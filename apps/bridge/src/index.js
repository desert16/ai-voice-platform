// ============================================================================
// VoiceCore AI — Multi-Tenant AudioSocket ↔ Gemini Live Bridge
// ============================================================================
// Her gelen çağrıda:
//  1. Asterisk UUID alınır
//  2. Redis'ten UUID → tenantId bulunur (ARI/asterisk-manager yazar)
//  3. Redis'ten tenant config (systemPrompt, agentId) çekilir
//  4. Gemini Live session o config ile açılır
//  5. Transcript ve Call kaydı PostgreSQL'e yazılır
// ============================================================================

require('dotenv').config();

const net = require('net');
const { GoogleGenAI, Modality } = require('@google/genai');
const { createRedisClient, getTenantConfig, setCallUuid } = require('./redis');
const { saveTranscript, startCall, endCall } = require('./db');

const PORT = parseInt(process.env.BRIDGE_PORT || '9092');
const HOST = process.env.BRIDGE_HOST || '127.0.0.1';

const TYPE_AUDIO  = 0x10;
const TYPE_UUID   = 0x01;
const TYPE_HANGUP = 0x00;

// ──────────────────────────────────────────────
// SES DÖNÜŞÜM YARDIMCILARI (bridge.js'den aynen)
// ──────────────────────────────────────────────

function calculateRMS(buf) {
  if (!buf || buf.length < 2) return 0;
  const samples = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.round(Math.sqrt(sum / samples.length));
}

function upsample8to16(input) {
  const out = new Int16Array(input.length * 2);
  for (let i = 0; i < input.length; i++) {
    const cur = input[i];
    const next = i + 1 < input.length ? input[i + 1] : cur;
    out[i * 2] = cur;
    out[i * 2 + 1] = Math.round((cur + next) / 2);
  }
  return out;
}

function downsample24to8(input) {
  const outLen = Math.floor(input.length / 3);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = i * 3;
    const avg = Math.round((input[idx] + input[idx + 1] + input[idx + 2]) / 3);
    out[i] = Math.max(-32768, Math.min(32767, avg));
  }
  return out;
}

function bufToInt16(buf) {
  return new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
}

function int16ToBuf(arr) {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.length * 2);
}

function frameAudio(payload) {
  const header = Buffer.alloc(3);
  header.writeUInt8(TYPE_AUDIO, 0);
  header.writeUInt16BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}

// ──────────────────────────────────────────────
// TENANT CONFIG CACHE (bellek — Redis'e ek olarak)
// ──────────────────────────────────────────────
const tenantCache = new Map(); // tenantId → config (30 saniye TTL)

async function getOrFetchTenantConfig(redis, tenantId) {
  const cached = tenantCache.get(tenantId);
  if (cached && (Date.now() - cached.fetchedAt) < 30000) {
    return cached.config;
  }

  const config = await getTenantConfig(redis, tenantId);
  if (config) {
    tenantCache.set(tenantId, { config, fetchedAt: Date.now() });
  }
  return config;
}

// ──────────────────────────────────────────────
// ÇAĞRI İŞLEME (Her TCP bağlantısı = bir çağrı)
// ──────────────────────────────────────────────

function handleCall(socket, redis, ai) {
  const remoteId = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`\n[YENİ ÇAĞRI] ${remoteId}`);

  let callUuid     = null;
  let tenantId     = null;
  let tenantConfig = null;
  let callDbId     = null;

  let buffer       = Buffer.alloc(0);
  let geminiSession = null;
  let sessionReady = false;
  let closed       = false;

  let playbackQueue = Buffer.alloc(0);
  let raw24kBuffer  = Buffer.alloc(0);
  let inputChunks   = [];

  // Drift-corrected playback timer
  let playTimeoutId = null;
  let nextPlayTime  = process.hrtime.bigint();

  function scheduleNextPlay() {
    if (closed) return;
    nextPlayTime += BigInt(20_000_000); // 20ms

    if (playbackQueue.length >= 320) {
      const chunk = playbackQueue.subarray(0, 320);
      playbackQueue = playbackQueue.subarray(320);
      try { socket.write(frameAudio(chunk)); }
      catch (e) { cleanup(); return; }
    }

    const now = process.hrtime.bigint();
    let delayMs = Number(nextPlayTime - now) / 1_000_000;
    if (delayMs < 0) delayMs = 0;
    playTimeoutId = setTimeout(scheduleNextPlay, delayMs);
  }

  // Gemini'ye 100ms'de bir ses gönder
  const sendTimer = setInterval(() => {
    if (!sessionReady || !geminiSession || closed) return;
    if (inputChunks.length === 0) return;

    const merged = Buffer.concat(inputChunks);
    inputChunks = [];

    const inputRms = calculateRMS(merged);
    // Echo cancel: bot konuşurken sessiz girişi yut
    if (playbackQueue.length > 320 && inputRms < 1200) return;

    try {
      const samples16 = upsample8to16(bufToInt16(merged));
      const buf16 = int16ToBuf(samples16);
      const b64 = buf16.toString('base64');

      if (typeof geminiSession.sendRealtimeInput === 'function') {
        geminiSession.sendRealtimeInput({
          mediaChunks: [{
            data: b64,
            mimeType: 'audio/pcm;rate=16000'
          }]
        });
      }
    } catch (e) {
      console.error(`[SEND ERROR] ${e.message}`);
    }
  }, 100);

  function handleGeminiMessage(msg) {
    if (msg?.serverContent?.interrupted) {
      playbackQueue = Buffer.alloc(0);
      raw24kBuffer  = Buffer.alloc(0);
      inputChunks   = [];
      return;
    }

    // Ses verisi
    const parts = msg?.serverContent?.modelTurn?.parts;
    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part?.inlineData?.data) {
          enqueueAudio(part.inlineData.data);
        }
      }
    }

    // Transkript — kullanılabilirse (text response)
    const textParts = msg?.serverContent?.modelTurn?.parts?.filter(p => p?.text);
    if (textParts?.length && callDbId) {
      const text = textParts.map(p => p.text).join('');
      saveTranscript({ callId: callDbId, speaker: 'AGENT', text }).catch(console.error);
    }
  }

  function enqueueAudio(base64Audio) {
    if (!base64Audio) return;
    const incoming = Buffer.from(base64Audio, 'base64');
    raw24kBuffer = Buffer.concat([raw24kBuffer, incoming]);

    const CHUNK_SIZE = 6; // 3 sample (24kHz) → 1 sample (8kHz)
    const usableLen = raw24kBuffer.length - (raw24kBuffer.length % CHUNK_SIZE);
    if (usableLen === 0) return;

    const usable = raw24kBuffer.subarray(0, usableLen);
    raw24kBuffer = raw24kBuffer.subarray(usableLen);

    const samples24k = bufToInt16(usable);
    const samples8k  = downsample24to8(samples24k);
    playbackQueue = Buffer.concat([playbackQueue, int16ToBuf(samples8k)]);
  }

  // UUID geldiğinde tenant config'i yükle ve Gemini'yi başlat
  async function initializeSession(uuid) {
    callUuid = uuid;
    console.log(`[UUID] ${callUuid}`);

    // Redis'ten tenantId bul (asterisk-manager yazar)
    tenantId = await redis.get(`tenant:uuid:${callUuid}`);

    if (!tenantId) {
      console.warn(`[WARN] UUID için tenant bulunamadı: ${callUuid} — default config kullanılıyor`);
      tenantConfig = getDefaultConfig();
    } else {
      console.log(`[TENANT] ${tenantId}`);
      tenantConfig = await getOrFetchTenantConfig(redis, tenantId);
      if (!tenantConfig) {
        console.warn(`[WARN] Tenant config yüklenemedi: ${tenantId} — default config`);
        tenantConfig = getDefaultConfig();
      }
    }

    // DB'ye çağrı kaydı aç
    try {
      callDbId = await startCall({
        tenantId,
        asteriskUuid: callUuid,
        agentId: tenantConfig.agentId,
      });
    } catch (e) {
      console.error(`[DB ERROR] Call kaydı oluşturulamadı: ${e.message}`);
    }

    const modelToUse = (tenantConfig.voiceModel && !tenantConfig.voiceModel.includes('3.1'))
      ? tenantConfig.voiceModel
      : 'models/gemini-2.0-flash-exp';

    console.log(`[GEMINI CONNECTING] Model: ${modelToUse} | Prompt uzunluğu: ${tenantConfig.systemPrompt?.length || 0}`);

    // Gemini session'ı tenant config ile aç
    try {
      geminiSession = await ai.live.connect({
        model: modelToUse,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: tenantConfig.systemPrompt }],
          },
        },
        callbacks: {
          onopen: () => {
            console.log(`[GEMINI] Bağlantı kuruldu ✓ (Model: ${modelToUse} | Tenant: ${tenantId || 'default'})`);
            sessionReady = true;
          },
          onmessage: (msg) => {
            try { handleGeminiMessage(msg); }
            catch (e) { console.error(`[MSG ERROR] ${e.message}`); }
          },
          onerror: (e) => {
            console.error(`[GEMINI ERROR]`, e?.message || e);
          },
          onclose: (ev) => {
            console.warn(`[GEMINI CLOSED]`, ev?.reason || ev || '');
            cleanup();
          },
        },
      });
    } catch (err) {
      console.error(`[GEMINI CONNECT ERROR] ${err.message}`);
      cleanup();
    }
  }


  // Veri paketi işleme
  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 3) {
      const type   = buffer.readUInt8(0);
      const length = buffer.readUInt16BE(1);
      if (buffer.length < 3 + length) break;

      const payload = buffer.subarray(3, 3 + length);
      buffer = buffer.subarray(3 + length);

      if (type === TYPE_UUID) {
        // Asterisk 16-byte binary UUID
        const uuid = payload.toString('hex');
        initializeSession(uuid).catch(console.error);
      } else if (type === TYPE_AUDIO) {
        inputChunks.push(payload);
      } else if (type === TYPE_HANGUP) {
        cleanup();
      }
    }
  });

  // Playback döngüsünü başlat
  nextPlayTime = process.hrtime.bigint();
  scheduleNextPlay();

  function cleanup() {
    if (closed) return;
    closed = true;

    if (playTimeoutId) clearTimeout(playTimeoutId);
    clearInterval(sendTimer);

    playbackQueue = Buffer.alloc(0);
    raw24kBuffer  = Buffer.alloc(0);
    inputChunks   = [];

    if (geminiSession) {
      try { geminiSession.close(); } catch (_) {}
    }
    if (!socket.destroyed) socket.destroy();

    // DB'ye çağrı bitişini kaydet
    if (callDbId) {
      endCall(callDbId).catch(console.error);
    }

    console.log(`[SONLANDI] ${remoteId} | Tenant: ${tenantId || 'unknown'}`);
  }

  socket.on('close', () => cleanup());
  socket.on('error', (err) => {
    console.error(`[SOCKET ERROR] ${err.message}`);
    cleanup();
  });
}

function getDefaultConfig() {
  return {
    systemPrompt: process.env.DEFAULT_SYSTEM_PROMPT ||
      'Sen VoiceCore AI sesli asistanısın. Arayan müşterilere kibar, doğal ve kısa Türkçe cümlelerle yardımcı ol.',
    voiceModel: 'models/gemini-2.0-flash-exp',
    agentId: null,
  };
}


// ──────────────────────────────────────────────
// ANA SUNUCU BAŞLATMA
// ──────────────────────────────────────────────

async function main() {
  const redis = await createRedisClient();
  const ai    = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const server = net.createServer((socket) => {
    handleCall(socket, redis, ai);
  });

  server.listen(PORT, HOST, () => {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  VoiceCore Multi-Tenant Bridge Hazır  ║`);
    console.log(`║  ${HOST}:${PORT}                          ║`);
    console.log(`╚══════════════════════════════════════╝\n`);
  });

  server.on('error', (err) => {
    console.error(`[SERVER ERROR] ${err.message}`);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] Sunucu kapatılıyor...');
    server.close(() => {
      redis.disconnect();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});

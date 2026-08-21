// ============================================================================
// VoiceCore AI - AudioSocket <-> Gemini Live Köprüsü (HASSAS ZAMANLAMALI)
// Multi-Tenant & Standalone Destekli
// ============================================================================
require('dotenv').config();

const net = require('net');
const { GoogleGenAI, Modality } = require('@google/genai');
const { createRedisClient, getTenantConfig } = require('./redis');
const { saveTranscript, startCall, endCall } = require('./db');

const PORT = parseInt(process.env.BRIDGE_PORT || '9092');
const HOST = process.env.BRIDGE_HOST || '0.0.0.0';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-live-preview';

const DEFAULT_SYSTEM_INSTRUCTION = process.env.DEFAULT_SYSTEM_PROMPT || 
  `Sen VoiceCore AI'in Türkçe sesli asistanısın. Kısa, doğal ve nazik cümlelerle konuş. Telefonda konuşuyorsun. Görüşme başında kullanıcıyı Türkçe selamla.`;

const TYPE_AUDIO  = 0x10;
const TYPE_UUID   = 0x01;
const TYPE_HANGUP = 0x00;

/* ================= SES DÖNÜŞÜM & HESAPLAMA ================= */

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

if (!GEMINI_API_KEY) {
  console.error('CRITICAL HATA: GEMINI_API_KEY bulunamadı! Lütfen apps/bridge/.env dosyasını kontrol edin.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function startBridgeServer() {
  let redis = null;
  try {
    redis = await createRedisClient();
  } catch (e) {
    console.warn('[REDIS WARN] Redis bağlantısı olmadan standalone modda başlatılıyor:', e.message);
  }

  const server = net.createServer((socket) => {
    const remoteInfo = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`\n[YENİ ÇAĞRI] ${remoteInfo}`);

    let callUuid = null;
    let tenantId = null;
    let callDbId = null;
    let buffer = Buffer.alloc(0);
    let geminiSession = null;
    let sessionReady = false;
    let closed = false;

    let playbackQueue = Buffer.alloc(0);
    let raw24kBuffer = Buffer.alloc(0);
    let inputChunks = [];

    // HIGH-RESOLUTION DRIFT-CORRECTED PLAYBACK TIMER
    let playTimeoutId = null;
    let nextPlayTime = process.hrtime.bigint();

    function scheduleNextPlay() {
      if (closed) return;
      nextPlayTime += BigInt(20000000); // 20ms

      if (playbackQueue.length >= 320) {
        const chunk = playbackQueue.subarray(0, 320);
        playbackQueue = playbackQueue.subarray(320);

        try {
          socket.write(frameAudio(chunk));
        } catch (e) {
          cleanup();
          return;
        }
      }

      const now = process.hrtime.bigint();
      let delayMs = Number(nextPlayTime - now) / 1_000_000;
      if (delayMs < 0) delayMs = 0;

      playTimeoutId = setTimeout(scheduleNextPlay, delayMs);
    }

    let sessionInitiated = false;

    // Gemini Bağlantısını Başlat
    async function connectGemini(systemPrompt = DEFAULT_SYSTEM_INSTRUCTION) {
      if (sessionInitiated || closed) return;
      sessionInitiated = true;

      try {
        geminiSession = await ai.live.connect({
          model: GEMINI_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          },
          callbacks: {
            onopen: () => {
              console.log(`[GEMINI] WebSocket Bağlantısı Kuruldu ✓ (Model: ${GEMINI_MODEL} | Tenant: ${tenantId || 'default'})`);
              sessionReady = true;
            },
            onmessage: (msg) => {
              try { handleGeminiMessage(msg); }
              catch (e) { console.error(`[MSG ERROR] ${e.message}`); }
            },
            onerror: (e) => console.error(`[GEMINI ERROR] ${e?.message || e}`),
            onclose: (ev) => {
              console.log(`[GEMINI CLOSED]`, ev?.reason || '');
              cleanup();
            },
          },
        });
      } catch (err) {
        console.error(`[CONNECT ERROR] ${err.message}`);
        cleanup();
      }
    }

    // 100ms içinde UUID gelmezse default ile başlat (yedek tetikleyici)
    const initFallbackTimer = setTimeout(() => {
      if (!sessionInitiated && !closed) {
        connectGemini(DEFAULT_SYSTEM_INSTRUCTION);
      }
    }, 120);

    // 100ms Zamanlayıcıyla Gemini'ye Ses Gönder
    const sendTimer = setInterval(() => {
      if (!sessionReady || !geminiSession || closed) return;
      if (inputChunks.length === 0) return;

      const merged = Buffer.concat(inputChunks);
      inputChunks = [];

      const inputRms = calculateRMS(merged);

      // Yankı Filtresi: Bot konuşuyorsa ve mikrofondan gelen ses düşükse yut
      if (playbackQueue.length > 320 && inputRms < 1200) {
        return;
      }

      try {
        const samples16 = upsample8to16(bufToInt16(merged));
        const buf16 = int16ToBuf(samples16);

        geminiSession.sendRealtimeInput({
          audio: { 
            data: buf16.toString('base64'), 
            mimeType: 'audio/pcm;rate=16000' 
          },
        });
      } catch (e) { 
        console.error(`[SEND ERROR] ${e.message}`); 
      }
    }, 100);

    function handleGeminiMessage(msg) {
      if (msg?.serverContent?.interrupted) {
        console.log(`[INTERRUPT] Kullanıcı araya girdi, ses tamponu temizlendi.`);
        playbackQueue = Buffer.alloc(0);
        raw24kBuffer = Buffer.alloc(0);
        inputChunks = [];
        return;
      }

      const parts = msg?.serverContent?.modelTurn?.parts;
      if (parts && Array.isArray(parts)) {
        for (const part of parts) {
          if (part?.inlineData?.data) {
            enqueueAudio(part.inlineData.data);
          }
        }
      }

      // Transkript
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

      const CHUNK_SIZE = 6; // 3 sample (24kHz) -> 1 sample (8kHz)
      const usableLen = raw24kBuffer.length - (raw24kBuffer.length % CHUNK_SIZE);
      if (usableLen === 0) return;

      const usable = raw24kBuffer.subarray(0, usableLen);
      raw24kBuffer = raw24kBuffer.subarray(usableLen);

      const samples24k = bufToInt16(usable);
      const samples8k = downsample24to8(samples24k);
      const buf8k = int16ToBuf(samples8k);

      playbackQueue = Buffer.concat([playbackQueue, buf8k]);
    }

    socket.on('data', async (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= 3) {
        const type = buffer.readUInt8(0);
        const length = buffer.readUInt16BE(1);

        if (buffer.length < 3 + length) break;

        const payload = buffer.subarray(3, 3 + length);
        buffer = buffer.subarray(3 + length);

        if (type === TYPE_UUID) {
          callUuid = payload.toString('hex');
          console.log(`[AUDIO SOCKET] UUID: ${callUuid}`);

          let promptToUse = DEFAULT_SYSTEM_INSTRUCTION;

          // Redis'ten tenantId ve prompt kontrolü
          if (redis) {
            try {
              tenantId = await redis.get(`tenant:uuid:${callUuid}`);
              if (tenantId) {
                const config = await getTenantConfig(redis, tenantId);
                if (config?.systemPrompt) {
                  promptToUse = config.systemPrompt;
                  console.log(`[TENANT PROMPT] ${tenantId} için özel prompt yüklendi (${promptToUse.length} karakter).`);
                }
              }
            } catch (e) {
              console.warn('[REDIS CHECK WARN]', e.message);
            }
          }

          // Gemini oturumunu tenant'ın özel promptu ile aç
          connectGemini(promptToUse);

          if (tenantId) {
            startCall({ tenantId, asteriskUuid: callUuid }).then(id => { callDbId = id; }).catch(() => {});
          }
        } else if (type === TYPE_AUDIO) {
          inputChunks.push(payload);
        } else if (type === TYPE_HANGUP) {
          cleanup();
        }
      }
    });


    nextPlayTime = process.hrtime.bigint();
    scheduleNextPlay();

    function cleanup() {
      if (closed) return;
      closed = true;

      if (playTimeoutId) clearTimeout(playTimeoutId);
      clearInterval(sendTimer);

      playbackQueue = Buffer.alloc(0);
      raw24kBuffer = Buffer.alloc(0);
      inputChunks = [];

      if (geminiSession) try { geminiSession.close(); } catch (e) {}
      if (!socket.destroyed) socket.destroy();

      if (callDbId) {
        endCall(callDbId).catch(console.error);
      }

      console.log(`[SONLANDI] Çağrı bitti.\n`);
    }

    socket.on('close', () => cleanup());
    socket.on('error', (err) => console.error(`[SOCKET ERROR] ${err.message}`));
  });

  server.listen(PORT, HOST, () => {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║   VoiceCore AI AudioSocket Köprüsü Hazır        ║`);
    console.log(`║   Port: ${HOST}:${PORT}                              ║`);
    console.log(`║   Gemini Model: ${GEMINI_MODEL.padEnd(29)}║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
  });
}

startBridgeServer().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});


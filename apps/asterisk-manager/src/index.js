// ============================================================================
// Asterisk Manager Servisi — Ana giriş noktası
// AMI bağlantısı + Redis  (DB erişimi yok — API sunucusu üzerinden)
// ============================================================================

require('dotenv').config();

const express = require('express');
const Redis   = require('ioredis');
const http    = require('http');

const { initAmi, reloadPjsip, reloadDialplan, getTrunkStatus } = require('./ami-client');
const { writeTenantConfig, deleteTenantConfig } = require('./config-generator');

const app   = express();
let   redis = null;

// ── API sunucusuna dahili HTTP çağrısı ───────────────────────────────────
// DB işlemleri doğrudan Prisma yerine API sunucusu üzerinden yapılır.
async function callApi(method, path, body = null) {
  const apiUrl = process.env.API_SERVER_URL || 'http://127.0.0.1:3000';
  const token  = process.env.SERVICE_TOKEN  || '';
  const url    = new URL(path, apiUrl);

  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port:     parseInt(url.port || '3000'),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type':    'application/json',
        'x-service-token': token,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}


app.use(express.json());

// Servis auth token (sadece internal API çağrıları)
function requireServiceToken(req, res, next) {
  const token = req.headers['x-service-token'];
  if (token !== process.env.SERVICE_TOKEN) {
    return res.status(401).json({ error: 'Yetkisiz' });
  }
  next();
}

// ──────────────────────────────────────────────
// TRUNK AKTİFLEŞTİRME
// POST /trunks/:tenantId/activate
// Body: { sipUsername, sipPassword, sipHost, sipPort, phoneNumber, label }
// ──────────────────────────────────────────────
app.post('/trunks/:tenantId/activate', requireServiceToken, async (req, res) => {
  const { tenantId } = req.params;
  const { sipUsername, sipPassword, sipHost, sipPort, phoneNumber, label } = req.body;

  if (!sipUsername || !sipPassword || !sipHost) {
    return res.status(400).json({ error: 'sipUsername, sipPassword ve sipHost zorunlu' });
  }

  try {
    // Config dosyalarını yaz
    writeTenantConfig({
      id: tenantId,
      sipUsername,
      sipPassword,
      sipHost,
      sipPort: sipPort || 5060,
      phoneNumber,
      label: label || tenantId,
    });

    // Asterisk'i reload et
    await reloadPjsip();
    await reloadDialplan();

    // API sunucusu üzerinden DB güncelle (Prisma yok — HTTP)
    await callApi('PATCH', `/api/internal/trunks/${tenantId}/status`, {
      sipUsername,
      status: 'REGISTERING',
    }).catch((e) => console.warn('[API] Trunk status güncelleme hatası:', e.message));

    // Tenant config'ini API'den al → Redis'e yaz (bridge için)
    const configRes = await callApi('GET', `/api/internal/tenants/${tenantId}/agent-config`)
      .catch(() => null);

    if (configRes?.status === 200 && configRes.body && redis) {
      await redis.setex(
        `tenant:config:${tenantId}`,
        3600,
        JSON.stringify(configRes.body)
      );
      console.log(`[REDIS] Tenant config yüklendi: ${tenantId}`);
    }

    res.json({ success: true, message: 'Trunk aktifleştirildi, Asterisk reload edildi' });

  } catch (err) {
    console.error('[ACTIVATE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// TRUNK DEVRE DIŞI BIRAKMA
// POST /trunks/:tenantId/deactivate
// ──────────────────────────────────────────────
app.post('/trunks/:tenantId/deactivate', requireServiceToken, async (req, res) => {
  const { tenantId } = req.params;

  try {
    deleteTenantConfig(tenantId);
    await reloadPjsip();
    await reloadDialplan();

    // API sunucusu üzerinden DB güncelle
    await callApi('PATCH', `/api/internal/trunks/${tenantId}/status`, {
      status: 'INACTIVE',
    }).catch((e) => console.warn('[API] Trunk deactivate güncelleme hatası:', e.message));

    if (redis) {
      await redis.del(`tenant:config:${tenantId}`);
    }

    res.json({ success: true, message: 'Trunk devre dışı bırakıldı' });
  } catch (err) {
    console.error('[DEACTIVATE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// TRUNK DURUM SORGULA
// GET /trunks/:tenantId/status
// ──────────────────────────────────────────────
app.get('/trunks/:tenantId/status', requireServiceToken, async (req, res) => {
  const { tenantId } = req.params;
  try {
    const status = await getTrunkStatus(tenantId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// TENANT CONFIG GÜNCELLE (prompt değiştiğinde)
// POST /tenants/:tenantId/sync-config
// ──────────────────────────────────────────────
app.post('/tenants/:tenantId/sync-config', requireServiceToken, async (req, res) => {
  const { tenantId } = req.params;

  try {
    // API sunucusundan agent config'i al
    const configRes = await callApi('GET', `/api/internal/tenants/${tenantId}/agent-config`)
      .catch(() => null);

    if (!configRes || configRes.status !== 200) {
      return res.status(404).json({ error: 'Aktif ajan bulunamadı' });
    }

    if (redis) {
      await redis.setex(
        `tenant:config:${tenantId}`,
        3600,
        JSON.stringify(configRes.body)
      );
    }

    res.json({ success: true, message: 'Tenant config güncellendi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Redis ref (ami-client için)
function getRedisClient() { return redis; }
module.exports = { getRedisClient };

// ──────────────────────────────────────────────
// BAŞLATMA
// ──────────────────────────────────────────────
async function main() {
  // Redis bağlantısı
  redis = new Redis({
    host:     process.env.REDIS_HOST     || '127.0.0.1',
    port:     parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  });
  redis.on('connect', () => console.log('[REDIS] Bağlantı kuruldu ✓'));
  redis.on('error',   (e) => console.error('[REDIS ERROR]', e.message));

  // AMI bağlantısı
  initAmi();

  // HTTP sunucusu (0.0.0.0 — API sunucusunun erişebilmesi için)
  const PORT = parseInt(process.env.MANAGER_PORT || process.env.PORT || '4001');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[ASTERISK-MANAGER] Port: 0.0.0.0:${PORT}`);
    console.log(`[ASTERISK-MANAGER] Hazır ✓\n`);
  });

}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});

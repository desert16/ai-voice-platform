// ============================================================================
// Asterisk Manager Servisi — Ana giriş noktası
// API sunucu + AMI bağlantısı + Redis
// ============================================================================

require('dotenv').config();

const express = require('express');
const Redis   = require('ioredis');

const { initAmi, reloadPjsip, reloadDialplan, getTrunkStatus } = require('./ami-client');
const { writeTenantConfig, deleteTenantConfig } = require('./config-generator');
const { PrismaClient } = require('@prisma/client');

const app    = express();
const prisma = new PrismaClient();
let   redis  = null;

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

    // DB'yi güncelle
    await prisma.sipTrunk.updateMany({
      where: { tenantId, sipUsername },
      data: { status: 'REGISTERING' },
    });

    // Tenant config'ini Redis'e yaz (bridge için)
    const agent = await prisma.agent.findFirst({
      where: { tenantId, isDefault: true, status: 'ACTIVE' },
    });

    if (agent && redis) {
      await redis.setex(
        `tenant:config:${tenantId}`,
        3600,
        JSON.stringify({
          agentId:      agent.id,
          systemPrompt: agent.systemPrompt,
          voiceModel:   agent.voiceModel,
          language:     agent.language,
        })
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

    await prisma.sipTrunk.updateMany({
      where: { tenantId },
      data: { status: 'INACTIVE' },
    });

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
    const agent = await prisma.agent.findFirst({
      where: { tenantId, isDefault: true, status: 'ACTIVE' },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Aktif ajan bulunamadı' });
    }

    if (redis) {
      await redis.setex(
        `tenant:config:${tenantId}`,
        3600,
        JSON.stringify({
          agentId:      agent.id,
          systemPrompt: agent.systemPrompt,
          voiceModel:   agent.voiceModel,
          language:     agent.language,
        })
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

  // HTTP sunucusu
  const PORT = parseInt(process.env.MANAGER_PORT || '4001');
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n[ASTERISK-MANAGER] Port: 127.0.0.1:${PORT}`);
    console.log(`[ASTERISK-MANAGER] Hazır ✓\n`);
  });
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});

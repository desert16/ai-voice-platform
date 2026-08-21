// ============================================================================
// /api/internal — Sadece PBX sunucusundan gelen dahili istekler
// x-service-token header zorunlu
// ============================================================================

const express  = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Servis token middleware
function requireServiceToken(req, res, next) {
  const token = req.headers['x-service-token'];
  if (!token || token !== process.env.SERVICE_TOKEN) {
    return res.status(401).json({ error: 'Yetkisiz — service token gerekli' });
  }
  next();
}

router.use(requireServiceToken);

// ──────────────────────────────────────────────
// GET /api/internal/tenants/:tenantId/agent-config
// Bridge için tenant'ın aktif ajan bilgilerini döner
// ──────────────────────────────────────────────
router.get('/tenants/:tenantId/agent-config', async (req, res) => {
  const { tenantId } = req.params;
  try {
    const agent = await prisma.agent.findFirst({
      where: { tenantId, isDefault: true, status: 'ACTIVE' },
      select: {
        id:           true,
        systemPrompt: true,
        voiceModel:   true,
        language:     true,
        name:         true,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Aktif ajan bulunamadı' });
    }

    res.json({
      agentId:      agent.id,
      systemPrompt: agent.systemPrompt,
      voiceModel:   agent.voiceModel,
      language:     agent.language,
      name:         agent.name,
    });
  } catch (err) {
    console.error('[INTERNAL] agent-config hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/internal/trunks/:tenantId/status
// Trunk durumunu güncelle (REGISTERING / INACTIVE / ACTIVE)
// Body: { sipUsername?, status }
// ──────────────────────────────────────────────
router.patch('/trunks/:tenantId/status', async (req, res) => {
  const { tenantId } = req.params;
  const { sipUsername, status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status zorunlu' });
  }

  try {
    const where = sipUsername
      ? { tenantId, sipUsername }
      : { tenantId };

    await prisma.sipTrunk.updateMany({
      where,
      data: { status },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[INTERNAL] trunk status güncelleme hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/internal/calls
// Bridge'den gelen çağrı kaydı
// ──────────────────────────────────────────────
router.post('/calls', async (req, res) => {
  const { tenantId, agentId, callerId, duration, transcript, status, recordingUrl } = req.body;

  if (!tenantId) {
    return res.status(400).json({ error: 'tenantId zorunlu' });
  }

  try {
    const call = await prisma.call.create({
      data: {
        tenantId,
        agentId:      agentId    || null,
        callerId:     callerId   || 'unknown',
        duration:     duration   || 0,
        transcript:   transcript || null,
        status:       status     || 'COMPLETED',
        recordingUrl: recordingUrl || null,
      },
    });

    res.json({ success: true, callId: call.id });
  } catch (err) {
    console.error('[INTERNAL] call kayıt hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

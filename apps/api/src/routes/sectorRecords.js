// apps/api/src/routes/sectorRecords.js
// AI tarafından aramalarda toplanan canlı sektörel veriler tablosu
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

// GET /api/tenants/:tenantId/sector-records — Sektörel kayıtları listele
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status, sectorCode, q, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      tenantId,
      ...(status && { status }),
      ...(sectorCode && { sectorCode }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { callerName: { contains: q, mode: 'insensitive' } },
          { callerNumber: { contains: q } },
          { notes: { contains: q, mode: 'insensitive' } },
        ]
      })
    };

    const [records, total] = await Promise.all([
      prisma.sectorRecord.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          call: { select: { id: true, duration: true, recordingUrl: true, startedAt: true } }
        }
      }),
      prisma.sectorRecord.count({ where })
    ]);

    return res.json({
      success: true,
      data: records,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error('[SECTOR RECORDS GET]', err);
    return error(res, err.message, 500);
  }
});

// POST /api/tenants/:tenantId/sector-records — Yeni kayıt ekle (AI veya manuel)
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { 
      sectorCode, title, callerNumber, callerName, 
      extractedData = {}, notes, callId, customerId 
    } = req.body;

    if (!title) {
      return error(res, 'Kayıt başlığı zorunludur', 400);
    }

    const record = await prisma.sectorRecord.create({
      data: {
        tenantId,
        sectorCode: sectorCode || 'general',
        title,
        callerNumber,
        callerName,
        status: 'NEW',
        extractedData: extractedData || {},
        notes,
        callId,
        customerId
      },
      include: {
        customer: true,
        call: true
      }
    });

    return success(res, record, 201);
  } catch (err) {
    console.error('[SECTOR RECORD POST]', err);
    return error(res, err.message, 500);
  }
});

// PUT /api/tenants/:tenantId/sector-records/:id — Durum / Not güncelle
router.put('/:id', async (req, res) => {
  try {
    const { tenantId, id } = req.params;
    const { status, notes, title, extractedData } = req.body;

    const record = await prisma.sectorRecord.updateMany({
      where: { id, tenantId },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(title && { title }),
        ...(extractedData && { extractedData })
      }
    });

    if (record.count === 0) return error(res, 'Kayıt bulunamadı', 404);

    const updated = await prisma.sectorRecord.findUnique({
      where: { id },
      include: { customer: true, call: true }
    });

    return success(res, updated);
  } catch (err) {
    console.error('[SECTOR RECORD PUT]', err);
    return error(res, err.message, 500);
  }
});

// DELETE /api/tenants/:tenantId/sector-records/:id — Kaydı sil
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId, id } = req.params;
    await prisma.sectorRecord.deleteMany({ where: { id, tenantId } });
    return success(res, { deleted: true });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// POST /api/tenants/:tenantId/upgrade-ai — Sadece Santral olan müşteriye AI Servisi Ekle
router.post('/upgrade-ai', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { sector: true, agents: true }
    });

    if (!tenant) return error(res, 'Tenant bulunamadı', 404);

    // Hizmet tipini FULL_SUITE yap
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { serviceType: 'FULL_SUITE' }
    });

    // AI Voice modülünü aktif et
    const aiVoiceModule = await prisma.module.findUnique({ where: { code: 'ai_voice' } });
    if (aiVoiceModule) {
      await prisma.tenantModule.upsert({
        where: { tenantId_moduleId: { tenantId, moduleId: aiVoiceModule.id } },
        update: { enabled: true },
        create: { tenantId, moduleId: aiVoiceModule.id, enabled: true }
      });
    }

    // Ajan yoksa oluştur
    if (tenant.agents.length === 0) {
      await prisma.agent.create({
        data: {
          tenantId,
          name: `${tenant.name} AI Asistanı`,
          systemPrompt: `Sen ${tenant.name} firmasının Türkçe sesli yapay zeka asistanısın. Kısa, nazik ve çözüm odaklı konuş.`,
          welcomeMessage: `Merhaba, ${tenant.name}'e hoş geldiniz!`,
          voiceModel: 'gemini-3.1-flash-live-preview',
          language: 'tr-TR',
          isDefault: true,
          status: 'ACTIVE'
        }
      });
    }

    return success(res, { upgraded: true, serviceType: 'FULL_SUITE' });
  } catch (err) {
    console.error('[UPGRADE AI ERROR]', err);
    return error(res, err.message, 500);
  }
});

module.exports = router;

// apps/api/src/routes/modules.js
// Modül yönetimi — admin liste + tenant aktif/pasif yönetimi
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

// GET /api/admin/modules — Tüm modülleri listele
router.get('/admin', async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { tenantModules: true } } },
    });
    success(res, modules);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/tenants/:tenantId/modules — Tenant'ın tüm modülleri (aktif + pasif)
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Tüm modülleri çek
    const allModules = await prisma.module.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Tenant'ın aktif modüllerini çek
    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId },
      include: { module: true },
    });

    const activeModuleIds = new Set(tenantModules.filter(tm => tm.enabled).map(tm => tm.moduleId));

    // Her modüle enabled flag ekle
    const result = allModules.map(mod => ({
      ...mod,
      enabled: activeModuleIds.has(mod.id),
      tenantModule: tenantModules.find(tm => tm.moduleId === mod.id) || null,
    }));

    success(res, result);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// PUT /api/tenants/:tenantId/modules/:moduleId — Modül aktif/pasif
router.put('/:moduleId', async (req, res) => {
  try {
    const { tenantId, moduleId } = req.params;
    const { enabled, settings } = req.body;

    const tenantModule = await prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId, moduleId } },
      update: { enabled: enabled ?? true, settings: settings || {} },
      create: { tenantId, moduleId, enabled: enabled ?? true, settings: settings || {} },
      include: { module: true },
    });

    success(res, tenantModule);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// POST /api/tenants/:tenantId/modules/apply-sector — Sektör şablonunu uygula
router.post('/apply-sector', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { sectorId } = req.body;
    if (!sectorId) return error(res, 'sectorId zorunlu', 400);

    // Sektörün default modüllerini al
    const sectorModules = await prisma.sectorModule.findMany({
      where: { sectorId, isDefault: true },
      include: { module: true },
    });

    // Tenant'a bu modülleri ekle/aktif et
    const results = await Promise.all(
      sectorModules.map(sm =>
        prisma.tenantModule.upsert({
          where: { tenantId_moduleId: { tenantId, moduleId: sm.moduleId } },
          update: { enabled: true },
          create: { tenantId, moduleId: sm.moduleId, enabled: true },
        })
      )
    );

    // Tenant'ın sectorId'sini güncelle
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { sectorId },
    });

    success(res, { applied: results.length, modules: sectorModules.map(sm => sm.module.code) });
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;

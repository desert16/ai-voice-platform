// apps/api/src/routes/sectors.js
// Sektör yönetimi — Admin tarafından yönetilir, kod değiştirmek gerekmez
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

// GET /api/admin/sectors — Tüm sektörleri listele
router.get('/', async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { tenants: true, sectorModules: true } },
        sectorModules: {
          include: { module: { select: { id: true, code: true, name: true, icon: true } } },
        },
      },
    });
    success(res, sectors);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/admin/sectors/:id — Sektör detayı + modülleri
router.get('/:id', async (req, res) => {
  try {
    const sector = await prisma.sector.findUnique({
      where: { id: req.params.id },
      include: {
        sectorModules: {
          include: { module: true },
          orderBy: { module: { name: 'asc' } },
        },
        _count: { select: { tenants: true } },
      },
    });
    if (!sector) return error(res, 'Sektör bulunamadı', 404);
    success(res, sector);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// POST /api/admin/sectors — Yeni sektör ekle
router.post('/', async (req, res) => {
  try {
    const { name, code, description, icon } = req.body;
    if (!name || !code) return error(res, 'name ve code zorunlu', 400);

    const sector = await prisma.sector.create({
      data: { name, code: code.toLowerCase(), description, icon },
    });
    success(res, sector, 201);
  } catch (err) {
    if (err.code === 'P2002') return error(res, 'Bu sektör kodu zaten mevcut', 409);
    error(res, err.message, 500);
  }
});

// PUT /api/admin/sectors/:id — Sektör güncelle
router.put('/:id', async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;
    const sector = await prisma.sector.update({
      where: { id: req.params.id },
      data: { name, description, icon, status },
    });
    success(res, sector);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// PUT /api/admin/sectors/:id/modules — Sektörün modüllerini güncelle
router.put('/:id/modules', async (req, res) => {
  try {
    const { moduleCodes } = req.body; // ['crm', 'appointment', 'ai_voice']
    if (!Array.isArray(moduleCodes)) return error(res, 'moduleCodes array olmalı', 400);

    const sectorId = req.params.id;

    // Eski bağlantıları sil
    await prisma.sectorModule.deleteMany({ where: { sectorId } });

    // Yeni bağlantıları ekle
    const modules = await prisma.module.findMany({ where: { code: { in: moduleCodes } } });
    await prisma.sectorModule.createMany({
      data: modules.map(m => ({ sectorId, moduleId: m.id, isDefault: true })),
    });

    success(res, { updated: modules.length });
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;

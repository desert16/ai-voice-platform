// apps/api/src/routes/properties.js — Emlak modülü
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { requireModule } = require('../core/moduleGuard');
const prisma = new PrismaClient();

router.get('/', requireModule('property'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status, type, city, minPrice, maxPrice, q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      tenantId,
      ...(status && { status }),
      ...(type && { type }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...(q && { OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ]}),
    };
    const [properties, total] = await Promise.all([
      prisma.property.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { customer: { select: { id: true, name: true, phone: true } } } }),
      prisma.property.count({ where }),
    ]);
    res.json({ success: true, data: properties, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { error(res, err.message, 500); }
});

router.get('/:id', requireModule('property'), async (req, res) => {
  try {
    const property = await prisma.property.findFirst({ where: { id: req.params.id, tenantId: req.params.tenantId }, include: { customer: true } });
    if (!property) return error(res, 'İlan bulunamadı', 404);
    success(res, property);
  } catch (err) { error(res, err.message, 500); }
});

router.post('/', requireModule('property'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { customerId, title, type, price, currency, city, district, address, area, rooms, floor, totalFloors, features, images, description } = req.body;
    if (!title) return error(res, 'Başlık zorunlu', 400);
    const property = await prisma.property.create({ data: { tenantId, customerId, title, type, price, currency, city, district, address, area, rooms, floor, totalFloors, features: features || [], images: images || [], description } });
    success(res, property, 201);
  } catch (err) { error(res, err.message, 500); }
});

router.put('/:id', requireModule('property'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const data = req.body;
    await prisma.property.updateMany({ where: { id: req.params.id, tenantId }, data });
    const updated = await prisma.property.findUnique({ where: { id: req.params.id } });
    success(res, updated);
  } catch (err) { error(res, err.message, 500); }
});

router.delete('/:id', requireModule('property'), async (req, res) => {
  try {
    await prisma.property.deleteMany({ where: { id: req.params.id, tenantId: req.params.tenantId } });
    success(res, { deleted: true });
  } catch (err) { error(res, err.message, 500); }
});

module.exports = router;

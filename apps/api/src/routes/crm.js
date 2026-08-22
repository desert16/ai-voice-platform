// apps/api/src/routes/crm.js
// Ortak CRM — Customer, Contact, Note, Activity
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { requireModule } = require('../core/moduleGuard');

const prisma = new PrismaClient();

// ─── CUSTOMERS ───────────────────────────────────────────────

// GET /api/tenants/:tenantId/crm/customers
router.get('/customers', requireModule('crm'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { q, type, tag, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      tenantId,
      ...(type && { type }),
      ...(tag && { tags: { has: tag } }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { calls: true, appointments: true, notes: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ success: true, data: customers, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/tenants/:tenantId/crm/customers/:id
router.get('/customers/:id', requireModule('crm'), async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId },
      include: {
        contacts: true,
        notes: { orderBy: { createdAt: 'desc' }, take: 20 },
        activities: { orderBy: { createdAt: 'desc' }, take: 30 },
        calls: { orderBy: { startedAt: 'desc' }, take: 10, include: { transcripts: { take: 1 } } },
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        _count: { select: { calls: true, orders: true, tickets: true } },
      },
    });
    if (!customer) return error(res, 'Müşteri bulunamadı', 404);
    success(res, customer);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// POST /api/tenants/:tenantId/crm/customers
router.post('/customers', requireModule('crm'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, phone, email, type, address, tags, source, metadata } = req.body;
    if (!name) return error(res, 'İsim zorunlu', 400);

    const customer = await prisma.customer.create({
      data: { tenantId, name, phone, email, type, address, tags: tags || [], source, metadata: metadata || {} },
    });

    // Activity kaydı
    await prisma.activity.create({
      data: { tenantId, customerId: customer.id, type: 'created', description: 'Müşteri oluşturuldu' },
    });

    success(res, customer, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// PUT /api/tenants/:tenantId/crm/customers/:id
router.put('/customers/:id', requireModule('crm'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, phone, email, type, address, tags, metadata } = req.body;

    const customer = await prisma.customer.updateMany({
      where: { id: req.params.id, tenantId },
      data: { name, phone, email, type, address, tags, metadata },
    });

    if (customer.count === 0) return error(res, 'Müşteri bulunamadı', 404);

    await prisma.activity.create({
      data: { tenantId, customerId: req.params.id, type: 'updated', description: 'Müşteri bilgileri güncellendi' },
    });

    const updated = await prisma.customer.findUnique({ where: { id: req.params.id } });
    success(res, updated);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// DELETE /api/tenants/:tenantId/crm/customers/:id
router.delete('/customers/:id', requireModule('crm'), async (req, res) => {
  try {
    await prisma.customer.deleteMany({ where: { id: req.params.id, tenantId: req.params.tenantId } });
    success(res, { deleted: true });
  } catch (err) {
    error(res, err.message, 500);
  }
});

// ─── NOTES ───────────────────────────────────────────────────

// GET /api/tenants/:tenantId/crm/customers/:id/notes
router.get('/customers/:id/notes', requireModule('crm'), async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { customerId: req.params.id, tenantId: req.params.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    success(res, notes);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// POST /api/tenants/:tenantId/crm/customers/:id/notes
router.post('/customers/:id/notes', requireModule('crm'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { text, createdBy } = req.body;
    if (!text) return error(res, 'Not metni zorunlu', 400);

    const note = await prisma.note.create({
      data: { tenantId, customerId: req.params.id, text, createdBy },
    });

    await prisma.activity.create({
      data: { tenantId, customerId: req.params.id, type: 'note', description: `Not eklendi: ${text.substring(0, 50)}...` },
    });

    success(res, note, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// ─── CONTACTS ────────────────────────────────────────────────

// GET /api/tenants/:tenantId/crm/customers/:id/contacts
router.get('/customers/:id/contacts', requireModule('crm'), async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({ where: { customerId: req.params.id } });
    success(res, contacts);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// POST /api/tenants/:tenantId/crm/customers/:id/contacts
router.post('/customers/:id/contacts', requireModule('crm'), async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;
    if (!name) return error(res, 'İsim zorunlu', 400);
    const contact = await prisma.contact.create({
      data: { customerId: req.params.id, name, phone, email, role },
    });
    success(res, contact, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// ─── SEARCH (AI Tool için) ────────────────────────────────────

// GET /api/tenants/:tenantId/crm/search?q=...
router.get('/search', requireModule('crm'), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return success(res, []);

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: req.params.tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 5,
      include: { _count: { select: { calls: true } } },
    });
    success(res, customers);
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;

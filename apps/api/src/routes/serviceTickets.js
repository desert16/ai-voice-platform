// apps/api/src/routes/serviceTickets.js — Teknik Servis modülü
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { requireModule } = require('../core/moduleGuard');
const prisma = new PrismaClient();

function generateTicketNo() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `SRV-${year}-${rand}`;
}

router.get('/', requireModule('service'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status, priority, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId, ...(status && { status }), ...(priority && { priority }) };
    const [tickets, total] = await Promise.all([
      prisma.serviceTicket.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { customer: { select: { id: true, name: true, phone: true } } } }),
      prisma.serviceTicket.count({ where }),
    ]);
    res.json({ success: true, data: tickets, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { error(res, err.message, 500); }
});

router.get('/:id', requireModule('service'), async (req, res) => {
  try {
    const ticket = await prisma.serviceTicket.findFirst({ where: { id: req.params.id, tenantId: req.params.tenantId }, include: { customer: true } });
    if (!ticket) return error(res, 'Servis kaydı bulunamadı', 404);
    success(res, ticket);
  } catch (err) { error(res, err.message, 500); }
});

router.post('/', requireModule('service'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { customerId, subject, description, deviceInfo, priority, assignedTo } = req.body;
    if (!subject) return error(res, 'Konu zorunlu', 400);
    const ticket = await prisma.serviceTicket.create({
      data: { tenantId, customerId, subject, description, deviceInfo, priority: priority || 'NORMAL', assignedTo, ticketNo: generateTicketNo() },
    });
    if (customerId) {
      await prisma.activity.create({ data: { tenantId, customerId, type: 'ticket', description: `Servis kaydı açıldı: ${subject}` } }).catch(() => {});
    }
    success(res, ticket, 201);
  } catch (err) { error(res, err.message, 500); }
});

router.put('/:id', requireModule('service'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status, priority, assignedTo, description, resolvedAt } = req.body;
    await prisma.serviceTicket.updateMany({ where: { id: req.params.id, tenantId }, data: { status, priority, assignedTo, description, resolvedAt: resolvedAt ? new Date(resolvedAt) : undefined } });
    const updated = await prisma.serviceTicket.findUnique({ where: { id: req.params.id } });
    success(res, updated);
  } catch (err) { error(res, err.message, 500); }
});

module.exports = router;

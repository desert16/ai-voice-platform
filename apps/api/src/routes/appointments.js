// apps/api/src/routes/appointments.js
// Sektör bağımsız randevu motoru
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { requireModule } = require('../core/moduleGuard');

const prisma = new PrismaClient();

// GET /api/tenants/:tenantId/appointments
router.get('/', requireModule('appointment'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status, from, to, type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      tenantId,
      ...(status && { status }),
      ...(type && { type }),
      ...(from || to) && {
        scheduledAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      },
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { scheduledAt: 'asc' },
        include: { customer: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({ success: true, data: appointments, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/tenants/:tenantId/appointments/available-slots
router.get('/available-slots', requireModule('appointment'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { date, duration = 30 } = req.query;
    if (!date) return error(res, 'Tarih (date) parametresi zorunlu', 400);

    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    // O günkü mevcut randevuları çek
    const existing = await prisma.appointment.findMany({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED'] },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    // Slotlar oluştur (09:00 - 18:00, her duration dk'da bir)
    const slots = [];
    let current = new Date(dayStart);
    const durationMs = parseInt(duration) * 60 * 1000;

    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + durationMs);
      const isOccupied = existing.some(appt => {
        const aStart = new Date(appt.scheduledAt);
        const aEnd = new Date(aStart.getTime() + appt.durationMinutes * 60 * 1000);
        return current < aEnd && slotEnd > aStart;
      });

      slots.push({ time: current.toISOString(), available: !isOccupied });
      current = new Date(current.getTime() + durationMs);
    }

    success(res, slots);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/tenants/:tenantId/appointments/:id
router.get('/:id', requireModule('appointment'), async (req, res) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId },
      include: { customer: true },
    });
    if (!appointment) return error(res, 'Randevu bulunamadı', 404);
    success(res, appointment);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// POST /api/tenants/:tenantId/appointments
router.post('/', requireModule('appointment'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { customerId, title, type, staffName, location, notes, scheduledAt, durationMinutes } = req.body;
    if (!title || !scheduledAt) return error(res, 'title ve scheduledAt zorunlu', 400);

    const appointment = await prisma.appointment.create({
      data: {
        tenantId, customerId, title, type: type || 'general',
        staffName, location, notes, durationMinutes: durationMinutes || 30,
        scheduledAt: new Date(scheduledAt),
        status: 'PENDING',
      },
    });

    // Activity kaydı
    if (customerId) {
      await prisma.activity.create({
        data: {
          tenantId, customerId,
          type: 'appointment',
          description: `Randevu oluşturuldu: ${title} — ${new Date(scheduledAt).toLocaleString('tr-TR')}`,
        },
      }).catch(() => {});
    }

    success(res, appointment, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// PUT /api/tenants/:tenantId/appointments/:id
router.put('/:id', requireModule('appointment'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { title, type, staffName, location, notes, scheduledAt, durationMinutes, status } = req.body;

    const appointment = await prisma.appointment.updateMany({
      where: { id: req.params.id, tenantId },
      data: {
        title, type, staffName, location, notes, durationMinutes, status,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      },
    });

    if (appointment.count === 0) return error(res, 'Randevu bulunamadı', 404);
    const updated = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    success(res, updated);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// DELETE /api/tenants/:tenantId/appointments/:id
router.delete('/:id', requireModule('appointment'), async (req, res) => {
  try {
    await prisma.appointment.deleteMany({ where: { id: req.params.id, tenantId: req.params.tenantId } });
    success(res, { deleted: true });
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;

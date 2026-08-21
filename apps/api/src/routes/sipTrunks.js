const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { authenticateToken, checkTenantAccess } = require('../middleware/auth');
const asteriskManager = require('../services/asteriskManager');
const redisService = require('../services/redisService');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

router.use(authenticateToken, checkTenantAccess);

router.get('/', async (req, res) => {
  try {
    const trunks = await prisma.sipTrunk.findMany({
      where: { tenantId: req.params.tenantId }
    });
    return success(res, 'Trunks retrieved', trunks);
  } catch (err) {
    return error(res, 'Failed to retrieve trunks', 500, err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const { label, sipUsername, sipPassword, sipHost, sipPort, phoneNumber } = req.body;
    const trunk = await prisma.sipTrunk.create({
      data: {
        tenantId: req.params.tenantId,
        label, sipUsername, sipPassword, sipHost, sipPort, phoneNumber
      }
    });
    return success(res, 'Trunk created', trunk, 201);
  } catch (err) {
    return error(res, 'Failed to create trunk', 500, err.message);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { label, sipUsername, sipPassword, sipHost, sipPort, phoneNumber } = req.body;
    const existing = await prisma.sipTrunk.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    if (!existing) return error(res, 'Trunk bulunamadı', 404);

    const updatedTrunk = await prisma.sipTrunk.update({
      where: { id: req.params.id },
      data: {
        label: label !== undefined ? label : existing.label,
        sipUsername: sipUsername !== undefined ? sipUsername : existing.sipUsername,
        sipPassword: sipPassword !== undefined ? sipPassword : existing.sipPassword,
        sipHost: sipHost !== undefined ? sipHost : existing.sipHost,
        sipPort: sipPort !== undefined ? parseInt(sipPort) : existing.sipPort,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : existing.phoneNumber,
        status: 'REGISTERING'
      }
    });

    // Asterisk santralinde de güncelle
    try {
      await asteriskManager.activateTrunk(req.params.tenantId, updatedTrunk);
    } catch (e) {
      console.warn('[TRUNK] Asterisk reload warning:', e.message);
    }

    await redisService.invalidateTenantConfig(req.params.tenantId);
    return success(res, 'Trunk güncellendi ve santrale yüklendi', updatedTrunk);
  } catch (err) {
    return error(res, 'Trunk güncelleme hatası', 500, err.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.sipTrunk.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    if (!existing) return error(res, 'Trunk bulunamadı', 404);

    // Asterisk'ten sil
    try {
      await asteriskManager.deactivateTrunk(req.params.tenantId, req.params.id);
    } catch (e) {
      console.warn('[TRUNK] Asterisk deactivate warning:', e.message);
    }

    await prisma.sipTrunk.delete({
      where: { id: req.params.id }
    });

    await redisService.invalidateTenantConfig(req.params.tenantId);
    return success(res, 'Trunk silindi ve santralden kaldırıldı');
  } catch (err) {
    return error(res, 'Trunk silme hatası', 500, err.message);
  }
});


router.post('/:id/activate', async (req, res) => {
  try {
    const trunk = await prisma.sipTrunk.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    
    if (!trunk) return error(res, 'Trunk not found', 404);

    await asteriskManager.activateTrunk(req.params.tenantId, trunk);

    const updatedTrunk = await prisma.sipTrunk.update({
      where: { id: trunk.id },
      data: { status: 'REGISTERING' }
    });
    
    await redisService.invalidateTenantConfig(req.params.tenantId);

    return success(res, 'Trunk activation initiated', updatedTrunk);
  } catch (err) {
    return error(res, 'Activation failed', 500, err.message);
  }
});

router.post('/:id/deactivate', async (req, res) => {
  try {
    const trunk = await prisma.sipTrunk.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    
    if (!trunk) return error(res, 'Trunk not found', 404);

    await asteriskManager.deactivateTrunk(req.params.tenantId, trunk.id);

    const updatedTrunk = await prisma.sipTrunk.update({
      where: { id: trunk.id },
      data: { status: 'INACTIVE' }
    });

    await redisService.invalidateTenantConfig(req.params.tenantId);

    return success(res, 'Trunk deactivated', updatedTrunk);
  } catch (err) {
    return error(res, 'Deactivation failed', 500, err.message);
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const trunk = await prisma.sipTrunk.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId },
      select: { status: true, lastRegisteredAt: true }
    });
    if (!trunk) return error(res, 'Trunk not found', 404);
    
    return success(res, 'Trunk status', trunk);
  } catch (err) {
    return error(res, 'Failed to get status', 500, err.message);
  }
});

module.exports = router;

const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { authenticateToken, checkTenantAccess } = require('../middleware/auth');
const redisService = require('../services/redisService');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

router.use(authenticateToken, checkTenantAccess);

router.get('/', async (req, res) => {
  try {
    const apis = await prisma.customerApi.findMany({
      where: { tenantId: req.params.tenantId }
    });
    return success(res, 'Customer APIs retrieved', apis);
  } catch (err) {
    return error(res, 'Failed to retrieve Customer APIs', 500, err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const api = await prisma.customerApi.create({
      data: { ...req.body, tenantId: req.params.tenantId }
    });
    await redisService.invalidateTenantConfig(req.params.tenantId);
    return success(res, 'Customer API created', api, 201);
  } catch (err) {
    return error(res, 'Failed to create Customer API', 500, err.message);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const api = await prisma.customerApi.update({
      where: { id: req.params.id, tenantId: req.params.tenantId },
      data: req.body
    });
    await redisService.invalidateTenantConfig(req.params.tenantId);
    return success(res, 'Customer API updated', api);
  } catch (err) {
    return error(res, 'Update failed', 500, err.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.customerApi.delete({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    await redisService.invalidateTenantConfig(req.params.tenantId);
    return success(res, 'Customer API deleted');
  } catch (err) {
    return error(res, 'Deletion failed', 500, err.message);
  }
});

router.post('/:id/test', async (req, res) => {
  try {
    const api = await prisma.customerApi.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    if (!api) return error(res, 'Customer API not found', 404);

    const response = await axios({
      method: api.method,
      url: api.endpoint,
      headers: typeof api.headers === 'string' ? JSON.parse(api.headers) : api.headers,
      data: req.body.testData || undefined
    });

    return success(res, 'Test successful', response.data);
  } catch (err) {
    return error(res, 'Test request failed', 500, err.message);
  }
});

module.exports = router;

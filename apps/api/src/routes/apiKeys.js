const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { authenticateToken, checkTenantAccess } = require('../middleware/auth');
const { generateApiKey } = require('../utils/crypto');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

router.use(authenticateToken, checkTenantAccess);

router.get('/', async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { tenantId: req.params.tenantId },
      select: {
        id: true, name: true, keyPrefix: true, permissions: true,
        lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return success(res, 'API keys retrieved', keys);
  } catch (err) {
    return error(res, 'Failed to retrieve API keys', 500, err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, permissions, expiresAt } = req.body;
    const { key, hash, prefix } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: req.params.tenantId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        permissions: permissions ? JSON.stringify(permissions) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Sadece oluşturulduğunda açıkça anahtarı dönüyoruz (bir daha gösterilmeyecek)
    return success(res, 'API key created. Please save it securely.', {
      ...apiKey,
      rawKey: key
    }, 201);
  } catch (err) {
    return error(res, 'Failed to create API key', 500, err.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.apiKey.delete({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    return success(res, 'API key deleted');
  } catch (err) {
    return error(res, 'Failed to delete API key', 500, err.message);
  }
});

module.exports = router;

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error, paginated } = require('../utils/response');
const { authenticateApiKey } = require('../middleware/apiKeyAuth');

const router = express.Router();
const prisma = new PrismaClient();

// All public API routes require API key
router.use(authenticateApiKey);

router.get('/calls', async (req, res) => {
  try {
    const permissions = JSON.parse(req.apiKey.permissions);
    if (!permissions.includes('calls:read')) {
      return error(res, 'Insufficient permissions', 403);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where: { tenantId: req.tenant.id },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' }
      }),
      prisma.call.count({ where: { tenantId: req.tenant.id } })
    ]);

    return paginated(res, 'Calls retrieved', calls, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch calls', 500, err.message);
  }
});

router.get('/calls/:id/transcript', async (req, res) => {
  try {
    const permissions = JSON.parse(req.apiKey.permissions);
    if (!permissions.includes('transcripts:read')) {
      return error(res, 'Insufficient permissions', 403);
    }

    const transcripts = await prisma.transcript.findMany({
      where: { callId: req.params.id, call: { tenantId: req.tenant.id } },
      orderBy: { timestamp: 'asc' }
    });

    return success(res, 'Transcript retrieved', transcripts);
  } catch (err) {
    return error(res, 'Failed to fetch transcript', 500, err.message);
  }
});

module.exports = router;

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error, paginated } = require('../utils/response');
const { authenticateToken, checkTenantAccess } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

router.use(authenticateToken, checkTenantAccess);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where: { tenantId: req.params.tenantId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: { agent: true, sipTrunk: true }
      }),
      prisma.call.count({ where: { tenantId: req.params.tenantId } })
    ]);

    return paginated(res, 'Calls retrieved', calls, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to retrieve calls', 500, err.message);
  }
});

router.get('/:callId/transcript', async (req, res) => {
  try {
    const transcripts = await prisma.transcript.findMany({
      where: { callId: req.params.callId, call: { tenantId: req.params.tenantId } },
      orderBy: { timestamp: 'asc' }
    });
    return success(res, 'Transcript retrieved', transcripts);
  } catch (err) {
    return error(res, 'Failed to retrieve transcript', 500, err.message);
  }
});

router.get('/:callId/recording', async (req, res) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.callId, tenantId: req.params.tenantId },
      select: { recordingUrl: true }
    });
    
    if (!call || !call.recordingUrl) {
      return error(res, 'Recording not found', 404);
    }
    
    return success(res, 'Recording URL retrieved', { recordingUrl: call.recordingUrl });
  } catch (err) {
    return error(res, 'Failed to retrieve recording', 500, err.message);
  }
});

module.exports = router;

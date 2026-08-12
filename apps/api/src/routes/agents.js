const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { authenticateToken, checkTenantAccess } = require('../middleware/auth');
const promptWizard = require('../services/promptWizard');
const redisService = require('../services/redisService');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

router.use(authenticateToken, checkTenantAccess);

router.get('/', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { tenantId: req.params.tenantId }
    });
    return success(res, 'Agents retrieved', agents);
  } catch (err) {
    return error(res, 'Failed to retrieve agents', 500, err.message);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, tenantId: req.params.tenantId }
    });
    if (!agent) return error(res, 'Agent not found', 404);

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: req.body
    });

    if (req.body.systemPrompt && req.body.systemPrompt !== agent.systemPrompt) {
      await prisma.agentVersion.create({
        data: {
          agentId: agent.id,
          systemPrompt: req.body.systemPrompt,
          createdBy: req.user.userId,
          changeNote: 'Manual update'
        }
      });
    }

    await redisService.invalidateTenantConfig(req.params.tenantId);

    return success(res, 'Agent updated', updatedAgent);
  } catch (err) {
    return error(res, 'Update failed', 500, err.message);
  }
});

router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await prisma.agentVersion.findMany({
      where: { agentId: req.params.id, agent: { tenantId: req.params.tenantId } },
      orderBy: { createdAt: 'desc' }
    });
    return success(res, 'Versions retrieved', versions);
  } catch (err) {
    return error(res, 'Failed to retrieve versions', 500, err.message);
  }
});

router.post('/:id/revert/:versionId', async (req, res) => {
  try {
    const version = await prisma.agentVersion.findUnique({
      where: { id: req.params.versionId, agentId: req.params.id }
    });
    if (!version) return error(res, 'Version not found', 404);

    const agent = await prisma.agent.update({
      where: { id: req.params.id, tenantId: req.params.tenantId },
      data: { systemPrompt: version.systemPrompt }
    });

    await prisma.agentVersion.create({
      data: {
        agentId: agent.id,
        systemPrompt: agent.systemPrompt,
        createdBy: req.user.userId,
        changeNote: `Reverted to ${version.id}`
      }
    });

    await redisService.invalidateTenantConfig(req.params.tenantId);

    return success(res, 'Agent reverted', agent);
  } catch (err) {
    return error(res, 'Revert failed', 500, err.message);
  }
});

// SSE Stream for AI Prompt Wizard
router.get('/ai-wizard', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const stream = promptWizard.startWizardStream(req, res);
  req.on('close', () => {
    stream.destroy();
  });
});

router.post('/ai-wizard/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    await promptWizard.handleMessage(sessionId, message);
    return success(res, 'Message processed');
  } catch (err) {
    return error(res, 'Failed to process message', 500, err.message);
  }
});


module.exports = router;

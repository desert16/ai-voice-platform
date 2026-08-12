const { PrismaClient } = require('@prisma/client');
const { hashApiKey } = require('../utils/crypto');
const { error } = require('../utils/response');

const prisma = new PrismaClient();

/**
 * API Key Authentication Middleware for Public API.
 * Expects key in "Authorization: Bearer <key>" or "X-Api-Key: <key>" header.
 */
async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];
  const xApiKey = req.headers['x-api-key'];
  
  let rawKey = xApiKey;
  
  if (!rawKey && authHeader && authHeader.startsWith('Bearer ')) {
    rawKey = authHeader.split(' ')[1];
  }

  if (!rawKey) {
    return error(res, 'API Key is required.', 401);
  }

  try {
    const keyHash = hashApiKey(rawKey);
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: true },
    });

    if (!apiKey || !apiKey.isActive) {
      return error(res, 'Invalid or inactive API key.', 401);
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return error(res, 'API key has expired.', 401);
    }

    // Attach tenant info to request
    req.tenant = apiKey.tenant;
    req.apiKey = apiKey;

    // Update last used asynchronously
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(console.error);

    next();
  } catch (err) {
    console.error('API Key Auth Error:', err);
    return error(res, 'Internal server error during authentication.', 500);
  }
}

module.exports = {
  authenticateApiKey,
};

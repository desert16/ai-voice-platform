const JWT_SECRET = process.env.JWT_SECRET || 'voicecore_jwt_super_secret_2024';

/**
 * JWT Authentication Middleware
 * Validates the token and attaches userId, tenantId, and role to req.user.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[AUTH] İstekte token bulunamadı');
    return error(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Validate tenant isolation unless it's a SUPERADMIN
    if (req.user.role !== 'SUPERADMIN' && !req.user.tenantId) {
      console.warn('[AUTH] Token tenant context içermiyor');
      return error(res, 'Invalid token payload: missing tenant context.', 403);
    }
    
    next();
  } catch (err) {
    console.error('[AUTH ERROR] Token doğrulama hatası:', err.message);
    return error(res, 'Invalid or expired token.', 401);
  }
}


/**
 * Middleware to require SUPERADMIN role
 */
function requireSuperadmin(req, res, next) {
  if (req.user?.role !== 'SUPERADMIN') {
    return error(res, 'Forbidden: Requires superadmin privileges.', 403);
  }
  next();
}

/**
 * Middleware to verify that the tenantId in URL matches the user's tenantId (by ID or Slug).
 */
async function checkTenantAccess(req, res, next) {
  const { tenantId } = req.params;
  
  if (req.user.role === 'SUPERADMIN' || tenantId === 'me' || tenantId === 'current') {
    req.params.tenantId = req.user.tenantId;
    return next();
  }

  if (req.user.tenantId === tenantId) {
    return next();
  }

  // Check if tenantId in URL is a slug matching the user's tenant
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { OR: [{ id: tenantId }, { slug: tenantId }] }
    });
    if (tenant && tenant.id === req.user.tenantId) {
      req.params.tenantId = tenant.id; // normalize to cuid
      return next();
    }
  } catch (_) {}

  return error(res, 'Forbidden: Cross-tenant access denied.', 403);
}


module.exports = {
  authenticateToken,
  requireSuperadmin,
  checkTenantAccess,
};

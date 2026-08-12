const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

/**
 * JWT Authentication Middleware
 * Validates the token and attaches userId, tenantId, and role to req.user.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Validate tenant isolation unless it's a SUPERADMIN
    if (req.user.role !== 'SUPERADMIN' && !req.user.tenantId) {
      return error(res, 'Invalid token payload: missing tenant context.', 403);
    }
    
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token.', 403);
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
 * Middleware to verify that the tenantId in URL matches the user's tenantId.
 */
function checkTenantAccess(req, res, next) {
  const { tenantId } = req.params;
  
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  if (req.user.tenantId !== tenantId) {
    return error(res, 'Forbidden: Cross-tenant access denied.', 403);
  }

  next();
}

module.exports = {
  authenticateToken,
  requireSuperadmin,
  checkTenantAccess,
};

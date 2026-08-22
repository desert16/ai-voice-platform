// apps/api/src/core/tenantGuard.js
// Her request'te tenant doğrulaması ve context enjeksiyonu
const { PrismaClient } = require('@prisma/client');
const { error } = require('../utils/response');

const prisma = new PrismaClient();

/**
 * tenantGuard — req.params.tenantId üzerinden tenant doğrular,
 * req.tenant ve req.tenantModules context'e enjekte eder.
 */
async function tenantGuard(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.body?.tenantId;
    if (!tenantId) return error(res, 'Tenant ID gerekli', 400);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        sector: true,
        tenantModules: { include: { module: true }, where: { enabled: true } },
        subscription: { include: { plan: true } },
      },
    });

    if (!tenant) return error(res, 'Tenant bulunamadı', 404);
    if (tenant.status === 'SUSPENDED') return error(res, 'Hesap askıya alındı', 403);
    if (tenant.status === 'CANCELLED') return error(res, 'Hesap iptal edildi', 403);

    // Aktif modül kodlarını set olarak sakla
    req.tenant = tenant;
    req.activeModules = new Set(tenant.tenantModules.map(tm => tm.module.code));
    next();
  } catch (err) {
    console.error('[TENANT GUARD]', err.message);
    error(res, 'Tenant doğrulama hatası', 500);
  }
}

module.exports = { tenantGuard };

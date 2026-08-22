// apps/api/src/core/moduleGuard.js
// Modül erişim kontrolü — tenant'ın o modülü aktif edip etmediğini kontrol eder
const { error } = require('../utils/response');

/**
 * requireModule('crm') gibi kullanılır.
 * tenantGuard'dan SONRA uygulanmalı (req.activeModules gerekli).
 */
function requireModule(moduleCode) {
  return (req, res, next) => {
    if (!req.activeModules) {
      return error(res, 'Tenant context bulunamadı. tenantGuard middleware eksik.', 500);
    }
    if (!req.activeModules.has(moduleCode)) {
      return error(res, `Bu özellik için "${moduleCode}" modülü aktif değil`, 403);
    }
    next();
  };
}

/**
 * requireAnyModule(['crm', 'appointment']) — en az biri aktifse geçer
 */
function requireAnyModule(moduleCodes) {
  return (req, res, next) => {
    if (!req.activeModules) {
      return error(res, 'Tenant context bulunamadı', 500);
    }
    const hasAny = moduleCodes.some(code => req.activeModules.has(code));
    if (!hasAny) {
      return error(res, `Bu özellik için şu modüllerden biri gerekli: ${moduleCodes.join(', ')}`, 403);
    }
    next();
  };
}

module.exports = { requireModule, requireAnyModule };

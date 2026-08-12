// ============================================================================
// Redis Client — Multi-Tenant UUID/Config Yönetimi
// ============================================================================

const Redis = require('ioredis');

async function createRedisClient() {
  const client = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    lazyConnect: false,
  });

  client.on('connect', () => console.log('[REDIS] Bağlantı kuruldu ✓'));
  client.on('error', (err) => console.error(`[REDIS ERROR] ${err.message}`));
  client.on('reconnecting', () => console.log('[REDIS] Yeniden bağlanıyor...'));

  return client;
}

// UUID → TenantId mapping'ini oku
// Asterisk-Manager servisi bu değeri çağrı başlangıcında yazar.
// Key: tenant:uuid:<asterisk-uuid-hex>  Value: tenantId  TTL: 5 dakika
async function getUuidTenant(redis, uuid) {
  return redis.get(`tenant:uuid:${uuid}`);
}

// Tenant config'ini Redis'ten oku
// API servisi tenant config'i güncellendiğinde bu key'i günceller.
// Key: tenant:config:<tenantId>  Value: JSON  TTL: 1 saat (API tarafından refresh edilir)
async function getTenantConfig(redis, tenantId) {
  try {
    const raw = await redis.get(`tenant:config:${tenantId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[REDIS] Config parse hatası (${tenantId}): ${e.message}`);
    return null;
  }
}

// Tenant config'ini Redis'e yaz (API servisi tarafından çağrılır)
async function setTenantConfig(redis, tenantId, config, ttlSeconds = 3600) {
  await redis.setex(
    `tenant:config:${tenantId}`,
    ttlSeconds,
    JSON.stringify(config)
  );
}

// Tenant config'ini geçersiz kıl (prompt güncellendiğinde)
async function invalidateTenantConfig(redis, tenantId) {
  await redis.del(`tenant:config:${tenantId}`);
}

module.exports = {
  createRedisClient,
  getUuidTenant,
  getTenantConfig,
  setTenantConfig,
  invalidateTenantConfig,
};

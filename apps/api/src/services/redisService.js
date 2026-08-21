const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || 'voicecore_redis_2024',
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 3000);
      }
    });
    
    this.redis.on('connect', () => {
      console.log('[REDIS] API Redis bağlantısı kuruldu ✓');
    });

    this.redis.on('error', (err) => {
      console.error('[REDIS ERROR]:', err.message);
    });
  }


  async invalidateTenantConfig(tenantId) {
    try {
      const key = `tenant_config:${tenantId}`;
      await this.redis.del(key);
      console.log(`Invalidated Redis cache for tenant: ${tenantId}`);
    } catch (err) {
      console.error('Redis Invalidaton Error:', err);
    }
  }

  async setTenantConfig(tenantId, config, ttlSeconds = 3600) {
    try {
      const key = `tenant_config:${tenantId}`;
      await this.redis.set(key, JSON.stringify(config), 'EX', ttlSeconds);
    } catch (err) {
      console.error('Redis Set Error:', err);
    }
  }

  async getTenantConfig(tenantId) {
    try {
      const key = `tenant_config:${tenantId}`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Redis Get Error:', err);
      return null;
    }
  }
}

module.exports = new RedisService();

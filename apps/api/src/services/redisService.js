const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://:voicecore_redis_2024@127.0.0.1:6379');
    
    this.redis.on('error', (err) => {
      console.error('Redis Connection Error:', err);
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

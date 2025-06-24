const redis = require('../utils/redisClient');

const DEFAULT_TTL = 43200;

const localCache = new Map(); // fallback en memoria
const isRedisReady = () => redis.status === 'ready';

const get = async (key) => {
  try {
    if (isRedisReady()) {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
    }
    return localCache.get(key) || null;  // fallback si no hay en Redis
  } catch (err) {
    console.error('Redis get error:', err);
    return localCache.get(key) || null;  // fallback si Redis falla
  }
};

const set = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    if (isRedisReady()) {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    }
    localCache.set(key, value); // guardamos también en memoria
  } catch (err) {
    console.error('Redis set error:', err);
    localCache.set(key, value); // fallback en memoria si falla Redis
  }
};

module.exports = { get, set };

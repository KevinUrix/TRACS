const redis = require('../utils/redisClient');

const DEFAULT_TTL = 43200; // Tiempo en ms

const localCache = new Map(); // fallback en memoria
const isRedisReady = () => redis.status === 'ready';

const get = async (key) => {
  try {
    if (isRedisReady()) {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
    }

    const cached = localCache.get(key);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        return cached.value; // Regresa el caché en caso de que no esté expirado y redis falle
      } else {
        localCache.delete(key); // Elimina el expirado
      }
    }
    return null;

  } catch (err) {
    console.error('Redis get error:', err);

    const cached = localCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value; // Regresa el valor desde el local (node) en caso de error
    }
    return null;
  }
};

const set = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    if (isRedisReady()) {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    }
    const expiresAt = Date.now() + ttl * 1000;
    localCache.set(key, { value, expiresAt }); // Guarda en caché local (node)
  } catch (err) {
    console.error('Redis set error:', err);

    const expiresAt = Date.now() + ttl * 1000;
    localCache.set(key, { value, expiresAt }); // Guarda el caché local, en caso de eror
  }
};

const keys = async (pattern = '*') => {
  try {
    // Limpia las keys expiradas antes de devolverlas
    const now = Date.now();
    for (const [key, { expiresAt }] of localCache.entries()) {
      if (expiresAt <= now) localCache.delete(key);
    }

    const localKeys = Array.from(localCache.keys());

    if (isRedisReady()) {
      const redisKeys = await redis.keys(pattern);
      const allKeys = new Set([...redisKeys, ...localKeys]); // eliminar duplicados
      return Array.from(allKeys);
    }

    return localKeys;
  } catch (err) {
    console.error('Error al obtener claves del caché:', err);
    return Array.from(localCache.keys());
  }
};


const syncLocalCacheToRedis = async () => {
  if (!isRedisReady()) return;

  const now = Date.now();

  for (const [key, { value, expiresAt }] of localCache.entries()) {
    if (expiresAt > now) {
      const ttl = Math.floor((expiresAt - now) / 1000);
      try {
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
        console.log(`✅ Sincronizada key=${key} a Redis`);
      } catch (err) {
        console.error(`❌ Error sincronizando key=${key}:`, err.message);
      }
    } else {
      localCache.delete(key); // limpia expirados
    }
  }
};


module.exports = { get, set, keys, syncLocalCacheToRedis };

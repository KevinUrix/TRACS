const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_HOST, {
  retryStrategy(times) {
    // if (times > 10) return null; deja de reconectar después de 10 intentos
    return Math.min(times * 100, 5000); // hasta 5 segundos entre reintentos
  },
  maxRetriesPerRequest: 3,  // máximo 3 intentos por comando
  enableOfflineQueue: false // no encola comandos si está desconectado
});

/* 
REDIS EN SERVIDOR LOCAL
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',  // la IP del servidor Redis
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy(times) {
    // if (times > 10) return null; deja de reconectar después de 10 intentos
    return Math.min(times * 100, 5000); // hasta 5 segundos entre reintentos
  },
  maxRetriesPerRequest: 3,  // máximo 3 intentos por comando
  enableOfflineQueue: false // no encola comandos si está desconectado
}); */

redis.on('error', (err) => {
    if (err.message.includes('ECONNREFUSED')) {

    console.warn('Redis connection refused - Redis está apagado o inaccesible');
  } else {
    console.warn('Redis error:', err.message);
  }
});

redis.on('connect', () => {
  console.log('Redis conectado');
});

redis.on('close', () => {
  console.log('Redis conexión cerrada');
});

redis.on('reconnecting', (delay) => {
  console.log(`Redis intentando reconectar en ${delay}ms`);
});

module.exports = redis;

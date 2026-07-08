/**
 * config/redis.js — Redis Client Setup
 * Uses ioredis with reconnect strategy and pub/sub support
 */

const Redis = require('ioredis');

let redisClient = null;
let redisSubscriber = null;

const connectRedis = async () => {
  try {
    const redisOptions = {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    };

    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', redisOptions);

    // Subscriber client for pub/sub (separate connection required)
    redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', redisOptions);

    await redisClient.connect();

    redisClient.on('connect', () => console.log('✅ Redis Connected'));
    redisClient.on('error', (err) => console.error('❌ Redis Error:', err.message));
    redisClient.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));

    console.log('✅ Redis Client ready');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    // Don't exit — app can function without Redis (degraded mode)
  }
};

/**
 * Get the main Redis client (for get/set/publish)
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

/**
 * Get the subscriber Redis client (for subscribe/psubscribe)
 */
const getRedisSubscriber = () => {
  if (!redisSubscriber) {
    throw new Error('Redis subscriber not initialized.');
  }
  return redisSubscriber;
};

module.exports = { connectRedis: connectRedis, getRedisClient, getRedisSubscriber };

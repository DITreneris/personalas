'use strict';

const { Redis } = require('@upstash/redis');

let redisClient = null;

function getRedis() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.VERCEL_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error('Redis REST environment variables are not configured.');
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function redisKey(key) {
  const prefix = (process.env.REDIS_KEY_PREFIX || '').trim();
  if (!prefix) return key;
  return prefix.endsWith(':') ? prefix + key : `${prefix}:${key}`;
}

function clientIp(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  if (req.socket && req.socket.remoteAddress) return String(req.socket.remoteAddress);
  return 'unknown';
}

/**
 * Fixed-window counter via Redis INCR + EXPIRE.
 * @returns {{ allowed: boolean, retryAfterSeconds: number }}
 */
async function checkRateLimit(bucket, id, limit, windowSeconds) {
  const key = redisKey(`rl:${bucket}:${id}`);
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (count > limit) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

module.exports = {
  checkRateLimit,
  clientIp
};

// ============================================
// Redis Client Configuration
// Used for: OTP, rate limiting, cache, chat
// ============================================

import { createClient, type RedisClientType } from 'redis';
import { env } from './env.js';

let redisClient: RedisClientType | null = null;
let isConnected = false;

export async function initRedis(): Promise<void> {
  const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      isConnected = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️ Redis not available, using in-memory fallback');
    redisClient = null;
    isConnected = false;
  }
}

export function getRedis(): RedisClientType | null {
  return isConnected ? redisClient : null;
}

/**
 * Socket.IO Redis adapter uchun pub/sub client juftligi.
 * Adapter ikkita alohida connection talab qiladi (subscriber bloklangan holatda bo'ladi).
 * Agar Redis mavjud bo'lmasa, null qaytaradi (adapter yoqilmaydi, single-node fallback).
 */
export async function createPubSubPair(): Promise<{ pub: RedisClientType; sub: RedisClientType } | null> {
  if (!isConnected || !redisClient) return null;
  try {
    const pub = redisClient.duplicate() as RedisClientType;
    const sub = redisClient.duplicate() as RedisClientType;
    pub.on('error', (err) => console.warn('⚠️ Redis pub error:', err.message));
    sub.on('error', (err) => console.warn('⚠️ Redis sub error:', err.message));
    await Promise.all([pub.connect(), sub.connect()]);
    return { pub, sub };
  } catch (err: any) {
    console.warn('⚠️ Redis pub/sub juftligini yaratib bo\'lmadi:', err?.message);
    return null;
  }
}

// ============================================
// OTP Operations (with Redis or in-memory fallback)
// ============================================
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

export async function setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.setEx(key, ttlSeconds, value);
  } else {
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

export async function getValue(key: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) {
    return redis.get(key);
  } else {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }
}

export async function deleteKey(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

export async function incrementKey(key: string, ttlSeconds?: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const val = await redis.incr(key);
    if (ttlSeconds && val === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return val;
  } else {
    const entry = memoryStore.get(key);
    const current = entry ? parseInt(entry.value) || 0 : 0;
    const newVal = current + 1;
    const expiresAt = entry?.expiresAt || (Date.now() + (ttlSeconds || 60) * 1000);
    memoryStore.set(key, { value: String(newVal), expiresAt });
    return newVal;
  }
}

// ============================================
// Cache helpers
// ============================================
export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await getValue(`cache:${key}`);
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 300): Promise<void> {
  await setWithExpiry(`cache:${key}`, JSON.stringify(value), ttlSeconds);
}

export async function cacheDelete(key: string): Promise<void> {
  await deleteKey(`cache:${key}`);
}

/**
 * Idempotency guard — webhook/payment kabi "exactly-once" operatsiyalar uchun.
 * Agar shu key bo'yicha avval qayd qilingan bo'lsa, `false` qaytaradi (duplicate).
 * Aks holda `true` qaytaradi va TTL muddatiga lock o'rnatadi.
 *
 * Redis mavjud bo'lmasa — `true` qaytaradi (single-node fallback, hech bo'lmaganda
 * joriy instance'da jarayonni davom ettirish uchun); bu holda idempotency kafolati
 * yo'qoladi, shuning uchun production'da Redis talab qilinadi.
 */
export async function acquireIdempotency(
  key: string,
  ttlSeconds: number = 86400,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    // In-memory fallback — bir node ichida idempotency
    const fallbackKey = `idem:${key}`;
    const existing = memoryStore.get(fallbackKey);
    if (existing && Date.now() < existing.expiresAt) return false;
    memoryStore.set(fallbackKey, { value: '1', expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }
  // SET NX EX — atomic; returns null if key exists, 'OK' if set
  const result = await redis.set(`idem:${key}`, '1', { NX: true, EX: ttlSeconds });
  return result === 'OK';
}

/**
 * Pattern bo'yicha cache'larni o'chirish (SCAN ishlatadi, KEYS emas)
 * O(1) per iteration — production-safe
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  let deleted = 0;
  try {
    // SCAN iterator — non-blocking, O(1) per page
    for await (const key of redis.scanIterator({ MATCH: `cache:${pattern}`, COUNT: 100 })) {
      await redis.del(key);
      deleted++;
    }
  } catch (err) {
    console.warn('⚠️ cacheDeletePattern xatolik:', err);
  }
  return deleted;
}

// ============================================
// Rate Limiting
// ============================================
export async function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const key = `rate:${identifier}`;
  const count = await incrementKey(key, windowSeconds);

  if (count > maxAttempts) {
    const redis = getRedis();
    let ttl = windowSeconds;
    if (redis) {
      ttl = await redis.ttl(key);
    }
    return { allowed: false, remaining: 0, retryAfter: ttl };
  }

  return { allowed: true, remaining: maxAttempts - count };
}

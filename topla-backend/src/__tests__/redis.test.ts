/**
 * Redis va cache utillarining unit testlari
 * In-memory fallback'ni sinab ko'radi (haqiqiy Redis kerak emas)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Redis client mock — null qaytaradi (in-memory fallback ishlatiladi)
vi.mock('redis', () => ({
  createClient: vi.fn().mockReturnValue({
    connect: vi.fn().mockRejectedValue(new Error('Redis mavjud emas')),
    on: vi.fn(),
    setEx: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    scanIterator: vi.fn(),
  }),
}));

// Har bir test uchun modulni qayta yuklash (memoryStore tozalanadi)
let setWithExpiry: typeof import('../config/redis.js')['setWithExpiry'];
let getValue: typeof import('../config/redis.js')['getValue'];
let deleteKey: typeof import('../config/redis.js')['deleteKey'];
let cacheGet: typeof import('../config/redis.js')['cacheGet'];
let cacheSet: typeof import('../config/redis.js')['cacheSet'];
let cacheDelete: typeof import('../config/redis.js')['cacheDelete'];
let checkRateLimit: typeof import('../config/redis.js')['checkRateLimit'];
let getRedis: typeof import('../config/redis.js')['getRedis'];

describe('Redis Utils (in-memory fallback)', () => {
  beforeEach(async () => {
    // Modulni qayta import qilish
    vi.resetModules();

    // redis mock'ni qayta sozlash
    vi.doMock('redis', () => ({
      createClient: vi.fn().mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('Redis mavjud emas')),
        on: vi.fn(),
      }),
    }));

    const redisModule = await import('../config/redis');
    setWithExpiry = redisModule.setWithExpiry;
    getValue = redisModule.getValue;
    deleteKey = redisModule.deleteKey;
    cacheGet = redisModule.cacheGet;
    cacheSet = redisModule.cacheSet;
    cacheDelete = redisModule.cacheDelete;
    checkRateLimit = redisModule.checkRateLimit;
    getRedis = redisModule.getRedis;
  });

  describe('getRedis', () => {
    it('Redis ulanmagan bo\'lsa null qaytarishi kerak', () => {
      expect(getRedis()).toBeNull();
    });
  });

  describe('setWithExpiry / getValue', () => {
    it('qiymat saqlash va olish', async () => {
      await setWithExpiry('test:key', 'qiymat-123', 60);
      const result = await getValue('test:key');
      expect(result).toBe('qiymat-123');
    });

    it('mavjud bo\'lmagan kalit null qaytarishi kerak', async () => {
      const result = await getValue('mavjud:emas');
      expect(result).toBeNull();
    });
  });

  describe('deleteKey', () => {
    it('kalitni o\'chirishi kerak', async () => {
      await setWithExpiry('delete:test', 'val', 60);
      await deleteKey('delete:test');
      const result = await getValue('delete:test');
      expect(result).toBeNull();
    });
  });

  describe('cacheGet / cacheSet', () => {
    it('JSON obyektni saqlash va olish', async () => {
      const data = { name: 'Topla', count: 42 };
      await cacheSet('test-cache', data, 60);
      const result = await cacheGet<typeof data>('test-cache');
      expect(result).toEqual(data);
    });

    it('mavjud bo\'lmagan cache null qaytarishi kerak', async () => {
      const result = await cacheGet('mavjud-emas');
      expect(result).toBeNull();
    });
  });

  describe('cacheDelete', () => {
    it('cache ni o\'chirishi kerak', async () => {
      await cacheSet('delete-cache', { data: true }, 60);
      await cacheDelete('delete-cache');
      const result = await cacheGet('delete-cache');
      expect(result).toBeNull();
    });
  });

  describe('checkRateLimit', () => {
    it('birinchi so\'rov ruxsat berilishi kerak', async () => {
      const result = await checkRateLimit('test-ip', 5, 60);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('limit oshganda rad etishi kerak', async () => {
      // 5 ta so'rovni yuborish
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('limit-test', 5, 60);
      }
      // 6-chi so'rov rad etilishi kerak
      const result = await checkRateLimit('limit-test', 5, 60);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});

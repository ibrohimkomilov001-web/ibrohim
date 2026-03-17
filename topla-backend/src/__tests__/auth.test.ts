/**
 * JWT va Cookie utillarining unit testlari
 * Testlar: token yaratish, tekshirish, muddati tugash, blacklist, cookie o'rnatish
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Redis mock — jwt.ts ichida ishlatiladi
vi.mock('../config/redis', () => {
  const store = new Map<string, string>();
  return {
    setWithExpiry: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    getValue: vi.fn(async (key: string) => store.get(key) ?? null),
    deleteKey: vi.fn(async (key: string) => { store.delete(key); }),
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
    cacheGet: vi.fn().mockResolvedValue(null),
    cacheSet: vi.fn(),
    cacheDelete: vi.fn(),
    initRedis: vi.fn(),
    getRedis: vi.fn().mockReturnValue(null),
    // Test helper — store'ni tozalash
    __store: store,
  };
});

// Database mock — authMiddleware ichida ishlatiladi
vi.mock('../config/database', () => ({
  prisma: { adminRole: { findUnique: vi.fn() } },
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
} from '../utils/jwt';

const TEST_PAYLOAD = {
  userId: '550e8400-e29b-41d4-a716-446655440001',
  role: 'customer',
  phone: '+998901234567',
};

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('yaroqli JWT token yaratishi kerak', () => {
      const token = generateToken(TEST_PAYLOAD);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT 3 qismdan iborat
    });

    it('token ichida to\'g\'ri payload bo\'lishi kerak', () => {
      const token = generateToken(TEST_PAYLOAD);
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
      expect(decoded.role).toBe(TEST_PAYLOAD.role);
      expect(decoded.phone).toBe(TEST_PAYLOAD.phone);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('refresh token yaratishi kerak', () => {
      const token = generateRefreshToken(TEST_PAYLOAD);
      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3);
    });

    it('access va refresh tokenlar farqli bo\'lishi kerak', () => {
      const accessToken = generateToken(TEST_PAYLOAD);
      const refreshToken = generateRefreshToken(TEST_PAYLOAD);
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyToken', () => {
    it('yaroqli tokenni muvaffaqiyatli tekshirishi kerak', () => {
      const token = generateToken(TEST_PAYLOAD);
      const payload = verifyToken(token);
      expect(payload.userId).toBe(TEST_PAYLOAD.userId);
      expect(payload.role).toBe(TEST_PAYLOAD.role);
    });

    it('noto\'g\'ri token uchun xato tashlashi kerak', () => {
      expect(() => verifyToken('noto\'g\'ri-token')).toThrow();
    });

    it('boshqa secret bilan yaratilgan token uchun xato tashlashi kerak', () => {
      const fakeToken = jwt.sign(TEST_PAYLOAD, 'boshqa-secret');
      expect(() => verifyToken(fakeToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('yaroqli refresh tokenni tekshirishi kerak', () => {
      const token = generateRefreshToken(TEST_PAYLOAD);
      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe(TEST_PAYLOAD.userId);
    });

    it('access token ni refresh sifatida qabul qilmasligi kerak', () => {
      const accessToken = generateToken(TEST_PAYLOAD);
      // Access token boshqa secret bilan yaratilgan — refresh verification muvaffaqiyatsiz bo'lishi kerak
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('blacklistToken', () => {
    it('tokenni blacklist ga qo\'shishi kerak', async () => {
      const token = generateToken(TEST_PAYLOAD);
      await blacklistToken(token);
      const isBlacklisted = await isTokenBlacklisted(token);
      expect(isBlacklisted).toBe(true);
    });

    it('blacklist da bo\'lmagan token false qaytarishi kerak', async () => {
      const token = generateToken({ userId: 'yangi-user', role: 'customer' });
      const isBlacklisted = await isTokenBlacklisted(token);
      expect(isBlacklisted).toBe(false);
    });
  });
});

describe('Cookie Utils', () => {
  // extractToken'ni sinab ko'rish
  let extractToken: typeof import('../utils/cookie.js')['extractToken'];
  let extractRefreshToken: typeof import('../utils/cookie.js')['extractRefreshToken'];

  beforeEach(async () => {
    const cookieModule = await import('../utils/cookie');
    extractToken = cookieModule.extractToken;
    extractRefreshToken = cookieModule.extractRefreshToken;
  });

  describe('extractToken', () => {
    it('cookie dan token olishi kerak', () => {
      const request = {
        headers: {},
        cookies: { topla_at: 'cookie-token-123' },
      };
      expect(extractToken(request)).toBe('cookie-token-123');
    });

    it('Authorization header dan token olishi kerak', () => {
      const request = {
        headers: { authorization: 'Bearer header-token-456' },
        cookies: {},
      };
      expect(extractToken(request)).toBe('header-token-456');
    });

    it('cookie va header bo\'lmaganda null qaytarishi kerak', () => {
      const request = { headers: {}, cookies: {} };
      expect(extractToken(request)).toBeNull();
    });

    it('cookie header dan ustun bo\'lishi kerak', () => {
      const request = {
        headers: { authorization: 'Bearer header-token' },
        cookies: { topla_at: 'cookie-token' },
      };
      // Cookie ustun — xavfsizroq (httpOnly)
      expect(extractToken(request)).toBe('cookie-token');
    });
  });

  describe('extractRefreshToken', () => {
    it('cookie dan refresh token olishi kerak', () => {
      const request = { cookies: { topla_rt: 'refresh-cookie-123' } };
      expect(extractRefreshToken(request)).toBe('refresh-cookie-123');
    });

    it('body dan refresh token olishi kerak', () => {
      const request = { cookies: {} };
      expect(extractRefreshToken(request, 'refresh-body-456')).toBe('refresh-body-456');
    });

    it('hech narsa bo\'lmaganda null qaytarishi kerak', () => {
      const request = { cookies: {} };
      expect(extractRefreshToken(request)).toBeNull();
    });
  });
});

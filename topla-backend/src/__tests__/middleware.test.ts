/**
 * Auth middleware unit testlari
 * Testlar: authMiddleware, requireRole, optionalAuth
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Redis mock
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
    __store: store,
  };
});

// Database mock
vi.mock('../config/database', () => ({
  prisma: {
    adminRole: { findUnique: vi.fn() },
    shop: { findUnique: vi.fn() },
  },
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

import { buildTestApp, authHeader, authCookie } from './helpers/test-app';
import { createTestToken, createExpiredToken, TEST_USER, TEST_ADMIN } from './helpers/mocks';
import { authMiddleware, requireRole, optionalAuth } from '../middleware/auth';

describe('authMiddleware', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();

    // Test endpoint — auth kerak
    app.get('/test-auth', { preHandler: authMiddleware }, async (request) => {
      return { userId: request.user!.userId, role: request.user!.role };
    });

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('yaroqli Bearer token bilan 200 qaytarishi kerak', async () => {
    const token = createTestToken({ userId: TEST_USER.id, role: 'customer' });
    const res = await app.inject({
      method: 'GET',
      url: '/test-auth',
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.userId).toBe(TEST_USER.id);
    expect(body.role).toBe('customer');
  });

  it('yaroqli cookie token bilan 200 qaytarishi kerak', async () => {
    const token = createTestToken({ userId: TEST_USER.id, role: 'customer' });
    const res = await app.inject({
      method: 'GET',
      url: '/test-auth',
      headers: { cookie: authCookie(token) },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().userId).toBe(TEST_USER.id);
  });

  it('token bo\'lmaganda 401 qaytarishi kerak', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test-auth',
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Unauthorized');
  });

  it('muddati tugagan token bilan 401 qaytarishi kerak', async () => {
    const token = createExpiredToken({ userId: TEST_USER.id, role: 'customer' });
    // Biroz kutish — token exp=0s darhol tugaydi
    await new Promise((r) => setTimeout(r, 1100));

    const res = await app.inject({
      method: 'GET',
      url: '/test-auth',
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(401);
  });

  it('noto\'g\'ri token bilan 401 qaytarishi kerak', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test-auth',
      headers: authHeader('bu.notogri.token'),
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('requireRole', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();

    // admin + vendor roli kerak bo'lgan endpoint
    app.get('/admin-only', {
      preHandler: [authMiddleware, requireRole('admin')],
    }, async (request) => {
      return { ok: true, role: request.user!.role };
    });

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('admin roli bilan 200 qaytarishi kerak', async () => {
    const token = createTestToken({ userId: TEST_ADMIN.id, role: 'admin' });
    const res = await app.inject({
      method: 'GET',
      url: '/admin-only',
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().role).toBe('admin');
  });

  it('customer roli bilan 403 qaytarishi kerak', async () => {
    const token = createTestToken({ userId: TEST_USER.id, role: 'customer' });
    const res = await app.inject({
      method: 'GET',
      url: '/admin-only',
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('Forbidden');
  });
});

describe('optionalAuth', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();

    app.get('/optional', { preHandler: optionalAuth }, async (request) => {
      return { hasUser: !!request.user, userId: request.user?.userId || null };
    });

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('token bilan foydalanuvchini aniqlashi kerak', async () => {
    const token = createTestToken({ userId: TEST_USER.id, role: 'customer' });
    const res = await app.inject({
      method: 'GET',
      url: '/optional',
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().hasUser).toBe(true);
    expect(res.json().userId).toBe(TEST_USER.id);
  });

  it('token siz ham 200 qaytarishi kerak (user null)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/optional',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().hasUser).toBe(false);
    expect(res.json().userId).toBeNull();
  });

  it('noto\'g\'ri token bilan xato tashlamas, user null bo\'lishi kerak', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/optional',
      headers: authHeader('notogri-token'),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().hasUser).toBe(false);
  });
});

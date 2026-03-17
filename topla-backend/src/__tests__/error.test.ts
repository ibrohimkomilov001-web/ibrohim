/**
 * Error handler unit testlari
 * Testlar: AppError, NotFoundError, Zod xatoliklari, Prisma xatoliklari
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// Mock'lar
vi.mock('../config/redis', () => ({
  setWithExpiry: vi.fn(),
  getValue: vi.fn().mockResolvedValue(null),
  deleteKey: vi.fn(),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
  initRedis: vi.fn(),
  getRedis: vi.fn().mockReturnValue(null),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
}));

vi.mock('../config/database', () => ({
  prisma: { adminRole: { findUnique: vi.fn() } },
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

import { buildTestApp } from './helpers/test-app';
import { errorHandler, AppError, NotFoundError, ForbiddenError } from '../middleware/error';

describe('Error Handler', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();
    app.setErrorHandler(errorHandler);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('AppError', () => {
    it('400 status va xabar qaytarishi kerak', async () => {
      app.get('/test-app-error', async () => {
        throw new AppError('Noto\'g\'ri ma\'lumot', 400);
      });
      await app.ready();

      const res = await app.inject({ method: 'GET', url: '/test-app-error' });
      expect(res.statusCode).toBe(400);
      expect(res.json().message).toBe('Noto\'g\'ri ma\'lumot');
    });
  });

  describe('NotFoundError', () => {
    it('404 status qaytarishi kerak', async () => {
      app.get('/test-not-found', async () => {
        throw new NotFoundError('Mahsulot');
      });
      await app.ready();

      const res = await app.inject({ method: 'GET', url: '/test-not-found' });
      expect(res.statusCode).toBe(404);
      expect(res.json().message).toContain('topilmadi');
    });
  });

  describe('ForbiddenError', () => {
    it('403 status qaytarishi kerak', async () => {
      app.get('/test-forbidden', async () => {
        throw new ForbiddenError();
      });
      await app.ready();

      const res = await app.inject({ method: 'GET', url: '/test-forbidden' });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('ZodError', () => {
    it('Zod validation xatosi 400 qaytarishi kerak', async () => {
      app.post('/test-zod', async (request) => {
        const schema = z.object({
          name: z.string().min(2),
          price: z.number().positive(),
        });
        schema.parse(request.body);
        return { ok: true };
      });
      await app.ready();

      const res = await app.inject({
        method: 'POST',
        url: '/test-zod',
        payload: { name: '', price: -5 },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.error).toBe('Validation Error');
      expect(body.details).toBeDefined();
      expect(body.details.length).toBeGreaterThan(0);
    });
  });

  describe('500 Server Error', () => {
    it('kutilmagan xato 500 qaytarishi kerak', async () => {
      app.get('/test-500', async () => {
        throw new Error('Kutilmagan xatolik');
      });
      await app.ready();

      const res = await app.inject({ method: 'GET', url: '/test-500' });
      expect(res.statusCode).toBe(500);
      // Xavfsizlik — xatolik tafsilotlari oshkor qilinmasligi kerak
      expect(res.json().message).not.toContain('Kutilmagan xatolik');
    });
  });
});

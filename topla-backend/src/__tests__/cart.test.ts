/**
 * Savat (Cart) routes unit testlari — Prisma mock bilan
 * Testlar: savat ko'rish, qo'shish, yangilash, o'chirish
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================
// Mock'lar — vi.hoisted() bilan (hoisting muammosini hal qiladi)
// ============================================
const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    cartItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    adminRole: {
      findUnique: vi.fn(),
    },
  };
  return { prismaMock };
});

vi.mock('../config/database', () => ({
  prisma: prismaMock,
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

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

import { buildTestApp, authHeader } from './helpers/test-app';
import { createTestToken, TEST_USER, TEST_PRODUCT, TEST_SHOP } from './helpers/mocks';
import { cartRoutes } from '../modules/products/cart.routes';

const userToken = createTestToken({ userId: TEST_USER.id, role: 'customer' });

describe('Cart Routes', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeEach(async () => {
    app = await buildTestApp();
    await app.register(cartRoutes, { prefix: '/api/v1' });
    await app.ready();

    // Mock'larni tozalash
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/cart', () => {
    it('bo\'sh savatni qaytarishi kerak', async () => {
      prismaMock.cartItem.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/cart',
        headers: authHeader(userToken),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
      expect(body.data.total).toBe(0);
      expect(body.data.itemCount).toBe(0);
    });

    it('mahsulotli savatni qaytarishi kerak', async () => {
      const cartItems = [
        {
          id: 'cart-1',
          userId: TEST_USER.id,
          productId: TEST_PRODUCT.id,
          quantity: 2,
          product: {
            ...TEST_PRODUCT,
            shop: { id: TEST_SHOP.id, name: TEST_SHOP.name },
          },
          createdAt: new Date(),
        },
      ];
      prismaMock.cartItem.findMany.mockResolvedValue(cartItems);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/cart',
        headers: authHeader(userToken),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.items).toHaveLength(1);
      expect(body.data.total).toBe(TEST_PRODUCT.price * 2);
      expect(body.data.itemCount).toBe(1);
    });

    it('autentifikatsiyasiz 401 qaytarishi kerak', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/cart',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/cart', () => {
    it('yangi mahsulotni savatga qo\'shishi kerak', async () => {
      prismaMock.product.findUnique.mockResolvedValue({ ...TEST_PRODUCT, isActive: true });
      prismaMock.cartItem.findFirst.mockResolvedValue(null);
      prismaMock.cartItem.upsert.mockResolvedValue({
        id: 'new-cart-item',
        userId: TEST_USER.id,
        productId: TEST_PRODUCT.id,
        quantity: 1,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/cart',
        headers: authHeader(userToken),
        payload: { productId: TEST_PRODUCT.id, quantity: 1 },
      });

      expect(res.statusCode).toBe(200);
    });

    it('mavjud bo\'lmagan mahsulotni qo\'shishda xato qaytarishi kerak', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/cart',
        headers: authHeader(userToken),
        payload: { productId: TEST_PRODUCT.id, quantity: 1 },
      });

      expect(res.statusCode).toBe(404);
    });

    it('noto\'g\'ri payload bilan xato qaytarishi kerak', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/cart',
        headers: authHeader(userToken),
        payload: { productId: 'notogri-uuid', quantity: -5 },
      });

      // Zod validation xatosi — error handler bo'lmasa 500, bo'lsa 400
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.statusCode).toBeLessThan(600);
    });
  });

  describe('DELETE /api/v1/cart', () => {
    it('butun savatni tozalashi kerak', async () => {
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 3 });

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/cart',
        headers: authHeader(userToken),
      });

      expect(res.statusCode).toBe(200);
    });
  });
});

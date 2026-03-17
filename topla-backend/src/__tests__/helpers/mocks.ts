/**
 * Mock'lar — Prisma, Redis va boshqa tashqi xizmatlarni test muhitida almashtiradi.
 * Har bir test faylida import qilib ishlatiladi.
 */
import { vi } from 'vitest';

// ============================================
// Prisma Mock
// ============================================

/** Prisma model mock — har bir model uchun CRUD metodlarini yaratadi */
function createModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
  };
}

/** Asosiy prisma mock obyekti */
export const prismaMock = {
  user: createModelMock(),
  shop: createModelMock(),
  product: createModelMock(),
  productVariant: createModelMock(),
  cartItem: createModelMock(),
  order: createModelMock(),
  orderItem: createModelMock(),
  address: createModelMock(),
  notification: createModelMock(),
  vendorTransaction: createModelMock(),
  adminSetting: createModelMock(),
  adminRole: createModelMock(),
  category: createModelMock(),
  pickupPoint: createModelMock(),
  courierAssignment: createModelMock(),
  session: createModelMock(),
  promoCode: createModelMock(),
  review: createModelMock(),
  banner: createModelMock(),
  chatMessage: createModelMock(),
  chatRoom: createModelMock(),
  // Raw query uchun
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
  $transaction: vi.fn().mockImplementation((fn: any) => {
    if (typeof fn === 'function') return fn(prismaMock);
    return Promise.all(fn);
  }),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// ============================================
// Redis Mock
// ============================================

const memoryStore = new Map<string, string>();

export const redisMock = {
  getValue: vi.fn().mockImplementation(async (key: string) => memoryStore.get(key) ?? null),
  setWithExpiry: vi.fn().mockImplementation(async (key: string, value: string) => {
    memoryStore.set(key, value);
  }),
  deleteKey: vi.fn().mockImplementation(async (key: string) => {
    memoryStore.delete(key);
  }),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  // Redis store'ni tozalash
  clear: () => memoryStore.clear(),
};

// ============================================
// JWT Mock Yordamchilari
// ============================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-topla-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-topla-2024';

/** Test foydalanuvchi uchun haqiqiy JWT token yaratish */
export function createTestToken(payload: {
  userId: string;
  role: string;
  phone?: string;
  pickupPointId?: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

/** Test uchun refresh token yaratish */
export function createTestRefreshToken(payload: {
  userId: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

/** Muddati o'tgan token yaratish (testlarda 401 tekshirish uchun) */
export function createExpiredToken(payload: {
  userId: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
}

// ============================================
// Namunaviy test ma'lumotlari
// ============================================

export const TEST_USER = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  phone: '+998901234567',
  fullName: 'Test Foydalanuvchi',
  email: 'test@topla.uz',
  role: 'customer',
  isActive: true,
  language: 'uz',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_VENDOR = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  phone: '+998901234568',
  fullName: 'Test Sotuvchi',
  email: 'vendor@topla.uz',
  role: 'vendor',
  isActive: true,
  language: 'uz',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_ADMIN = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  phone: '+998901234569',
  fullName: 'Test Admin',
  email: 'admin@topla.uz',
  role: 'admin',
  isActive: true,
  language: 'uz',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_SHOP = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  name: 'Test Do\'kon',
  slug: 'test-dokon',
  ownerId: TEST_VENDOR.id,
  status: 'active',
  balance: 1000000,
  rating: 4.5,
  reviewCount: 10,
  commissionRate: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_PRODUCT = {
  id: '550e8400-e29b-41d4-a716-446655440020',
  name: 'Test Mahsulot',
  slug: 'test-mahsulot',
  shopId: TEST_SHOP.id,
  categoryId: '550e8400-e29b-41d4-a716-446655440030',
  price: 50000,
  stock: 100,
  isActive: true,
  images: ['https://cdn.topla.uz/test.jpg'],
  description: 'Test mahsulot tavsifi',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_CATEGORY = {
  id: '550e8400-e29b-41d4-a716-446655440030',
  name: 'Elektronika',
  slug: 'elektronika',
  isActive: true,
};

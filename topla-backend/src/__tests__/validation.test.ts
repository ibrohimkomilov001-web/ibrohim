/**
 * Zod validation sxemalari va env konfiguratsiya testlari
 * Bu testlar tashqi xizmatlarga bog'liq emas — toza unit testlar
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ============================================
// Asosiy Zod sxemalar (loyihadan olingan)
// ============================================

const loginSchema = z.object({
  firebaseToken: z.string().min(1),
  phone: z.string().min(9),
  fcmToken: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(9).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['uz', 'ru']).optional(),
});

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullish(),
  quantity: z.number().int().positive().max(999).default(1),
});

const createOrderSchema = z.object({
  addressId: z.string().uuid().optional(),
  pickupPointId: z.string().uuid().optional(),
  deliveryMethod: z.enum(['courier', 'pickup']).default('courier'),
  paymentMethod: z.enum(['cash', 'card']).default('cash'),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  note: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().optional(),
  })).optional(),
});

const vendorRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().min(9),
  shopName: z.string().min(2),
});

// ============================================
// Login Schema Testlari
// ============================================

describe('loginSchema', () => {
  it('yaroqli login ma\'lumotlarini qabul qilishi kerak', () => {
    const result = loginSchema.safeParse({
      firebaseToken: 'firebase-token-123',
      phone: '+998901234567',
      platform: 'android',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platform).toBe('android');
    }
  });

  it('default platform android bo\'lishi kerak', () => {
    const result = loginSchema.safeParse({
      firebaseToken: 'token',
      phone: '+998901234567',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platform).toBe('android');
    }
  });

  it('bo\'sh firebaseToken rad etilishi kerak', () => {
    const result = loginSchema.safeParse({
      firebaseToken: '',
      phone: '+998901234567',
    });
    expect(result.success).toBe(false);
  });

  it('qisqa telefon raqam rad etilishi kerak', () => {
    const result = loginSchema.safeParse({
      firebaseToken: 'token',
      phone: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('noto\'g\'ri platform rad etilishi kerak', () => {
    const result = loginSchema.safeParse({
      firebaseToken: 'token',
      phone: '+998901234567',
      platform: 'windows',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// Update Profile Schema Testlari
// ============================================

describe('updateProfileSchema', () => {
  it('bo\'sh obyektni qabul qilishi kerak (barcha optional)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('yaroqli email ni qabul qilishi kerak', () => {
    const result = updateProfileSchema.safeParse({ email: 'test@topla.uz' });
    expect(result.success).toBe(true);
  });

  it('noto\'g\'ri emailni rad etishi kerak', () => {
    const result = updateProfileSchema.safeParse({ email: 'notogri-email' });
    expect(result.success).toBe(false);
  });

  it('juda qisqa ism rad etilishi kerak', () => {
    const result = updateProfileSchema.safeParse({ fullName: 'A' });
    expect(result.success).toBe(false);
  });

  it('faqat uz va ru tillarini qabul qilishi kerak', () => {
    expect(updateProfileSchema.safeParse({ language: 'uz' }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ language: 'ru' }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ language: 'en' }).success).toBe(false);
  });
});

// ============================================
// Add To Cart Schema Testlari
// ============================================

describe('addToCartSchema', () => {
  it('yaroqli UUID bilan qabul qilishi kerak', () => {
    const result = addToCartSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440001',
      quantity: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(3);
    }
  });

  it('default quantity 1 bo\'lishi kerak', () => {
    const result = addToCartSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it('manfiy miqdorni rad etishi kerak', () => {
    const result = addToCartSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440001',
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it('999 dan katta miqdorni rad etishi kerak', () => {
    const result = addToCartSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440001',
      quantity: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('noto\'g\'ri UUID ni rad etishi kerak', () => {
    const result = addToCartSchema.safeParse({
      productId: 'notogri-uuid',
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// Create Order Schema Testlari
// ============================================

describe('createOrderSchema', () => {
  it('minimal buyurtma ma\'lumotlarini qabul qilishi kerak', () => {
    const result = createOrderSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliveryMethod).toBe('courier');
      expect(result.data.paymentMethod).toBe('cash');
    }
  });

  it('to\'liq ma\'lumotlar bilan qabul qilishi kerak', () => {
    const result = createOrderSchema.safeParse({
      addressId: '550e8400-e29b-41d4-a716-446655440001',
      deliveryMethod: 'pickup',
      paymentMethod: 'card',
      recipientName: 'Ali',
      recipientPhone: '+998901234567',
      note: 'Tezroq yetkazib bering',
      items: [
        { productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('noto\'g\'ri yetkazish usulini rad etishi kerak', () => {
    const result = createOrderSchema.safeParse({
      deliveryMethod: 'drone',
    });
    expect(result.success).toBe(false);
  });

  it('noto\'g\'ri to\'lov usulini rad etishi kerak', () => {
    const result = createOrderSchema.safeParse({
      paymentMethod: 'bitcoin',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// Vendor Register Schema Testlari
// ============================================

describe('vendorRegisterSchema', () => {
  it('yaroqli vendor ma\'lumotlarini qabul qilishi kerak', () => {
    const result = vendorRegisterSchema.safeParse({
      email: 'vendor@test.uz',
      password: 'parol123',
      fullName: 'Test Sotuvchi',
      phone: '+998901234567',
      shopName: 'Mening Do\'konim',
    });
    expect(result.success).toBe(true);
  });

  it('qisqa parolni rad etishi kerak (< 6 belgi)', () => {
    const result = vendorRegisterSchema.safeParse({
      email: 'vendor@test.uz',
      password: '123',
      fullName: 'Test',
      phone: '+998901234567',
      shopName: 'Do\'kon',
    });
    expect(result.success).toBe(false);
  });

  it('email siz rad etishi kerak', () => {
    const result = vendorRegisterSchema.safeParse({
      password: 'parol123',
      fullName: 'Test',
      phone: '+998901234567',
      shopName: 'Do\'kon',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// Env Schema Testlari
// ============================================

describe('Env Configuration', () => {
  it('NODE_ENV faqat development/production/test bo\'lishi kerak', () => {
    const envSchema = z.object({
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    });

    expect(envSchema.safeParse({ NODE_ENV: 'development' }).success).toBe(true);
    expect(envSchema.safeParse({ NODE_ENV: 'production' }).success).toBe(true);
    expect(envSchema.safeParse({ NODE_ENV: 'test' }).success).toBe(true);
    expect(envSchema.safeParse({ NODE_ENV: 'staging' }).success).toBe(false);
  });

  it('PORT raqam bo\'lishi kerak', () => {
    const envSchema = z.object({
      PORT: z.coerce.number().default(3000),
    });

    const result = envSchema.safeParse({ PORT: '3001' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3001);
    }
  });
});

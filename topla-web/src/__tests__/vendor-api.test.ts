/**
 * Vendor API client — Phase 5 interface & method testlari
 */
import { describe, it, expect } from 'vitest';
import type {
  OnboardingProgress,
  OnboardingStep,
  PerformanceScore,
  PerformanceMetric,
  BulkPriceUpdate,
  BulkPriceResult,
  BulkImportResult,
  ShopSettings,
} from '@/lib/api/vendor';

// ============================================
// Type Contract Tests — Vendor API Interfaces
// ============================================

describe('OnboardingProgress interface', () => {
  it('should define correct shape', () => {
    const progress: OnboardingProgress = {
      completed: 5,
      total: 7,
      percentage: 71,
      steps: [
        { key: 'shop_info', label: "Do'kon ma'lumotlari", completed: true, href: '/vendor/settings' },
        { key: 'first_product', label: "Birinchi mahsulot", completed: false, href: '/vendor/products' },
      ],
    };

    expect(progress.completed).toBe(5);
    expect(progress.total).toBe(7);
    expect(progress.percentage).toBe(71);
    expect(progress.steps).toHaveLength(2);
    expect(progress.steps[0].completed).toBe(true);
    expect(progress.steps[1].completed).toBe(false);
  });

  it('should have steps with required fields', () => {
    const step: OnboardingStep = {
      key: 'documents',
      label: 'Hujjatlar',
      completed: false,
      href: '/vendor/documents',
    };
    expect(step.key).toBeTruthy();
    expect(step.label).toBeTruthy();
    expect(step.href).toBeTruthy();
    expect(typeof step.completed).toBe('boolean');
  });
});

describe('PerformanceScore interface', () => {
  it('should define correct shape', () => {
    const score: PerformanceScore = {
      overall: 85.5,
      level: 'gold',
      periodDays: 30,
      metrics: {
        fulfillmentRate: { label: 'Buyurtma bajarish', value: 95, weight: 0.25, weightedScore: 23.75 },
        cancellationRate: { label: 'Bekor qilish', value: 3, weight: 0.15, weightedScore: 14.1 },
      },
    };

    expect(score.overall).toBe(85.5);
    expect(score.level).toBe('gold');
    expect(score.periodDays).toBe(30);
    expect(Object.keys(score.metrics)).toContain('fulfillmentRate');
    expect(score.metrics.fulfillmentRate.weight).toBe(0.25);
  });

  it('should support all performance levels', () => {
    const levels: PerformanceScore['level'][] = ['bronze', 'silver', 'gold', 'platinum'];
    levels.forEach(level => {
      const score: PerformanceScore = {
        overall: 50, level, periodDays: 30,
        metrics: {},
      };
      expect(score.level).toBe(level);
    });
  });
});

describe('BulkPriceUpdate interface', () => {
  it('should allow price-only updates', () => {
    const update: BulkPriceUpdate = {
      productId: '123e4567-e89b-12d3-a456-426614174000',
      price: 50000,
    };
    expect(update.price).toBe(50000);
    expect(update.originalPrice).toBeUndefined();
    expect(update.discountPercent).toBeUndefined();
  });

  it('should allow discount updates', () => {
    const update: BulkPriceUpdate = {
      productId: '123e4567-e89b-12d3-a456-426614174000',
      originalPrice: 100000,
      discountPercent: 20,
    };
    expect(update.discountPercent).toBe(20);
  });
});

describe('BulkPriceResult interface', () => {
  it('should report updated count and errors', () => {
    const result: BulkPriceResult = {
      updated: 8,
      errors: [
        { productId: 'abc-123', error: 'Mahsulot topilmadi' },
      ],
      total: 9,
    };
    expect(result.updated).toBe(8);
    expect(result.errors).toHaveLength(1);
    expect(result.total).toBe(9);
  });
});

describe('BulkImportResult interface', () => {
  it('should report imported count and row errors', () => {
    const result: BulkImportResult = {
      imported: 50,
      errors: [
        { row: 3, error: "Narx noto'g'ri" },
        { row: 15, error: "Kategoriya topilmadi" },
      ],
      total: 52,
    };
    expect(result.imported).toBe(50);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].row).toBe(3);
  });
});

describe('ShopSettings interface', () => {
  it('should have all required fields', () => {
    const settings: ShopSettings = {
      name: 'Test Shop',
      description: 'Test',
      phone: '+998901234567',
      email: 'test@test.com',
      address: 'Toshkent',
      city: 'Toshkent',
      website: null,
      telegram: '@test',
      instagram: '@test',
      businessType: 'llc',
      inn: '123456789',
      bankName: 'Test Bank',
      bankAccount: '20208000123',
      mfo: '00084',
      oked: '47111',
      fulfillmentType: 'FBS',
      isOpen: true,
      workingHours: { mon: '09:00-18:00' },
      minOrderAmount: 10000,
      deliveryFee: 5000,
      freeDeliveryFrom: 100000,
      deliveryRadius: 10,
      logoUrl: '/logo.png',
      bannerUrl: null,
      latitude: 41.2995,
      longitude: 69.2401,
    };

    expect(settings.name).toBe('Test Shop');
    expect(settings.fulfillmentType).toBe('FBS');
    expect(settings.website).toBeNull();
    expect(settings.bannerUrl).toBeNull();
    expect(settings.isOpen).toBe(true);
    expect(settings.inn).toBe('123456789');
  });

  it('should support nullable fields', () => {
    const partial: Partial<ShopSettings> = {
      website: null,
      telegram: null,
      freeDeliveryFrom: null,
      deliveryRadius: null,
      logoUrl: null,
      bannerUrl: null,
      latitude: null,
      longitude: null,
    };
    expect(partial.website).toBeNull();
    expect(partial.freeDeliveryFrom).toBeNull();
  });
});

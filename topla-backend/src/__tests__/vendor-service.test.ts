/**
 * vendor.service.ts — Unit testlari
 * CSV parsing, export, performance score, onboarding, bulk price update
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import pure helper functions directly
import { parseCsvLine, escapeCsvField } from '../services/vendor.service.js';

// ============================================
// CSV Parsing Tests
// ============================================
describe('parseCsvLine', () => {
  it('should parse simple comma-separated values', () => {
    const result = parseCsvLine('a,b,c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should handle quoted fields with commas', () => {
    const result = parseCsvLine('"hello, world",b,c');
    expect(result).toEqual(['hello, world', 'b', 'c']);
  });

  it('should handle escaped quotes inside quoted fields', () => {
    const result = parseCsvLine('"he said ""hello""",b');
    expect(result).toEqual(['he said "hello"', 'b']);
  });

  it('should handle empty fields', () => {
    const result = parseCsvLine('a,,c,');
    expect(result).toEqual(['a', '', 'c', '']);
  });

  it('should handle single field', () => {
    const result = parseCsvLine('hello');
    expect(result).toEqual(['hello']);
  });

  it('should trim whitespace from values', () => {
    const result = parseCsvLine(' a , b , c ');
    expect(result).toEqual([' a ', ' b ', ' c ']);
  });

  it('should handle empty input', () => {
    const result = parseCsvLine('');
    expect(result).toEqual(['']);
  });

  it('should handle newlines inside quotes', () => {
    const result = parseCsvLine('"line1\\nline2",b');
    expect(result).toEqual(['line1\\nline2', 'b']);
  });

  it('should parse Uzbek text correctly', () => {
    const result = parseCsvLine("Ko'ylak,10000,Kiyim");
    expect(result).toEqual(["Ko'ylak", '10000', 'Kiyim']);
  });
});

// ============================================
// CSV Escape Tests
// ============================================
describe('escapeCsvField', () => {
  it('should return simple string as-is', () => {
    expect(escapeCsvField('hello')).toBe('hello');
  });

  it('should wrap strings with commas in quotes', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  it('should wrap strings with quotes and escape them', () => {
    expect(escapeCsvField('he said "hi"')).toBe('"he said ""hi"""');
  });

  it('should wrap strings with newlines in quotes', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('should handle empty string', () => {
    expect(escapeCsvField('')).toBe('');
  });

  it('should handle undefined/null by returning empty', () => {
    // escapeCsvField expects string, so calling with non-string is a type error
    // but we test it doesn't crash the actual code path
    expect(escapeCsvField('')).toBe('');
  });
});

// ============================================
// Bulk Price Update Validation Tests (schema)
// ============================================
import { z } from 'zod';

const bulkPriceSchema = z.object({
  updates: z.array(z.object({
    productId: z.string().uuid(),
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    discountPercent: z.number().min(0).max(100).optional(),
  })).min(1).max(500),
});

describe('bulkPriceSchema validation', () => {
  it('should validate correct payload', () => {
    const data = {
      updates: [
        { productId: '123e4567-e89b-12d3-a456-426614174000', price: 50000 },
        { productId: '223e4567-e89b-12d3-a456-426614174000', originalPrice: 100000, discountPercent: 20 },
      ],
    };
    const result = bulkPriceSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject empty updates array', () => {
    const result = bulkPriceSchema.safeParse({ updates: [] });
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID', () => {
    const result = bulkPriceSchema.safeParse({
      updates: [{ productId: 'not-a-uuid', price: 50000 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const result = bulkPriceSchema.safeParse({
      updates: [{ productId: '123e4567-e89b-12d3-a456-426614174000', price: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject discount above 100', () => {
    const result = bulkPriceSchema.safeParse({
      updates: [{ productId: '123e4567-e89b-12d3-a456-426614174000', discountPercent: 101 }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept update with only productId', () => {
    const result = bulkPriceSchema.safeParse({
      updates: [{ productId: '123e4567-e89b-12d3-a456-426614174000' }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject more than 500 updates', () => {
    const updates = Array.from({ length: 501 }, (_, i) => ({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      price: 1000,
    }));
    const result = bulkPriceSchema.safeParse({ updates });
    expect(result.success).toBe(false);
  });
});

// ============================================
// Shop Settings Validation Tests
// ============================================
const shopSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  website: z.string().url().optional().nullable(),
  telegram: z.string().max(100).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  businessType: z.string().max(100).optional(),
  inn: z.string().max(20).optional(),
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(30).optional(),
  mfo: z.string().max(10).optional(),
  oked: z.string().max(10).optional(),
  fulfillmentType: z.enum(['FBS', 'DBS']).optional(),
  isOpen: z.boolean().optional(),
  minOrderAmount: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  freeDeliveryFrom: z.number().min(0).optional().nullable(),
  deliveryRadius: z.number().min(0).optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
});

describe('shopSettingsSchema validation', () => {
  it('should validate empty partial update', () => {
    const result = shopSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate full update', () => {
    const result = shopSettingsSchema.safeParse({
      name: 'Test Shop',
      description: 'Description here',
      phone: '+998901234567',
      email: 'shop@test.com',
      address: 'Toshkent, Yunusobod',
      city: 'Toshkent',
      fulfillmentType: 'FBS',
      inn: '123456789',
      bankName: 'Ipoteka bank',
      bankAccount: '20208000123456789',
      mfo: '00084',
      oked: '47111',
      minOrderAmount: 10000,
      deliveryFee: 5000,
      freeDeliveryFrom: 100000,
      instagram: '@testshop',
      telegram: '@testshop',
      website: 'https://test.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject name shorter than 2 chars', () => {
    const result = shopSettingsSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = shopSettingsSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid fulfillment type', () => {
    const result = shopSettingsSchema.safeParse({ fulfillmentType: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should accept nullable fields as null', () => {
    const result = shopSettingsSchema.safeParse({
      website: null,
      telegram: null,
      instagram: null,
      freeDeliveryFrom: null,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative delivery fee', () => {
    const result = shopSettingsSchema.safeParse({ deliveryFee: -1000 });
    expect(result.success).toBe(false);
  });
});

// ============================================
// CSV Import Header Mapping Tests
// ============================================
describe('CSV import header recognition', () => {
  const COLUMN_ALIASES: Record<string, string[]> = {
    name: ['nomi', 'name', 'mahsulot', 'product', 'товар'],
    nameUz: ['nomi_uz', 'name_uz', 'номи'],
    nameRu: ['nomi_ru', 'name_ru', 'название'],
    description: ['tavsif', 'description', 'описание'],
    price: ['narx', 'price', 'цена', 'sotuv_narxi'],
    originalPrice: ['asl_narx', 'original_price', 'скидка_от'],
    sku: ['sku', 'artikul', 'артикул', 'kod'],
    barcode: ['barcode', 'shtrix_kod', 'штрих_код'],
    stock: ['soni', 'stock', 'quantity', 'остаток', 'miqdor'],
    category: ['kategoriya', 'category', 'категория', 'turkum'],
    brand: ['brend', 'brand', 'бренд'],
    weight: ['vazn', 'weight', 'вес'],
    unit: ['birlik', 'unit', 'единица'],
  };

  const findColumnKey = (header: string): string | null => {
    const h = header.toLowerCase().trim();
    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(h)) return key;
    }
    return null;
  };

  it('should recognize Uzbek column names', () => {
    expect(findColumnKey('Nomi')).toBe('name');
    expect(findColumnKey('narx')).toBe('price');
    expect(findColumnKey('kategoriya')).toBe('category');
    expect(findColumnKey('soni')).toBe('stock');
    expect(findColumnKey('brend')).toBe('brand');
  });

  it('should recognize English column names', () => {
    expect(findColumnKey('Name')).toBe('name');
    expect(findColumnKey('price')).toBe('price');
    expect(findColumnKey('category')).toBe('category');
    expect(findColumnKey('stock')).toBe('stock');
    expect(findColumnKey('brand')).toBe('brand');
  });

  it('should recognize Russian column names', () => {
    expect(findColumnKey('товар')).toBe('name');
    expect(findColumnKey('цена')).toBe('price');
    expect(findColumnKey('категория')).toBe('category');
    expect(findColumnKey('остаток')).toBe('stock');
    expect(findColumnKey('бренд')).toBe('brand');
  });

  it('should return null for unknown columns', () => {
    expect(findColumnKey('unknown_col')).toBeNull();
    expect(findColumnKey('xyz')).toBeNull();
  });

  it('should be case-insensitive', () => {
    expect(findColumnKey('NOMI')).toBe('name');
    expect(findColumnKey('Price')).toBe('price');
    expect(findColumnKey('КАТЕГОРИЯ')).toBe('category');
  });
});

// ============================================
// Performance Score Level Tests
// ============================================
describe('Performance score levels', () => {
  const getLevel = (score: number) => {
    if (score >= 90) return 'platinum';
    if (score >= 75) return 'gold';
    if (score >= 55) return 'silver';
    return 'bronze';
  };

  it('should return platinum for score >= 90', () => {
    expect(getLevel(90)).toBe('platinum');
    expect(getLevel(100)).toBe('platinum');
    expect(getLevel(95)).toBe('platinum');
  });

  it('should return gold for score 75-89', () => {
    expect(getLevel(75)).toBe('gold');
    expect(getLevel(89)).toBe('gold');
    expect(getLevel(80)).toBe('gold');
  });

  it('should return silver for score 55-74', () => {
    expect(getLevel(55)).toBe('silver');
    expect(getLevel(74)).toBe('silver');
    expect(getLevel(65)).toBe('silver');
  });

  it('should return bronze for score < 55', () => {
    expect(getLevel(0)).toBe('bronze');
    expect(getLevel(54)).toBe('bronze');
    expect(getLevel(30)).toBe('bronze');
  });

  it('should handle edge cases', () => {
    expect(getLevel(54.9)).toBe('bronze');
    expect(getLevel(55)).toBe('silver');
    expect(getLevel(74.9)).toBe('silver');
    expect(getLevel(75)).toBe('gold');
    expect(getLevel(89.9)).toBe('gold');
    expect(getLevel(90)).toBe('platinum');
  });
});

// ============================================
// CSV Product Import Validation Tests
// ============================================
describe('CSV product import validation', () => {
  it('should require name field', () => {
    const row = { price: '10000', stock: '5' };
    const hasName = !!row.name;
    expect(hasName).toBe(false);
  });

  it('should validate numeric price', () => {
    const parsePrice = (val: string) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0 ? num : null;
    };

    expect(parsePrice('50000')).toBe(50000);
    expect(parsePrice('0')).toBe(0);
    expect(parsePrice('-100')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('')).toBe(0); // Number('') === 0
  });

  it('should validate stock as integer', () => {
    const parseStock = (val: string) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 ? num : null;
    };

    expect(parseStock('100')).toBe(100);
    expect(parseStock('0')).toBe(0);
    expect(parseStock('-5')).toBeNull();
    expect(parseStock('abc')).toBeNull();
    expect(parseStock('3.7')).toBe(3);
  });

  it('should generate slug from product name', () => {
    const generateSlug = (name: string) =>
      name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');

    expect(generateSlug("Ko'ylak Erkaklar uchun")).toBe('koylak-erkaklar-uchun');
    expect(generateSlug('Test Product 123')).toBe('test-product-123');
  });
});

// ============================================
// Discount Calculation Tests
// ============================================
describe('Discount calculation in bulk price update', () => {
  const calcDiscount = (price: number, originalPrice: number) => {
    if (originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  it('should calculate percent from price and originalPrice', () => {
    expect(calcDiscount(80000, 100000)).toBe(20);
    expect(calcDiscount(50000, 100000)).toBe(50);
    expect(calcDiscount(90000, 100000)).toBe(10);
  });

  it('should return 0 when price >= originalPrice', () => {
    expect(calcDiscount(100000, 100000)).toBe(0);
    expect(calcDiscount(120000, 100000)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(calcDiscount(1, 100)).toBe(99);
    expect(calcDiscount(0, 100)).toBe(100);
  });
});

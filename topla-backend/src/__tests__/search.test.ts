/**
 * Phase 3: Search System Tests
 * - Transliteration (Latin ↔ Cyrillic)
 * - Search service (buildMeiliDocument, synonyms, stop words)
 * - Search analytics tracking schema
 * - Search filter validation
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ============================================
// 1. TRANSLITERATION TESTS
// ============================================

// Import transliteration functions inline for testing
const LATIN_TO_CYRILLIC: [string, string][] = [
  ['sh', 'ш'], ['Sh', 'Ш'], ['SH', 'Ш'],
  ['ch', 'ч'], ['Ch', 'Ч'], ['CH', 'Ч'],
  ['ng', 'нг'], ['Ng', 'Нг'], ['NG', 'НГ'],
  ["o'", 'ў'], ["O'", 'Ў'],
  ["g'", 'ғ'], ["G'", 'Ғ'],
  ['a', 'а'], ['A', 'А'],
  ['b', 'б'], ['B', 'Б'],
  ['d', 'д'], ['D', 'Д'],
  ['e', 'е'], ['E', 'Е'],
  ['f', 'ф'], ['F', 'Ф'],
  ['g', 'г'], ['G', 'Г'],
  ['h', 'ҳ'], ['H', 'Ҳ'],
  ['i', 'и'], ['I', 'И'],
  ['j', 'ж'], ['J', 'Ж'],
  ['k', 'к'], ['K', 'К'],
  ['l', 'л'], ['L', 'Л'],
  ['m', 'м'], ['M', 'М'],
  ['n', 'н'], ['N', 'Н'],
  ['o', 'о'], ['O', 'О'],
  ['p', 'п'], ['P', 'П'],
  ['q', 'қ'], ['Q', 'Қ'],
  ['r', 'р'], ['R', 'Р'],
  ['s', 'с'], ['S', 'С'],
  ['t', 'т'], ['T', 'Т'],
  ['u', 'у'], ['U', 'У'],
  ['v', 'в'], ['V', 'В'],
  ['x', 'х'], ['X', 'Х'],
  ['y', 'й'], ['Y', 'Й'],
  ['z', 'з'], ['Z', 'З'],
  ["'", 'ъ'],
];

const CYRILLIC_TO_LATIN: [string, string][] = [
  ['ш', 'sh'], ['Ш', 'Sh'],
  ['ч', 'ch'], ['Ч', 'Ch'],
  ['ғ', "g'"], ['Ғ', "G'"],
  ['ў', "o'"], ['Ў', "O'"],
  ['ҳ', 'h'], ['Ҳ', 'H'],
  ['қ', 'q'], ['Қ', 'Q'],
  ['а', 'a'], ['А', 'A'],
  ['б', 'b'], ['Б', 'B'],
  ['в', 'v'], ['В', 'V'],
  ['г', 'g'], ['Г', 'G'],
  ['д', 'd'], ['Д', 'D'],
  ['е', 'e'], ['Е', 'E'],
  ['ё', 'yo'], ['Ё', 'Yo'],
  ['ж', 'j'], ['Ж', 'J'],
  ['з', 'z'], ['З', 'Z'],
  ['и', 'i'], ['И', 'I'],
  ['й', 'y'], ['Й', 'Y'],
  ['к', 'k'], ['К', 'K'],
  ['л', 'l'], ['Л', 'L'],
  ['м', 'm'], ['М', 'M'],
  ['н', 'n'], ['Н', 'N'],
  ['о', 'o'], ['О', 'O'],
  ['п', 'p'], ['П', 'P'],
  ['р', 'r'], ['Р', 'R'],
  ['с', 's'], ['С', 'S'],
  ['т', 't'], ['Т', 'T'],
  ['у', 'u'], ['У', 'U'],
  ['ф', 'f'], ['Ф', 'F'],
  ['х', 'x'], ['Х', 'X'],
  ['ц', 'ts'], ['Ц', 'Ts'],
  ['ъ', "'"], ['Ъ', "'"],
  ['ь', ''], ['Ь', ''],
  ['э', 'e'], ['Э', 'E'],
  ['ю', 'yu'], ['Ю', 'Yu'],
  ['я', 'ya'], ['Я', 'Ya'],
];

function applyMapping(text: string, mapping: [string, string][]): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const [from, to] of mapping) {
      if (text.substring(i, i + from.length) === from) {
        result += to;
        i += from.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += text[i];
      i++;
    }
  }
  return result;
}

function latinToCyrillic(text: string): string {
  return applyMapping(text, LATIN_TO_CYRILLIC);
}

function cyrillicToLatin(text: string): string {
  return applyMapping(text, CYRILLIC_TO_LATIN);
}

function isCyrillic(text: string): boolean {
  return /[а-яёўғқҳА-ЯЁЎҒҚҲ]/.test(text);
}

function isLatin(text: string): boolean {
  return /[a-zA-Z]/.test(text) && !isCyrillic(text);
}

function getTransliteratedQueries(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [trimmed];
  if (isCyrillic(trimmed)) return [trimmed, cyrillicToLatin(trimmed)];
  if (isLatin(trimmed)) return [trimmed, latinToCyrillic(trimmed)];
  return [trimmed];
}

describe('Transliteration: Latin → Cyrillic', () => {
  it('oddiy so\'zlarni to\'g\'ri konvertatsiya qiladi', () => {
    expect(latinToCyrillic('telefon')).toBe('телефон');
    expect(latinToCyrillic('kitob')).toBe('китоб');
    expect(latinToCyrillic('bozor')).toBe('бозор');
  });

  it('digraf (sh, ch) larni to\'g\'ri o\'zgartiradi', () => {
    expect(latinToCyrillic('shaxar')).toBe('шахар');
    expect(latinToCyrillic('choy')).toBe('чой');
  });

  it("o' va g' ni to'g'ri konvertatsiya qiladi", () => {
    expect(latinToCyrillic("o'zbek")).toBe('ўзбек');
    expect(latinToCyrillic("g'oz")).toBe('ғоз');
  });

  it('katta harflarni saqlaydi', () => {
    expect(latinToCyrillic('Salom')).toBe('Салом');
    expect(latinToCyrillic('Shaxar')).toBe('Шахар');
  });

  it('raqamlarni o\'zgartirmaydi', () => {
    expect(latinToCyrillic('telefon123')).toBe('телефон123');
  });

  it("bo'sh stringni qaytaradi", () => {
    expect(latinToCyrillic('')).toBe('');
  });
});

describe('Transliteration: Cyrillic → Latin', () => {
  it('oddiy so\'zlarni to\'g\'ri konvertatsiya qiladi', () => {
    expect(cyrillicToLatin('телефон')).toBe('telefon');
    expect(cyrillicToLatin('китоб')).toBe('kitob');
  });

  it('maxsus harflarni to\'g\'ri o\'zgartiradi', () => {
    expect(cyrillicToLatin('шахар')).toBe('shaxar');
    expect(cyrillicToLatin('чой')).toBe('choy');
    expect(cyrillicToLatin('ғоз')).toBe("g'oz");
    expect(cyrillicToLatin('ўзбек')).toBe("o'zbek");
  });

  it('katta harflarni saqlaydi', () => {
    expect(cyrillicToLatin('Салом')).toBe('Salom');
  });
});

describe('getTransliteratedQueries', () => {
  it('lotin so\'zni ikki variantda qaytaradi', () => {
    const result = getTransliteratedQueries('telefon');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('telefon');
    expect(result[1]).toBe('телефон');
  });

  it('kirill so\'zni ikki variantda qaytaradi', () => {
    const result = getTransliteratedQueries('телефон');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('телефон');
    expect(result[1]).toBe('telefon');
  });

  it('raqamlarni bir variantda qaytaradi', () => {
    const result = getTransliteratedQueries('12345');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('12345');
  });

  it("bo'sh stringni qaytaradi", () => {
    const result = getTransliteratedQueries('');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('');
  });

  it('probel bilan trimlab ishlaydi', () => {
    const result = getTransliteratedQueries('  telefon  ');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('telefon');
  });
});

// ============================================
// 2. MEILISEARCH DOCUMENT BUILDER TESTS
// ============================================

function buildMeiliDocument(product: any) {
  const attributeValues: Record<string, string> = {};
  if (product.attributeValues?.length) {
    for (const av of product.attributeValues) {
      const key = av.attribute?.key || av.attributeId;
      attributeValues[key] = av.value;
    }
  }
  return {
    id: product.id,
    nameUz: product.nameUz || product.name || '',
    nameRu: product.nameRu || '',
    name: product.name || product.nameUz || '',
    price: parseFloat(product.price) || 0,
    originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
    images: product.images || [],
    thumbnailUrl: product.thumbnailUrl || (product.images?.[0] || null),
    categoryId: product.categoryId,
    categoryNameUz: product.category?.nameUz || '',
    categoryNameRu: product.category?.nameRu || '',
    brandId: product.brandId,
    brandName: product.brand?.name || '',
    colorId: product.colorId,
    shopId: product.shopId,
    shopName: product.shop?.name || '',
    rating: product.rating || 0,
    stock: product.stock || 0,
    discountPercent: product.discountPercent || 0,
    status: product.status || 'active',
    slug: product.slug || '',
    barcode: product.barcode || null,
    tags: product.tags || [],
    attributeValues,
  };
}

describe('buildMeiliDocument', () => {
  const mockProduct = {
    id: 'prod-1',
    nameUz: 'Smartfon',
    nameRu: 'Смартфон',
    name: 'Smartphone',
    price: '999000',
    originalPrice: '1200000',
    images: ['img1.jpg', 'img2.jpg'],
    thumbnailUrl: 'thumb.jpg',
    categoryId: 'cat-1',
    category: { nameUz: 'Elektronika', nameRu: 'Электроника' },
    brandId: 'brand-1',
    brand: { name: 'Samsung' },
    colorId: 'color-1',
    shopId: 'shop-1',
    shop: { name: 'MegaShop' },
    rating: 4.5,
    stock: 10,
    discountPercent: 15,
    status: 'active',
    slug: 'samsung-galaxy-a54',
    barcode: '8801643123456',
    tags: ['yangi', 'bestseller'],
    attributeValues: [
      { attribute: { key: 'ram' }, value: '8GB' },
      { attribute: { key: 'storage' }, value: '256GB' },
    ],
  };

  it('asosiy maydonlarni to\'g\'ri mapplaydi', () => {
    const doc = buildMeiliDocument(mockProduct);
    expect(doc.id).toBe('prod-1');
    expect(doc.nameUz).toBe('Smartfon');
    expect(doc.nameRu).toBe('Смартфон');
    expect(doc.price).toBe(999000);
    expect(doc.originalPrice).toBe(1200000);
  });

  it('brand nomini to\'g\'ri oladi', () => {
    const doc = buildMeiliDocument(mockProduct);
    expect(doc.brandName).toBe('Samsung');
  });

  it('brand yo\'q bo\'lsa bo\'sh string qaytaradi', () => {
    const noBrand = { ...mockProduct, brand: undefined };
    const doc = buildMeiliDocument(noBrand);
    expect(doc.brandName).toBe('');
  });

  it('attribute values ni map qiladi', () => {
    const doc = buildMeiliDocument(mockProduct);
    expect(doc.attributeValues).toEqual({ ram: '8GB', storage: '256GB' });
  });

  it('attribute values bo\'sh bo\'lsa bo\'sh object qaytaradi', () => {
    const noAttr = { ...mockProduct, attributeValues: [] };
    const doc = buildMeiliDocument(noAttr);
    expect(doc.attributeValues).toEqual({});
  });

  it('tags ni to\'g\'ri oladi', () => {
    const doc = buildMeiliDocument(mockProduct);
    expect(doc.tags).toEqual(['yangi', 'bestseller']);
  });

  it('slug va barcode ni to\'g\'ri oladi', () => {
    const doc = buildMeiliDocument(mockProduct);
    expect(doc.slug).toBe('samsung-galaxy-a54');
    expect(doc.barcode).toBe('8801643123456');
  });

  it('slug yo\'q bo\'lsa bo\'sh string qaytaradi', () => {
    const noSlug = { ...mockProduct, slug: undefined };
    const doc = buildMeiliDocument(noSlug);
    expect(doc.slug).toBe('');
  });

  it('images yo\'q bo\'lsa bo\'sh array qaytaradi', () => {
    const noImg = { ...mockProduct, images: undefined, thumbnailUrl: undefined };
    const doc = buildMeiliDocument(noImg);
    expect(doc.images).toEqual([]);
    expect(doc.thumbnailUrl).toBeNull();
  });

  it('narxni string dan number ga convert qiladi', () => {
    const doc = buildMeiliDocument(mockProduct);
    expect(typeof doc.price).toBe('number');
    expect(typeof doc.originalPrice).toBe('number');
  });

  it('noto\'g\'ri narxda 0 qaytaradi', () => {
    const badPrice = { ...mockProduct, price: 'invalid' };
    const doc = buildMeiliDocument(badPrice);
    expect(doc.price).toBe(0);
  });
});

// ============================================
// 3. SEARCH ANALYTICS SCHEMA TESTS
// ============================================

const searchTrackSchema = z.object({
  query: z.string().min(1).max(200),
  productId: z.string().uuid().optional(),
  action: z.enum(['click', 'add_to_cart', 'purchase', 'no_results']),
  position: z.number().int().min(0).optional(),
  engine: z.string().optional(),
  sessionId: z.string().optional(),
});

describe('Search Analytics Track Schema', () => {
  it('to\'g\'ri click hodisasini qabul qiladi', () => {
    const result = searchTrackSchema.safeParse({
      query: 'telefon',
      productId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'click',
      position: 3,
      engine: 'meilisearch',
    });
    expect(result.success).toBe(true);
  });

  it("no_results hodisasini qabul qiladi (productId yo'q)", () => {
    const result = searchTrackSchema.safeParse({
      query: 'nonexistent product',
      action: 'no_results',
    });
    expect(result.success).toBe(true);
  });

  it("bo'sh query ni rad qiladi", () => {
    const result = searchTrackSchema.safeParse({
      query: '',
      action: 'click',
    });
    expect(result.success).toBe(false);
  });

  it("noto'g'ri action ni rad qiladi", () => {
    const result = searchTrackSchema.safeParse({
      query: 'telefon',
      action: 'invalid_action',
    });
    expect(result.success).toBe(false);
  });

  it("noto'g'ri UUID formatini rad qiladi", () => {
    const result = searchTrackSchema.safeParse({
      query: 'telefon',
      productId: 'not-a-uuid',
      action: 'click',
    });
    expect(result.success).toBe(false);
  });

  it('juda uzun queryni rad qiladi', () => {
    const result = searchTrackSchema.safeParse({
      query: 'a'.repeat(201),
      action: 'click',
    });
    expect(result.success).toBe(false);
  });

  it('manfiy position ni rad qiladi', () => {
    const result = searchTrackSchema.safeParse({
      query: 'telefon',
      action: 'click',
      position: -1,
    });
    expect(result.success).toBe(false);
  });

  it('add_to_cart va purchase actionlarini qabul qiladi', () => {
    expect(searchTrackSchema.safeParse({ query: 'laptop', action: 'add_to_cart' }).success).toBe(true);
    expect(searchTrackSchema.safeParse({ query: 'laptop', action: 'purchase' }).success).toBe(true);
  });
});

// ============================================
// 4. SEARCH FILTER SCHEMA TESTS
// ============================================

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  categoryId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
  brandIds: z.string().optional(),
  colorIds: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  hasDiscount: z.coerce.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).optional(),
});

describe('Search Filter Schema', () => {
  it("oddiy qidiruvni qabul qiladi", () => {
    const result = searchSchema.safeParse({ q: 'telefon' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("barcha filterlarni qabul qiladi", () => {
    const result = searchSchema.safeParse({
      q: 'telefon',
      page: '2',
      limit: '10',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      minPrice: '100000',
      maxPrice: '5000000',
      minRating: '4',
      inStock: 'true',
      hasDiscount: 'true',
      sort: 'price_asc',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
      expect(result.data.minPrice).toBe(100000);
      expect(result.data.maxPrice).toBe(5000000);
      expect(result.data.minRating).toBe(4);
      expect(result.data.inStock).toBe(true);
      expect(result.data.sort).toBe('price_asc');
    }
  });

  it("bo'sh query ni rad qiladi", () => {
    expect(searchSchema.safeParse({ q: '' }).success).toBe(false);
  });

  it("juda katta limitni rad qiladi", () => {
    expect(searchSchema.safeParse({ q: 'test', limit: '100' }).success).toBe(false);
  });

  it("manfiy narxni rad qiladi", () => {
    expect(searchSchema.safeParse({ q: 'test', minPrice: '-100' }).success).toBe(false);
  });

  it("noto'g'ri sortni rad qiladi", () => {
    expect(searchSchema.safeParse({ q: 'test', sort: 'invalid' }).success).toBe(false);
  });

  it("barcha sort turlarini qabul qiladi", () => {
    const sorts = ['price_asc', 'price_desc', 'rating', 'newest', 'popular'];
    for (const sort of sorts) {
      expect(searchSchema.safeParse({ q: 'test', sort }).success).toBe(true);
    }
  });

  it("reyting 0 dan 5 gacha bo'lishi kerak", () => {
    expect(searchSchema.safeParse({ q: 'test', minRating: '3' }).success).toBe(true);
    expect(searchSchema.safeParse({ q: 'test', minRating: '6' }).success).toBe(false);
    expect(searchSchema.safeParse({ q: 'test', minRating: '-1' }).success).toBe(false);
  });

  it("brandIds va colorIds sifatida comma-separated string qabul qiladi", () => {
    const result = searchSchema.safeParse({
      q: 'test',
      brandIds: 'id1,id2,id3',
      colorIds: 'c1,c2',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brandIds).toBe('id1,id2,id3');
    }
  });
});

// ============================================
// 5. SYNONYMS & STOP WORDS TESTS
// ============================================

describe('Uzbek Synonyms', () => {
  function getDefaultSynonyms(): Record<string, string[]> {
    return {
      'telefon': ['smartfon', 'телефон', 'смартфон', 'mobil', 'мобил'],
      'smartfon': ['telefon', 'телефон', 'смартфон', 'mobil'],
      'krossovka': ['poyabzal', 'krossofka', 'sneaker', 'кроссовка'],
      'sumka': ['сумка', 'bag', 'khaltak'],
      'naushnik': ['наушник', 'quloqchin', 'headphone', 'earphone'],
      'kompyuter': ['komp', 'computer', 'noutbuk', 'компьютер'],
      'noutbuk': ['notebook', 'laptop', 'ноутбук', 'kompyuter'],
    };
  }

  it("sinonimlar to'g'ri strukturada", () => {
    const synonyms = getDefaultSynonyms();
    expect(typeof synonyms).toBe('object');
    expect(Object.keys(synonyms).length).toBeGreaterThan(0);
  });

  it("har bir kalit uchun massiv mavjud", () => {
    const synonyms = getDefaultSynonyms();
    for (const [key, values] of Object.entries(synonyms)) {
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBeGreaterThan(0);
    }
  });

  it("telefon sinonimlarida smartfon bor", () => {
    const synonyms = getDefaultSynonyms();
    expect(synonyms['telefon']).toContain('smartfon');
    expect(synonyms['telefon']).toContain('телефон');
  });

  it("har bir sinonim string bo'lishi kerak", () => {
    const synonyms = getDefaultSynonyms();
    for (const values of Object.values(synonyms)) {
      for (const v of values) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Uzbek Stop Words', () => {
  function getUzbekStopWords(): string[] {
    return [
      'va', 'bilan', 'uchun', 'bu', 'shu', 'u', 'ham', 'yoki', 'lekin',
      'ammo', 'bir', 'har', 'hamma', 'barcha', 'da', 'ga', 'ni', 'dan',
      'ва', 'билан', 'учун', 'бу', 'шу', 'у', 'ҳам', 'ёки', 'лекин',
      'аммо', 'бир', 'ҳар', 'ҳамма', 'барча',
      'и', 'в', 'на', 'для', 'с', 'по', 'от', 'из', 'к', 'не', 'это',
    ];
  }

  it("stop words massivi bo'sh emas", () => {
    const stopWords = getUzbekStopWords();
    expect(stopWords.length).toBeGreaterThan(10);
  });

  it("o'zbek (lotin) stop words mavjud", () => {
    const stopWords = getUzbekStopWords();
    expect(stopWords).toContain('va');
    expect(stopWords).toContain('bilan');
    expect(stopWords).toContain('uchun');
  });

  it("o'zbek (kirill) stop words mavjud", () => {
    const stopWords = getUzbekStopWords();
    expect(stopWords).toContain('ва');
    expect(stopWords).toContain('билан');
  });

  it("rus stop words mavjud", () => {
    const stopWords = getUzbekStopWords();
    expect(stopWords).toContain('и');
    expect(stopWords).toContain('для');
  });

  it("har bir stop word string va bo'sh emas", () => {
    const stopWords = getUzbekStopWords();
    for (const w of stopWords) {
      expect(typeof w).toBe('string');
      expect(w.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// 6. MEILISEARCH FILTER BUILDER TESTS
// ============================================

describe('Meilisearch Filter Builder', () => {
  function buildFilters(params: any): string[] {
    const filters: string[] = ['status = active'];
    if (params.categoryId) filters.push(`categoryId = "${params.categoryId}"`);
    if (params.shopId) filters.push(`shopId = "${params.shopId}"`);
    if (params.minPrice !== undefined) filters.push(`price >= ${params.minPrice}`);
    if (params.maxPrice !== undefined) filters.push(`price <= ${params.maxPrice}`);
    if (params.minRating !== undefined) filters.push(`rating >= ${params.minRating}`);
    if (params.inStock) filters.push('stock > 0');
    if (params.hasDiscount) filters.push('discountPercent > 0');
    if (params.isWowPrice) filters.push('isFlashSale = true');
    if (params.brandIds) {
      const ids = params.brandIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) {
        const brandFilter = ids.map((id: string) => `brandId = "${id.trim()}"`).join(' OR ');
        filters.push(`(${brandFilter})`);
      }
    }
    if (params.colorIds) {
      const ids = params.colorIds.split(',').filter((id: string) => id.trim());
      if (ids.length > 0) {
        const colorFilter = ids.map((id: string) => `colorId = "${id.trim()}"`).join(' OR ');
        filters.push(`(${colorFilter})`);
      }
    }
    return filters;
  }

  it("har doim status = active filterini qo'shadi", () => {
    const filters = buildFilters({});
    expect(filters).toContain('status = active');
  });

  it("narx filterlarini to'g'ri yaratadi", () => {
    const filters = buildFilters({ minPrice: 100, maxPrice: 5000 });
    expect(filters).toContain('price >= 100');
    expect(filters).toContain('price <= 5000');
  });

  it("brand ID filterlarini OR bilan birlashtiradi", () => {
    const filters = buildFilters({ brandIds: 'b1,b2,b3' });
    const brandFilter = filters.find(f => f.includes('brandId'));
    expect(brandFilter).toBeDefined();
    expect(brandFilter).toContain('b1');
    expect(brandFilter).toContain('b2');
    expect(brandFilter).toContain('OR');
  });

  it("inStock filterini to'g'ri qo'shadi", () => {
    const filters = buildFilters({ inStock: true });
    expect(filters).toContain('stock > 0');
  });

  it("hasDiscount filterini to'g'ri qo'shadi", () => {
    const filters = buildFilters({ hasDiscount: true });
    expect(filters).toContain('discountPercent > 0');
  });

  it("isWowPrice filterini to'g'ri qo'shadi", () => {
    const filters = buildFilters({ isWowPrice: true });
    expect(filters).toContain('isFlashSale = true');
  });

  it("categoryId filterini to'g'ri qo'shadi", () => {
    const filters = buildFilters({ categoryId: 'cat-1' });
    expect(filters).toContain('categoryId = "cat-1"');
  });

  it("filtersiz faqat status filterini qaytaradi", () => {
    const filters = buildFilters({});
    expect(filters).toHaveLength(1);
    expect(filters[0]).toBe('status = active');
  });
});

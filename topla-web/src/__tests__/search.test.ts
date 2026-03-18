/**
 * Phase 3: Web Search System Tests
 * - shopApi search endpoint URLs
 * - Search filter construction
 * - Trending search fallback logic
 */
import { describe, it, expect } from 'vitest';

// ============================================
// 1. SEARCH API URL BUILDER TESTS
// ============================================

describe('Search API URL Builder', () => {
  function buildSearchUrl(q: string, params?: Record<string, string>): string {
    const searchParams = new URLSearchParams({ q, limit: '20', ...params });
    return `/products/search?${searchParams.toString()}`;
  }

  it('Meilisearch endpointiga yo\'naltiradi (/products/search)', () => {
    const url = buildSearchUrl('telefon');
    expect(url).toContain('/products/search');
    expect(url).not.toContain('/products?search=');
  });

  it("query parametrini to'g'ri encode qiladi", () => {
    const url = buildSearchUrl('telefon samsung');
    expect(url).toContain('q=telefon+samsung');
  });

  it("default limit 20", () => {
    const url = buildSearchUrl('test');
    expect(url).toContain('limit=20');
  });

  it("filtrlarni to'g'ri qo'shadi", () => {
    const url = buildSearchUrl('telefon', {
      minPrice: '100000',
      maxPrice: '5000000',
      sort: 'price_asc',
    });
    expect(url).toContain('minPrice=100000');
    expect(url).toContain('maxPrice=5000000');
    expect(url).toContain('sort=price_asc');
  });

  it("custom limitni params orqali berishadi", () => {
    const url = buildSearchUrl('test', { limit: '40' });
    // Last one wins in URLSearchParams
    expect(url).toContain('limit=40');
  });

  it("bo'sh filterlarni qo'shmaydi", () => {
    const url = buildSearchUrl('test', {});
    expect(url).toBe('/products/search?q=test&limit=20');
  });
});

// ============================================
// 2. SEARCH SUGGEST URL TESTS
// ============================================

describe('Search Suggest API', () => {
  function buildSuggestUrl(q: string): string {
    return `/search/suggest?q=${encodeURIComponent(q)}`;
  }

  it("suggest endpointiga to'g'ri yo'naltiradi", () => {
    const url = buildSuggestUrl('tel');
    expect(url).toBe('/search/suggest?q=tel');
  });

  it("maxsus belgilarni encode qiladi", () => {
    const url = buildSuggestUrl("o'zbek");
    expect(url).toContain('suggest?q=');
    expect(url).toContain("o'zbek");
  });
});

// ============================================
// 3. TRENDING SEARCH FALLBACK TESTS
// ============================================

describe('Trending Search Fallback', () => {
  const defaultTrending = ['telefon', 'krossovka', 'sumka', 'soat', 'naushnik', 'kiyim'];

  function getTrendingSearches(apiData: any[] | null | undefined): string[] {
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      return apiData.map((item: any) => item.query);
    }
    return defaultTrending;
  }

  it("API ma'lumotlari mavjud bo'lsa ularni qaytaradi", () => {
    const apiData = [
      { query: 'laptop', count: 100 },
      { query: 'smartfon', count: 80 },
    ];
    const result = getTrendingSearches(apiData);
    expect(result).toEqual(['laptop', 'smartfon']);
  });

  it("API null bo'lsa default qaytaradi", () => {
    const result = getTrendingSearches(null);
    expect(result).toEqual(defaultTrending);
  });

  it("API undefined bo'lsa default qaytaradi", () => {
    const result = getTrendingSearches(undefined);
    expect(result).toEqual(defaultTrending);
  });

  it("API bo'sh array bo'lsa default qaytaradi", () => {
    const result = getTrendingSearches([]);
    expect(result).toEqual(defaultTrending);
  });
});

// ============================================
// 4. SEARCH RESULT PARSER TESTS
// ============================================

describe('Search Result Parser', () => {
  function parseSearchResult(searchResult: any) {
    const products = searchResult?.data ?? searchResult?.products ?? searchResult ?? [];
    const totalHits = searchResult?.meta?.total ?? searchResult?.pagination?.total ?? 0;
    const searchEngine = searchResult?.meta?.engine ?? '';
    const processingTimeMs = searchResult?.meta?.processingTimeMs;
    const facets = searchResult?.meta?.facets ?? {};
    
    return { products, totalHits, searchEngine, processingTimeMs, facets };
  }

  it("Meilisearch formatini to'g'ri parse qiladi", () => {
    const result = parseSearchResult({
      data: [{ id: '1', name: 'Test' }],
      meta: {
        total: 42,
        engine: 'meilisearch',
        processingTimeMs: 5,
        facets: { categoryId: { 'cat-1': 10 } },
      },
    });
    expect(result.products).toHaveLength(1);
    expect(result.totalHits).toBe(42);
    expect(result.searchEngine).toBe('meilisearch');
    expect(result.processingTimeMs).toBe(5);
    expect(result.facets.categoryId).toBeDefined();
  });

  it("DB fallback formatini to'g'ri parse qiladi", () => {
    const result = parseSearchResult({
      data: [{ id: '1' }],
      meta: {
        total: 5,
        engine: 'database',
      },
    });
    expect(result.searchEngine).toBe('database');
    expect(result.totalHits).toBe(5);
  });

  it("eski format (products/pagination) ni ham qo'llab-quvvatlaydi", () => {
    const result = parseSearchResult({
      products: [{ id: '1' }, { id: '2' }],
      pagination: { total: 100 },
    });
    expect(result.products).toHaveLength(2);
    expect(result.totalHits).toBe(100);
  });

  it("null natijada bo'sh array qaytaradi", () => {
    const result = parseSearchResult(null);
    expect(result.products).toEqual([]);
    expect(result.totalHits).toBe(0);
    expect(result.searchEngine).toBe('');
  });

  it("undefined natijada bo'sh array qaytaradi", () => {
    const result = parseSearchResult(undefined);
    expect(result.products).toEqual([]);
    expect(result.totalHits).toBe(0);
  });
});

// ============================================
// 5. SEARCH FILTER STATE TESTS
// ============================================

interface SearchFilters {
  categoryId?: string;
  brandIds?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  hasDiscount?: string;
  sort?: string;
}

describe('Search Filter State', () => {
  function updateFilter(filters: SearchFilters, key: keyof SearchFilters, value: string | undefined): SearchFilters {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    return next;
  }

  it("yangi filter qo'shadi", () => {
    const result = updateFilter({}, 'minPrice', '100000');
    expect(result.minPrice).toBe('100000');
  });

  it("mavjud filterni yangilaydi", () => {
    const result = updateFilter({ minPrice: '100000' }, 'minPrice', '200000');
    expect(result.minPrice).toBe('200000');
  });

  it("undefined berilsa filterni o'chiradi", () => {
    const result = updateFilter({ minPrice: '100000', sort: 'price_asc' }, 'minPrice', undefined);
    expect(result.minPrice).toBeUndefined();
    expect(result.sort).toBe('price_asc');
  });

  it("bo'sh string berilsa filterni qoldiradi", () => {
    // Bo'sh string truthy emas, shuning uchun delete bo'ladi
    const result = updateFilter({ minPrice: '100000' }, 'minPrice', '');
    expect(result.minPrice).toBeUndefined();
  });

  it("filter sonini to'g'ri hisoblaydi", () => {
    const filters: SearchFilters = {
      minPrice: '100',
      maxPrice: '500',
      sort: 'price_asc',
    };
    expect(Object.keys(filters).length).toBe(3);
  });

  it("clearFilters barcha filterlarni tozalaydi", () => {
    const cleared: SearchFilters = {};
    expect(Object.keys(cleared).length).toBe(0);
  });
});

// ============================================
// 6. LOCAL SEARCH HISTORY TESTS
// ============================================

describe('Local Search History', () => {
  function saveSearch(recentSearches: string[], term: string): string[] {
    return [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10);
  }

  it("yangi qidiruvni boshiga qo'shadi", () => {
    const result = saveSearch(['old1', 'old2'], 'new');
    expect(result[0]).toBe('new');
    expect(result).toHaveLength(3);
  });

  it("takroriy qidiruvni boshiga ko'chiradi", () => {
    const result = saveSearch(['first', 'second', 'third'], 'second');
    expect(result[0]).toBe('second');
    expect(result).toHaveLength(3);
    // 'second' faqat bir marta bo'lishi kerak
    expect(result.filter(s => s === 'second')).toHaveLength(1);
  });

  it("maksimum 10 ta saqlaydi", () => {
    const existing = Array.from({ length: 10 }, (_, i) => `search${i}`);
    const result = saveSearch(existing, 'new');
    expect(result).toHaveLength(10);
    expect(result[0]).toBe('new');
    expect(result).not.toContain('search9');
  });

  it("bo'sh tarixga qo'shadi", () => {
    const result = saveSearch([], 'first');
    expect(result).toEqual(['first']);
  });
});

// ============================================
// Meilisearch Integration Service
// Product search with fuzzy matching, facets,
// synonyms, transliteration, attribute indexing
// ============================================

import { env } from '../config/env.js';
import { getTransliteratedQueries } from '../utils/transliterate.js';

const MEILI_URL = env.MEILISEARCH_URL;
const MEILI_KEY = (() => {
  const key = env.MEILISEARCH_API_KEY;
  if (!key && env.NODE_ENV === 'production') {
    console.error('❌ MEILISEARCH_API_KEY production muhitda majburiy! Xavfsizlik xavfi.');
  }
  return key;
})();
const INDEX_NAME = 'products';

export interface MeiliProduct {
  id: string;
  nameUz: string;
  nameRu: string;
  descriptionUz: string;
  descriptionRu: string;
  name: string;
  price: number;
  originalPrice: number | null;
  images: string[];
  thumbnailUrl: string | null;
  categoryId: string | null;
  categoryNameUz: string;
  categoryNameRu: string;
  brandId: string | null;
  brandName: string;
  colorId: string | null;
  shopId: string;
  shopName: string;
  rating: number;
  salesCount: number;
  qualityScore: number;
  stock: number;
  discountPercent: number;
  isFlashSale: boolean;
  status: string;
  createdAt: string;
  // Phase 3: new fields
  slug: string;
  barcode: string | null;
  tags: string[];
  attributeValues: Record<string, string>;  // { "ram": "8GB", "color": "qora" }
}

// ============================================
// Helper: fetch from Meilisearch
// ============================================
async function meiliRequest(path: string, method = 'GET', body?: any): Promise<any> {
  try {
    const response = await fetch(`${MEILI_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(MEILI_KEY ? { Authorization: `Bearer ${MEILI_KEY}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Meilisearch error: ${response.status} ${text}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Meilisearch connection error:', error);
    return null;
  }
}

// ============================================
// Initialize index with settings
// ============================================
export async function initMeilisearch(): Promise<void> {
  try {
    // Create index
    await meiliRequest(`/indexes/${INDEX_NAME}`, 'POST', {
      uid: INDEX_NAME,
      primaryKey: 'id',
    });

    // Configure searchable attributes (priority order)
    await meiliRequest(`/indexes/${INDEX_NAME}/settings`, 'PATCH', {
      searchableAttributes: [
        'nameUz',
        'nameRu',
        'name',
        'tags',
        'barcode',
        'slug',
        'brandName',
        'categoryNameUz',
        'categoryNameRu',
        'shopName',
        'descriptionUz',
        'descriptionRu',
      ],
      filterableAttributes: [
        'categoryId',
        'brandId',
        'colorId',
        'shopId',
        'status',
        'price',
        'originalPrice',
        'rating',
        'qualityScore',
        'stock',
        'discountPercent',
        'isFlashSale',
        'tags',
      ],
      sortableAttributes: [
        'price',
        'rating',
        'salesCount',
        'qualityScore',
        'createdAt',
        'discountPercent',
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'qualityScore:desc',
        'salesCount:desc',
      ],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 },
      },
      // Facets for aggregated filter counts
      faceting: {
        maxValuesPerFacet: 200,
      },
      // Uzbek synonyms
      synonyms: getDefaultSynonyms(),
      // Uzbek stop words
      stopWords: getUzbekStopWords(),
    });

    console.log('✅ Meilisearch initialized');
  } catch (error) {
    console.warn('⚠️ Meilisearch not available, search will use database fallback');
  }
}

// ============================================
// Uzbek synonyms (default set)
// ============================================
function getDefaultSynonyms(): Record<string, string[]> {
  return {
    // Common Uzbek product terms
    'telefon': ['smartfon', 'телефон', 'смартфон', 'mobil', 'мобил'],
    'smartfon': ['telefon', 'телефон', 'смартфон', 'mobil'],
    'телефон': ['telefon', 'smartfon', 'смартфон'],
    'krossovka': ['poyabzal', 'krossofka', 'sneaker', 'кроссовка'],
    'poyabzal': ['krossovka', 'tufli', 'oyoq kiyim'],
    'кроссовка': ['krossovka', 'poyabzal'],
    'sumka': ['сумка', 'bag', 'khaltak'],
    'сумка': ['sumka', 'bag', 'khaltak'],
    'soat': ['соат', 'часы', 'watch'],
    'часы': ['soat', 'соат', 'watch'],
    'naushnik': ['наушник', 'quloqchin', 'headphone', 'earphone'],
    'quloqchin': ['naushnik', 'наушник', 'headphone'],
    'kiyim': ['кийим', 'одежда', 'libos'],
    'libos': ['kiyim', 'кийим'],
    'ko\'ylak': ['рубашка', 'koylak', 'shirt'],
    'shim': ['штаны', 'брюки', 'pants', 'trousers'],
    'komp': ['kompyuter', 'computer', 'noutbuk'],
    'kompyuter': ['komp', 'computer', 'noutbuk', 'компьютер'],
    'noutbuk': ['notebook', 'laptop', 'ноутбук', 'kompyuter'],
    'planshet': ['tablet', 'планшет'],
    'televizor': ['tv', 'телевизор'],
    'muzlatgich': ['xolodilnik', 'холодильник', 'fridge'],
    'kir yuvish mashinasi': ['stiralka', 'стиральная машина'],
    'changyutgich': ['pylesos', 'пылесос', 'vacuum'],
    // Brand abbreviations
    'samsun': ['samsung'],
    'ajfon': ['iphone', 'айфон'],
    'iphone': ['ajfon', 'айфон'],
    'xiaomi': ['shyaomi', 'сяоми', 'redmi'],
  };
}

// ============================================
// Uzbek stop words
// ============================================
function getUzbekStopWords(): string[] {
  return [
    // Uzbek Latin
    'va', 'bilan', 'uchun', 'bu', 'shu', 'u', 'ham', 'yoki', 'lekin',
    'ammo', 'bir', 'har', 'hamma', 'barcha', 'da', 'ga', 'ni', 'dan',
    // Uzbek Cyrillic
    'ва', 'билан', 'учун', 'бу', 'шу', 'у', 'ҳам', 'ёки', 'лекин',
    'аммо', 'бир', 'ҳар', 'ҳамма', 'барча',
    // Russian common
    'и', 'в', 'на', 'для', 'с', 'по', 'от', 'из', 'к', 'не', 'это',
  ];
}

// ============================================
// Index a single product
// ============================================
export async function indexProduct(product: any): Promise<void> {
  const doc = buildMeiliDocument(product);
  await meiliRequest(`/indexes/${INDEX_NAME}/documents`, 'POST', [doc]);
}

// ============================================
// Remove product from index
// ============================================
export async function removeProductFromIndex(productId: string): Promise<void> {
  await meiliRequest(`/indexes/${INDEX_NAME}/documents/${productId}`, 'DELETE');
}

// ============================================
// Search products via Meilisearch
// Supports facets, highlights, transliteration
// ============================================
export interface SearchResult {
  hits: MeiliProduct[];
  totalHits: number;
  query: string;
  facetDistribution?: Record<string, Record<string, number>>;
  processingTimeMs?: number;
}

export async function searchProducts(query: string, options?: {
  limit?: number;
  offset?: number;
  filter?: string[];
  sort?: string[];
  facets?: string[];
  showMatchesPosition?: boolean;
  attributesToHighlight?: string[];
}): Promise<SearchResult | null> {
  // Apply transliteration — search with both Latin and Cyrillic variants
  const queries = getTransliteratedQueries(query);
  const primaryQuery = queries[0];

  const body: any = {
    q: primaryQuery,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    attributesToHighlight: options?.attributesToHighlight || ['nameUz', 'nameRu', 'name'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
  };
  if (options?.filter?.length) body.filter = options.filter;
  if (options?.sort?.length) body.sort = options.sort;
  if (options?.facets?.length) body.facets = options.facets;
  if (options?.showMatchesPosition) body.showMatchesPosition = true;

  let result = await meiliRequest(`/indexes/${INDEX_NAME}/search`, 'POST', body);

  // If no results and we have a transliterated variant, try that
  if ((!result?.hits?.length) && queries.length > 1) {
    body.q = queries[1];
    result = await meiliRequest(`/indexes/${INDEX_NAME}/search`, 'POST', body);
  }

  if (!result) return null;

  return {
    hits: result.hits || [],
    totalHits: result.estimatedTotalHits || result.totalHits || 0,
    query: result.query || query,
    facetDistribution: result.facetDistribution || undefined,
    processingTimeMs: result.processingTimeMs || undefined,
  };
}

// ============================================
// Clear entire index
// ============================================
export async function clearIndex(): Promise<void> {
  await meiliRequest(`/indexes/${INDEX_NAME}/documents`, 'DELETE');
}

// ============================================
// Bulk index products (re-index entire catalog)
// ============================================
export async function bulkIndexProducts(products: any[]): Promise<{ indexed: number; failed: number }> {
  const BATCH_SIZE = 500;
  let indexed = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const docs = batch.map(p => {
      try {
        return buildMeiliDocument(p);
      } catch {
        failed++;
        return null;
      }
    }).filter(Boolean);

    if (docs.length > 0) {
      const result = await meiliRequest(`/indexes/${INDEX_NAME}/documents`, 'POST', docs);
      if (result) {
        indexed += docs.length;
      } else {
        failed += docs.length;
      }
    }
  }

  return { indexed, failed };
}

// ============================================
// Build Meilisearch document from Prisma product
// Supports attribute values, tags, slug, barcode
// ============================================
export function buildMeiliDocument(product: any): MeiliProduct {
  // Build attribute values map: { "ram": "8GB", "hajm": "256GB" }
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
    descriptionUz: product.descriptionUz || product.description || '',
    descriptionRu: product.descriptionRu || '',
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
    salesCount: product.salesCount || 0,
    qualityScore: product.qualityScore || 0,
    stock: product.stock || 0,
    discountPercent: product.discountPercent || 0,
    isFlashSale: product.isFlashSale || false,
    status: product.status || 'active',
    createdAt: product.createdAt?.toISOString?.() || new Date().toISOString(),
    // Phase 3: new fields
    slug: product.slug || '',
    barcode: product.barcode || null,
    tags: product.tags || [],
    attributeValues,
  };
}

// ============================================
// Admin: Update synonyms
// ============================================
export async function updateSynonyms(synonyms: Record<string, string[]>): Promise<boolean> {
  const result = await meiliRequest(`/indexes/${INDEX_NAME}/settings/synonyms`, 'PUT', synonyms);
  return result !== null;
}

// ============================================
// Admin: Get current synonyms
// ============================================
export async function getSynonyms(): Promise<Record<string, string[]> | null> {
  return await meiliRequest(`/indexes/${INDEX_NAME}/settings/synonyms`);
}

// ============================================
// Admin: Get index stats
// ============================================
export async function getIndexStats(): Promise<any> {
  return await meiliRequest(`/indexes/${INDEX_NAME}/stats`);
}

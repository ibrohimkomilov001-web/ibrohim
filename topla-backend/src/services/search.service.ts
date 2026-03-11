// ============================================
// Meilisearch Integration Service
// Product search with fuzzy matching
// ============================================

const MEILI_URL = process.env.MEILISEARCH_URL || 'http://localhost:7700';
const MEILI_KEY = (() => {
  const key = process.env.MEILISEARCH_API_KEY || '';
  if (!key && process.env.NODE_ENV === 'production') {
    console.error('❌ MEILISEARCH_API_KEY production muhitda majburiy! Xavfsizlik xavfi.');
  }
  return key;
})();
const INDEX_NAME = 'products';

interface MeiliProduct {
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
  status: string;
  createdAt: string;
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

    // Configure searchable attributes
    await meiliRequest(`/indexes/${INDEX_NAME}/settings`, 'PATCH', {
      searchableAttributes: [
        'nameUz',
        'nameRu',
        'name',
        'descriptionUz',
        'descriptionRu',
        'categoryNameUz',
        'categoryNameRu',
        'brandName',
        'shopName',
      ],
      filterableAttributes: [
        'categoryId',
        'brandId',
        'colorId',
        'shopId',
        'status',
        'price',
        'rating',
        'qualityScore',
        'stock',
        'discountPercent',
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
    });

    console.log('✅ Meilisearch initialized');
  } catch (error) {
    console.warn('⚠️ Meilisearch not available, search will use database fallback');
  }
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
// ============================================
export async function searchProducts(query: string, options?: {
  limit?: number;
  offset?: number;
  filter?: string[];
  sort?: string[];
}): Promise<{ hits: MeiliProduct[]; totalHits: number; query: string } | null> {
  const body: any = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
  };
  if (options?.filter?.length) body.filter = options.filter;
  if (options?.sort?.length) body.sort = options.sort;

  const result = await meiliRequest(`/indexes/${INDEX_NAME}/search`, 'POST', body);
  if (!result) return null;

  return {
    hits: result.hits || [],
    totalHits: result.estimatedTotalHits || result.totalHits || 0,
    query: result.query || query,
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
// ============================================
export function buildMeiliDocument(product: any): MeiliProduct {
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
    status: product.status || 'active',
    createdAt: product.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}

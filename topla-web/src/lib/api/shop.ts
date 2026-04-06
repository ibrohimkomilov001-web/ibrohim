const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ============ TYPES ============

export interface Category {
  id: string;
  nameUz: string;
  nameRu?: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  _count?: { products: number };
}

export interface ShopInfo {
  id: string;
  name: string;
  logoUrl?: string;
  rating: number;
  reviewCount?: number;
  phone?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  nameUz: string;
  nameRu?: string;
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  discountPercent?: number;
  images: string[];
  rating: number;
  salesCount: number;
  stock: number;
  isActive: boolean;
  isFeatured?: boolean;
  flashSalePrice?: number;
  flashSaleStart?: string;
  flashSaleEnd?: string;
  shop?: ShopInfo;
  category?: { id: string; nameUz: string; nameRu?: string; parent?: { id: string; nameUz: string; nameRu?: string } };
  brand?: { id: string; name: string };
  color?: { id: string; nameUz: string; nameRu?: string; hexCode: string };
}

export interface ProductDetail extends ProductItem {
  description?: string;
  descriptionUz?: string;
  descriptionRu?: string;
  weight?: number;
  sku?: string;
  unit?: string;
  minOrder?: number;
  viewCount: number;
  createdAt: string;
}

export interface ShopDetail {
  id: string;
  name: string;
  nameRu?: string;
  slug?: string;
  description?: string;
  descriptionRu?: string;
  logoUrl?: string;
  bannerUrl?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  telegram?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  deliveryFee?: number;
  freeDeliveryFrom?: number;
  minOrderAmount?: number;
  _count?: { products: number; orders: number; followers?: number };
}

export interface Banner {
  id: string;
  imageUrl: string;
  titleUz?: string;
  titleRu?: string;
  subtitleUz?: string;
  subtitleRu?: string;
  actionType?: string;
  actionValue?: string;
  sortOrder: number;
}

export interface PaginatedResponse<T> {
  products?: T[];
  items?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ FETCH HELPERS ============

async function shopFetch<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

async function clientFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ============ PUBLIC API ============

export const shopApi = {
  // Banners
  getBanners: () => shopFetch<Banner[]>('/banners'),

  // Categories
  getCategories: () => shopFetch<Category[]>('/categories'),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return clientFetch<PaginatedResponse<ProductItem>>(`/products${query}`);
  },

  getFeaturedProducts: (limit = 20) =>
    clientFetch<PaginatedResponse<ProductItem>>(`/products/featured?limit=${limit}`),

  getProduct: (id: string) => clientFetch<ProductDetail>(`/products/${id}`),

  searchProducts: (q: string, params?: Record<string, string>) => {
    const searchParams = new URLSearchParams({ q, limit: '20', ...params });
    return clientFetch<any>(`/products/search?${searchParams.toString()}`);
  },

  // Search suggestions (autocomplete)
  searchSuggest: (q: string) =>
    clientFetch<any[]>(`/search/suggest?q=${encodeURIComponent(q)}`),

  // Popular/trending searches
  getPopularSearches: () =>
    clientFetch<any[]>(`/search/popular`),

  // Track search analytics
  trackSearch: (data: { query: string; productId?: string; action: string; position?: number; engine?: string }) =>
    clientFetch<any>(`/search/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {}),

  // Shops
  getShops: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return clientFetch<PaginatedResponse<ShopDetail>>(`/shops${query}`);
  },

  getShop: (id: string) => clientFetch<ShopDetail>(`/shops/${id}`),

  getShopProducts: (shopId: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return clientFetch<PaginatedResponse<ProductItem>>(`/shops/${shopId}/products${query}`);
  },
};

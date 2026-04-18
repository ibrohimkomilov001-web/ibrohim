const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
import { userRequest } from './user-auth';

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
  shopType?: string;
  totalSales?: number;
  createdAt?: string;
  _count?: { followers?: number; orderItems?: number };
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
  hasVariants?: boolean;
  defaultVariantId?: string;
  optionLinks?: Array<{
    optionType: {
      id: string;
      slug: string;
      nameUz: string;
      nameRu?: string;
      displayType: string;
      unit?: string;
      values: Array<{
        id: string;
        slug: string;
        valueUz: string;
        valueRu?: string;
        hexCode?: string;
        imageUrl?: string;
      }>;
    };
  }>;
  variants?: Array<{
    id: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    sku?: string;
    images: string[];
    isActive: boolean;
    variantValues: Array<{
      optionType: { id: string; slug: string; nameUz: string; displayType: string };
      optionValue: { id: string; slug: string; valueUz: string; valueRu?: string; hexCode?: string };
    }>;
  }>;
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
  totalSales?: number;
  shopType?: string;
  createdAt?: string;
  deliveryFee?: number;
  freeDeliveryFrom?: number;
  minOrderAmount?: number;
  _count?: { products: number; orders: number; followers?: number; orderItems?: number };
}

export interface Banner {
  id: string;
  imageUrl: string;
  titleUz?: string | null;
  titleRu?: string | null;
  subtitleUz?: string | null;
  subtitleRu?: string | null;
  actionType?: 'none' | 'link' | 'product' | 'category' | 'shop' | string;
  actionValue?: string | null;
  ctaText?: string | null;
  ctaTextRu?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  textPosition?: 'left' | 'center' | 'right' | null;
  startsAt?: string | null;
  endsAt?: string | null;
  clickCount?: number;
  viewCount?: number;
  sortOrder: number;
  isActive?: boolean;
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
  trackBannerClick: (id: string) =>
    fetch(`${API_BASE_URL}/banners/${id}/click`, { method: 'POST', keepalive: true }).catch(() => {}),
  trackBannerView: (id: string) =>
    fetch(`${API_BASE_URL}/banners/${id}/view`, { method: 'POST', keepalive: true }).catch(() => {}),

  // Categories
  getCategories: () => shopFetch<Category[]>('/categories'),

  getCategoryTree: () => clientFetch<Category[]>('/categories?tree=true'),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return clientFetch<PaginatedResponse<ProductItem>>(`/products${query}`);
  },

  getFeaturedProducts: (limit = 20) =>
    clientFetch<PaginatedResponse<ProductItem>>(`/products/featured?limit=${limit}`),

  getProduct: (id: string) => clientFetch<ProductDetail>(`/products/${id}`),

  getProductReviews: (id: string, page = 1) =>
    clientFetch<any>(`/products/${id}/reviews?page=${page}&limit=20`),

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

  // Public settings (support phone, email)
  getPublicSettings: () => clientFetch<Record<string, string>>('/settings/public'),

  // Shop follow (requires auth — uses userRequest with CSRF + cookies)
  followShop: (shopId: string) =>
    userRequest<{ isFollowing: boolean }>(`/shops/${shopId}/follow`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  unfollowShop: (shopId: string) =>
    userRequest<{ isFollowing: boolean }>(`/shops/${shopId}/follow`, {
      method: 'DELETE',
    }),

  isFollowingShop: (shopId: string) =>
    userRequest<{ isFollowing: boolean }>(`/shops/${shopId}/is-following`),
};

import api from './client';

// ============ TYPES ============

export interface Shop {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  city?: string;
  instagram?: string;
  telegram?: string;
  website?: string;
  status: 'pending' | 'active' | 'rejected' | 'blocked';
  isOpen: boolean;
  commissionRate: number;
  balance: number;
  rating: number;
  reviewCount: number;
  fulfillmentType: 'FBS' | 'DBS';
  minOrderAmount?: number;
  deliveryFee?: number;
  freeDeliveryFrom?: number;
  deliveryRadius?: number;
  businessType?: string;
  inn?: string;
  bankName?: string;
  bankAccount?: string;
  mfo?: string;
  oked?: string;
  createdAt: string;
  _count?: {
    products: number;
    orders: number;
  };
}

export interface Product {
  id: string;
  categoryId?: string;
  brandId?: string;
  colorId?: string;
  name: string;
  nameUz: string;
  nameRu?: string;
  description?: string;
  descriptionUz?: string;
  descriptionRu?: string;
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  flashSalePrice?: number;
  flashSaleStart?: string;
  flashSaleEnd?: string;
  weight?: number;
  stock: number;
  sku?: string;
  images: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  viewCount: number;
  category?: { id: string; nameUz: string; nameRu?: string; parent?: { id: string; nameUz: string; nameRu?: string } };
  brand?: { id: string; name: string };
  hasVariants?: boolean;
  colors?: { id: string; name: string; hexCode: string }[];
  variants?: ProductVariant[];
  // Extended fields (P-FIX-04, P-06, P-11)
  slug?: string;
  barcode?: string;
  videoUrl?: string;
  tags?: string[];
  width?: number;
  height?: number;
  length?: number;
  metaTitle?: string;
  metaDescription?: string;
  warranty?: string;
  attributeValues?: { attributeId: string; value: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  colorId?: string | null;
  sizeId?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  sku?: string | null;
  images: string[];
  isActive: boolean;
  sortOrder: number;
  color?: { id: string; nameUz: string; nameRu: string; hexCode: string } | null;
  size?: { id: string; nameUz: string; nameRu: string } | null;
}

export interface ColorOption {
  id: string;
  nameUz: string;
  nameRu: string;
  hexCode: string;
  sortOrder?: number;
}

export interface SizeOption {
  id: string;
  nameUz: string;
  nameRu: string;
  sortOrder?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  subtotal: number;
  paymentMethod: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName?: string;
    phone: string;
  };
  address?: {
    fullAddress: string;
    lat?: number;
    lng?: number;
  };
  items: OrderItem[];
  statusHistory?: {
    status: string;
    note?: string;
    createdAt: string;
  }[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  product?: {
    id: string;
    images: string[];
  };
}

export interface VendorStats {
  balance: number;
  rating: number;
  reviewCount: number;
  commissionRate: number;
  orders: {
    total: number;
    today: number;
    month: number;
    pending: number;
    delivered: number;
    cancelled: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
  };
  revenue: {
    total: number;
    month: number;
    today: number;
  };
  totalCommission: number;
}

export interface VendorAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  dailyRevenue: { date: string; revenue: number; orders: number; commission: number }[];
  topProducts: { productId: string; name: string; totalSold: number; orderCount: number }[];
  ordersByStatus: { status: string; count: number }[];
  summary: {
    totalRevenue: number;
    totalCommission: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

export interface Transaction {
  id: string;
  type: 'sale' | 'commission' | 'payout' | 'adjustment';
  amount: number;
  description?: string;
  orderId?: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  amount: number;
  cardNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  note?: string;
  createdAt: string;
  processedAt?: string;
}

export interface Category {
  id: string;
  nameUz: string;
  nameRu?: string;
  icon?: string;
  sortOrder: number;
  children?: {
    id: string;
    nameUz: string;
    nameRu?: string;
    icon?: string;
    sortOrder: number;
    isActive?: boolean;
    children?: {
      id: string;
      nameUz: string;
      nameRu?: string;
      sortOrder: number;
    }[];
  }[];
}

export interface CategoryAttribute {
  id: string;
  nameUz: string;
  nameRu?: string;
  key: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  unit?: string;
  options?: string[];
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export interface VendorDocument {
  id: string;
  type: 'license' | 'certificate' | 'passport' | 'inn';
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  createdAt: string;
}

export interface ShopReview {
  id: string;
  rating: number;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewsResponse extends PaginatedResponse<ShopReview> {
  averageRating?: number;
  ratingDistribution?: Record<number, number>;
}

// ============ API FUNCTIONS ============

export const vendorApi = {
  // --- Shop ---
  getShop: () => api.get<Shop>('/vendor/shop'),

  updateShop: (data: Partial<Shop>) => api.put<Shop>('/vendor/shop/settings', data),

  // --- Stats ---
  getStats: () => api.get<VendorStats>('/vendor/stats'),

  getAnalytics: (period?: string) =>
    api.get<VendorAnalytics>(`/vendor/analytics${period ? `?period=${period}` : ''}`),

  // --- Products ---
  getProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    const qs = query.toString();
    return api.get<PaginatedResponse<Product>>(`/vendor/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (id: string) => api.get<Product>(`/vendor/products/${id}`),

  createProduct: (data: Partial<Product>) =>
    api.post<Product>('/vendor/products', data),

  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/vendor/products/${id}`, data),

  deleteProduct: (id: string) => api.delete(`/vendor/products/${id}`),

  toggleProductActive: (id: string, isActive: boolean) =>
    api.patch(`/vendor/products/${id}`, { isActive }),

  // --- Orders ---
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    // Backend returns { orders: Order[], total: number }
    const result = await api.get<{ orders: Order[]; total: number }>(`/vendor/orders${qs ? `?${qs}` : ''}`);
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    return {
      data: result.orders || [],
      total: result.total || 0,
      page,
      limit,
      totalPages: Math.ceil((result.total || 0) / limit),
    } as PaginatedResponse<Order>;
  },

  getOrder: (id: string) => api.get<Order>(`/vendor/orders/${id}`),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    api.put(`/vendor/orders/${id}/status`, { status, note }),

  // --- Transactions ---
  getTransactions: (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return api.get<PaginatedResponse<Transaction>>(`/vendor/transactions${qs ? `?${qs}` : ''}`);
  },

  // --- Payouts ---
  getPayouts: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<PaginatedResponse<Payout>>(`/vendor/payouts${qs ? `?${qs}` : ''}`);
  },

  requestPayout: (data: { amount: number; cardNumber: string }) =>
    api.post<Payout>('/vendor/payouts', data),

  // --- Commissions ---
  getCommissions: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<PaginatedResponse<Transaction>>(`/vendor/commissions${qs ? `?${qs}` : ''}`);
  },

  // --- Categories ---
  getCategories: () => api.get<Category[]>('/categories'),
  getCategoryAttributes: (categoryId: string) =>
    api.get<CategoryAttribute[]>(`/categories/${categoryId}/attributes`),
  cloneProduct: (id: string) =>
    api.post<Product>(`/vendor/products/${id}/clone`, {}),

  // --- Colors & Brands ---
  getColors: () => api.get<ColorOption[]>('/colors'),
  getBrands: () => api.get<any[]>('/brands'),
  getSizes: () => api.get<SizeOption[]>('/sizes'),

  // --- Documents ---
  getDocuments: () => api.get<VendorDocument[]>('/vendor/documents'),

  uploadDocument: (formData: FormData) =>
    api.upload<VendorDocument>('/vendor/documents', formData),

  deleteDocument: (id: string) => api.delete(`/vendor/documents/${id}`),

  reuploadDocument: (id: string, formData: FormData) =>
    api.put<VendorDocument>(`/vendor/documents/${id}`, formData),

  // --- Reviews ---
  getReviews: (params?: { page?: number; limit?: number; rating?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.rating) query.set('rating', String(params.rating));
    const qs = query.toString();
    return api.get<ReviewsResponse>(`/vendor/reviews${qs ? `?${qs}` : ''}`);
  },

  replyToReview: (id: string, reply: string) =>
    api.post(`/vendor/reviews/${id}/reply`, { reply }),

  // --- Promo Codes ---
  getPromoCodes: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<{ data: PromoCode[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(`/vendor/promo-codes${qs ? `?${qs}` : ''}`);
  },

  createPromoCode: (data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    expiresAt?: string;
  }) => api.post<PromoCode>('/vendor/promo-codes', data),

  updatePromoCode: (id: string, data: Partial<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    expiresAt?: string;
    isActive: boolean;
  }>) => api.put<PromoCode>(`/vendor/promo-codes/${id}`, data),

  deletePromoCode: (id: string) => api.delete(`/vendor/promo-codes/${id}`),

  // --- Notifications ---
  getNotifications: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<{ notifications: Notification[]; unreadCount: number; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/notifications${qs ? `?${qs}` : ''}`);
  },

  getUnreadNotificationCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markNotificationRead: (id: string) =>
    api.put(`/notifications/${id}/read`, {}),

  markAllNotificationsRead: () =>
    api.put('/notifications/read-all', {}),

  // --- Funnel Analytics (COMPETE-001) ---
  getFunnelAnalytics: (period?: string) =>
    api.get<any>(`/vendor/analytics/funnel${period ? `?period=${period}` : ''}`),

  // --- Product Reviews (COMPETE-007) ---
  getProductReviews: (params?: { page?: number; limit?: number; rating?: number; productId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.rating) query.set('rating', String(params.rating));
    if (params?.productId) query.set('productId', params.productId);
    const qs = query.toString();
    return api.get<any>(`/vendor/product-reviews${qs ? `?${qs}` : ''}`);
  },

  // --- Product Boosts (COMPETE-002) ---
  getBoosts: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<any>(`/vendor/boosts${qs ? `?${qs}` : ''}`);
  },

  createBoost: (data: { productId: string; dailyBudget: number; totalBudget: number; startDate: string; endDate: string }) =>
    api.post<any>('/vendor/boosts', data),

  pauseBoost: (id: string) =>
    api.patch<any>(`/vendor/boosts/${id}/pause`, {}),

  resumeBoost: (id: string) =>
    api.patch<any>(`/vendor/boosts/${id}/resume`, {}),

  cancelBoost: (id: string) =>
    api.delete<any>(`/vendor/boosts/${id}`),

  // --- Penalties (COMPETE-009) ---
  getPenalties: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<any>(`/vendor/penalties${qs ? `?${qs}` : ''}`);
  },

  appealPenalty: (id: string, note: string) =>
    api.post<any>(`/vendor/penalties/${id}/appeal`, { note }),

  // Delivery / Logistics (COMPETE-006)
  getDeliverySettings: () => api.get<any>('/vendor/delivery-settings'),
  updateDeliverySettings: (data: any) => api.put<any>('/vendor/delivery-settings', data),
  getOrderTracking: (orderId: string) => api.get<any>(`/vendor/orders/${orderId}/tracking`),
  addTrackingNumber: (orderId: string, data: { trackingNumber: string; carrier?: string }) =>
    api.post<any>(`/vendor/orders/${orderId}/tracking`, data),

  // --- ADVANCED-001: AI Price Suggestion ---
  getAIPriceSuggestion: (productId: string) =>
    api.get<any>(`/vendor/ai/price-suggestion/${productId}`),

  getAIPriceAlerts: () =>
    api.get<any>('/vendor/ai/price-alerts'),

  // --- ADVANCED-006: Vendor Finance Dashboard ---
  getFinanceSummary: (period?: string) =>
    api.get<any>(`/vendor/finance/summary${period ? `?period=${period}` : ''}`),

  getFinanceReports: () =>
    api.get<any>('/vendor/finance/reports'),

  // ===== Phase 5: Vendor System Enhancements =====

  // V-NEW-02: Onboarding progress
  getOnboarding: () =>
    api.get<OnboardingProgress>('/vendor/onboarding'),

  // V-NEW-04: Performance score
  getPerformance: (period?: 'week' | 'month' | 'year' | 'all') =>
    api.get<PerformanceScore>(`/vendor/performance${period ? `?period=${period}` : ''}`),

  // V-04: Product export CSV
  exportProducts: async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/products/export`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Export failed');
    return response.text();
  },

  // V-NEW-03: Bulk product import
  importProducts: (csvContent: string) =>
    api.post<BulkImportResult>('/vendor/products/import', { csvContent }),

  // B-08: Bulk price update
  bulkUpdatePrices: (updates: BulkPriceUpdate[]) =>
    api.patch<BulkPriceResult>('/vendor/products/bulk-price', { updates }),

  // V-NEW-01: Full shop settings update
  updateShopSettings: (settings: Partial<ShopSettings>) =>
    api.put<any>('/vendor/shop/settings', settings),

  // API KEYS
  getApiKeys: () =>
    api.get<{ success: boolean; data: VendorApiKey[] }>('/vendor/api-keys').then(r => r.data),

  createApiKey: (body: { name: string; permissions?: string[]; rateLimit?: number }) =>
    api.post<{ success: boolean; data: VendorApiKey }>('/vendor/api-keys', body).then(r => r.data),

  updateApiKey: (id: string, body: { name?: string; isActive?: boolean; permissions?: string[] }) =>
    api.patch<{ success: boolean; data: VendorApiKey }>(`/vendor/api-keys/${id}`, body).then(r => r.data),

  deleteApiKey: (id: string) =>
    api.delete<{ success: boolean }>(`/vendor/api-keys/${id}`),

  getApiUsage: () =>
    api.get<{ success: boolean; data: any[] }>('/vendor/api-usage').then(r => r.data),

  // WEBHOOKS
  getWebhooks: () =>
    api.get<{ success: boolean; data: VendorWebhook[] }>('/vendor/webhooks').then(r => r.data),

  createWebhook: (body: { apiKeyId: string; url: string; events: string[] }) =>
    api.post<{ success: boolean; data: VendorWebhook }>('/vendor/webhooks', body).then(r => r.data),

  deleteWebhook: (id: string) =>
    api.delete<{ success: boolean }>(`/vendor/webhooks/${id}`),

  testWebhook: (id: string) =>
    api.post<{ success: boolean; data: { statusCode: number; ok: boolean; error?: string } }>(`/vendor/webhooks/${id}/test`, {}).then(r => r.data),
};

export interface PromoCode {
  id: string;
  code: string;
  shopId?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  currentUses: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body?: string;
  type: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

// Delivery / Logistics (COMPETE-006)
export interface DeliverySettings {
  fulfillmentType: string;
  returnPolicy: string;
  returnDays: number;
  freeDeliveryThreshold: number | null;
}

// ===== Phase 5 interfaces =====

export interface OnboardingStep {
  key: string;
  label: string;
  id?: string;
  title?: string;
  description?: string;
  completed: boolean;
  href: string;
}

export interface OnboardingProgress {
  completed: number;
  total: number;
  percentage: number;
  steps: OnboardingStep[];
  contract?: {
    contractStatus: string;
    contractUrl?: string;
    contractSentAt?: string;
    contractSignedAt?: string;
    contractNote?: string;
  };
}

export interface PerformanceMetric {
  label: string;
  value: number;
  weight: number;
  weightedScore: number;
}

export interface PerformanceScore {
  overall: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  metrics: Record<string, PerformanceMetric>;
  periodDays: number;
}

export interface BulkPriceUpdate {
  productId: string;
  price?: number;
  originalPrice?: number;
  discountPercent?: number;
}

export interface BulkPriceResult {
  updated: number;
  errors: { productId: string; error: string }[];
  total: number;
}

export interface BulkImportResult {
  imported: number;
  errors: { row: number; error: string }[];
  total: number;
}

// ===== API Keys & Webhooks =====

export interface VendorApiKey {
  id: string;
  name: string;
  key: string; // masked: "tpk_abc123..."
  secret: string; // masked on list, full only on creation
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  webhooks: VendorWebhook[];
}

export interface VendorWebhook {
  id: string;
  apiKeyId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  failCount: number;
  createdAt: string;
}

export interface ShopSettings {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  website: string | null;
  telegram: string | null;
  instagram: string | null;
  businessType: string;
  inn: string;
  bankName: string;
  bankAccount: string;
  mfo: string;
  oked: string;
  fulfillmentType: 'FBS' | 'DBS';
  isOpen: boolean;
  workingHours: Record<string, any>;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryFrom: number | null;
  deliveryRadius: number | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default vendorApi;

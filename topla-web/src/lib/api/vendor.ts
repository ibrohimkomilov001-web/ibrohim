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
  createdAt: string;
  _count?: {
    products: number;
    orders: number;
  };
}

export interface Product {
  id: string;
  categoryId?: string;
  subcategoryId?: string;
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
  category?: { id: string; nameUz: string; nameRu?: string };
  subcategory?: { id: string; nameUz: string; nameRu?: string };
  brand?: { id: string; name: string };
  colors?: { id: string; name: string; hexCode: string }[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
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
  subcategories: {
    id: string;
    nameUz: string;
    nameRu?: string;
    sortOrder: number;
  }[];
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

  updateShop: (data: Partial<Shop>) => api.put<Shop>('/vendor/shop', data),

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
  getOrders: (params?: {
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
    return api.get<PaginatedResponse<Order>>(`/vendor/orders${qs ? `?${qs}` : ''}`);
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
  getCategories: () => api.get<{ data: Category[] }>('/categories'),

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
};

export default vendorApi;

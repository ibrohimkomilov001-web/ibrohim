// ============================================
// Admin Panel API Client
// Connects to topla-backend admin endpoints
// ============================================

function getApiBase(): string {
  // Brauzerda bo'lsa — relative URL ishlatamiz (cross-origin muammosi yo'q)
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  // SSR da — to'liq URL kerak
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
}

export const API_BASE = getApiBase();

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_token', token);
}

export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_demo_mode');
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin_demo_mode') === 'true';
}

async function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Demo rejimda backend'ga so'rov yubormasdan demo ma'lumot qaytarish
  if (isDemoMode()) {
    return getDemoResponse<T>(endpoint, options);
  }

  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    // Demo rejimda bo'lsa — demo ma'lumot qaytarish
    if (isDemoMode()) {
      return getDemoResponse<T>(endpoint, options);
    }
    throw new Error('Serverga ulanib bo\'lmadi');
  }

  if (!response.ok) {
    let errorData: any;
    try { errorData = await response.json(); } catch { /* ignore */ }

    if (response.status === 401) {
      removeAdminToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }

    throw new Error(errorData?.message || `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

// ============================================
// Auth
// ============================================
export async function adminLogin(email: string, password: string) {
  // Login har doim realga borishi kerak — demo rejimni tozalaymiz
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_demo_mode');
  }

  try {
    const url = `${API_BASE}/auth/admin/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || `HTTP ${response.status}`);
    }

    const res = await response.json();
    if (res.data?.token) {
      setAdminToken(res.data.token);
    }
    return res.data;
  } catch (err: any) {
    // Backend ishlamayotgan bo'lsa — xato qaytarish
    throw new Error(err.message || 'Serverga ulanib bo\'lmadi. Qayta urinib ko\'ring.');
  }
}

// ============================================
// Dashboard
// ============================================
export async function fetchDashboardStats() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/dashboard');
  return res.data;
}

// ============================================
// Users
// ============================================
export async function fetchUsers(params?: { search?: string; role?: string; status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.role) query.set('role', params.role);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/users?${query}`);
  return res.data;
}

export async function updateUserStatus(id: string, status: string) {
  const res = await adminRequest<{ success: boolean }>(`/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return res;
}

export async function updateUserRole(id: string, role: string) {
  return adminRequest(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

// ============================================
// Shops
// ============================================
export async function fetchShops(params?: { search?: string; status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/shops?${query}`);
  return res.data;
}

export async function fetchShopDetail(id: string) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/shops/${id}`);
  return res.data;
}

export async function updateShopStatus(id: string, status: string) {
  return adminRequest(`/admin/shops/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateShopCommission(id: string, commissionRate: number) {
  return adminRequest(`/admin/shops/${id}/commission`, {
    method: 'PUT',
    body: JSON.stringify({ commissionRate }),
  });
}

// ============================================
// Products
// ============================================
export async function fetchProducts(params?: { search?: string; status?: string; shopId?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.shopId) query.set('shopId', params.shopId);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/products?${query}`);
  return res.data;
}

export async function blockProduct(id: string, reason: string) {
  return adminRequest(`/admin/products/${id}/block`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

export async function unblockProduct(id: string) {
  return adminRequest(`/admin/products/${id}/unblock`, { method: 'PUT' });
}

export async function deleteProduct(id: string) {
  return adminRequest(`/admin/products/${id}`, { method: 'DELETE' });
}

export async function approveProduct(id: string) {
  return adminRequest(`/admin/products/${id}/approve`, { method: 'PUT' });
}

export async function rejectProduct(id: string, reason: string) {
  return adminRequest(`/admin/products/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

// ============================================
// Orders
// ============================================
export async function fetchOrders(params?: { status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/orders?${query}`);
  return res.data;
}

export async function fetchOrderDetail(id: string) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/orders/${id}`);
  return res.data;
}

export async function updateOrderStatus(id: string, status: string, note?: string) {
  return adminRequest(`/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
}

// ============================================
// Categories
// ============================================
export async function fetchCategories() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/categories');
  return res.data;
}

export async function createCategory(data: any) {
  return adminRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: any) {
  return adminRequest(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string) {
  return adminRequest(`/admin/categories/${id}`, { method: 'DELETE' });
}

// Subcategories — backend uses flat /admin/subcategories routes
export async function createSubcategory(categoryId: string, data: any) {
  return adminRequest('/admin/subcategories', {
    method: 'POST',
    body: JSON.stringify({ categoryId, ...data }),
  });
}

export async function updateSubcategory(_categoryId: string, subId: string, data: any) {
  return adminRequest(`/admin/subcategories/${subId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSubcategory(_categoryId: string, subId: string) {
  return adminRequest(`/admin/subcategories/${subId}`, { method: 'DELETE' });
}

// ============================================
// Admin Image Upload
// ============================================
export async function adminUploadImage(file: File, folder: string = 'banner'): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  // Upload endpoint returns { url, fileName, size } directly (no {success, data} wrapper)
  const res = await adminRequest<{ url: string; fileName: string; size: number }>('/upload/image', {
    method: 'POST',
    body: formData,
  });

  return res?.url || '';
}

// ============================================
// Banners
// ============================================
export async function fetchBanners() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/banners');
  return res.data;
}

export async function createBanner(data: any) {
  return adminRequest('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBanner(id: string, data: any) {
  return adminRequest(`/admin/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBanner(id: string) {
  return adminRequest(`/admin/banners/${id}`, { method: 'DELETE' });
}

// ============================================
// Promo Codes
// ============================================
export async function fetchPromoCodes() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/promo-codes');
  return res.data;
}

export async function createPromoCode(data: any) {
  return adminRequest('/admin/promo-codes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePromoCode(id: string, data: any) {
  return adminRequest(`/admin/promo-codes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePromoCode(id: string) {
  return adminRequest(`/admin/promo-codes/${id}`, { method: 'DELETE' });
}

// ============================================
// Delivery Zones
// ============================================
export async function fetchDeliveryZones() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/delivery-zones');
  return res.data;
}

export async function createDeliveryZone(data: any) {
  return adminRequest('/admin/delivery-zones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteDeliveryZone(id: string) {
  return adminRequest(`/admin/delivery-zones/${id}`, { method: 'DELETE' });
}

export async function updateDeliveryZone(id: string, data: any) {
  return adminRequest(`/admin/delivery-zones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// Payouts
// ============================================
export async function fetchPayouts(params?: { status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/payouts?${query}`);
  return res.data;
}

export async function processPayout(id: string, data: { status: string; transactionId?: string; rejectionReason?: string }) {
  return adminRequest(`/admin/payouts/${id}/process`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// Notifications
// ============================================
export async function fetchNotifications() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/notifications');
  return res.data;
}

export async function createNotification(data: { title: string; body: string; type?: string; targetRole?: string }) {
  return adminRequest('/admin/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function sendNotification(id: string) {
  return adminRequest(`/admin/notifications/${id}/send`, { method: 'POST' });
}

export async function deleteNotification(id: string) {
  return adminRequest(`/admin/notifications/${id}`, { method: 'DELETE' });
}

export async function broadcastNotification(data: { title: string; body: string; type?: string; targetRole?: string; imageUrl?: string; linkUrl?: string }) {
  return adminRequest('/admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Reports
// ============================================
export async function fetchReports(period: string = 'month') {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/reports?period=${period}`);
  return res.data;
}

// ============================================
// Analytics
// ============================================
export async function fetchAnalyticsRevenue(period: string = '30d', compare: boolean = false) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/analytics/revenue?period=${period}&compare=${compare}`);
  return res.data;
}

export async function fetchAnalyticsOrders(period: string = '30d') {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/analytics/orders?period=${period}`);
  return res.data;
}

export async function fetchAnalyticsUsers(period: string = '30d', compare: boolean = false) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/analytics/users?period=${period}&compare=${compare}`);
  return res.data;
}

export async function fetchAnalyticsCategories(period: string = '30d') {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/analytics/categories?period=${period}`);
  return res.data;
}

export async function fetchAnalyticsRegions(period: string = '30d') {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/analytics/regions?period=${period}`);
  return res.data;
}

// ============================================
// Logs
// ============================================
export async function fetchLogs(params?: { action?: string; entityType?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.action) query.set('action', params.action);
  if (params?.entityType) query.set('entityType', params.entityType);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/logs?${query}`);
  return res.data;
}

// ============================================
// Settings
// ============================================
export async function fetchSettings() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/settings');
  return res.data;
}

export async function updateSettings(settings: Record<string, any>) {
  return adminRequest('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

// ============================================
// Brands
// ============================================
export async function fetchBrands() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/brands');
  return res.data;
}

export async function createBrand(data: any) {
  return adminRequest('/admin/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBrand(id: string, data: any) {
  return adminRequest(`/admin/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBrand(id: string) {
  return adminRequest(`/admin/brands/${id}`, { method: 'DELETE' });
}

// ============================================
// Colors
// ============================================
export async function fetchColors() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/colors');
  return res.data;
}

export async function createColor(data: any) {
  return adminRequest('/admin/colors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateColor(id: string, data: any) {
  return adminRequest(`/admin/colors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteColor(id: string) {
  return adminRequest(`/admin/colors/${id}`, { method: 'DELETE' });
}

// ============================================
// Couriers
// ============================================
export async function fetchCouriers(params?: { page?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.status) query.set('status', params.status);
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/couriers?${query}`);
  return res.data;
}

// ============================================
// Logs - Clear
// ============================================
export async function clearLogs() {
  return adminRequest('/admin/logs/clear', { method: 'DELETE' });
}

// ============================================
// Documents (Admin Review)
// ============================================
export async function fetchDocuments(params?: { status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/documents?${query}`);
  return res.data;
}

export async function fetchDocumentStats() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/documents/stats');
  return res.data;
}

export async function reviewDocument(id: string, data: { status: 'approved' | 'rejected'; rejectedReason?: string }) {
  return adminRequest(`/admin/documents/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// Demo Mode — Backend ishlamayotganda demo ma'lumotlar
// ============================================
function getDemoResponse<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();

  // Write operatsiyalari uchun success qaytarish
  if (method !== 'GET') {
    return { success: true, message: 'Demo rejimda saqlandi' } as T;
  }

  // Dashboard
  if (endpoint.includes('/admin/dashboard')) {
    return {
      success: true,
      data: {
        totalUsers: 1247,
        totalShops: 86,
        totalProducts: 3452,
        totalOrders: 892,
        totalRevenue: 456780000,
        todayOrders: 34,
        todayRevenue: 12450000,
        pendingShops: 5,
        pendingProducts: 12,
        activeUsers: 328,
        recentOrders: [
          { id: 'ord-1', orderNumber: 'T-20260211-001', totalAmount: 185000, status: 'delivered', created_at: '2026-02-11T10:30:00Z', customer: { full_name: 'Aziz Karimov', phone: '+998901234567' } },
          { id: 'ord-2', orderNumber: 'T-20260211-002', totalAmount: 92000, status: 'preparing', created_at: '2026-02-11T11:15:00Z', customer: { full_name: 'Nilufar Rahimova', phone: '+998907654321' } },
          { id: 'ord-3', orderNumber: 'T-20260211-003', totalAmount: 340000, status: 'pending', created_at: '2026-02-11T12:00:00Z', customer: { full_name: 'Sardor Toshmatov', phone: '+998933456789' } },
          { id: 'ord-4', orderNumber: 'T-20260210-015', totalAmount: 67000, status: 'delivered', created_at: '2026-02-10T16:30:00Z', customer: { full_name: 'Madina Aliyeva', phone: '+998945678901' } },
          { id: 'ord-5', orderNumber: 'T-20260210-014', totalAmount: 520000, status: 'delivered', created_at: '2026-02-10T14:20:00Z', customer: { full_name: 'Bobur Qodirov', phone: '+998912345678' } },
        ],
        salesChart: [
          { date: '2026-02-05', amount: 8500000 },
          { date: '2026-02-06', amount: 12300000 },
          { date: '2026-02-07', amount: 9800000 },
          { date: '2026-02-08', amount: 15400000 },
          { date: '2026-02-09', amount: 11200000 },
          { date: '2026-02-10', amount: 18900000 },
          { date: '2026-02-11', amount: 12450000 },
        ],
      },
    } as T;
  }

  // Users
  if (endpoint.includes('/admin/users')) {
    return {
      success: true,
      data: {
        users: [
          { id: 'u1', full_name: 'Aziz Karimov', phone: '+998901234567', email: 'aziz@mail.uz', role: 'user', is_active: true, avatar_url: null, created_at: '2025-12-15T10:00:00Z', orders_count: 12 },
          { id: 'u2', full_name: 'Nilufar Rahimova', phone: '+998907654321', email: 'nilufar@mail.uz', role: 'user', is_active: true, avatar_url: null, created_at: '2026-01-05T14:00:00Z', orders_count: 8 },
          { id: 'u3', full_name: 'Sardor Toshmatov', phone: '+998933456789', email: null, role: 'vendor', is_active: true, avatar_url: null, created_at: '2025-11-20T09:00:00Z', orders_count: 0 },
          { id: 'u4', full_name: 'Madina Aliyeva', phone: '+998945678901', email: 'madina@gmail.com', role: 'user', is_active: true, avatar_url: null, created_at: '2026-01-18T16:00:00Z', orders_count: 5 },
          { id: 'u5', full_name: 'Bobur Qodirov', phone: '+998912345678', email: null, role: 'user', is_active: false, avatar_url: null, created_at: '2025-10-01T08:00:00Z', orders_count: 3 },
          { id: 'u6', full_name: 'Gulnora Usmanova', phone: '+998998887766', email: 'gulnora@inbox.uz', role: 'vendor', is_active: true, avatar_url: null, created_at: '2026-01-25T12:00:00Z', orders_count: 0 },
          { id: 'u7', full_name: 'Jamshid Normatov', phone: '+998971112233', email: null, role: 'courier', is_active: true, avatar_url: null, created_at: '2026-02-01T07:00:00Z', orders_count: 0 },
          { id: 'u8', full_name: 'TOPLA Admin', phone: '+998900000000', email: 'admin@topla.uz', role: 'admin', is_active: true, avatar_url: null, created_at: '2025-06-01T00:00:00Z', orders_count: 0 },
        ],
        total: 8,
        page: 1,
        limit: 20,
      },
    } as T;
  }

  // Shop detail
  if (endpoint.match(/\/admin\/shops\/[^/?]+$/)) {
    return {
      success: true,
      data: {
        id: 'shop-1', name: 'TechnoMart', description: 'Elektronika do\'koni', status: 'active',
        phone: '+998901112233', email: 'technomart@mail.uz', address: 'Toshkent, Chilonzor 9',
        commission_rate: 10, rating: 4.5, products_count: 156, orders_count: 342,
        owner: { full_name: 'Sardor Toshmatov', phone: '+998933456789' },
        created_at: '2025-11-20T09:00:00Z',
      },
    } as T;
  }
  // Shops list
  if (endpoint.includes('/admin/shops')) {
    return {
      success: true,
      data: {
        shops: [
          { id: 'shop-1', name: 'TechnoMart', status: 'active', phone: '+998901112233', city: 'Toshkent', commission_rate: 10, rating: 4.5, products_count: 156, owner: { full_name: 'Sardor Toshmatov', phone: '+998933456789' }, created_at: '2025-11-20T09:00:00Z' },
          { id: 'shop-2', name: 'ModaStyle', status: 'active', phone: '+998935554433', city: 'Toshkent', commission_rate: 12, rating: 4.2, products_count: 89, owner: { full_name: 'Gulnora Usmanova', phone: '+998998887766' }, created_at: '2026-01-10T10:00:00Z' },
          { id: 'shop-3', name: 'FreshMart', status: 'pending', phone: '+998977776655', city: 'Samarqand', commission_rate: 8, rating: 0, products_count: 0, owner: { full_name: 'Olim Rahimov', phone: '+998977776655' }, created_at: '2026-02-09T15:00:00Z' },
          { id: 'shop-4', name: 'KitobDunyosi', status: 'active', phone: '+998913332211', city: 'Toshkent', commission_rate: 10, rating: 4.8, products_count: 234, owner: { full_name: 'Dilshod Karimov', phone: '+998913332211' }, created_at: '2025-08-15T11:00:00Z' },
          { id: 'shop-5', name: 'SportZone', status: 'suspended', phone: '+998946667788', city: 'Namangan', commission_rate: 10, rating: 3.1, products_count: 45, owner: { full_name: 'Akbar Yusupov', phone: '+998946667788' }, created_at: '2025-10-05T13:00:00Z' },
        ],
        total: 5, page: 1, limit: 20,
      },
    } as T;
  }

  // Products
  if (endpoint.includes('/admin/products')) {
    return {
      success: true,
      data: {
        products: [
          { id: 'p1', name_uz: 'iPhone 16 Pro Max', price: 18500000, status: 'active', stock: 15, quality_score: 95, shop: { name: 'TechnoMart' }, category: { name_uz: 'Smartfonlar' }, images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200'], created_at: '2026-02-01T10:00:00Z' },
          { id: 'p2', name_uz: 'Samsung Galaxy S25 Ultra', price: 16800000, status: 'active', stock: 8, quality_score: 90, shop: { name: 'TechnoMart' }, category: { name_uz: 'Smartfonlar' }, images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200'], created_at: '2026-01-28T14:00:00Z' },
          { id: 'p3', name_uz: 'Nike Air Max 2026', price: 1250000, status: 'active', stock: 42, quality_score: 85, shop: { name: 'SportZone' }, category: { name_uz: 'Krossovkalar' }, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200'], created_at: '2026-01-20T09:00:00Z' },
          { id: 'p4', name_uz: 'Ko\'ylak ayollar uchun', price: 280000, status: 'pending', stock: 25, quality_score: 60, shop: { name: 'ModaStyle' }, category: { name_uz: 'Kiyimlar' }, images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200'], created_at: '2026-02-10T16:00:00Z' },
          { id: 'p5', name_uz: 'MacBook Pro M4', price: 32000000, status: 'active', stock: 5, quality_score: 98, shop: { name: 'TechnoMart' }, category: { name_uz: 'Noutbuklar' }, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200'], created_at: '2026-01-15T11:00:00Z' },
          { id: 'p6', name_uz: 'AirPods Pro 3', price: 3500000, status: 'blocked', stock: 0, quality_score: 30, shop: { name: 'TechnoMart' }, category: { name_uz: 'Quloqchinlar' }, images: ['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200'], created_at: '2026-02-05T08:00:00Z' },
        ],
        total: 6, page: 1, limit: 20,
      },
    } as T;
  }

  // Order detail
  if (endpoint.match(/\/admin\/orders\/[^/?]+$/)) {
    return {
      success: true,
      data: {
        id: 'ord-1', orderNumber: 'T-20260211-001', status: 'delivered', totalAmount: 185000, deliveryFee: 15000,
        customer: { full_name: 'Aziz Karimov', phone: '+998901234567' },
        address: { full_address: 'Toshkent, Yunusobod 4, 12-uy, 34-xonadon' },
        items: [{ id: 'oi-1', product: { name: 'Nike Air Max', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'] }, quantity: 1, price: 170000, shop: { name: 'SportZone' } }],
        created_at: '2026-02-11T10:30:00Z', delivered_at: '2026-02-11T12:00:00Z',
      },
    } as T;
  }
  // Orders list
  if (endpoint.includes('/admin/orders')) {
    return {
      success: true,
      data: {
        orders: [
          { id: 'ord-1', order_number: 'T-20260211-001', total_amount: 185000, status: 'delivered', created_at: '2026-02-11T10:30:00Z', customer: { full_name: 'Aziz Karimov' }, shop: { name: 'SportZone' }, items_count: 1 },
          { id: 'ord-2', order_number: 'T-20260211-002', total_amount: 92000, status: 'preparing', created_at: '2026-02-11T11:15:00Z', customer: { full_name: 'Nilufar Rahimova' }, shop: { name: 'ModaStyle' }, items_count: 2 },
          { id: 'ord-3', order_number: 'T-20260211-003', total_amount: 340000, status: 'pending', created_at: '2026-02-11T12:00:00Z', customer: { full_name: 'Sardor Toshmatov' }, shop: { name: 'TechnoMart' }, items_count: 1 },
          { id: 'ord-4', order_number: 'T-20260210-015', total_amount: 67000, status: 'delivered', created_at: '2026-02-10T16:30:00Z', customer: { full_name: 'Madina Aliyeva' }, shop: { name: 'KitobDunyosi' }, items_count: 3 },
          { id: 'ord-5', order_number: 'T-20260210-014', total_amount: 520000, status: 'cancelled', created_at: '2026-02-10T14:20:00Z', customer: { full_name: 'Bobur Qodirov' }, shop: { name: 'TechnoMart' }, items_count: 2 },
        ],
        total: 5, page: 1, limit: 20,
      },
    } as T;
  }

  // Categories
  if (endpoint.includes('/admin/categories')) {
    return {
      success: true,
      data: [
        { id: 'cat-1', name_uz: 'Elektronika', name_ru: 'Электроника', icon: 'mobile', sort_order: 1, products_count: 245, subcategories: [{ id: 'sub-1', name_uz: 'Smartfonlar', name_ru: 'Смартфоны' }, { id: 'sub-2', name_uz: 'Planshetlar', name_ru: 'Планшеты' }] },
        { id: 'cat-2', name_uz: 'Kiyimlar', name_ru: 'Одежда', icon: 'shirt', sort_order: 2, products_count: 189, subcategories: [{ id: 'sub-3', name_uz: 'Erkaklar', name_ru: 'Мужская' }, { id: 'sub-4', name_uz: 'Ayollar', name_ru: 'Женская' }] },
        { id: 'cat-3', name_uz: 'Sport', name_ru: 'Спорт', icon: 'dumbbell', sort_order: 3, products_count: 78, subcategories: [{ id: 'sub-5', name_uz: 'Krossovkalar', name_ru: 'Кроссовки' }] },
        { id: 'cat-4', name_uz: 'Uy-ro\'zg\'or', name_ru: 'Дом и сад', icon: 'home', sort_order: 4, products_count: 156, subcategories: [] },
        { id: 'cat-5', name_uz: 'Kitoblar', name_ru: 'Книги', icon: 'book', sort_order: 5, products_count: 234, subcategories: [{ id: 'sub-6', name_uz: 'Badiiy', name_ru: 'Художественные' }, { id: 'sub-7', name_uz: 'Ilmiy', name_ru: 'Научные' }] },
        { id: 'cat-6', name_uz: 'Go\'zallik', name_ru: 'Красота', icon: 'sparkles', sort_order: 6, products_count: 112, subcategories: [] },
      ],
    } as T;
  }

  // Banners
  if (endpoint.includes('/admin/banners')) {
    return {
      success: true,
      data: [
        { id: 'b1', image_url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop', title_uz: 'Yangi kolleksiya', title_ru: 'Новая коллекция', is_active: true, sort_order: 1 },
        { id: 'b2', image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop', title_uz: 'Chegirmalar haftaligi', title_ru: 'Неделя скидок', is_active: true, sort_order: 2 },
        { id: 'b3', image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop', title_uz: 'Bepul yetkazib berish', title_ru: 'Бесплатная доставка', is_active: false, sort_order: 3 },
      ],
    } as T;
  }

  // Promo Codes
  if (endpoint.includes('/admin/promo-codes')) {
    return {
      success: true,
      data: [
        { id: 'pc1', code: 'TOPLA10', discount_type: 'percentage', discount_value: 10, min_order_amount: 100000, max_uses: 500, used_count: 234, is_active: true, expires_at: '2026-03-31T23:59:59Z' },
        { id: 'pc2', code: 'YANGI2026', discount_type: 'fixed', discount_value: 25000, min_order_amount: 200000, max_uses: 100, used_count: 67, is_active: true, expires_at: '2026-06-30T23:59:59Z' },
        { id: 'pc3', code: 'DELIVERY0', discount_type: 'fixed', discount_value: 15000, min_order_amount: 50000, max_uses: 200, used_count: 198, is_active: false, expires_at: '2026-01-31T23:59:59Z' },
      ],
    } as T;
  }

  // Delivery Zones
  if (endpoint.includes('/admin/delivery-zones')) {
    return {
      success: true,
      data: [
        { id: 'dz1', name: 'Toshkent shahri', base_fee: 15000, min_order: 30000, estimated_time: '30-60 daqiqa', is_active: true },
        { id: 'dz2', name: 'Toshkent viloyati', base_fee: 25000, min_order: 50000, estimated_time: '1-2 soat', is_active: true },
        { id: 'dz3', name: 'Samarqand', base_fee: 35000, min_order: 80000, estimated_time: '1-2 kun', is_active: false },
      ],
    } as T;
  }

  // Payouts
  if (endpoint.includes('/admin/payouts')) {
    return {
      success: true,
      data: {
        payouts: [
          { id: 'pay1', shop: { name: 'TechnoMart' }, amount: 2450000, status: 'pending', created_at: '2026-02-10T10:00:00Z', period: '2026-02-01 - 2026-02-10' },
          { id: 'pay2', shop: { name: 'ModaStyle' }, amount: 890000, status: 'completed', created_at: '2026-02-05T12:00:00Z', period: '2026-01-25 - 2026-02-05', transaction_id: 'TXN-20260205-001' },
          { id: 'pay3', shop: { name: 'KitobDunyosi' }, amount: 1200000, status: 'completed', created_at: '2026-02-01T09:00:00Z', period: '2026-01-20 - 2026-02-01', transaction_id: 'TXN-20260201-003' },
        ],
        total: 3, page: 1, limit: 20,
      },
    } as T;
  }

  // Analytics - Revenue
  if (endpoint.includes('/admin/analytics/revenue')) {
    const days = 30;
    const current = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - days + i + 1);
      return { date: d.toISOString().split('T')[0], revenue: Math.round(5000000 + Math.random() * 20000000), orders: Math.round(10 + Math.random() * 50) };
    });
    const previous = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - days * 2 + i + 1);
      return { date: d.toISOString().split('T')[0], revenue: Math.round(4000000 + Math.random() * 15000000), orders: Math.round(8 + Math.random() * 40) };
    });
    return { success: true, data: { current, previous, summary: { totalRevenue: 456780000, totalOrders: 892, growthPercent: 12.5, avgOrderValue: 512000 } } } as T;
  }

  // Analytics - Orders
  if (endpoint.includes('/admin/analytics/orders')) {
    const days = 30;
    const timeSeries = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - days + i + 1);
      return { date: d.toISOString().split('T')[0], count: Math.round(10 + Math.random() * 50) };
    });
    return { success: true, data: {
      timeSeries,
      statusBreakdown: [
        { status: 'delivered', count: 520 }, { status: 'pending', count: 45 }, { status: 'processing', count: 67 },
        { status: 'cancelled', count: 38 }, { status: 'shipping', count: 22 }, { status: 'confirmed', count: 89 },
      ],
      paymentBreakdown: [
        { method: 'cash', count: 412, total: 201000000 }, { method: 'payme', count: 289, total: 156000000 },
        { method: 'click', count: 156, total: 78000000 }, { method: 'card', count: 35, total: 21780000 },
      ],
    } } as T;
  }

  // Analytics - Users
  if (endpoint.includes('/admin/analytics/users')) {
    const days = 30;
    const current = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - days + i + 1);
      return { date: d.toISOString().split('T')[0], count: Math.round(5 + Math.random() * 30) };
    });
    return { success: true, data: { current, previous: [], summary: { totalNew: 347, growthPercent: 15.2 } } } as T;
  }

  // Analytics - Categories
  if (endpoint.includes('/admin/analytics/categories')) {
    return { success: true, data: [
      { id: 'c1', name: 'Elektronika', count: 342, revenue: 191000000 },
      { id: 'c2', name: 'Kiyimlar', count: 234, revenue: 114000000 },
      { id: 'c3', name: 'Sport', count: 156, revenue: 68000000 },
      { id: 'c4', name: 'Kitoblar', count: 89, revenue: 45000000 },
      { id: 'c5', name: 'Oziq-ovqat', count: 178, revenue: 52000000 },
      { id: 'c6', name: 'Uy-ro\'zg\'or', count: 67, revenue: 28000000 },
      { id: 'c7', name: 'Go\'zallik', count: 45, revenue: 19000000 },
    ] } as T;
  }

  // Analytics - Regions
  if (endpoint.includes('/admin/analytics/regions')) {
    return { success: true, data: [
      { region: 'tashkent_city', count: 456, revenue: 234000000 },
      { region: 'tashkent', count: 123, revenue: 67000000 },
      { region: 'samarkand', count: 89, revenue: 45000000 },
      { region: 'fergana', count: 67, revenue: 34000000 },
      { region: 'bukhara', count: 45, revenue: 23000000 },
      { region: 'andijon', count: 38, revenue: 19000000 },
      { region: 'namangan', count: 34, revenue: 17000000 },
      { region: 'khorezm', count: 23, revenue: 12000000 },
      { region: 'navoiy', count: 18, revenue: 9000000 },
      { region: 'qashqadaryo', count: 15, revenue: 7000000 },
      { region: 'surxondaryo', count: 12, revenue: 6000000 },
      { region: 'jizzax', count: 10, revenue: 5000000 },
      { region: 'sirdaryo', count: 8, revenue: 4000000 },
      { region: 'karakalpakstan', count: 6, revenue: 3000000 },
    ] } as T;
  }

  // Reports
  if (endpoint.includes('/admin/reports')) {
    return {
      success: true,
      data: {
        revenue: { total: 456780000, growth: 12.5 },
        orders: { total: 892, growth: 8.3 },
        users: { total: 1247, growth: 15.2 },
        shops: { total: 86, growth: 5.1 },
        topShops: [
          { name: 'TechnoMart', revenue: 125000000, orders: 342 },
          { name: 'KitobDunyosi', revenue: 89000000, orders: 567 },
          { name: 'ModaStyle', revenue: 67000000, orders: 234 },
        ],
        topProducts: [
          { name: 'iPhone 16 Pro Max', sales: 45, revenue: 832500000 },
          { name: 'Samsung Galaxy S25', sales: 38, revenue: 638400000 },
          { name: 'Nike Air Max 2026', sales: 89, revenue: 111250000 },
        ],
        categoryBreakdown: [
          { name: 'Elektronika', percentage: 42 },
          { name: 'Kiyimlar', percentage: 25 },
          { name: 'Sport', percentage: 15 },
          { name: 'Kitoblar', percentage: 10 },
          { name: 'Boshqa', percentage: 8 },
        ],
      },
    } as T;
  }

  // Logs
  if (endpoint.includes('/admin/logs')) {
    return {
      success: true,
      data: {
        logs: [
          { id: 'log1', user: { full_name: 'TOPLA Admin' }, action: 'admin.login', entity_type: 'profile', created_at: '2026-02-11T10:00:00Z', ip_address: '192.168.1.1' },
          { id: 'log2', user: { full_name: 'TOPLA Admin' }, action: 'product.approve', entity_type: 'product', entity_id: 'p1', created_at: '2026-02-11T09:30:00Z', ip_address: '192.168.1.1' },
          { id: 'log3', user: { full_name: 'TOPLA Admin' }, action: 'shop.approve', entity_type: 'shop', entity_id: 'shop-3', created_at: '2026-02-10T16:00:00Z', ip_address: '192.168.1.1' },
          { id: 'log4', user: { full_name: 'TOPLA Admin' }, action: 'user.block', entity_type: 'profile', entity_id: 'u5', created_at: '2026-02-10T14:00:00Z', ip_address: '192.168.1.1' },
          { id: 'log5', user: { full_name: 'TOPLA Admin' }, action: 'settings.update', entity_type: 'settings', created_at: '2026-02-09T11:00:00Z', ip_address: '192.168.1.1' },
        ],
        total: 5, page: 1, limit: 20,
      },
    } as T;
  }

  // Settings
  if (endpoint.includes('/admin/settings')) {
    return {
      success: true,
      data: {
        default_delivery_fee: '15000',
        commission_rate: '10',
        courier_delivery_share: '80',
        courier_assignment_timeout: '60',
        min_order_amount: '30000',
        app_version: '1.0.0',
        maintenance_mode: 'false',
        support_phone: '+998712000000',
        support_email: 'support@topla.uz',
      },
    } as T;
  }

  // Notifications
  if (endpoint.includes('/admin/notifications')) {
    return { success: true, data: [] } as T;
  }

  // Brands
  if (endpoint.includes('/admin/brands')) {
    return {
      success: true,
      data: [
        { id: 'br1', name: 'Apple', logo_url: null, products_count: 45 },
        { id: 'br2', name: 'Samsung', logo_url: null, products_count: 38 },
        { id: 'br3', name: 'Nike', logo_url: null, products_count: 89 },
        { id: 'br4', name: 'Adidas', logo_url: null, products_count: 56 },
        { id: 'br5', name: 'Xiaomi', logo_url: null, products_count: 34 },
      ],
    } as T;
  }

  // Default
  return { success: true, data: [] } as T;
}

// ============================================
// Pickup Points
// ============================================
export async function fetchAdminPickupPoints() {
  return adminRequest<any>('/admin/pickup-points');
}

export async function createAdminPickupPoint(data: any) {
  return adminRequest<any>('/admin/pickup-points', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminPickupPoint(id: string, data: any) {
  return adminRequest<any>(`/admin/pickup-points/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminPickupPoint(id: string) {
  return adminRequest<any>(`/admin/pickup-points/${id}`, {
    method: 'DELETE',
  });
}

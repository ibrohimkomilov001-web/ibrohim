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
  clearAdminPermissions();
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

async function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    // Store RBAC permissions from login response
    if (res.data?.adminRole) {
      setAdminPermissions(res.data.adminRole);
    }
    return res.data;
  } catch (err: any) {
    // Backend ishlamayotgan bo'lsa — xato qaytarish
    throw new Error(err.message || 'Serverga ulanib bo\'lmadi. Qayta urinib ko\'ring.');
  }
}

// ============================================
// Admin Me — get current admin profile + RBAC permissions
// ============================================
export interface AdminPermissions {
  level: string;
  permissions: string[];
}

export async function fetchAdminMe(): Promise<{ user: any; adminRole: AdminPermissions }> {
  const res = await adminRequest<{ success: boolean; data: { user: any; adminRole: AdminPermissions } }>('/admin/me');
  return res.data;
}

// Store admin permissions in memory + localStorage
const ADMIN_PERMISSIONS_KEY = 'admin_permissions';
const ADMIN_LEVEL_KEY = 'admin_level';

export function setAdminPermissions(adminRole: AdminPermissions): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_LEVEL_KEY, adminRole.level);
  localStorage.setItem(ADMIN_PERMISSIONS_KEY, JSON.stringify(adminRole.permissions));
}

export function getAdminLevel(): string {
  if (typeof window === 'undefined') return 'viewer';
  return localStorage.getItem(ADMIN_LEVEL_KEY) || 'super_admin';
}

export function getAdminPermissions(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PERMISSIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearAdminPermissions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_LEVEL_KEY);
  localStorage.removeItem(ADMIN_PERMISSIONS_KEY);
}

/**
 * Check if current admin has a specific permission.
 * super_admin always returns true.
 */
export function hasPermission(permission: string): boolean {
  const level = getAdminLevel();
  if (level === 'super_admin') return true;
  return getAdminPermissions().includes(permission);
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

export async function fetchShopStats(): Promise<{ total: number; pending: number; active: number; blocked: number }> {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/shops/stats');
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

export async function deleteShop(id: string) {
  return adminRequest(`/admin/shops/${id}`, {
    method: 'DELETE',
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
export async function fetchOrders(params?: { search?: string; status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
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
export async function fetchPromoCodes(params?: { search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/promo-codes?${query}`);
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
export async function fetchLogs(params?: { search?: string; action?: string; entityType?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.action) query.set('action', params.action);
  if (params?.entityType) query.set('entityType', params.entityType);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/logs?${query}`);
  return res.data;
}

// ============================================
// Chat (Admin monitoring)
// ============================================
export async function fetchChatRooms(params?: { search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/chats?${query}`);
  return res.data;
}

export async function fetchChatMessages(roomId: string, params?: { page?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/chats/${roomId}/messages?${query}`);
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
    body: JSON.stringify(settings),
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
export async function clearLogs(days: number = 30) {
  return adminRequest(`/admin/logs/clear?days=${days}`, { method: 'DELETE' });
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
// Pickup Points
// ============================================
export async function fetchAdminPickupPoints() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/pickup-points');
  return res.data;
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

// ============================================
// Pickup Point Applications (Punkt arizalari)
// ============================================
export async function fetchPickupApplications(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const qs = searchParams.toString();
  return adminRequest<{
    data: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/pickup-applications${qs ? `?${qs}` : ''}`);
}

export async function fetchPickupApplicationStats() {
  return adminRequest<{
    data: { total: number; pending: number; contacted: number; approved: number; rejected: number };
  }>('/admin/pickup-applications/stats');
}

export async function updatePickupApplication(id: string, data: { status: string; adminNote?: string }) {
  return adminRequest<any>(`/admin/pickup-applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePickupApplication(id: string) {
  return adminRequest<any>(`/admin/pickup-applications/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// Lucky Wheel (Omad g'ildiragi)
// ============================================
export async function fetchLuckyWheelPrizes() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/lucky-wheel');
  return res.data;
}

export async function createLuckyWheelPrize(data: any) {
  return adminRequest('/admin/lucky-wheel', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLuckyWheelPrize(id: string, data: any) {
  return adminRequest(`/admin/lucky-wheel/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLuckyWheelPrize(id: string) {
  return adminRequest(`/admin/lucky-wheel/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchLuckyWheelSpins(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const qs = searchParams.toString();
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/lucky-wheel/spins${qs ? `?${qs}` : ''}`);
  return res.data;
}

// ============================================
// REFERRAL ADMIN
// ============================================

export async function fetchReferrals(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  const qs = searchParams.toString();
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/referrals${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function updateReferralSettings(data: { bonusAmount?: number }) {
  const res = await adminRequest<{ success: boolean }>('/admin/referral-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res;
}

export async function updateReferral(id: string, data: { referrerPaid?: boolean; referredPaid?: boolean; bonusAmount?: number }) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/referrals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

// ============================================
// Category Commissions (COMPETE-003)
// ============================================
export async function fetchCategoryCommissions() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/category-commissions');
  return res.data;
}

export async function updateCategoryCommission(categoryId: string, rate: number) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/category-commissions/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify({ rate }),
  });
  return res.data;
}

export async function deleteCategoryCommission(categoryId: string) {
  return adminRequest(`/admin/category-commissions/${categoryId}`, { method: 'DELETE' });
}

// ============================================
// Promotions (COMPETE-004)
// ============================================
export async function fetchPromotions(params?: { status?: string; type?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/promotions?${query}`);
  return res.data;
}

export async function fetchPromotionDetail(id: string) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/promotions/${id}`);
  return res.data;
}

export async function createPromotion(data: any) {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/promotions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updatePromotion(id: string, data: any) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updatePromotionStatus(id: string, status: string) {
  return adminRequest(`/admin/promotions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deletePromotion(id: string) {
  return adminRequest(`/admin/promotions/${id}`, { method: 'DELETE' });
}

// ============================================
// Penalties (COMPETE-009)
// ============================================
export async function fetchPenalties(params?: { status?: string; shopId?: string; type?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.shopId) query.set('shopId', params.shopId);
  if (params?.type) query.set('type', params.type);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/penalties?${query}`);
  return res.data;
}

export async function createPenalty(data: { shopId: string; orderId?: string; type: string; amount: number; reason: string; description?: string }) {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/penalties', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updatePenaltyStatus(id: string, status: string) {
  return adminRequest(`/admin/penalties/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ============================================
// Moderation Queue (COMPETE-010)
// ============================================
export async function fetchModerationQueue(params?: { status?: string; search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/moderation-queue?${query}`);
  return res.data;
}

// ============================================
// Product Boosts (COMPETE-002)
// ============================================
export async function fetchAdminBoosts(params?: { status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/boosts?${query}`);
  return res.data;
}

export async function approveBoost(id: string) {
  return adminRequest(`/admin/boosts/${id}/approve`, { method: 'PATCH' });
}

export async function rejectBoost(id: string) {
  return adminRequest(`/admin/boosts/${id}/reject`, { method: 'PATCH' });
}

// ============================================
// Admin Roles / RBAC (SECURE-002)
// ============================================
export async function fetchAdminRoles() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/roles');
  return res.data;
}

export async function updateAdminRole(userId: string, data: { level: string; permissions?: string[] }) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/roles/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteAdminRole(userId: string) {
  return adminRequest(`/admin/roles/${userId}`, { method: 'DELETE' });
}

// ============================================
// ADVANCED-003: Extended Analytics
// ============================================
export async function fetchHeatmap(period: string = 'month') {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/analytics/heatmap?period=${period}`);
  return res.data;
}

export async function fetchFunnel(period: string = 'month') {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/analytics/funnel?period=${period}`);
  return res.data;
}

export async function fetchCohort() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/analytics/cohort');
  return res.data;
}

export async function fetchABTests() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/ab-tests');
  return res.data;
}

export async function createABTest(data: any) {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/ab-tests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateABTest(id: string, data: any) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/ab-tests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

// ============================================
// ADVANCED-004: Loyalty Management
// ============================================
export async function fetchLoyaltyAccounts(params?: { tier?: string; search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.tier) query.set('tier', params.tier);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const res = await adminRequest<{ success: boolean; data: any; meta: any }>(`/admin/loyalty/accounts?${query}`);
  return res;
}

export async function adjustLoyaltyPoints(data: { userId: string; points: number; description: string }) {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/loyalty/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function fetchLoyaltyStats() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/loyalty/stats');
  return res.data;
}

// ============================================
// ADVANCED-007: API Marketplace
// ============================================
export async function fetchApiKeys() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/api-keys');
  return res.data;
}

export async function createApiKey(data: { userId: string; name: string; permissions: string[]; rateLimit?: number }) {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/api-keys', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteApiKey(id: string) {
  return adminRequest(`/admin/api-keys/${id}`, { method: 'DELETE' });
}

export async function createWebhook(data: { apiKeyId: string; url: string; events: string[] }) {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/webhooks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteWebhook(id: string) {
  return adminRequest(`/admin/webhooks/${id}`, { method: 'DELETE' });
}

// ============================================
// ADVANCED-008: FAQ Management
// ============================================
export async function fetchFaqEntries() {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/faq');
  return res.data;
}

export async function createFaqEntry(data: { question: string; answer: string; keywords?: string[]; category?: string }) {
  const res = await adminRequest<{ success: boolean; data: any }>('/admin/faq', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateFaqEntry(id: string, data: any) {
  const res = await adminRequest<{ success: boolean; data: any }>(`/admin/faq/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteFaqEntry(id: string) {
  return adminRequest(`/admin/faq/${id}`, { method: 'DELETE' });
}

// ============================================
// Reviews Moderation
// ============================================
export async function fetchProductReviews(params?: { page?: number; rating?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.rating) query.set('rating', String(params.rating));
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  const res = await adminRequest<{ success: boolean; data: any[]; meta: any }>(`/admin/reviews/products${qs ? `?${qs}` : ''}`);
  return res;
}

export async function fetchShopReviews(params?: { page?: number; rating?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.rating) query.set('rating', String(params.rating));
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  const res = await adminRequest<{ success: boolean; data: any[]; meta: any }>(`/admin/reviews/shops${qs ? `?${qs}` : ''}`);
  return res;
}

export async function deleteProductReview(id: string) {
  return adminRequest(`/admin/reviews/products/${id}`, { method: 'DELETE' });
}

export async function deleteShopReview(id: string) {
  return adminRequest(`/admin/reviews/shops/${id}`, { method: 'DELETE' });
}

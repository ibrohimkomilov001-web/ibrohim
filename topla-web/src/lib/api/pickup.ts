// ============================================
// Pickup Point Staff API Client — base-client factory orqali
// ============================================

import { createRequest, createTokenHelpers, withCsrfHeaders } from './base-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return API_BASE_URL;
}

export const API_BASE = getApiBase();

// ============================================
// Public: Pickup point partner application
// ============================================
export async function submitPickupApplication(data: {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  areaSize?: number;
  note?: string;
}): Promise<{ id: string }> {
  const url = `${API_BASE}/pickup-points/apply`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: withCsrfHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
      credentials: 'include',
    });
  } catch {
    throw new Error('Serverga ulanib bo\'lmadi');
  }

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || `Xatolik: ${response.status}`);
  }
  return json.data;
}

// Token helpers — base-client factory orqali
const tokenHelpers = createTokenHelpers('pickup');

export function setPickupToken(_token: string): void {
  tokenHelpers.setToken(_token);
}

export function removePickupToken(): void {
  tokenHelpers.removeToken();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pickup_point_name');
  }
}

export function isPickupAuthenticated(): boolean {
  return tokenHelpers.isAuthenticated();
}

export function getPickupPointName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('pickup_point_name') || 'Topshirish punkti';
}

// Request function — base-client factory orqali
const pickupRequest = createRequest({
  tokenKey: 'pickup',
  loginRedirect: '/pickup/login',
  useRelativeUrl: true,
});

// ============================================
// Auth
// ============================================
export async function pickupLogin(loginCode: string, pinCode: string) {
  const res = await pickupRequest<{ token: string; pickupPoint: { id: string; name: string; address: string } }>(
    '/pickup/login',
    {
      method: 'POST',
      body: JSON.stringify({ loginCode, pinCode }),
    }
  );

  setPickupToken(res.token);
  if (typeof window !== 'undefined' && res.pickupPoint) {
    localStorage.setItem('pickup_point_name', res.pickupPoint.name);
  }
  return res;
}

// ============================================
// Orders at this pickup point
// ============================================
export async function getPickupOrders(params?: { status?: string; date?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.date) searchParams.set('date', params.date);
  const qs = searchParams.toString();
  return pickupRequest<any[]>(`/pickup/orders${qs ? `?${qs}` : ''}`);
}

// ============================================
// Verify order (QR code or manual code)
// ============================================
export async function verifyPickupOrder(params: { pickupToken?: string; pickupCode?: string }) {
  return pickupRequest<{ orderId: string; orderNumber: number; customerName: string; customerPhone: string; items: any[]; total: number }>('/pickup/verify', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ============================================
// Stats for this pickup point
// ============================================
export async function getPickupStats() {
  return pickupRequest<{
    todayDelivered: number;
    todayWaiting: number;
    totalDelivered: number;
    totalOrders: number;
  }>('/pickup/stats');
}

// ============================================
// Change PIN
// ============================================
export async function changePickupPin(currentPin: string, newPin: string) {
  return pickupRequest<{ message: string }>('/pickup/change-pin', {
    method: 'POST',
    body: JSON.stringify({ currentPin, newPin }),
  });
}

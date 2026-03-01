// ============================================
// Pickup Point Staff API Client
// ============================================

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
}

export const API_BASE = getApiBase();

function getPickupToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pickup_token');
}

export function setPickupToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pickup_token', token);
}

export function removePickupToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pickup_token');
  localStorage.removeItem('pickup_point_name');
}

export function isPickupAuthenticated(): boolean {
  return !!getPickupToken();
}

export function getPickupPointName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('pickup_point_name') || 'Topshirish punkti';
}

async function pickupRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getPickupToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
      removePickupToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/pickup/login';
      }
    }

    throw new Error(errorData?.message || `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) return {} as T;
  const json = JSON.parse(text);
  // Backend wraps responses in { success, data } format — unwrap it
  if (json.data !== undefined) return json.data as T;
  return json as T;
}

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

/**
 * User Auth API — OTP-based authentication for shop customers
 * base-client factory orqali yaratilgan
 */

import { createRequest, createTokenHelpers } from './base-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ============ TYPES ============

export interface UserProfile {
  id: string;
  phone: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  language: string;
  status?: string;
  gender?: 'male' | 'female' | 'unspecified';
  birthDate?: string;
  region?: string;
  referralCode?: string;
  referralPoints?: number;
  addresses?: UserAddress[];
}

export interface UserAddress {
  id: string;
  label?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface UserDevice {
  id: string;
  platform: 'android' | 'ios' | 'web';
  deviceId?: string;
  deviceName?: string;
  browser?: string;
  ipAddress?: string;
  location?: string;
  lastActiveAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface OtpResponse {
  phone: string;
  channel: string;
  telegramAvailable: boolean;
}

// ============ TOKEN MANAGEMENT (base-client factory) ============

const tokenHelpers = createTokenHelpers('topla_user');

export function getUserToken(): string | null {
  return tokenHelpers.getToken();
}

/** Login muvaffaqiyatli — flag o'rnatish (tokenlar cookie da) */
export function setUserTokens(_access: string, _refresh: string): void {
  tokenHelpers.setToken(_access);
}

export function removeUserTokens(): void {
  tokenHelpers.removeToken();
}

/** Auth holatini tekshirish */
export function isUserAuthenticated(): boolean {
  return tokenHelpers.isAuthenticated();
}

// ============ REFRESH TOKEN LOGIC ============

async function tryRefreshToken(): Promise<boolean> {
  if (!isUserAuthenticated()) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    });

    if (!response.ok) return false;

    const json = await response.json();
    const data = json.data ?? json;
    if (data.accessToken) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ============ REQUEST (base-client factory + refresh) ============

const userRequest = createRequest({
  tokenKey: 'topla_user',
  loginRedirect: null, // user auth da redirect yo'q — app o'zi boshqaradi
  onUnauthorized: tryRefreshToken,
});

// ============ API ============

export const userAuthApi = {
  /** Send OTP via SMS or Telegram */
  sendOtp: (phone: string, channel: 'sms' | 'telegram' = 'sms') =>
    userRequest<OtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, channel }),
    }),

  /** Verify OTP and get tokens */
  verifyOtp: (phone: string, code: string) =>
    userRequest<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        code,
        fcmToken: `web_${Date.now()}`,
        platform: 'web',
      }),
    }),

  /** Get current user profile */
  getMe: () => userRequest<UserProfile>('/auth/me'),

  /** Update profile */
  updateProfile: (data: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    language?: string;
    gender?: 'male' | 'female' | 'unspecified';
    birthDate?: string;
    region?: string;
  }) =>
    userRequest<UserProfile>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Get user devices */
  getDevices: () => userRequest<UserDevice[]>('/auth/devices'),

  /** Delete a device */
  deleteDevice: (id: string) =>
    userRequest<void>(`/auth/devices/${id}`, { method: 'DELETE' }),

  /** Terminate all other devices */
  terminateOtherDevices: () =>
    userRequest<void>('/auth/devices/terminate-others', { method: 'POST' }),

  /** Google Access Token orqali kirish */
  loginWithGoogle: (googleAccessToken: string) =>
    userRequest<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        googleAccessToken,
        platform: 'web',
        fcmToken: `web_${Date.now()}`,
      }),
    }),

  /** Logout */
  logout: async () => {
    try {
      await userRequest<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch { /* ignore */ }
    removeUserTokens();
  },

  /** Get my product reviews */
  getMyReviews: (page = 1) =>
    userRequest<any>(`/my/reviews?page=${page}&limit=20`),

  /** Submit a product review */
  submitReview: (productId: string, data: { rating: number; comment?: string }) =>
    userRequest<any>(`/products/${encodeURIComponent(productId)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get my orders */
  getMyOrders: (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return userRequest<any>(`/orders${qs ? `?${qs}` : ''}`);
  },

  /** Get order details */
  getOrder: (id: string) =>
    userRequest<any>(`/orders/${encodeURIComponent(id)}`),

  /** Cancel order */
  cancelOrder: (id: string, reason?: string) =>
    userRequest<any>(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  /** Get my addresses */
  getAddresses: () =>
    userRequest<any>(`/addresses`),

  /** Create address */
  createAddress: (data: {
    name: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
    street?: string;
    building?: string;
    apartment?: string;
    entrance?: string;
    floor?: string;
    comment?: string;
    isDefault?: boolean;
  }) =>
    userRequest<any>(`/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Update address */
  updateAddress: (id: string, data: Record<string, any>) =>
    userRequest<any>(`/addresses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Delete address */
  deleteAddress: (id: string) =>
    userRequest<any>(`/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  /** Passkey login — 1-qadam: options olish */
  passkeyLoginBegin: () =>
    userRequest<{ options: any; sessionId: string }>('/auth/passkey/login/begin', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  /** Passkey login — 2-qadam: tekshirish */
  passkeyLoginVerify: (sessionId: string, credential: any) =>
    userRequest<AuthResponse>('/auth/passkey/login/verify', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        credential,
        platform: 'web',
        fcmToken: `web_${Date.now()}`,
      }),
    }),
};

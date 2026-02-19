/**
 * User Auth API — OTP-based authentication for shop customers
 * Separate from vendor auth (which uses email+password)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ============ TYPES ============

export interface UserProfile {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  language: string;
  status?: string;
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

// ============ TOKEN MANAGEMENT ============

const TOKEN_KEY = 'topla_user_token';
const REFRESH_KEY = 'topla_user_refresh';

export function getUserToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setUserTokens(access: string, refresh: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function removeUserTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

// ============ FETCH HELPER ============

async function userRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getUserToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getUserToken()}`;
      const retryResponse = await fetch(url, { ...options, headers });
      if (retryResponse.ok) {
        const json = await retryResponse.json();
        return (json.data ?? json) as T;
      }
    }
    removeUserTokens();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      msg = err.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const text = await response.text();
  if (!text) return {} as T;
  const json = JSON.parse(text);
  return (json.data ?? json) as T;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const json = await response.json();
    const data = json.data ?? json;
    if (data.accessToken && data.refreshToken) {
      setUserTokens(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

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
  updateProfile: (data: { fullName?: string; email?: string; language?: string }) =>
    userRequest<UserProfile>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Get user devices */
  getDevices: () => userRequest<UserDevice[]>('/auth/devices'),

  /** Delete a device */
  deleteDevice: (id: string) =>
    userRequest<void>(`/auth/devices/${id}`, { method: 'DELETE' }),

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
};

/**
 * Shared base API client factory
 * Eliminates duplicated fetch logic across admin, pickup, and user-auth clients.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * CSRF cookie ni o'qish (non-httpOnly — JS o'qiy oladi).
 * Backend "Double Submit Cookie" pattern ishlatadi.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)topla_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * CSRF va Content-Type header larni qo'shish
 */
export function withCsrfHeaders(headers: Record<string, string>): Record<string, string> {
  const csrf = getCsrfToken();
  if (csrf) {
    headers['x-csrf-token'] = csrf;
  }
  return headers;
}

export class ApiRequestError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

export interface ClientConfig {
  /** localStorage key for the auth token */
  tokenKey: string;
  /** Where to redirect on 401 (e.g. '/admin/login'). Null to skip redirect. */
  loginRedirect: string | null;
  /** Base URL override. Defaults to NEXT_PUBLIC_API_URL. */
  baseUrl?: string;
  /** Whether to use relative URL on browser (for subdomain proxy). */
  useRelativeUrl?: boolean;
  /** Custom 401 handler (e.g. refresh token). Return true if handled. */
  onUnauthorized?: () => Promise<boolean>;
  /** Auto-unwrap { success, data } response wrapper. Default: true */
  autoUnwrap?: boolean;
}

function resolveBaseUrl(config: ClientConfig): string {
  if (config.useRelativeUrl && typeof window !== 'undefined') {
    return '/api/v1';
  }
  return config.baseUrl || API_BASE_URL;
}

/**
 * Token helpers — tokenlar httpOnly cookie da saqlanadi (XSS himoyasi).
 * localStorage da faqat auth flag saqlanadi (token emas!).
 */
export function createTokenHelpers(tokenKey: string) {
  const flagKey = `${tokenKey}_auth`;
  return {
    /** Token endi httpOnly cookie da — JS dan o'qib bo'lmaydi */
    getToken(): string | null {
      return null;
    },
    /** Login muvaffaqiyatli — auth flag ni o'rnatish */
    setToken(_token: string): void {
      if (typeof window === 'undefined') return;
      localStorage.setItem(flagKey, '1');
    },
    /** Logout — auth flag ni o'chirish */
    removeToken(): void {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(flagKey);
    },
    /** Auth holatini tekshirish (flag asosida) */
    isAuthenticated(): boolean {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem(flagKey) === '1';
    },
  };
}

/**
 * Creates a typed request function with shared auth, error handling, and response unwrapping.
 */
export function createRequest(config: ClientConfig) {
  const { getToken, removeToken } = createTokenHelpers(config.tokenKey);
  const base = resolveBaseUrl(config);

  return async function request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = withCsrfHeaders({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    });

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers, credentials: 'include' });
    } catch {
      throw new ApiRequestError('Serverga ulanib bo\'lmadi', 0);
    }

    if (response.status === 401) {
      // Try custom handler (e.g. refresh token)
      if (config.onUnauthorized) {
        const handled = await config.onUnauthorized();
        if (handled) {
          // Retry with new token
          const newToken = getToken();
          if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, { ...options, headers, credentials: 'include' });
          if (retryResponse.ok) {
            const json = await retryResponse.json();
            return (json.data ?? json) as T;
          }
        }
      }

      removeToken();
      if (config.loginRedirect && typeof window !== 'undefined') {
        window.location.href = config.loginRedirect;
      }
      throw new ApiRequestError('Unauthorized', 401);
    }

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch { /* ignore */ }

      throw new ApiRequestError(
        errorData?.message || `HTTP ${response.status}`,
        response.status,
        errorData,
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    const json = JSON.parse(text);

    // Backend wraps responses: { success, data } — auto-unwrap (default)
    if (config.autoUnwrap !== false && json && typeof json === 'object' && 'data' in json) {
      return json.data as T;
    }

    return json as T;
  };
}

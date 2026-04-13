/**
 * Vendor API Client — base-client factory orqali yaratilgan
 */
import { createRequest, createTokenHelpers, ApiRequestError } from './base-client';

const tokenHelpers = createTokenHelpers('vendor');

const request = createRequest({
  tokenKey: 'vendor',
  loginRedirect: '/vendor/login',
  useRelativeUrl: true,
});

// Backward-compat alias
const ApiClientError = ApiRequestError;

const { getToken, setToken, removeToken } = tokenHelpers;
const isVendorAuthenticated = tokenHelpers.isAuthenticated;

const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),
};

export { getToken, setToken, removeToken, isVendorAuthenticated, ApiClientError };
export { api };
export default api;

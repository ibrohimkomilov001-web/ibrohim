/**
 * API base-client unit testlari
 * Testlar: getCsrfToken, withCsrfHeaders, ApiRequestError, createTokenHelpers, createRequest
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCsrfToken,
  withCsrfHeaders,
  ApiRequestError,
  createTokenHelpers,
  createRequest,
} from '@/lib/api/base-client';

// ============================================
// getCsrfToken
// ============================================
describe('getCsrfToken()', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(document, 'cookie');

  afterEach(() => {
    // Cookie ni asl holatiga qaytarish
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    }
  });

  it('topla_csrf cookie ni o\'qishi kerak', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'other=abc; topla_csrf=test-csrf-token-123; session=xyz',
      writable: true,
      configurable: true,
    });

    expect(getCsrfToken()).toBe('test-csrf-token-123');
  });

  it('cookie bo\'lmaganda null qaytarishi kerak', () => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });

    expect(getCsrfToken()).toBeNull();
  });

  it('boshqa cookie lar orasida to\'g\'ri topishi kerak', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'topla_at=access; topla_csrf=my-token; topla_rt=refresh',
      writable: true,
      configurable: true,
    });

    expect(getCsrfToken()).toBe('my-token');
  });
});

// ============================================
// withCsrfHeaders
// ============================================
describe('withCsrfHeaders()', () => {
  it('CSRF token mavjud bo\'lganda x-csrf-token header qo\'shishi kerak', () => {
    // csrf cookie ni o'rnatish
    Object.defineProperty(document, 'cookie', {
      value: 'topla_csrf=csrf-token-456',
      writable: true,
      configurable: true,
    });

    const headers = withCsrfHeaders({ 'Content-Type': 'application/json' });

    expect(headers['x-csrf-token']).toBe('csrf-token-456');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('CSRF cookie bo\'lmaganda header qo\'shmasligi kerak', () => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });

    const headers = withCsrfHeaders({ 'Content-Type': 'application/json' });

    expect(headers['x-csrf-token']).toBeUndefined();
  });
});

// ============================================
// ApiRequestError
// ============================================
describe('ApiRequestError', () => {
  it('to\'g\'ri xususiyatlar bilan yaratilishi kerak', () => {
    const error = new ApiRequestError('Not Found', 404, { detail: 'topilmadi' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ detail: 'topilmadi' });
    expect(error.name).toBe('ApiRequestError');
  });

  it('data bo\'lmasa undefined bo\'lishi kerak', () => {
    const error = new ApiRequestError('Server Error', 500);

    expect(error.status).toBe(500);
    expect(error.data).toBeUndefined();
  });
});

// ============================================
// createTokenHelpers — httpOnly cookie autentifikatsiya
// ============================================
describe('createTokenHelpers()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getToken har doim null qaytarishi kerak (httpOnly cookie)', () => {
    const helpers = createTokenHelpers('vendor');

    // setToken chaqirilgan bo'lsa ham, getToken null qaytaradi
    helpers.setToken('some-token');
    expect(helpers.getToken()).toBeNull();
  });

  it('setToken auth flag ni localStorage ga saqlashi kerak', () => {
    const helpers = createTokenHelpers('vendor');
    helpers.setToken('token-123');

    expect(localStorage.getItem('vendor_auth')).toBe('1');
  });

  it('removeToken auth flag ni o\'chirishi kerak', () => {
    const helpers = createTokenHelpers('vendor');
    helpers.setToken('token-123');
    helpers.removeToken();

    expect(localStorage.getItem('vendor_auth')).toBeNull();
  });

  it('isAuthenticated flag asosida tekshirishi kerak', () => {
    const helpers = createTokenHelpers('admin');

    expect(helpers.isAuthenticated()).toBe(false);

    helpers.setToken('token');
    expect(helpers.isAuthenticated()).toBe(true);

    helpers.removeToken();
    expect(helpers.isAuthenticated()).toBe(false);
  });
});

// ============================================
// createRequest — fetch wrapper
// ============================================
describe('createRequest()', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('muvaffaqiyatli so\'rovda data ni qaytarishi kerak', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ success: true, data: { id: 1, name: 'Test' } })),
    });

    const request = createRequest({
      tokenKey: 'test',
      loginRedirect: null,
      baseUrl: 'http://localhost:3001/api/v1',
    });

    const result = await request<{ id: number; name: string }>('/health');

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('credentials: include ishlatishi kerak (cookie uchun)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: {} })),
    });

    const request = createRequest({
      tokenKey: 'test',
      loginRedirect: null,
      baseUrl: 'http://localhost:3001/api/v1',
    });

    await request('/test');

    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[1].credentials).toBe('include');
  });

  it('xato javobda ApiRequestError tashlashi kerak', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Topilmadi' }),
    });

    const request = createRequest({
      tokenKey: 'test',
      loginRedirect: null,
      baseUrl: 'http://localhost:3001/api/v1',
    });

    try {
      await request('/not-found');
      expect.fail('Xato tashlash kerak edi');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiRequestError);
      expect((err as ApiRequestError).status).toBe(404);
      expect((err as ApiRequestError).message).toBe('Topilmadi');
    }
  });

  it('tarmoq xatosida to\'g\'ri xato tashlashi kerak', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const request = createRequest({
      tokenKey: 'test',
      loginRedirect: null,
      baseUrl: 'http://localhost:3001/api/v1',
    });

    await expect(request('/test')).rejects.toThrow('Serverga ulanib');
  });

  it('bo\'sh javobda bo\'sh obyekt qaytarishi kerak', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    });

    const request = createRequest({
      tokenKey: 'test',
      loginRedirect: null,
      baseUrl: 'http://localhost:3001/api/v1',
    });

    const result = await request('/empty');
    expect(result).toEqual({});
  });

  it('CSRF header ni so\'rov bilan yuborishi kerak', async () => {
    Object.defineProperty(document, 'cookie', {
      value: 'topla_csrf=csrf-secret-abc',
      writable: true,
      configurable: true,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: 'ok' })),
    });

    const request = createRequest({
      tokenKey: 'test',
      loginRedirect: null,
      baseUrl: 'http://localhost:3001/api/v1',
    });

    await request('/test');

    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[1].headers['x-csrf-token']).toBe('csrf-secret-abc');
  });
});

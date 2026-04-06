import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { env } from '../config/env.js';

// ============================================
// CSRF Himoyasi — Double Submit Cookie Pattern
// ============================================
//
// httpOnly cookie lar ishlatilganda, CSRF hujumi xavfi bor.
// Himoya usuli:
//   1. Backend = `topla_csrf` cookie (non-httpOnly, JS o'qiy oladi)
//   2. Frontend = X-CSRF-Token header ga shu qiymatni qo'yadi
//   3. Backend = cookie va header bir xilligini tekshiradi
//
// Mobil ilovalar (Authorization header ishlatadi) CSRF dan himoyalanmagan,
// chunki cookie ishlatmaydi — shuning uchun faqat cookie-auth uchun tekshiramiz.
// ============================================

const IS_PRODUCTION = env.NODE_ENV === 'production';
const CSRF_COOKIE_NAME = 'topla_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

// State-changing methods (GET/HEAD/OPTIONS xavfsiz)
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// CSRF tekshiruv kerak emas:
// - Login/register (cookie hali yo'q)
// - Public endpointlar
// - Webhook lar (tashqi servislardan keladi)
const EXEMPT_PREFIXES = [
  '/api/v1/auth/send-otp',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/login',
  '/api/v1/auth/admin/login',
  '/api/v1/auth/admin/refresh',
  '/api/v1/auth/admin/logout',
  '/api/v1/auth/vendor/login',
  '/api/v1/auth/vendor/register',
  '/api/v1/pickup/login',
  '/api/v1/pickup-points/apply',
  '/api/v1/payments/payme/endpoint',
  '/api/v1/payments/click/prepare',
  '/api/v1/payments/click/complete',
  '/api/v1/payments/aliance/callback',
  '/api/v1/payments/octobank/callback',
];

function isExempt(url: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/**
 * Har bir so'rovda CSRF cookie ni o'rnatish (agar yo'q bo'lsa).
 * Non-httpOnly — JS o'qiy oladi.
 */
export function ensureCsrfCookie(request: FastifyRequest, reply: FastifyReply): void {
  const existing = request.cookies?.[CSRF_COOKIE_NAME];
  if (existing) return;

  const csrfToken = crypto.randomBytes(32).toString('hex');
  reply.setCookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // JS o'qishi kerak!
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    path: '/',
    maxAge: 86400 * 1000, // 1 kun (ms)
  });
}

/**
 * State-changing so'rovlar uchun CSRF tekshirish.
 * Cookie va X-CSRF-Token header bir xil bo'lishi kerak.
 *
 * Faqat cookie-auth ishlatgan so'rovlar uchun:
 *   - Agar Authorization header bor bo'lsa → mobil ilova → CSRF kerak emas
 *   - Agar cookie auth bo'lsa → web → CSRF majburiy
 */
export async function validateCsrf(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // GET/HEAD/OPTIONS — xavfsiz
  if (!UNSAFE_METHODS.has(request.method)) return;

  // Exempt routes (login, webhooks, etc.)
  if (isExempt(request.url)) return;

  // Agar Authorization header bor — mobil ilova, CSRF kerak emas
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return;

  // Cookie auth ishlatilayotgan bo'lsa — CSRF tekshirish
  const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];
  if (!cookieToken) {
    // Cookie yo'q — yangi session, hali auth qilinmagan
    return;
  }

  const headerToken = request.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!headerToken || headerToken !== cookieToken) {
    reply.status(403).send({
      success: false,
      message: 'CSRF token yaroqsiz. Sahifani yangilab qayta urinib ko\'ring.',
      error: 'CSRF_INVALID',
    });
    return;
  }
}

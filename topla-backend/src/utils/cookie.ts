import { FastifyReply } from 'fastify';
import { env } from '../config/env.js';

// ============================================
// httpOnly Cookie Helpers
// XSS himoyasi — tokenlar JavaScript orqali o'qib bo'lmaydi
// ============================================

const IS_PRODUCTION = env.NODE_ENV === 'production';

// Cookie opsiyalari (har ikki token uchun umumiy)
const BASE_COOKIE_OPTIONS = {
  httpOnly: true,                             // JS orqali o'qib bo'lmaydi (XSS himoyasi)
  secure: IS_PRODUCTION,                      // HTTPS faqat production da
  sameSite: IS_PRODUCTION ? 'none' as const : 'lax' as const, // Cross-origin uchun 'none' (prod), dev uchun 'lax'
  path: '/',
};

// Access token TTL — env dan olinadi (default 1d = 86400s)
function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 86400; // default 1 kun
  const num = parseInt(match[1]!, 10);
  switch (match[2]) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: return 86400;
  }
}

const ACCESS_MAX_AGE = parseExpiresIn(env.JWT_EXPIRES_IN) * 1000;       // ms
const REFRESH_MAX_AGE = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN) * 1000; // ms

/**
 * Login/register javobida access va refresh tokenlarni httpOnly cookie qilib o'rnatish.
 * JSON body da ham qaytariladi (mobil ilova uchun backward compatibility).
 */
export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  reply.setCookie('topla_at', accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
  });

  reply.setCookie('topla_rt', refreshToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
}

/**
 * Faqat access token cookie ni yangilash (refresh paytida)
 */
export function setAccessCookie(
  reply: FastifyReply,
  accessToken: string,
): void {
  reply.setCookie('topla_at', accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
  });
}

/**
 * Logout — barcha auth cookie larni o'chirish
 */
export function clearAuthCookies(reply: FastifyReply): void {
  const clearOptions = {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
  };

  reply.setCookie('topla_at', '', clearOptions);
  reply.setCookie('topla_rt', '', clearOptions);
}

/**
 * Request dan token olish: avval cookie, keyin Authorization header.
 * Bu usul ham web (cookie), ham mobil (header) ni qo'llab-quvvatlaydi.
 */
export function extractToken(request: { headers: { authorization?: string }; cookies?: Record<string, string | undefined> }): string | null {
  // 1. Cookie dan (web uchun — xavfsizroq)
  const cookieToken = request.cookies?.['topla_at'];
  if (cookieToken) return cookieToken;

  // 2. Authorization header dan (mobil ilova uchun)
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Refresh token olish: avval cookie, keyin request body.
 */
export function extractRefreshToken(
  request: { cookies?: Record<string, string | undefined> },
  bodyRefreshToken?: string,
): string | null {
  // 1. Cookie dan
  const cookieRefresh = request.cookies?.['topla_rt'];
  if (cookieRefresh) return cookieRefresh;

  // 2. Body dan (mobil ilova uchun)
  if (bodyRefreshToken) return bodyRefreshToken;

  return null;
}

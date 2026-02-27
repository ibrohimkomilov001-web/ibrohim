import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { setWithExpiry, getValue } from '../config/redis.js';

export interface JwtPayload {
  userId: string;
  role: string;
  phone?: string;
  pickupPointId?: string;
  iat?: number;
  exp?: number;
}

// Refresh secret — must be independent from access token secret
const REFRESH_SECRET = env.JWT_REFRESH_SECRET || (() => {
  if (env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET muhitda majburiy (production). Alohida secret o\'rnating.');
  }
  // Development/test uchun auto-generate (production'da ishlamaydi)
  console.warn('⚠️  JWT_REFRESH_SECRET o\'rnatilmagan — development uchun auto-generated secret ishlatilmoqda');
  return require('crypto').randomBytes(32).toString('hex');
})();

export function generateToken(payload: JwtPayload): string {
  const { iat, exp, ...cleanPayload } = payload;
  return jwt.sign(cleanPayload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function generateRefreshToken(payload: JwtPayload): string {
  const { iat, exp, ...cleanPayload } = payload;
  return jwt.sign(cleanPayload, REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

// ============================================
// Token Blacklist (Redis-backed)
// ============================================

/**
 * Token ni blacklist ga qo'shish (logout, token rotation)
 * TTL = tokenning qolgan amal qilish muddati
 */
export async function blacklistToken(token: string): Promise<void> {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded?.exp) return;

    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl > 0) {
      await setWithExpiry(`blacklist:${token}`, '1', ttl);
    }
  } catch {
    // Token decode xatosi — e'tiborsiz
  }
}

/**
 * Token blacklist da borligini tekshirish
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const val = await getValue(`blacklist:${token}`);
  return val !== null;
}

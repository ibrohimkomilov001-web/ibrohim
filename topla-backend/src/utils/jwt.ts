import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { setWithExpiry, getValue } from '../config/redis.js';

export interface JwtPayload {
  userId: string;
  role: string;
  phone: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: JwtPayload): string {
  const { iat, exp, ...cleanPayload } = payload;
  return jwt.sign(cleanPayload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function generateRefreshToken(payload: JwtPayload): string {
  const { iat, exp, ...cleanPayload } = payload;
  const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET + '-refresh';
  return jwt.sign(cleanPayload, refreshSecret, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET + '-refresh';
  return jwt.verify(token, refreshSecret) as JwtPayload;
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

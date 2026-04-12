import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken, isTokenBlacklisted, JwtPayload } from '../utils/jwt.js';
import { extractToken } from '../utils/cookie.js';
import { prisma } from '../config/database.js';
import { checkRateLimit } from '../config/redis.js';
import { AppError } from './error.js';

export interface ApiKeyContext {
  keyId: string;
  userId: string;
  permissions: string[];
  rateLimit: number;
}

// Extend FastifyRequest to include user and admin permissions
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
    adminPermissions?: string[];
    adminLevel?: string;
    apiKeyContext?: ApiKeyContext;
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Cookie dan yoki Authorization header dan token olish
  const token = extractToken(request);

  if (!token) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token topilmadi',
    });
  }

  try {
    // Blacklist tekshirish
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token bekor qilingan. Qayta kiring.',
      });
    }

    const payload = verifyToken(token);
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token yaroqsiz yoki muddati tugagan',
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Sizda bu amal uchun ruxsat yo\'q',
      });
    }
  };
}

/**
 * Permission-based authorization middleware (RBAC)
 * Checks granular permissions from AdminRole model.
 * super_admin level always passes. Other levels need explicit permission.
 * Usage: requirePermission('products.manage') or requirePermission('orders.view', 'orders.manage')
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (request.user.role !== 'admin') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Faqat adminlar uchun',
      });
    }

    // Fetch admin role if not already loaded
    if (!request.adminLevel) {
      const adminRole = await prisma.adminRole.findUnique({
        where: { userId: request.user.userId },
      });

      if (adminRole) {
        request.adminLevel = adminRole.level;
        request.adminPermissions = adminRole.permissions;
      } else {
        // No explicit AdminRole — treat as super_admin for backward compatibility
        // (existing admins without AdminRole entry should retain full access)
        request.adminLevel = 'super_admin';
        request.adminPermissions = [];
      }
    }

    // super_admin has all permissions
    if (request.adminLevel === 'super_admin') {
      return;
    }

    // Check if user has ANY of the required permissions
    const hasPermission = requiredPermissions.some(
      (perm) => request.adminPermissions?.includes(perm)
    );

    if (!hasPermission) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Sizda "${requiredPermissions.join('" yoki "')}" ruxsati yo'q`,
      });
    }
  };
}

/**
 * Vendor do'koni active ekanligini tekshirish middleware.
 * Pending/inactive/blocked do'konlar uchun yozish amallarini bloklaydi.
 * Faqat vendorAuth bilan birga ishlatiladi.
 */
export function requireActiveShop() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Admin har doim ruxsat oladi
    if (request.user.role === 'admin') return;

    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user.userId },
      select: { status: true },
    });

    if (!shop) {
      return reply.status(404).send({
        error: 'NotFound',
        message: "Do'kon topilmadi",
      });
    }

    if (shop.status === 'blocked') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: "Do'koningiz bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling.",
      });
    }

    if (shop.status !== 'active') {
      return reply.status(403).send({
        error: 'ShopNotActive',
        message: "Do'koningiz hali tasdiqlanmagan. Admin tekshiruvini kuting.",
        shopStatus: shop.status,
      });
    }
  };
}

/**
 * API Key authentication middleware for partner/external integrations.
 * Reads X-API-Key header (tpk_... prefix), validates against DB, enforces rate limits.
 * Attaches apiKeyContext to the request on success.
 */
export async function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string | undefined;

  if (!apiKey || !apiKey.startsWith('tpk_')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'X-API-Key header majburiy (tpk_ prefiksi bilan)',
    });
  }

  const record = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    select: { id: true, userId: true, permissions: true, rateLimit: true, isActive: true },
  });

  if (!record || !record.isActive) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API kalit topilmadi yoki nofaol',
    });
  }

  // Rate limit: per-key sliding window (hourly)
  const rateCheck = await checkRateLimit(`apikey:${record.id}`, record.rateLimit, 3600);
  if (!rateCheck.allowed) {
    return reply.status(429).send({
      error: 'TooManyRequests',
      message: `Rate limit oshib ketdi. ${rateCheck.retryAfter} soniyadan keyin urinib ko'ring`,
      retryAfter: rateCheck.retryAfter,
    });
  }

  // Update lastUsedAt (fire and forget)
  prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  request.apiKeyContext = {
    keyId: record.id,
    userId: record.userId,
    permissions: record.permissions,
    rateLimit: record.rateLimit,
  };
}

/**
 * Check that the API key has the required permission(s)
 */
export function requireApiPermission(...requiredPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const ctx = request.apiKeyContext;
    if (!ctx) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'API kalit talab qilinadi' });
    }
    const hasAll = requiredPermissions.every(p => ctx.permissions.includes(p));
    if (!hasAll) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `API kalitda "${requiredPermissions.join('" va "')}" ruxsati yo'q`,
      });
    }
  };
}

/**
 * Optional auth - doesn't fail if no token, but sets user if present
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return;

  try {
    const token = authHeader.substring(7);

    // Blacklist tekshirish (logout qilingan token bilan kirishni oldini olish)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return;

    request.user = verifyToken(token);
  } catch {
    // Token invalid — just skip, don't fail
  }
}

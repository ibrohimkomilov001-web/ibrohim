import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken, isTokenBlacklisted, JwtPayload } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { AppError } from './error.js';

// Extend FastifyRequest to include user and admin permissions
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
    adminPermissions?: string[];
    adminLevel?: string;
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token topilmadi',
    });
  }

  const token = authHeader.substring(7);

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

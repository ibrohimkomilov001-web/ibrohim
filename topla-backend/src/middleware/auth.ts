import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken, isTokenBlacklisted, JwtPayload } from '../utils/jwt.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
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

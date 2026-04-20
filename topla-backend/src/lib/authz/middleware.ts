/**
 * ============================================
 * RBAC v2 Middleware — requirePermissionV2
 * ============================================
 * Yangi policy engine asosida permission middleware.
 * Feature flag USE_NEW_AUTHZ=true bo'lsa ishlaydi; aks holda eski logika (shadow mode'da
 * ikkalasini taqqoslash mumkin).
 *
 * Foydalanish:
 *   preHandler: [authMiddleware, requirePermissionV2('products.moderate')]
 *   preHandler: [authMiddleware, requirePermissionV2('orders.view', { shopIdFrom: 'params.shopId' })]
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import {
  loadAuthzContext,
  can,
  ForbiddenError,
  type AuthzContext,
} from './policy.js';
import { isKnownPermission, type PermissionValue } from './permissions.js';

declare module 'fastify' {
  interface FastifyRequest {
    authzContext?: AuthzContext;
  }
}

/**
 * ENV flag: authz v2 global'ini yoqish.
 * Default — false (dual/shadow mode). Production'da bosqichma-bosqich yoqiladi.
 */
export function isAuthzV2Enabled(): boolean {
  // `env` modelida bo'lmasligi mumkin — process.env orqali o'qiymiz
  return process.env.USE_NEW_AUTHZ === 'true' || (env as any).USE_NEW_AUTHZ === true;
}

// ============================================
// Resource extractor helpers
// ============================================

export interface RequirePermissionOptsV2 {
  /**
   * Shop.id qayerdan olinsa: request.params.shopId yoki request.body.shopId.
   * Format: "params.key" yoki "body.key" yoki "query.key"
   */
  shopIdFrom?: string;
  /**
   * Organization.id qayerdan olinsa. Format xuddi shundek.
   */
  organizationIdFrom?: string;
}

function resolvePath(req: FastifyRequest, spec?: string): string | undefined {
  if (!spec) return undefined;
  const [src, key] = spec.split('.', 2);
  if (!key) return undefined;
  const bag =
    src === 'params' ? (req.params as Record<string, unknown>)
    : src === 'body' ? (req.body as Record<string, unknown>)
    : src === 'query' ? (req.query as Record<string, unknown>)
    : undefined;
  const val = bag?.[key];
  return typeof val === 'string' ? val : undefined;
}

// ============================================
// Middleware
// ============================================

/**
 * Yangi authz bilan permission tekshirish.
 * Agar ruxsat yo'q bo'lsa 403 qaytaradi.
 */
export function requirePermissionV2(
  permission: PermissionValue | string,
  opts: RequirePermissionOptsV2 = {},
) {
  if (!isKnownPermission(permission)) {
    throw new Error(`requirePermissionV2: noma'lum permission "${permission}"`);
  }

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Kontekstni yuklash (bir requestda bir marta)
    if (!request.authzContext) {
      request.authzContext = await loadAuthzContext(request.user.userId);
    }

    const shopId = resolvePath(request, opts.shopIdFrom);
    const organizationId = resolvePath(request, opts.organizationIdFrom);

    try {
      const ok = await can(request.authzContext, permission, { shopId, organizationId });
      if (!ok) {
        return reply.status(403).send({
          error: 'Forbidden',
          code: 'PERMISSION_DENIED',
          message: `"${permission}" uchun ruxsat yo'q`,
          permission,
        });
      }
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return reply.status(403).send({
          error: 'Forbidden',
          code: err.code,
          message: err.message,
          permission: err.permission,
        });
      }
      throw err;
    }
  };
}

/**
 * Shadow mode: eski va yangi logika natijalarini log qilib farq aniqlaydi.
 * Foydalanish: eski requirePermission() dan keyin chaqiriladi. Reply qaytarmaydi.
 */
export function shadowCheckPermission(
  permission: PermissionValue | string,
  opts: RequirePermissionOptsV2 = {},
) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) return;
    try {
      if (!request.authzContext) {
        request.authzContext = await loadAuthzContext(request.user.userId);
      }
      const shopId = resolvePath(request, opts.shopIdFrom);
      const organizationId = resolvePath(request, opts.organizationIdFrom);
      const v2Result = await can(request.authzContext, permission, { shopId, organizationId });

      // Eski logika natijasi: bu hook eski middleware o'tgandan keyin chaqiriladi,
      // demak eski logika ruxsat bergan. Farq bor bo'lsa log qilamiz.
      if (!v2Result) {
        request.log.warn(
          {
            authz: 'shadow-mismatch',
            permission,
            userId: request.user.userId,
            shopId,
            organizationId,
            oldResult: 'ALLOW',
            newResult: 'DENY',
          },
          '[AUTHZ-SHADOW] eski/yangi natija farqi',
        );
      }
    } catch (err) {
      request.log.warn({ err, permission }, '[AUTHZ-SHADOW] tekshiruv xatoligi');
    }
  };
}

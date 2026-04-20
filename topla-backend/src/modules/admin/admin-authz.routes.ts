/**
 * ============================================
 * Admin — RBAC v2 Management Routes
 * ============================================
 * Yangi Role/Membership modeliga asoslangan:
 *   GET    /admin/authz/roles              — tizim va custom rollari ro'yxati
 *   GET    /admin/authz/permissions        — barcha permissionlar katalogi
 *   GET    /admin/authz/memberships        — PLATFORM org uchun barcha membershiplar
 *   POST   /admin/authz/memberships        — yangi admin membership yaratish
 *   PUT    /admin/authz/memberships/:id    — rol o'zgartirish
 *   DELETE /admin/authz/memberships/:id    — bekor qilish (revoke)
 *
 * Barcha endpointlar `USE_NEW_AUTHZ` flagidan qat'i nazar ishlaydi — yangi sistemani
 * boshqarish uchun kerak.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { requirePermissionV2 } from '../../lib/authz/middleware.js';
import { invalidateAuthzContext } from '../../lib/authz/policy.js';
import { bumpTokenVersion } from '../../services/refresh-token.service.js';
import { PERMISSION_BITS, PERM } from '../../lib/authz/permissions.js';
import { ROLE_TEMPLATES } from '../../lib/authz/role-templates.js';
import { AppError } from '../../middleware/error.js';

export async function adminAuthzRoutes(app: FastifyInstance) {
  // ───────────────────────────────────────────
  // Permissions katalogi
  // ───────────────────────────────────────────
  app.get('/admin/authz/permissions', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermissionV2(PERM.USERS_ASSIGN_ROLE)],
  }, async (_request, reply) => {
    // Section bo'yicha guruhlash
    const bySection: Record<string, string[]> = {};
    for (const p of PERMISSION_BITS) {
      const section = p.split('.')[0] ?? 'other';
      (bySection[section] ||= []).push(p);
    }
    return reply.send({
      success: true,
      data: {
        all: [...PERMISSION_BITS],
        bySection,
        total: PERMISSION_BITS.length,
      },
    });
  });

  // ───────────────────────────────────────────
  // Rollar ro'yxati
  // ───────────────────────────────────────────
  app.get('/admin/authz/roles', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermissionV2(PERM.USERS_ASSIGN_ROLE)],
  }, async (request, reply) => {
    const { scope } = z.object({
      scope: z.enum(['PLATFORM', 'BUSINESS_GROUP', 'BUSINESS', 'SHOP', 'COURIER_COMPANY']).optional(),
    }).parse(request.query);

    const roles = await prisma.role.findMany({
      where: scope ? { scope } : undefined,
      orderBy: [{ scope: 'asc' }, { priority: 'desc' }],
      include: {
        _count: { select: { memberships: { where: { status: 'active' } } } },
      },
    });
    return reply.send({ success: true, data: roles });
  });

  // ───────────────────────────────────────────
  // PLATFORM membershiplari (adminlar ro'yxati)
  // ───────────────────────────────────────────
  app.get('/admin/authz/memberships', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermissionV2(PERM.USERS_ASSIGN_ROLE)],
  }, async (_request, reply) => {
    const platform = await prisma.organization.findFirst({ where: { type: 'PLATFORM' } });
    if (!platform) {
      throw new AppError('PLATFORM organizatsiyasi topilmadi. `db:seed:authz` ishlatilganmi?', 500);
    }
    const memberships = await prisma.membership.findMany({
      where: { organizationId: platform.id },
      include: {
        profile: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true } },
        role: { select: { id: true, code: true, name: true, priority: true, scope: true } },
      },
      orderBy: [{ status: 'asc' }, { acceptedAt: 'desc' }],
    });
    return reply.send({ success: true, data: { platformOrgId: platform.id, memberships } });
  });

  // ───────────────────────────────────────────
  // Yangi admin membership yaratish
  // ───────────────────────────────────────────
  app.post('/admin/authz/memberships', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermissionV2(PERM.USERS_ASSIGN_ROLE)],
  }, async (request, reply) => {
    const body = z.object({
      profileId: z.string().uuid(),
      roleCode: z.string().min(1),
      extraPermissions: z.array(z.string()).optional(),
    }).parse(request.body);

    const platform = await prisma.organization.findFirst({ where: { type: 'PLATFORM' } });
    if (!platform) throw new AppError('PLATFORM organizatsiyasi topilmadi', 500);

    const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
    if (!role) throw new AppError(`Rol topilmadi: ${body.roleCode}`, 400);
    if (role.scope !== 'PLATFORM') throw new AppError('Faqat PLATFORM rollari beriladi', 400);

    const profile = await prisma.profile.findUnique({ where: { id: body.profileId } });
    if (!profile) throw new AppError('Foydalanuvchi topilmadi', 404);

    const membership = await prisma.membership.upsert({
      where: {
        profileId_organizationId: { profileId: body.profileId, organizationId: platform.id },
      },
      create: {
        profileId: body.profileId,
        organizationId: platform.id,
        roleId: role.id,
        status: 'active',
        acceptedAt: new Date(),
        invitedBy: request.user!.userId,
        extraPermissions: body.extraPermissions ?? [],
      },
      update: {
        roleId: role.id,
        status: 'active',
        revokedAt: null,
        revokedReason: null,
        extraPermissions: body.extraPermissions ?? [],
      },
      include: {
        profile: { select: { id: true, fullName: true, email: true } },
        role: { select: { code: true, name: true } },
      },
    });

    await invalidateAuthzContext(body.profileId);
    await bumpTokenVersion(body.profileId);

    // Profile.role ni ham admin ga ko'taramiz (backward compat)
    if (profile.role !== 'admin') {
      await prisma.profile.update({ where: { id: body.profileId }, data: { role: 'admin' } });
    }

    return reply.send({ success: true, data: membership });
  });

  // ───────────────────────────────────────────
  // Rol o'zgartirish
  // ───────────────────────────────────────────
  app.put('/admin/authz/memberships/:id', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermissionV2(PERM.USERS_ASSIGN_ROLE)],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      roleCode: z.string().optional(),
      extraPermissions: z.array(z.string()).optional(),
      status: z.enum(['active', 'suspended']).optional(),
    }).parse(request.body);

    const existing = await prisma.membership.findUnique({
      where: { id },
      include: { role: true, organization: { select: { type: true } } },
    });
    if (!existing) throw new AppError('Membership topilmadi', 404);

    // O'z membership'ini super_admin dan boshqasiga o'zgartira olmasligi kerak
    if (existing.profileId === request.user!.userId && existing.role.code === 'admin_super') {
      if (body.roleCode && body.roleCode !== 'admin_super') {
        throw new AppError("O'z super_admin rolingizni o'zgartira olmaysiz", 400);
      }
    }

    let roleId = existing.roleId;
    if (body.roleCode && body.roleCode !== existing.role.code) {
      const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
      if (!role) throw new AppError(`Rol topilmadi: ${body.roleCode}`, 400);
      if (role.scope !== existing.organization.type) {
        throw new AppError('Rol scope organizatsiya tipiga mos emas', 400);
      }
      roleId = role.id;
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        roleId,
        extraPermissions: body.extraPermissions ?? existing.extraPermissions,
        status: body.status ?? existing.status,
      },
      include: {
        profile: { select: { id: true, fullName: true, email: true } },
        role: { select: { code: true, name: true } },
      },
    });

    await invalidateAuthzContext(existing.profileId);
    await bumpTokenVersion(existing.profileId);

    return reply.send({ success: true, data: updated });
  });

  // ───────────────────────────────────────────
  // Membership revoke
  // ───────────────────────────────────────────
  app.delete('/admin/authz/memberships/:id', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermissionV2(PERM.USERS_ASSIGN_ROLE)],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = z.object({ reason: z.string().optional() }).parse(request.body ?? {});

    const existing = await prisma.membership.findUnique({ where: { id }, include: { role: true } });
    if (!existing) throw new AppError('Membership topilmadi', 404);

    if (existing.profileId === request.user!.userId) {
      throw new AppError("O'z membership'ingizni o'chira olmaysiz", 400);
    }

    await prisma.membership.update({
      where: { id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedReason: reason ?? 'admin_action',
      },
    });

    await invalidateAuthzContext(existing.profileId);
    await bumpTokenVersion(existing.profileId);

    return reply.send({ success: true, message: 'Membership bekor qilindi' });
  });

  // ───────────────────────────────────────────
  // Rol shablonlari (compile-time, seed bilan bir xil)
  // ───────────────────────────────────────────
  app.get('/admin/authz/role-templates', {
    preHandler: [authMiddleware, requireRole('admin'), requirePermissionV2(PERM.USERS_ASSIGN_ROLE)],
  }, async (_request, reply) => {
    return reply.send({ success: true, data: ROLE_TEMPLATES });
  });
}

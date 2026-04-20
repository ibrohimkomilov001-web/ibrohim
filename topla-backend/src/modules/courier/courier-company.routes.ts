/**
 * ============================================
 * Courier Company — Staff & Fleet Routes
 * ============================================
 *
 *   GET    /courier-company                      — kompaniya ma'lumoti + memberships + fleet
 *   POST   /courier-company                      — kompaniya yaratish (foydalanuvchi courier_company_owner sifatida)
 *
 *   # Staff
 *   GET    /courier-company/roles                — COURIER_COMPANY scope rollari
 *   GET    /courier-company/staff                — xodimlar
 *   GET    /courier-company/staff/invites        — ochiq takliflar
 *   POST   /courier-company/staff/invites        — xodim taklif qilish
 *   DELETE /courier-company/staff/invites/:id    — taklifni bekor qilish
 *   POST   /courier-company/staff/invites/:token/accept — taklif qabul qilish
 *   PUT    /courier-company/staff/:id            — xodim rol/status
 *   DELETE /courier-company/staff/:id            — xodimni chiqarish
 *
 *   # Fleet (kuryerlar)
 *   GET    /courier-company/couriers             — kompaniyaga ulangan kuryerlar
 *   POST   /courier-company/couriers/:courierId/attach  — mavjud kuryerni kompaniyaga ulash
 *   DELETE /courier-company/couriers/:courierId/detach  — kompaniyadan chiqarish
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { invalidateAuthzContext } from '../../lib/authz/policy.js';
import { bumpTokenVersion } from '../../services/refresh-token.service.js';

// ============================================
// Helpers
// ============================================

/**
 * Joriy userning COURIER_COMPANY organization'ini topadi.
 * Foydalanuvchi ushbu kompaniyada active membership'ga ega bo'lishi kerak.
 */
async function resolveCourierCompany(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      profileId: userId,
      status: 'active',
      organization: { type: 'COURIER_COMPANY' },
    },
    include: {
      organization: true,
      role: { select: { code: true, priority: true } },
    },
  });
  if (!membership) {
    throw new AppError('Siz hech qanday kuryerlik kompaniyasida emassiz', 404);
  }
  return {
    organizationId: membership.organizationId,
    organization: membership.organization,
    myRole: membership.role,
  };
}

async function requireCanManageCompany(userId: string, organizationId: string): Promise<void> {
  const m = await prisma.membership.findUnique({
    where: { profileId_organizationId: { profileId: userId, organizationId } },
    include: { role: { select: { priority: true } } },
  });
  if (!m || m.status !== 'active') {
    throw new AppError('Faol membership yo\'q', 403);
  }
  // courier_company_owner (100), courier_dispatcher (70) — >= 60 cheki
  if (m.role.priority < 60) {
    throw new AppError('Boshqarish uchun ruxsat yo\'q', 403);
  }
}

function generateInviteToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || `courier-company-${Date.now()}`;
}

// ============================================
// Routes
// ============================================

export async function courierCompanyRoutes(app: FastifyInstance): Promise<void> {
  // ───────────────────────────────────────────
  // Kompaniya yaratish (self-service)
  // ───────────────────────────────────────────
  app.post('/courier-company', { preHandler: [authMiddleware] }, async (request, reply) => {
    const body = z.object({
      name: z.string().min(2).max(120),
      legalName: z.string().optional(),
      inn: z.string().optional(),
    }).parse(request.body);

    const userId = request.user!.userId;

    // Agar foydalanuvchi allaqachon COURIER_COMPANY ownerimi — ruxsat bermaslik
    const existing = await prisma.membership.findFirst({
      where: {
        profileId: userId,
        status: 'active',
        organization: { type: 'COURIER_COMPANY' },
      },
    });
    if (existing) {
      throw new AppError('Siz allaqachon bir kuryerlik kompaniyasida a\'zosiz', 400);
    }

    const ownerRole = await prisma.role.findUnique({ where: { code: 'courier_company_owner' } });
    if (!ownerRole) {
      throw new AppError('courier_company_owner roli topilmadi. Seed\'ni ishga tushiring.', 500);
    }

    const org = await prisma.organization.create({
      data: {
        type: 'COURIER_COMPANY',
        name: body.name,
        legalName: body.legalName,
        inn: body.inn,
        slug: `${slugify(body.name)}-${crypto.randomBytes(3).toString('hex')}`,
      },
    });

    await prisma.membership.create({
      data: {
        profileId: userId,
        organizationId: org.id,
        roleId: ownerRole.id,
        status: 'active',
        acceptedAt: new Date(),
      },
    });

    // Profile.role ni courier ga ko'tarish (agar oddiy user bo'lsa)
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (profile && profile.role === 'user') {
      await prisma.profile.update({ where: { id: userId }, data: { role: 'courier' } });
    }

    await invalidateAuthzContext(userId);
    await bumpTokenVersion(userId);

    return reply.send({ success: true, data: org });
  });

  // ───────────────────────────────────────────
  // Kompaniya haqida umumiy ma'lumot
  // ───────────────────────────────────────────
  app.get('/courier-company', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { organizationId, organization } = await resolveCourierCompany(request.user!.userId);

    const [memberships, couriers] = await Promise.all([
      prisma.membership.findMany({
        where: { organizationId, status: { not: 'revoked' } },
        include: {
          profile: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          role: { select: { code: true, name: true, priority: true } },
        },
        orderBy: [{ status: 'asc' }, { acceptedAt: 'desc' }],
      }),
      prisma.courier.findMany({
        where: { companyId: organizationId },
        include: {
          profile: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return reply.send({
      success: true,
      data: { organization, memberships, couriers },
    });
  });

  // ───────────────────────────────────────────
  // Rollar
  // ───────────────────────────────────────────
  app.get('/courier-company/roles', { preHandler: [authMiddleware] }, async (_request, reply) => {
    const roles = await prisma.role.findMany({
      where: { scope: 'COURIER_COMPANY', isSystem: true },
      select: {
        id: true, code: true, name: true, description: true, priority: true, permissions: true,
      },
      orderBy: { priority: 'desc' },
    });
    return reply.send({ success: true, data: roles });
  });

  // ───────────────────────────────────────────
  // Staff (xodimlar)
  // ───────────────────────────────────────────
  app.get('/courier-company/staff', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { organizationId } = await resolveCourierCompany(request.user!.userId);
    const memberships = await prisma.membership.findMany({
      where: { organizationId, status: { not: 'revoked' } },
      include: {
        profile: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        role: { select: { id: true, code: true, name: true, priority: true } },
      },
      orderBy: [{ status: 'asc' }, { acceptedAt: 'desc' }],
    });
    return reply.send({ success: true, data: memberships });
  });

  app.get('/courier-company/staff/invites', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { organizationId } = await resolveCourierCompany(request.user!.userId);
    const invites = await prisma.membership.findMany({
      where: { organizationId, status: 'pending' },
      include: {
        role: { select: { code: true, name: true } },
        profile: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { invitedAt: 'desc' },
    });
    return reply.send({ success: true, data: invites });
  });

  app.post('/courier-company/staff/invites', { preHandler: [authMiddleware] }, async (request, reply) => {
    const body = z.object({
      email: z.string().email(),
      roleCode: z.string().min(1),
      expiresInDays: z.number().int().min(1).max(90).default(7),
    }).parse(request.body);

    const userId = request.user!.userId;
    const { organizationId } = await resolveCourierCompany(userId);
    await requireCanManageCompany(userId, organizationId);

    const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
    if (!role || role.scope !== 'COURIER_COMPANY') {
      throw new AppError('Noto\'g\'ri rol (COURIER_COMPANY scope talab qilinadi)', 400);
    }

    const existingProfile = await prisma.profile.findFirst({ where: { email: body.email } });
    if (!existingProfile) {
      throw new AppError(
        `Foydalanuvchi ${body.email} tizimda ro'yxatdan o'tmagan. Avval u ro'yxatdan o'tib olsin.`,
        400,
      );
    }

    const existing = await prisma.membership.findUnique({
      where: { profileId_organizationId: { profileId: existingProfile.id, organizationId } },
    });
    if (existing && existing.status === 'active') {
      throw new AppError('Bu foydalanuvchi allaqachon xodim', 400);
    }

    const { token, hash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000);

    await prisma.membership.upsert({
      where: { profileId_organizationId: { profileId: existingProfile.id, organizationId } },
      create: {
        profileId: existingProfile.id,
        organizationId,
        roleId: role.id,
        status: 'pending',
        invitedBy: userId,
        invitedEmail: body.email,
        invitedAt: new Date(),
        expiresAt,
        inviteTokenHash: hash,
      },
      update: {
        roleId: role.id,
        status: 'pending',
        invitedBy: userId,
        invitedEmail: body.email,
        invitedAt: new Date(),
        expiresAt,
        inviteTokenHash: hash,
        acceptedAt: null,
        revokedAt: null,
        revokedReason: null,
      },
    });

    const inviteUrl = `${process.env.WEB_URL || ''}/courier-company/staff/accept?token=${token}`;

    return reply.send({
      success: true,
      data: {
        email: body.email,
        roleCode: body.roleCode,
        expiresAt,
        ...(process.env.NODE_ENV !== 'production' && { inviteUrl, token }),
      },
    });
  });

  app.delete('/courier-company/staff/invites/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const { organizationId } = await resolveCourierCompany(userId);
    await requireCanManageCompany(userId, organizationId);

    const invite = await prisma.membership.findUnique({ where: { id } });
    if (!invite || invite.organizationId !== organizationId || invite.status !== 'pending') {
      throw new AppError('Taklif topilmadi', 404);
    }
    await prisma.membership.update({
      where: { id },
      data: { status: 'revoked', revokedAt: new Date(), revokedReason: 'invite_cancelled', inviteTokenHash: null },
    });
    return reply.send({ success: true, message: 'Taklif bekor qilindi' });
  });

  app.post('/courier-company/staff/invites/:token/accept', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { token } = request.params as { token: string };
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await prisma.membership.findUnique({
      where: { inviteTokenHash: hash },
      include: { role: { select: { code: true, name: true } }, organization: { select: { name: true, type: true } } },
    });
    if (!invite) throw new AppError('Taklif topilmadi yoki eskirgan', 404);
    if (invite.status !== 'pending') throw new AppError('Taklif faol emas', 400);
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new AppError('Taklifning muddati tugagan', 400);
    }

    const userId = request.user!.userId;
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) throw new AppError('Foydalanuvchi topilmadi', 404);
    if (invite.invitedEmail && profile.email !== invite.invitedEmail) {
      throw new AppError('Taklif boshqa foydalanuvchiga yuborilgan', 403);
    }

    const updated = await prisma.membership.update({
      where: { id: invite.id },
      data: {
        profileId: userId,
        status: 'active',
        acceptedAt: new Date(),
        inviteTokenHash: null,
      },
      include: {
        role: { select: { code: true, name: true } },
        organization: { select: { id: true, name: true, type: true } },
      },
    });

    if (profile.role === 'user') {
      await prisma.profile.update({ where: { id: userId }, data: { role: 'courier' } });
    }

    await invalidateAuthzContext(userId);
    await bumpTokenVersion(userId);

    return reply.send({ success: true, data: updated });
  });

  app.put('/courier-company/staff/:membershipId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { membershipId } = request.params as { membershipId: string };
    const body = z.object({
      roleCode: z.string().optional(),
      status: z.enum(['active', 'suspended']).optional(),
      extraPermissions: z.array(z.string()).optional(),
    }).parse(request.body);

    const userId = request.user!.userId;
    const { organizationId } = await resolveCourierCompany(userId);
    await requireCanManageCompany(userId, organizationId);

    const existing = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { role: { select: { code: true, priority: true } } },
    });
    if (!existing || existing.organizationId !== organizationId) {
      throw new AppError('Xodim topilmadi', 404);
    }
    if (existing.profileId === userId) {
      throw new AppError('O\'z rolingizni o\'zgartira olmaysiz', 400);
    }

    let roleId = existing.roleId;
    if (body.roleCode && body.roleCode !== existing.role.code) {
      const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
      if (!role || role.scope !== 'COURIER_COMPANY') throw new AppError('Noto\'g\'ri rol', 400);
      roleId = role.id;
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        roleId,
        status: body.status ?? existing.status,
        extraPermissions: body.extraPermissions ?? existing.extraPermissions,
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

  app.delete('/courier-company/staff/:membershipId', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { membershipId } = request.params as { membershipId: string };
    const userId = request.user!.userId;
    const { organizationId } = await resolveCourierCompany(userId);
    await requireCanManageCompany(userId, organizationId);

    const existing = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!existing || existing.organizationId !== organizationId) {
      throw new AppError('Xodim topilmadi', 404);
    }
    if (existing.profileId === userId) {
      throw new AppError('O\'zingizni chiqarib yubora olmaysiz', 400);
    }

    await prisma.membership.update({
      where: { id: membershipId },
      data: { status: 'revoked', revokedAt: new Date(), revokedReason: 'removed_by_owner' },
    });

    await invalidateAuthzContext(existing.profileId);
    await bumpTokenVersion(existing.profileId);

    return reply.send({ success: true, message: 'Xodim chiqarib yuborildi' });
  });

  // ───────────────────────────────────────────
  // Fleet — kuryerlar
  // ───────────────────────────────────────────
  app.get('/courier-company/couriers', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { organizationId } = await resolveCourierCompany(request.user!.userId);
    const couriers = await prisma.courier.findMany({
      where: { companyId: organizationId },
      include: {
        profile: { select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: couriers });
  });

  /**
   * Mavjud kuryerni kompaniyaga ulash.
   * courierId = Courier.id (Profile.id emas)
   * Kuryer boshqa kompaniyaga tegishli emasligi tekshiriladi.
   */
  app.post('/courier-company/couriers/:courierId/attach', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { courierId } = request.params as { courierId: string };
    const userId = request.user!.userId;
    const { organizationId } = await resolveCourierCompany(userId);
    await requireCanManageCompany(userId, organizationId);

    const courier = await prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) throw new AppError('Kuryer topilmadi', 404);

    if (courier.companyId && courier.companyId !== organizationId) {
      throw new AppError('Bu kuryer boshqa kompaniyaga tegishli', 400);
    }
    if (courier.companyId === organizationId) {
      return reply.send({ success: true, message: 'Kuryer allaqachon ulangan' });
    }

    const updated = await prisma.courier.update({
      where: { id: courierId },
      data: { companyId: organizationId },
      include: {
        profile: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
      },
    });

    await invalidateAuthzContext(courier.profileId);

    return reply.send({ success: true, data: updated });
  });

  app.delete('/courier-company/couriers/:courierId/detach', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { courierId } = request.params as { courierId: string };
    const userId = request.user!.userId;
    const { organizationId } = await resolveCourierCompany(userId);
    await requireCanManageCompany(userId, organizationId);

    const courier = await prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) throw new AppError('Kuryer topilmadi', 404);
    if (courier.companyId !== organizationId) {
      throw new AppError('Bu kuryer kompaniyangizga tegishli emas', 403);
    }

    await prisma.courier.update({
      where: { id: courierId },
      data: { companyId: null },
    });

    await invalidateAuthzContext(courier.profileId);

    return reply.send({ success: true, message: 'Kuryer kompaniyadan chiqarildi' });
  });
}

/**
 * ============================================
 * Vendor — Staff & Business Management Routes
 * ============================================
 * Mahsulot egasi/admin uchun do'kon va biznes darajasidagi xodimlar boshqaruvi.
 *
 *   GET    /vendor/staff                    — do'kon xodimlari ro'yxati
 *   GET    /vendor/staff/roles              — tanlash uchun SHOP scope rollari
 *   POST   /vendor/staff/invites            — yangi xodim taklif qilish
 *   GET    /vendor/staff/invites            — ochiq takliflar
 *   DELETE /vendor/staff/invites/:id        — taklifni bekor qilish
 *   PUT    /vendor/staff/:membershipId      — xodim rolini o'zgartirish
 *   DELETE /vendor/staff/:membershipId      — xodimni chiqarib yuborish
 *
 *   POST   /vendor/staff/invites/:token/accept  — ochiq (taklif qabul qilish)
 *
 *   GET    /vendor/business                 — biznes tuzilmasi (BusinessGroup/Business → Shops)
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { invalidateAuthzContext } from '../../lib/authz/policy.js';
import { bumpTokenVersion } from '../../services/refresh-token.service.js';

// ============================================
// Helpers
// ============================================

/**
 * Joriy userni do'koniga va mansub Organization'iga (SHOP) bog'laydi.
 */
async function resolveVendorShopOrg(userId: string) {
  const shop = await prisma.shop.findFirst({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      organizationId: true,
      organization: { select: { id: true, parentId: true } },
    },
  });
  if (!shop) {
    throw new AppError("Sizga tegishli do'kon topilmadi", 404);
  }
  if (!shop.organizationId || !shop.organization) {
    throw new AppError(
      "Do'koningizda RBAC v2 organizatsiyasi yaratilmagan. Administratorga murojaat qiling.",
      500,
    );
  }
  return {
    shopId: shop.id,
    shopName: shop.name,
    organizationId: shop.organizationId,
    parentOrgId: shop.organization.parentId,
  };
}

/**
 * Foydalanuvchi do'konda rol berishga haqli ekanligini tekshiradi.
 * Hozircha: faqat shop_admin (yoki unga ekvivalent) + platform admin.
 */
async function requireCanManageStaff(userId: string, organizationId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: { profileId_organizationId: { profileId: userId, organizationId } },
    include: { role: { select: { code: true, priority: true } } },
  });
  if (!membership || membership.status !== 'active') {
    throw new AppError("Do'konda faol membership yo'q", 403);
  }
  // Faqat priority >= 80 (shop_admin, business_owner, business_admin) rollari xodim boshqara oladi
  if (membership.role.priority < 80) {
    throw new AppError('Xodim boshqarish uchun ruxsatingiz yo\'q', 403);
  }
}

function generateInviteToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

// ============================================
// Routes
// ============================================

export async function vendorStaffRoutes(app: FastifyInstance): Promise<void> {
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];

  // ───────────────────────────────────────────
  // Tanlash uchun SHOP scope rollari
  // ───────────────────────────────────────────
  app.get('/vendor/staff/roles', { preHandler: vendorAuth }, async (_request, reply) => {
    const roles = await prisma.role.findMany({
      where: { scope: 'SHOP', isSystem: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        priority: true,
        permissions: true,
      },
      orderBy: { priority: 'desc' },
    });
    return reply.send({ success: true, data: roles });
  });

  // ───────────────────────────────────────────
  // Xodimlar ro'yxati
  // ───────────────────────────────────────────
  app.get('/vendor/staff', { preHandler: vendorAuth }, async (request, reply) => {
    const { organizationId } = await resolveVendorShopOrg(request.user!.userId);

    const memberships = await prisma.membership.findMany({
      where: { organizationId, status: { not: 'revoked' } },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        role: { select: { id: true, code: true, name: true, priority: true } },
      },
      orderBy: [{ status: 'asc' }, { acceptedAt: 'desc' }],
    });

    return reply.send({ success: true, data: memberships });
  });

  // ───────────────────────────────────────────
  // Ochiq takliflar
  // ───────────────────────────────────────────
  app.get('/vendor/staff/invites', { preHandler: vendorAuth }, async (request, reply) => {
    const { organizationId } = await resolveVendorShopOrg(request.user!.userId);

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

  // ───────────────────────────────────────────
  // Taklif yuborish
  // ───────────────────────────────────────────
  app.post('/vendor/staff/invites', { preHandler: vendorAuth }, async (request, reply) => {
    const body = z.object({
      email: z.string().email(),
      roleCode: z.string().min(1),
      expiresInDays: z.number().int().min(1).max(90).default(7),
    }).parse(request.body);

    const userId = request.user!.userId;
    const { organizationId } = await resolveVendorShopOrg(userId);
    await requireCanManageStaff(userId, organizationId);

    const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
    if (!role || role.scope !== 'SHOP') {
      throw new AppError('Noto\'g\'ri rol (SHOP scope talab qilinadi)', 400);
    }

    // Mavjud profile bo'lsa — topamiz, yo'q bo'lsa keyin accept'da create qilinadi
    const existingProfile = await prisma.profile.findFirst({ where: { email: body.email } });

    if (existingProfile) {
      // Allaqachon membership bormi?
      const existing = await prisma.membership.findUnique({
        where: {
          profileId_organizationId: { profileId: existingProfile.id, organizationId },
        },
      });
      if (existing && existing.status === 'active') {
        throw new AppError('Bu foydalanuvchi allaqachon xodim', 400);
      }
    }

    const { token, hash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000);

    // Agar profile mavjud bo'lsa — unga bog'laymiz, aks holda null
    const profileId = existingProfile?.id;

    if (profileId) {
      // Upsert: agar revoked/suspended bo'lsa qayta faollashtiramiz
      await prisma.membership.upsert({
        where: {
          profileId_organizationId: { profileId, organizationId },
        },
        create: {
          profileId,
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
    } else {
      // Profil hali yo'q — keyin accept bosganida profile ochiladi.
      // Hozir vaqtinchalik "shadow" profilega ulab bo'lmagani uchun
      // invite faqat email va hash bilan saqlanadi; accept endpoint'da bog'lanadi.
      // Soddaroq: foydalanuvchi birinchi bo'lib ro'yxatdan o'tishi kerak (OTP orqali),
      // keyin invite'ni accept qilishi mumkin.
      throw new AppError(
        `Foydalanuvchi ${body.email} tizimda ro'yxatdan o'tmagan. Avval u ro'yxatdan o'tib olsin.`,
        400,
      );
    }

    // TODO: Email yuborish (SMTP servisi mavjud bo'lsa)
    // Hozir token'ni frontend'ga qaytaramiz (development rejimi)
    const inviteUrl = `${process.env.WEB_URL || ''}/vendor/staff/accept?token=${token}`;

    return reply.send({
      success: true,
      data: {
        email: body.email,
        roleCode: body.roleCode,
        expiresAt,
        // Prod'da bu qaytarilmaydi — email orqali yuboriladi
        ...(process.env.NODE_ENV !== 'production' && { inviteUrl, token }),
      },
    });
  });

  // ───────────────────────────────────────────
  // Taklifni bekor qilish
  // ───────────────────────────────────────────
  app.delete('/vendor/staff/invites/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const { organizationId } = await resolveVendorShopOrg(userId);
    await requireCanManageStaff(userId, organizationId);

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

  // ───────────────────────────────────────────
  // Taklif qabul qilish (authenticated user only)
  // ───────────────────────────────────────────
  app.post('/vendor/staff/invites/:token/accept', {
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

    // Ushbu foydalanuvchining emaili taklif email'iga mos kelishini tekshirish
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) throw new AppError('Foydalanuvchi topilmadi', 404);
    if (invite.invitedEmail && profile.email !== invite.invitedEmail) {
      throw new AppError('Taklif boshqa foydalanuvchiga yuborilgan', 403);
    }

    // Qabul qilish
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

    // Profile.role ni vendor ga ko'tarish (agar oddiy user bo'lsa)
    if (profile.role === 'user') {
      await prisma.profile.update({ where: { id: userId }, data: { role: 'vendor' } });
    }

    await invalidateAuthzContext(userId);
    await bumpTokenVersion(userId);

    return reply.send({ success: true, data: updated });
  });

  // ───────────────────────────────────────────
  // Xodim rolini o'zgartirish
  // ───────────────────────────────────────────
  app.put('/vendor/staff/:membershipId', { preHandler: vendorAuth }, async (request, reply) => {
    const { membershipId } = request.params as { membershipId: string };
    const body = z.object({
      roleCode: z.string().optional(),
      status: z.enum(['active', 'suspended']).optional(),
      extraPermissions: z.array(z.string()).optional(),
    }).parse(request.body);

    const userId = request.user!.userId;
    const { organizationId } = await resolveVendorShopOrg(userId);
    await requireCanManageStaff(userId, organizationId);

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
      if (!role || role.scope !== 'SHOP') throw new AppError('Noto\'g\'ri rol', 400);
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

  // ───────────────────────────────────────────
  // Xodimni o'chirish (revoke)
  // ───────────────────────────────────────────
  app.delete('/vendor/staff/:membershipId', { preHandler: vendorAuth }, async (request, reply) => {
    const { membershipId } = request.params as { membershipId: string };
    const userId = request.user!.userId;
    const { organizationId } = await resolveVendorShopOrg(userId);
    await requireCanManageStaff(userId, organizationId);

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
  // Biznes tuzilmasi
  // ───────────────────────────────────────────
  app.get('/vendor/business', { preHandler: vendorAuth }, async (request, reply) => {
    const { organizationId, parentOrgId, shopId, shopName } = await resolveVendorShopOrg(request.user!.userId);

    const shopOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          where: { status: 'active' },
          select: { id: true, profileId: true, role: { select: { code: true, name: true } } },
        },
      },
    });

    let parentOrg = null;
    if (parentOrgId) {
      parentOrg = await prisma.organization.findUnique({
        where: { id: parentOrgId },
        include: {
          children: {
            select: { id: true, type: true, name: true },
          },
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        shop: { id: shopId, name: shopName },
        organization: shopOrg,
        business: parentOrg,
      },
    });
  });
}

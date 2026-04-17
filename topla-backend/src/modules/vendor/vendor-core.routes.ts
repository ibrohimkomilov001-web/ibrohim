/**
 * Vendor Core Routes — Profile, Shop, Shop Settings, Onboarding, Performance
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole, requireActiveShop } from '../../middleware/auth.js';
import { NotFoundError } from '../../middleware/error.js';
import { getVendorShop } from '../../utils/shop.js';
import { cacheGet, cacheSet } from '../../config/redis.js';
import {
  calculateOnboardingProgress,
  calculatePerformanceScore,
} from '../../services/vendor.service.js';
import { getContractStatus, isDidoxConfigured } from '../../services/didox.service.js';

export async function vendorCoreRoutes(app: FastifyInstance): Promise<void> {
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];
  const vendorWriteAuth = [...vendorAuth, requireActiveShop()];

  // ============================================
  // GET /vendor/profile
  // ============================================
  app.get('/vendor/profile', { preHandler: vendorAuth }, async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      include: { shop: true },
    });

    if (!profile) throw new NotFoundError('Profil');

    return reply.send({
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phone,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
      shop: profile.shop ? {
        id: profile.shop.id,
        name: profile.shop.name,
        status: profile.shop.status,
        contractStatus: profile.shop.contractStatus,
        contractUrl: profile.shop.contractUrl,
      } : undefined,
    });
  });

  // ============================================
  // GET /vendor/shop
  // ============================================
  app.get('/vendor/shop', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: request.user!.userId },
      include: {
        _count: { select: { products: true, reviews: true, orderItems: true } },
      },
    });

    if (!shop) throw new NotFoundError('Do\'kon');

    return reply.send({ success: true, data: shop });
  });

  // ============================================
  // PUT /vendor/shop/settings
  // ============================================
  const shopSettingsSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    nameRu: z.string().max(100).optional().nullable(),
    description: z.string().max(2000).optional(),
    descriptionRu: z.string().max(2000).optional().nullable(),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().max(300).optional(),
    city: z.string().max(100).optional(),
    website: z.string().url().optional().nullable().or(z.literal('')),
    telegram: z.string().max(100).optional().nullable(),
    instagram: z.string().max(100).optional().nullable(),
    businessType: z.string().max(100).optional(),
    inn: z.string().max(20).optional(),
    bankName: z.string().max(100).optional(),
    bankAccount: z.string().max(30).optional(),
    mfo: z.string().max(10).optional(),
    oked: z.string().max(10).optional(),
    fulfillmentType: z.enum(['FBS', 'DBS']).optional(),
    isOpen: z.boolean().optional(),
    workingHours: z.record(z.any()).optional(),
    minOrderAmount: z.number().min(0).optional(),
    deliveryFee: z.number().min(0).optional(),
    freeDeliveryFrom: z.number().min(0).optional().nullable(),
    deliveryRadius: z.number().min(0).optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    bannerUrl: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  });

  app.put('/vendor/shop/settings', { preHandler: vendorWriteAuth }, async (request, reply) => {
    const body = shopSettingsSchema.parse(request.body);
    const shop = await getVendorShop(request.user!.userId);

    const cleanBody = {
      ...body,
      ...(body.website === '' && { website: null }),
      ...(body.email === '' && { email: null }),
      ...(body.nameRu === '' && { nameRu: null }),
      ...(body.descriptionRu === '' && { descriptionRu: null }),
    };

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: cleanBody,
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // GET /vendor/onboarding
  // ============================================
  app.get('/vendor/onboarding', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);
    const progress = await calculateOnboardingProgress(shop.id);

    const contractInfo = {
      contractStatus: shop.contractStatus,
      contractUrl: shop.contractUrl,
      contractSentAt: shop.contractSentAt,
      contractSignedAt: shop.contractSignedAt,
      contractNote: shop.contractNote,
    };

    return reply.send({ success: true, data: { ...progress, contract: contractInfo } });
  });

  // ============================================
  // GET /vendor/contract-status
  // ============================================
  app.get('/vendor/contract-status', { preHandler: vendorAuth }, async (request, reply) => {
    const shop = await getVendorShop(request.user!.userId);

    // Agar contractId bo'lsa va DiDox sozlangan bo'lsa — real-time status olish
    if (shop.contractId && isDidoxConfigured()) {
      try {
        const didoxStatus = await getContractStatus(shop.contractId);

        const updateData: Record<string, unknown> = {};

        if (didoxStatus.status === 'signed' && shop.contractStatus !== 'signed') {
          updateData.contractStatus = 'signed';
          updateData.contractSignedAt = didoxStatus.signedAt ? new Date(didoxStatus.signedAt) : new Date();
        } else if (didoxStatus.status === 'rejected' && shop.contractStatus !== 'rejected') {
          updateData.contractStatus = 'rejected';
          updateData.contractNote = didoxStatus.rejectReason || undefined;
        } else if (didoxStatus.status === 'viewed' && shop.contractStatus === 'sent') {
          updateData.contractStatus = 'pending_signature';
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.shop.update({ where: { id: shop.id }, data: updateData });
        }

        return reply.send({
          success: true,
          data: {
            contractStatus: (updateData.contractStatus as string) || shop.contractStatus,
            contractId: shop.contractId,
            contractUrl: shop.contractUrl,
            contractSentAt: shop.contractSentAt,
            contractSignedAt: updateData.contractSignedAt || shop.contractSignedAt,
            contractNote: (updateData.contractNote as string) || shop.contractNote,
          },
        });
      } catch (err) {
        request.log.warn({ err, shopId: shop.id }, 'Didox status tekshirishda xato');
      }
    }

    // Fallback: faqat DB dan qaytarish
    return reply.send({
      success: true,
      data: {
        contractStatus: shop.contractStatus,
        contractId: shop.contractId,
        contractUrl: shop.contractUrl,
        contractSentAt: shop.contractSentAt,
        contractSignedAt: shop.contractSignedAt,
        contractNote: shop.contractNote,
      },
    });
  });

  // ============================================
  // GET /vendor/performance
  // ============================================
  app.get('/vendor/performance', { preHandler: vendorAuth }, async (request, reply) => {
    const { period } = request.query as { period?: string };
    const shop = await getVendorShop(request.user!.userId);

    const periodDays = period === 'week' ? 7 : period === 'year' ? 365 : period === 'all' ? 3650 : 30;

    const cacheKey = `vendor:perf:${shop.id}:${periodDays}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return reply.send({ success: true, data: JSON.parse(cached) });

    const score = await calculatePerformanceScore(shop.id, periodDays);
    await cacheSet(cacheKey, JSON.stringify(score), 300);

    return reply.send({ success: true, data: score });
  });
}

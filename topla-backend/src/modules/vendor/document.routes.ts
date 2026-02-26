// ============================================
// Vendor Document Routes
// Upload/manage business documents for verification
// ============================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';

// ============================================
// Validation Schemas
// ============================================

const createDocumentSchema = z.object({
  type: z.enum(['passport', 'inn', 'license', 'certificate', 'other']),
  name: z.string().min(1).max(200),
  fileUrl: z.string().url(),
});

const adminReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectedReason: z.string().optional(),
});

// ============================================
// Routes
// ============================================

export async function documentRoutes(app: FastifyInstance): Promise<void> {
  const vendorAuth = [authMiddleware, requireRole('vendor', 'admin')];
  const adminAuth = [authMiddleware, requireRole('admin')];

  // ============================================
  // GET /vendor/documents — List vendor's documents
  // ============================================
  app.get('/vendor/documents', { preHandler: vendorAuth }, async (request, reply) => {
    const userId = request.user!.userId;

    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundError('Do\'kon topilmadi');
    }

    const documents = await prisma.vendorDocument.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: documents });
  });

  // ============================================
  // POST /vendor/documents — Upload a document
  // ============================================
  app.post('/vendor/documents', { preHandler: vendorAuth }, async (request, reply) => {
    const userId = request.user!.userId;
    const body = createDocumentSchema.parse(request.body);

    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundError('Do\'kon topilmadi');
    }

    // Check for duplicate document type
    const existing = await prisma.vendorDocument.findFirst({
      where: { shopId: shop.id, type: body.type, status: { not: 'rejected' } },
    });

    if (existing) {
      throw new AppError('Bu turdagi hujjat allaqachon yuklangan', 409);
    }

    const document = await prisma.vendorDocument.create({
      data: {
        shopId: shop.id,
        type: body.type,
        name: body.name,
        fileUrl: body.fileUrl,
        status: 'pending',
      },
    });

    return reply.status(201).send({ success: true, data: document });
  });

  // ============================================
  // DELETE /vendor/documents/:id — Delete own document
  // ============================================
  app.delete('/vendor/documents/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundError('Do\'kon topilmadi');
    }

    const doc = await prisma.vendorDocument.findFirst({
      where: { id, shopId: shop.id },
    });

    if (!doc) {
      throw new NotFoundError('Hujjat topilmadi');
    }

    if (doc.status === 'approved') {
      throw new AppError('Tasdiqlangan hujjatni o\'chirish mumkin emas', 400);
    }

    await prisma.vendorDocument.delete({ where: { id } });

    return reply.send({ success: true, message: 'Hujjat o\'chirildi' });
  });

  // ============================================
  // PUT /vendor/documents/:id — Re-upload rejected document
  // ============================================
  app.put('/vendor/documents/:id', { preHandler: vendorAuth }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const body = createDocumentSchema.parse(request.body);

    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundError('Do\'kon topilmadi');
    }

    const doc = await prisma.vendorDocument.findFirst({
      where: { id, shopId: shop.id },
    });

    if (!doc) {
      throw new NotFoundError('Hujjat topilmadi');
    }

    if (doc.status === 'approved') {
      throw new AppError('Tasdiqlangan hujjatni o\'zgartirish mumkin emas', 400);
    }

    const updated = await prisma.vendorDocument.update({
      where: { id },
      data: {
        type: body.type,
        name: body.name,
        fileUrl: body.fileUrl,
        status: 'pending',
        rejectedReason: null,
      },
    });

    return reply.send({ success: true, data: updated });
  });

  // ============================================
  // ADMIN: GET /admin/documents — List all vendor documents
  // ============================================
  app.get('/admin/documents', { preHandler: adminAuth }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as any);
    const { status, shopId } = request.query as { status?: string; shopId?: string };

    const where: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }
    if (shopId) {
      where.shopId = shopId;
    }

    const [documents, total] = await Promise.all([
      prisma.vendorDocument.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true, logoUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      prisma.vendorDocument.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: documents,
      meta: paginationMeta(page, limit, total),
    });
  });

  // ============================================
  // ADMIN: GET /admin/documents/stats — Document stats
  // ============================================
  app.get('/admin/documents/stats', { preHandler: adminAuth }, async (request, reply) => {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.vendorDocument.count({ where: { status: 'pending' } }),
      prisma.vendorDocument.count({ where: { status: 'approved' } }),
      prisma.vendorDocument.count({ where: { status: 'rejected' } }),
      prisma.vendorDocument.count(),
    ]);

    return reply.send({
      success: true,
      data: { pending, approved, rejected, total },
    });
  });

  // ============================================
  // ADMIN: PUT /admin/documents/:id/review — Approve/reject
  // ============================================
  app.put('/admin/documents/:id/review', { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = adminReviewSchema.parse(request.body);

    const doc = await prisma.vendorDocument.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundError('Hujjat topilmadi');
    }

    if (body.status === 'rejected' && !body.rejectedReason) {
      throw new AppError('Rad etish sababi ko\'rsatilishi kerak', 400);
    }

    const updated = await prisma.vendorDocument.update({
      where: { id },
      data: {
        status: body.status,
        rejectedReason: body.status === 'rejected' ? body.rejectedReason : null,
      },
    });

    // Notify vendor about document status change
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: doc.shopId },
        select: { ownerId: true, name: true },
      });

      if (shop) {
        await prisma.notification.create({
          data: {
            userId: shop.ownerId,
            title: body.status === 'approved' ? 'Hujjat tasdiqlandi' : 'Hujjat rad etildi',
            body: body.status === 'approved'
              ? `${doc.name} hujjati muvaffaqiyatli tasdiqlandi`
              : `${doc.name} hujjati rad etildi: ${body.rejectedReason}`,
            type: 'system',
          },
        });
      }
    } catch (e) {
      // Don't fail the review if notification fails
      request.log.error(e, 'Failed to send document review notification');
    }

    return reply.send({ success: true, data: updated });
  });
}

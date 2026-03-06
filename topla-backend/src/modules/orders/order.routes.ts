import { FastifyInstance } from 'fastify';
import { randomInt, randomUUID, randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';
import { parsePagination, paginationMeta } from '../../utils/pagination.js';
import { notifyOrderStatusChange } from '../notifications/notification.service.js';
import { enqueueNotification } from '../../services/queue.service.js';
import { findAndAssignCourier } from '../courier/courier.service.js';
import {
  emitOrderStatusUpdate,
  emitNewOrderToVendor,
  emitToAdminDashboard,
} from '../../websocket/socket.js';

// ============================================
// Validation Schemas
// ============================================

// ============================================
// Helper: Dynamic delivery fee from AdminSetting
// ============================================

async function getDeliveryFee(): Promise<number> {
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'delivery_fee' },
    });
    if (setting) {
      return parseFloat(setting.value) || 15000;
    }
  } catch {
    // fallback
  }
  return 15000; // default
}

const createOrderSchema = z.object({
  addressId: z.string().uuid().optional(),
  pickupPointId: z.string().uuid().optional(),
  deliveryMethod: z.enum(['courier', 'pickup']).default('courier'),
  paymentMethod: z.enum(['cash', 'card', 'payme', 'click']).default('cash'),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryTimeSlot: z.string().optional(),
  promoCode: z.string().optional(),
  note: z.string().optional(),
  // Tanlangan mahsulotlar — agar berilmasa, barcha savat items olinadi
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().optional(),
  })).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'confirmed',
    'processing',
    'ready_for_pickup',
    'at_pickup_point',
    'courier_assigned',
    'courier_picked_up',
    'shipping',
    'delivered',
    'cancelled',
  ]),
  cancelReason: z.string().optional(),
});

// ============================================
// Helper: Generate order number
// ============================================

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = randomInt(0, 1000000).toString().padStart(6, '0');
  return `TOPLA-${dateStr}-${random}`;
}

// ============================================
// Status flow validation (Yandex Go style)
// ============================================

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['courier_assigned', 'at_pickup_point', 'cancelled'],
  at_pickup_point: ['delivered', 'cancelled'],
  courier_assigned: ['courier_picked_up', 'cancelled'],
  courier_picked_up: ['shipping'],
  shipping: ['delivered'],
  delivered: [], // final
  cancelled: [], // final
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// ============================================
// Routes
// ============================================

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  // ============================================
  // MIJOZ (Customer) endpoints
  // ============================================

  /**
   * POST /promo-codes/verify
   * Promo kodni tekshirish (buyurtma berishdan oldin)
   */
  app.post('/promo-codes/verify', { preHandler: authMiddleware }, async (request, reply) => {
    const verifySchema = z.object({
      code: z.string().min(1).max(50),
      subtotal: z.number().min(0).optional(),
    });
    const body = verifySchema.parse(request.body);
    const userId = request.user!.userId;

    const promo = await prisma.promoCode.findFirst({
      where: {
        code: body.code.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!promo) {
      throw new AppError('Promo kod topilmadi yoki muddati tugagan', 404);
    }

    // Limit tekshiruvi
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      throw new AppError('Promo kod limiti tugagan', 400);
    }

    // Foydalanuvchi allaqachon ishlatganmi
    const alreadyUsed = await prisma.promoCodeUsage.findFirst({
      where: { promoId: promo.id, userId },
    });
    if (alreadyUsed) {
      throw new AppError('Siz bu promo kodni oldin ishlatgansiz', 400);
    }

    // Minimum summa tekshiruvi
    if (promo.minOrderAmount && body.subtotal && body.subtotal < Number(promo.minOrderAmount)) {
      throw new AppError(`Minimal buyurtma summasi: ${promo.minOrderAmount} so'm`, 400);
    }

    // Chegirma hisobi
    let discount = 0;
    if (body.subtotal) {
      discount =
        promo.discountType === 'percentage'
          ? (body.subtotal * Number(promo.discountValue)) / 100
          : Number(promo.discountValue);
    }

    return reply.send({
      success: true,
      data: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        discount: Math.round(discount),
        expiresAt: promo.expiresAt,
        remainingUses: promo.maxUses ? promo.maxUses - promo.currentUses : null,
      },
    });
  });

  /**
   * GET /promo-codes/my
   * Foydalanuvchining barcha promo kodlari (Lucky Wheel + Referral bonus)
   */
  app.get('/promo-codes/my', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    // Lucky Wheel dan yutilgan promo kodlarni olish
    const spins = await prisma.luckyWheelSpin.findMany({
      where: {
        userId,
        promoCode: { not: null },
        prizeType: { not: 'nothing' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        promoCode: true,
        prizeType: true,
        prizeName: true,
        createdAt: true,
        prize: {
          select: {
            nameUz: true,
            nameRu: true,
            type: true,
            value: true,
            color: true,
            imageUrl: true,
          },
        },
      },
    });

    // Promo kodlarning to'liq ma'lumotlarini olish
    const promoCodes = spins.filter(s => s.promoCode);
    const codes = promoCodes.map(s => s.promoCode!);

    const promoRecords = codes.length > 0 ? await prisma.promoCode.findMany({
      where: { code: { in: codes } },
      include: {
        usages: {
          where: { userId },
          select: { usedAt: true, orderId: true },
        },
      },
    }) : [];

    // Map bo'yicha birlashtirish
    const promoMap = new Map(promoRecords.map(p => [p.code, p]));

    const result = promoCodes.map(spin => {
      const promo = promoMap.get(spin.promoCode!);
      const isUsed = promo ? promo.usages.length > 0 : false;
      const isExpired = promo?.expiresAt ? new Date(promo.expiresAt) < new Date() : false;

      let status: 'active' | 'used' | 'expired' = 'active';
      if (isUsed) status = 'used';
      else if (isExpired) status = 'expired';

      return {
        code: spin.promoCode,
        prizeType: spin.prizeType,
        prizeName: spin.prizeName,
        discountType: promo?.discountType || null,
        discountValue: promo ? Number(promo.discountValue) : null,
        minOrderAmount: promo?.minOrderAmount ? Number(promo.minOrderAmount) : null,
        expiresAt: promo?.expiresAt || null,
        status,
        isUsed,
        isExpired,
        usedAt: promo?.usages[0]?.usedAt || null,
        createdAt: spin.createdAt,
        prize: spin.prize,
      };
    });

    return reply.send({
      success: true,
      data: { promoCodes: result },
    });
  });

  /**
   * POST /orders
   * Yangi buyurtma yaratish
   */
  app.post('/orders', { preHandler: authMiddleware }, async (request, reply) => {
    const body = createOrderSchema.parse(request.body);
    const userId = request.user!.userId;

    // 1. Savatdagi mahsulotlarni olish (tanlangan yoki barchasi)
    let cartItems;
    if (body.items && body.items.length > 0) {
      // Faqat tanlangan mahsulotlar
      const selectedProductIds = body.items.map(i => i.productId);
      cartItems = await prisma.cartItem.findMany({
        where: {
          userId,
          productId: { in: selectedProductIds },
        },
        include: {
          product: {
            include: { shop: true },
          },
        },
      });

      // Agar request'da quantity berilgan bo'lsa, uni qo'llash
      for (const item of cartItems) {
        const requestItem = body.items!.find(i => i.productId === item.productId);
        if (requestItem?.quantity) {
          item.quantity = requestItem.quantity;
        }
      }
    } else {
      // Barcha savat items (backward compatible)
      cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            include: { shop: true },
          },
        },
      });
    }

    if (cartItems.length === 0) {
      throw new AppError('Savat bo\'sh');
    }

    // 2. Mahsulot mavjudligini tekshirish
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new AppError(
          `"${item.product.name}" mahsulotidan faqat ${item.product.stock} dona bor`,
        );
      }
      if (!item.product.isActive) {
        throw new AppError(`"${item.product.name}" mahsuloti sotuvda mavjud emas`);
      }
      // Do'kon statusi tekshirish
      if (item.product.shop.status !== 'active') {
        throw new AppError(`"${item.product.name}" mahsulotining do'koni faol emas`);
      }
    }

    // 3. Manzilni tekshirish (courier bo'lsa)
    if (body.deliveryMethod === 'courier') {
      if (!body.addressId) {
        throw new AppError('Yetkazib berish uchun manzil kerak');
      }
      const address = await prisma.address.findFirst({
        where: { id: body.addressId, userId },
      });
      if (!address) {
        throw new AppError('Manzil topilmadi');
      }
    }

    // 3.1 Pickup point tekshirish
    if (body.deliveryMethod === 'pickup') {
      if (!body.pickupPointId) {
        throw new AppError('Topshirish punktini tanlang');
      }
      const pickupPoint = await prisma.pickupPoint.findFirst({
        where: { id: body.pickupPointId, isActive: true },
      });
      if (!pickupPoint) {
        throw new AppError('Topshirish punkti topilmadi yoki faol emas');
      }
    }

    // 3.5 Shop minOrderAmount tekshirish  
    const shopTotals = new Map<string, { total: number; shopName: string; minOrder: number }>();
    for (const item of cartItems) {
      const shopId = item.product.shopId;
      const existing = shopTotals.get(shopId);
      const itemTotal = Number(item.product.price) * item.quantity;
      if (existing) {
        existing.total += itemTotal;
      } else {
        shopTotals.set(shopId, {
          total: itemTotal,
          shopName: item.product.shop.name,
          minOrder: Number(item.product.shop.minOrderAmount || 0),
        });
      }
    }
    for (const [, info] of shopTotals) {
      if (info.minOrder > 0 && info.total < info.minOrder) {
        throw new AppError(
          `"${info.shopName}" do'konida minimal buyurtma summasi ${info.minOrder} so'm. Hozirgi: ${info.total} so'm`,
        );
      }
    }

    // 4. Narxlarni hisoblash
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    let discount = 0;
    let promoId: string | null = null;
    // Promo code — asosiy tekshiruv (tez xato qaytarish uchun)
    if (body.promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          code: body.promoCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (promo) {
        if (promo.maxUses && promo.currentUses >= promo.maxUses) {
          throw new AppError('Promo kod limiti tugagan');
        }

        const alreadyUsed = await prisma.promoCodeUsage.findFirst({
          where: { promoId: promo.id, userId },
        });
        if (alreadyUsed) {
          throw new AppError('Siz bu promo kodni oldin ishlatgansiz');
        }

        discount =
          promo.discountType === 'percentage'
            ? (subtotal * Number(promo.discountValue)) / 100
            : Number(promo.discountValue);
        promoId = promo.id;
      }
    }

    const deliveryFee = body.deliveryMethod === 'courier'
      ? await getDeliveryFee()
      : 0;
    const total = Math.max(0, subtotal - discount + deliveryFee);

    // 5. Transaction ichida buyurtma yaratish (stock check + decrement atomik)
    const order = await prisma.$transaction(async (tx) => {
      // Stock tekshirish - TRANSACTION ICHIDA (race condition oldini oladi)
      for (const item of cartItems) {
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true, isActive: true },
        });
        if (!currentProduct || currentProduct.stock < item.quantity) {
          throw new AppError(
            `"${currentProduct?.name || item.product.name}" mahsulotidan faqat ${currentProduct?.stock || 0} dona bor`,
          );
        }
        if (!currentProduct.isActive) {
          throw new AppError(`"${currentProduct.name}" mahsuloti sotuvda mavjud emas`);
        }
      }

      // Buyurtma yaratish (darhol confirmed — auto-confirm)
      // Pickup buyurtmalar uchun darhol QR kod generatsiya (Yandex Market uslubida)
      const isPickup = body.deliveryMethod === 'pickup';
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId: body.addressId || null,
          status: 'confirmed',
          paymentStatus: body.paymentMethod === 'cash' ? 'pending' : 'pending',
          paymentMethod: body.paymentMethod,
          deliveryMethod: body.deliveryMethod,
          pickupPointId: isPickup ? body.pickupPointId : null,
          // Pickup: darhol PIN kod va QR token yaratish
          pickupCode: isPickup ? randomInt(100000, 999999).toString() : null,
          pickupToken: isPickup ? randomUUID() : null,
          subtotal,
          deliveryFee,
          discount,
          total,
          recipientName: body.recipientName,
          recipientPhone: body.recipientPhone,
          deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
          deliveryTimeSlot: body.deliveryTimeSlot,
          promoCode: body.promoCode?.toUpperCase(),
          note: body.note,
        },
      });

      // Order items yaratish
      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          shopId: item.product.shopId,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          imageUrl: item.product.images?.[0] || null,
        })),
      });

      // Stokni kamaytirish
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Savatdan faqat buyurtma qilingan mahsulotlarni o'chirish
      const orderedProductIds = cartItems.map(item => item.productId);
      await tx.cartItem.deleteMany({
        where: {
          userId,
          productId: { in: orderedProductIds },
        },
      });

      // Status history (confirmed — auto)
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: 'confirmed',
          changedBy: userId,
          note: 'Avtomatik tasdiqlandi',
        },
      });

      // Promo usage — atomik tekshiruv va yangilash (race condition oldini oladi)
      if (promoId) {
        // Atomik: faqat limit tugamagan bo'lsa increment qilish
        const updated = await tx.$executeRaw`
          UPDATE promo_codes 
          SET current_uses = current_uses + 1
          WHERE id = ${promoId}::uuid
          AND (max_uses IS NULL OR current_uses < max_uses)
          AND is_active = true
        `;
        if (updated === 0) {
          throw new AppError('Promo kod limiti tugagan (boshqa foydalanuvchi ishlatib bo\'ldi)');
        }
        await tx.promoCodeUsage.create({
          data: { promoId, userId },
        });
      }

      return newOrder;
    });

    // 6. Bildirishnomalar (BullMQ orqali non-blocking)
    // Vendorga: "Yangi buyurtma!"
    // Adminga: "Yangi buyurtma tushdi"
    enqueueNotification({ type: 'order_status', orderId: order.id, newStatus: 'order_new' }).catch(() => {});

    // 7. Javob
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        address: true,
      },
    });

    // 7.5 Real-time: Vendorlarga yangi buyurtma + Admin dashboard
    if (fullOrder) {
      const shopIds = [...new Set(fullOrder.items.map((i) => i.shopId))];
      for (const shopId of shopIds) {
        emitNewOrderToVendor(shopId, fullOrder);
      }
      emitToAdminDashboard('order:new', { order: fullOrder });
    }

    return reply.status(201).send({
      success: true,
      data: fullOrder,
    });
  });

  /**
   * GET /orders
   * Mijozning buyurtmalari ro'yxati
   */
  const orderListQuerySchema = z.object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  });
  const idParamSchema = z.object({ id: z.string().uuid() });
  const cancelSchema = z.object({ reason: z.string().max(500).optional() });

  app.get('/orders', { preHandler: authMiddleware }, async (request, reply) => {
    const { status, page, limit: lim } = orderListQuerySchema.parse(request.query);
    const skip = (page - 1) * lim;

    const where: any = { userId: request.user!.userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              shop: { select: { id: true, name: true, logoUrl: true } },
            },
          },
          address: true,
          courier: {
            include: {
              profile: {
                select: { id: true, fullName: true, phone: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: lim,
      }),
      prisma.order.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        orders,
        pagination: paginationMeta(page, lim, total),
      },
    });
  });

  /**
   * GET /orders/:id
   * Buyurtma tafsilotlari (mijoz)
   */
  app.get('/orders/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const order = await prisma.order.findFirst({
      where: { id, userId: request.user!.userId },
      include: {
        items: {
          include: {
            shop: { select: { id: true, name: true, logoUrl: true, phone: true } },
          },
        },
        address: true,
        pickupPoint: { select: { id: true, name: true, address: true, latitude: true, longitude: true, phone: true, workingHours: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        courier: {
          include: {
            profile: {
              select: { id: true, fullName: true, phone: true, avatarUrl: true },
            },
          },
        },
        deliveryRating: true,
      },
    });

    if (!order) throw new NotFoundError('Buyurtma');

    return reply.send({ success: true, data: order });
  });

  /**
   * POST /orders/:id/cancel
   * Buyurtmani bekor qilish (mijoz)
   */
  app.post('/orders/:id/cancel', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { reason } = cancelSchema.parse(request.body || {});

    const order = await prisma.order.findFirst({
      where: { id, userId: request.user!.userId },
    });

    if (!order) throw new NotFoundError('Buyurtma');

    // Faqat pending va confirmed holatlarda bekor qilish mumkin
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new AppError('Bu holatda buyurtmani bekor qilib bo\'lmaydi');
    }

    await prisma.$transaction(async (tx) => {
      // Status yangilash
      await tx.order.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelReason: reason || 'Mijoz tomonidan bekor qilindi',
          cancelledAt: new Date(),
        },
      });

      // Stokni qaytarish
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: 'cancelled',
          note: reason,
          changedBy: request.user!.userId,
        },
      });
    });

    enqueueNotification({ type: 'order_status', orderId: id, newStatus: 'order_cancelled', extra: { cancelReason: reason } }).catch(() => {});

    // Real-time: Buyurtma kuzatuvchilariga
    emitOrderStatusUpdate(id, 'cancelled', { cancelReason: reason });
    emitToAdminDashboard('order:cancelled', { orderId: id });

    return reply.send({ success: true, message: 'Buyurtma bekor qilindi' });
  });

  // ============================================
  // VENDOR endpoints
  // ============================================

  /**
   * GET /vendor/orders
   * Vendorning barcha buyurtmalari
   */
  app.get(
    '/vendor/orders',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const { status, page = '1', limit = '20' } = request.query as {
        status?: string;
        page?: string;
        limit?: string;
      };

      // Vendorning do'konini topish
      const shop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });

      if (!shop) throw new AppError('Do\'kon topilmadi');

      const where: any = {
        items: { some: { shopId: shop.id } },
      };
      if (status) where.status = status;

      const cappedLimit = Math.min(parseInt(limit) || 20, 100);
      const skip = (parseInt(page) - 1) * cappedLimit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: { where: { shopId: shop.id } },
            user: {
              select: { id: true, fullName: true, phone: true },
            },
            address: true,
            courier: {
              include: {
                profile: {
                  select: { id: true, fullName: true, phone: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: cappedLimit,
        }),
        prisma.order.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: { orders, total },
      });
    },
  );

  /**
   * GET /vendor/orders/:id
   * Vendor buyurtmani ID bo'yicha ko'rish
   */
  app.get(
    '/vendor/orders/:id',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const shop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });
      if (!shop) throw new AppError('Do\'kon topilmadi');

      const order = await prisma.order.findFirst({
        where: {
          id,
          items: { some: { shopId: shop.id } },
        },
        include: {
          items: {
            where: { shopId: shop.id },
            include: { product: { select: { id: true, name: true, nameUz: true, images: true } } },
          },
          user: { select: { id: true, fullName: true, phone: true, email: true } },
          address: true,
          courier: {
            include: {
              profile: { select: { id: true, fullName: true, phone: true } },
            },
          },
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!order) throw new AppError('Buyurtma topilmadi', 404);

      return reply.send({ success: true, data: order });
    },
  );

  /**
   * PUT /vendor/orders/:id/status
   * Vendor buyurtma statusini yangilash
   * 
   * FLOW:
   * pending → confirmed (Vendor qabul qildi)
   * confirmed → processing (Vendor tayyorlayapti)
   * processing → ready_for_pickup (Tayyor - kuryerga berish)
   */
  app.put(
    '/vendor/orders/:id/status',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateStatusSchema.parse(request.body);

      // Vendorning do'konini topish
      const shop = await prisma.shop.findUnique({
        where: { ownerId: request.user!.userId },
      });

      if (!shop) throw new AppError('Do\'kon topilmadi');

      // Buyurtmani tekshirish
      const order = await prisma.order.findFirst({
        where: {
          id,
          items: { some: { shopId: shop.id } },
        },
      });

      if (!order) throw new NotFoundError('Buyurtma');

      // Status o'tishini tekshirish
      if (!isValidTransition(order.status, body.status)) {
        throw new AppError(
          `"${order.status}" holatidan "${body.status}" holatiga o'tish mumkin emas`,
        );
      }

      // Vendor faqat o'z bosqichlarigacha o'zgartira oladi
      const vendorAllowed = ['confirmed', 'processing', 'ready_for_pickup', 'at_pickup_point', 'cancelled'];
      if (!vendorAllowed.includes(body.status)) {
        throw new AppError('Vendor bu statusni o\'zgartira olmaydi');
      }

      // Status yangilash
      const timestamps: Record<string, Date> = {};
      const extraData: Record<string, any> = {};
      if (body.status === 'confirmed') timestamps.confirmedAt = new Date();
      if (body.status === 'ready_for_pickup') timestamps.readyAt = new Date();
      if (body.status === 'cancelled') timestamps.cancelledAt = new Date();

      // Buyurtma pickup punktiga yetganda — faqat vaqtni belgilash
      // (pickupCode va pickupToken buyurtma yaratilganda darhol generatsiya qilingan)
      if (body.status === 'at_pickup_point') {
        extraData.pickupReadyAt = new Date();
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: {
            status: body.status as any,
            cancelReason: body.cancelReason,
            ...timestamps,
            ...extraData,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: body.status as any,
            note: body.cancelReason,
            changedBy: request.user!.userId,
          },
        });

        // Bekor qilishda stokni qaytarish
        if (body.status === 'cancelled') {
          const items = await tx.orderItem.findMany({ where: { orderId: id } });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }

          // BL2: Agar kuryer tayinlangan bo'lsa — kuryerni bo'shatish
          if (order.courierId) {
            await tx.courier.update({
              where: { id: order.courierId },
              data: { status: 'online' },
            });
          }
        }
      });

      // Bildirishnomalar (BullMQ — non-blocking)
      enqueueNotification({
        type: 'order_status',
        orderId: id,
        newStatus: body.status,
        extra: { cancelReason: body.cancelReason },
      }).catch(() => {});

      // Real-time: Buyurtma kuzatuvchilariga
      emitOrderStatusUpdate(id, body.status, {
        cancelReason: body.cancelReason,
      });
      emitToAdminDashboard('order:status-changed', {
        orderId: id,
        status: body.status,
      });

      // MUHIM: Agar "ready_for_pickup" bo'lsa → kuryer izlash boshlash!
      if (body.status === 'ready_for_pickup' && order.deliveryMethod === 'courier') {
        // Eng yaqin kuryerni topish va tayinlash
        findAndAssignCourier(id).catch((err) =>
          console.error('Courier assignment error:', err),
        );
      }

      // MUHIM: Agar "delivered" bo'lsa → referral bonus berish
      if (body.status === 'delivered') {
        processReferralBonus(order.userId).catch((err) =>
          console.error('Referral bonus error:', err),
        );
      }

      return reply.send({
        success: true,
        message: `Buyurtma statusi "${body.status}" ga o'zgartirildi`,
      });
    },
  );

  // ============================================
  // RATING (baholash)
  // ============================================

  /**
   * POST /orders/:id/rate
   * Yetkazib berishni baholash
   */
  const rateSchema = z.object({
    rating: z.number().int().min(1, 'Baho kamida 1').max(5, 'Baho 5 dan oshmasligi kerak'),
    comment: z.string().max(500).optional(),
  });

  app.post('/orders/:id/rate', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { rating, comment } = rateSchema.parse(request.body);

    const order = await prisma.order.findFirst({
      where: { id, userId: request.user!.userId, status: 'delivered' },
    });

    if (!order) throw new AppError('Buyurtma topilmadi yoki hali yetkazilmagan');
    if (!order.courierId) throw new AppError('Bu buyurtmada kuryer yo\'q');

    // Oldingi baho bormi?
    const existing = await prisma.deliveryRating.findUnique({
      where: { orderId: id },
    });
    if (existing) throw new AppError('Siz allaqachon baholagansiz');

    // Baho yaratish
    await prisma.deliveryRating.create({
      data: {
        orderId: id,
        courierId: order.courierId,
        userId: request.user!.userId,
        rating,
        comment,
      },
    });

    // Kuryer ratingini yangilash
    const avgRating = await prisma.deliveryRating.aggregate({
      where: { courierId: order.courierId },
      _avg: { rating: true },
    });

    await prisma.courier.update({
      where: { id: order.courierId },
      data: { rating: avgRating._avg.rating || 5 },
    });

    return reply.send({ success: true, message: 'Rahmat! Bahoyingiz qabul qilindi' });
  });
}

// ============================================
// Helper: Referral Ball — buyurtma delivered bo'lganda
// Do'st xarid qilganda referrer ga +purchasePoints ball (bir marta, >= minPurchase)
// ============================================
async function processReferralBonus(userId: string): Promise<void> {
  try {
    // Foydalanuvchining referral yozuvi bormi va purchase bonus berilmaganmi?
    const referral = await prisma.referral.findFirst({
      where: {
        referredId: userId,
        purchaseBonusGiven: false,
      },
    });

    if (!referral) return; // Referral yo'q yoki allaqachon berilgan

    // Oxirgi delivered buyurtmani topish (total tekshirish uchun)
    const lastDeliveredOrder = await prisma.order.findFirst({
      where: { userId, status: 'delivered' },
      orderBy: { deliveredAt: 'desc' },
      select: { total: true },
    });

    if (!lastDeliveredOrder) return;

    // Admin sozlamalaridan ball miqdorlarini olish
    let purchasePoints = 5;
    let minPurchaseAmount = 100000;
    try {
      const [purchSetting, minSetting] = await Promise.all([
        prisma.adminSetting.findUnique({ where: { key: 'referral_purchase_points' } }),
        prisma.adminSetting.findUnique({ where: { key: 'referral_min_purchase' } }),
      ]);
      if (purchSetting) purchasePoints = parseInt(purchSetting.value) || 5;
      if (minSetting) minPurchaseAmount = parseInt(minSetting.value) || 100000;
    } catch {}

    // Minimum xarid summasi tekshirish
    const orderTotal = Number(lastDeliveredOrder.total);
    if (orderTotal < minPurchaseAmount) {
      console.log(`Referral purchase bonus skipped: order total ${orderTotal} < min ${minPurchaseAmount}`);
      return;
    }

    // Referred foydalanuvchi ismini olish
    const referredProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    await prisma.$transaction(async (tx) => {
      // Referrer ga ball berish
      await tx.profile.update({
        where: { id: referral.referrerId },
        data: { referralPoints: { increment: purchasePoints } },
      });

      // Ball log
      await tx.referralPointLog.create({
        data: {
          profileId: referral.referrerId,
          amount: purchasePoints,
          type: 'friend_purchased',
          description: `Do'st xarid qildi: ${referredProfile?.fullName || 'Foydalanuvchi'} (${orderTotal.toLocaleString()} so'm)`,
          referralId: referral.id,
        },
      });

      // Referral yozuvini yangilash
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          purchaseBonusGiven: true,
          referrerPaid: true,
        },
      });
    });

    console.log(`Referral purchase bonus: referrer=${referral.referrerId}, +${purchasePoints} ball, order=${orderTotal}`);

    // Bildirishnoma yuborish (non-blocking)
    const { createNotification } = await import('../../modules/notifications/notification.service.js');
    createNotification(
      referral.referrerId,
      'referral_bonus' as any,
      'Do\'stingiz xarid qildi!',
      `${referredProfile?.fullName || 'Do\'stingiz'} xarid qildi! +${purchasePoints} ball qo'shildi`,
    ).catch(() => {});
  } catch (err) {
    console.error('processReferralBonus error:', err);
  }
}

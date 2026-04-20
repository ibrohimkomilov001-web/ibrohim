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
  emitToCourier,
} from '../../websocket/socket.js';
import {
  calculateDeliveryFee,
  estimateDeliveryTime,
  reorderToCart,
  cancelOrderItem,
  buildVariantInfo,
  getDeliveryInfo,
} from '../../services/order.service.js';

// ============================================
// Validation Schemas
// ============================================

// Helper: getDeliveryFee removed → now in order.service.ts (calculateDeliveryFee)

const createOrderSchema = z.object({
  addressId: z.string().uuid().optional(),
  pickupPointId: z.string().uuid().optional(),
  deliveryMethod: z.enum(['courier', 'pickup']).default('courier'),
  paymentMethod: z.enum(['cash', 'card']).default('cash'),
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
  pending: ['confirmed', 'processing', 'cancelled'],
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
          variant: {
            include: {
              color: { select: { nameUz: true, nameRu: true } },
              size: { select: { nameUz: true, nameRu: true } },
              variantValues: {
                include: {
                  optionType: { select: { id: true, slug: true, nameUz: true, nameRu: true, sortOrder: true } },
                  optionValue: { select: { id: true, slug: true, valueUz: true, valueRu: true, hexCode: true } },
                },
              },
            },
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
          variant: {
            include: {
              color: { select: { nameUz: true, nameRu: true } },
              size: { select: { nameUz: true, nameRu: true } },
              variantValues: {
                include: {
                  optionType: { select: { id: true, slug: true, nameUz: true, nameRu: true, sortOrder: true } },
                  optionValue: { select: { id: true, slug: true, valueUz: true, valueRu: true, hexCode: true } },
                },
              },
            },
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

    // Dynamic delivery fee (zone-based or AdminSetting fallback)
    let deliveryFeePerOrder = 0;
    let freeDeliveryThreshold = 0;
    if (body.deliveryMethod === 'courier') {
      const feeResult = await calculateDeliveryFee(body.addressId, body.deliveryMethod);
      deliveryFeePerOrder = feeResult.fee;
      freeDeliveryThreshold = feeResult.freeDeliveryThreshold;
      // Free delivery if subtotal exceeds threshold
      if (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold) {
        deliveryFeePerOrder = 0;
      }
    }

    // Delivery time estimate
    const deliveryEstimate = estimateDeliveryTime(
      body.deliveryMethod,
      body.deliveryDate,
      body.deliveryTimeSlot,
    );

    // 4.5 Multi-shop order splitting (O-04 fix)
    // Cart items'ni shopId bo'yicha gruppalash
    const shopGroups = new Map<string, typeof cartItems>();
    for (const item of cartItems) {
      const shopId = item.product.shopId;
      if (!shopGroups.has(shopId)) {
        shopGroups.set(shopId, []);
      }
      shopGroups.get(shopId)!.push(item);
    }

    // Promo code'ni eng katta orderni aniqlash uchun
    const shopEntries = Array.from(shopGroups.entries()).map(([shopId, items]) => {
      const shopSubtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
      return { shopId, items, shopSubtotal };
    });
    // Eng katta shop birinchi bo'lsin (promo code shu orderga qo'llaniladi)
    shopEntries.sort((a, b) => b.shopSubtotal - a.shopSubtotal);

    // 5. Transaction ichida buyurtmalarni yaratish (stock check + decrement atomik)
    const orders = await prisma.$transaction(async (tx) => {
      // Promo code — transaction ichida qayta tekshirish (race condition himoyasi)
      if (promoId && body.promoCode) {
        const freshPromo = await tx.promoCode.findFirst({
          where: {
            id: promoId,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });
        if (!freshPromo || (freshPromo.maxUses && freshPromo.currentUses >= freshPromo.maxUses)) {
          throw new AppError('Promo kod limiti tugagan');
        }
        const usedAlready = await tx.promoCodeUsage.findFirst({
          where: { promoId, userId },
        });
        if (usedAlready) {
          throw new AppError('Siz bu promo kodni oldin ishlatgansiz');
        }
        // Yangi discount hisoblash
        discount = freshPromo.discountType === 'percentage'
          ? (subtotal * Number(freshPromo.discountValue)) / 100
          : Number(freshPromo.discountValue);
      }

      // Stock tekshirish - SELECT FOR UPDATE bilan qulflash (race condition oldini oladi)
      for (const item of cartItems) {
        const locked: { id: string; stock: number; name: string; is_active: boolean }[] =
          await tx.$queryRaw`
            SELECT id, stock, name, is_active
            FROM products
            WHERE id = ${item.productId}::uuid
            FOR UPDATE
          `;
        const currentProduct = locked[0];
        if (!currentProduct) {
          throw new AppError(`"${item.product.name}" topilmadi`);
        }
        if (!currentProduct.is_active) {
          throw new AppError(`"${currentProduct.name}" mahsuloti sotuvda mavjud emas`);
        }
        // Variant bo'lsa — variant stock tekshir
        if (item.variantId) {
          const lockedVariants: { id: string; stock: number; is_active: boolean }[] =
            await tx.$queryRaw`
              SELECT id, stock, is_active
              FROM product_variants
              WHERE id = ${item.variantId}::uuid
              FOR UPDATE
            `;
          const currentVariant = lockedVariants[0];
          if (!currentVariant || !currentVariant.is_active) {
            throw new AppError(`"${currentProduct.name}" varianti mavjud emas`);
          }
          if (currentVariant.stock < item.quantity) {
            throw new AppError(
              `"${currentProduct.name}" varianti faqat ${currentVariant.stock} dona bor`,
            );
          }
        } else if (currentProduct.stock < item.quantity) {
          throw new AppError(
            `"${currentProduct.name}" mahsulotidan faqat ${currentProduct.stock} dona bor`,
          );
        }
      }

      const isPickup = body.deliveryMethod === 'pickup';
      const createdOrders = [];

      // Har bir do'kon uchun alohida buyurtma yaratish
      for (let i = 0; i < shopEntries.length; i++) {
        const entry = shopEntries[i]!;
        const shopItems = entry.items;
        const shopSubtotal = entry.shopSubtotal;
        // Promo code faqat birinchi (eng katta) orderga qo'llaniladi
        const orderDiscount = i === 0 ? discount : 0;
        const orderTotal = Math.max(0, shopSubtotal - orderDiscount + deliveryFeePerOrder);

        const newOrder = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId,
            addressId: body.addressId || null,
            status: 'pending',
            paymentStatus: body.paymentMethod === 'cash' ? 'pending' : 'pending',
            paymentMethod: body.paymentMethod,
            deliveryMethod: body.deliveryMethod,
            pickupPointId: isPickup ? body.pickupPointId : null,
            pickupCode: isPickup ? randomInt(100000, 999999).toString() : null,
            pickupToken: isPickup ? randomUUID() : null,
            subtotal: shopSubtotal,
            deliveryFee: deliveryFeePerOrder,
            discount: orderDiscount,
            total: orderTotal,
            recipientName: body.recipientName,
            recipientPhone: body.recipientPhone,
            deliveryDate: deliveryEstimate.estimatedDate || (body.deliveryDate ? new Date(body.deliveryDate) : null),
            deliveryTimeSlot: deliveryEstimate.estimatedTimeSlot || body.deliveryTimeSlot,
            promoCode: i === 0 ? body.promoCode?.toUpperCase() : null,
            note: body.note,
          },
        });

        // Order items yaratish (B-03: variantLabel to'ldirish + attributeValues)
        await tx.orderItem.createMany({
          data: shopItems.map((item: typeof shopItems[number]) => {
            const variantInfo = buildVariantInfo(item);
            return {
              orderId: newOrder.id,
              productId: item.productId,
              variantId: item.variantId || null,
              shopId: item.product.shopId,
              name: item.product.name,
              variantLabel: variantInfo.variantLabel,
              price: variantInfo.price || item.product.price,
              quantity: item.quantity,
              imageUrl: variantInfo.imageUrl || item.product.images?.[0] || null,
            };
          }),
        });

        // Status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: newOrder.id,
            status: 'pending',
            changedBy: userId,
            note: 'Buyurtma yaratildi — tasdiqlash kutilmoqda',
          },
        });

        createdOrders.push(newOrder);
      }

      // Stokni kamaytirish (barcha items uchun)
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        // Variant stock ham kamaytirish
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Savatdan faqat buyurtma qilingan mahsulotlarni o'chirish
      const orderedProductIds = cartItems.map(item => item.productId);
      await tx.cartItem.deleteMany({
        where: {
          userId,
          productId: { in: orderedProductIds },
        },
      });

      // Promo usage — atomik tekshiruv va yangilash
      if (promoId) {
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

      return createdOrders;
    });

    // 6. Bildirishnomalar (BullMQ orqali non-blocking)
    for (const order of orders) {
      enqueueNotification({ type: 'order_status', orderId: order.id, newStatus: 'pending' }).catch(() => {});
    }

    // 7. Javob — bitta yoki ko'p order
    const fullOrders = await prisma.order.findMany({
      where: { id: { in: orders.map(o => o.id) } },
      include: {
        items: true,
        address: true,
      },
    });

    // 7.5 Real-time: Vendorlarga yangi buyurtma + Admin dashboard
    for (const fullOrder of fullOrders) {
      const shopIds = [...new Set(fullOrder.items.map((i) => i.shopId))];
      for (const shopId of shopIds) {
        emitNewOrderToVendor(shopId, fullOrder);
      }
      emitToAdminDashboard('order:new', { order: fullOrder });
    }

    // Backward compatible: agar bitta order bo'lsa, data: order; aks holda data: orders[]
    if (fullOrders.length === 1) {
      return reply.status(201).send({
        success: true,
        data: fullOrders[0],
      });
    }

    return reply.status(201).send({
      success: true,
      data: fullOrders,
      meta: { orderCount: fullOrders.length },
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

    // Faqat pending va processing holatlarda bekor qilish mumkin
    if (!['pending', 'processing'].includes(order.status)) {
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

      // Promo kod qaytarish
      if (order.promoCode) {
        const promo = await tx.promoCode.findFirst({
          where: { code: order.promoCode },
        });
        if (promo) {
          // PromoCodeUsage o'chirish
          await tx.promoCodeUsage.deleteMany({
            where: { promoId: promo.id, userId: order.userId },
          });
          // currentUses kamaytirish
          await tx.promoCode.update({
            where: { id: promo.id },
            data: { currentUses: { decrement: 1 } },
          });
        }
      }

      // Karta to'lov qaytarish (refund)
      if (order.paymentStatus === 'paid' && order.paymentMethod !== 'cash') {
        // Tranzaksiyani refunded qilish
        await tx.transaction.updateMany({
          where: { orderId: id, status: 'completed' },
          data: { status: 'refunded' },
        });
        // Order paymentStatus ni refunded qilish
        await tx.order.update({
          where: { id },
          data: { paymentStatus: 'refunded' },
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
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

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
   * pending → processing (Do'kon tayyorlayapti)
   * processing → ready_for_pickup (Tayyor - kuryerga berish)
   */
  app.put(
    '/vendor/orders/:id/status',
    { preHandler: [authMiddleware, requireRole('vendor', 'admin')] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
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
          // Parallel increment (N+1 fix — har bir itemda stock farqli, updateMany mumkin emas)
          await Promise.all(items.map(item =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            }),
          ));

          // BL2: Agar kuryer tayinlangan bo'lsa — kuryerni bo'shatish
          if (order.courierId) {
            await tx.courier.update({
              where: { id: order.courierId },
              data: { status: 'online' },
            });

            // Kutilayotgan assignment larni bekor qilish
            await tx.deliveryAssignment.updateMany({
              where: { orderId: id, status: 'pending' },
              data: { status: 'cancelled' as any },
            });
          }
        }
      });

      // BL2 + W4: Kuryerga buyurtma bekor qilindi deb xabar berish
      if (body.status === 'cancelled' && order.courierId) {
        emitToCourier(order.courierId, 'order:cancelled', {
          orderId: id,
          orderNumber: order.orderNumber,
          reason: body.cancelReason || 'Vendor tomonidan bekor qilindi',
        });
      }

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

      // MUHIM: Agar "delivered" bo'lsa → salesCount oshirish + referral bonus berish
      if (body.status === 'delivered') {
        // Mahsulotlarning sotilgan sonini oshirish
        const deliveredItems = await prisma.orderItem.findMany({ where: { orderId: id } });
        const shopIds = new Set<string>();
        for (const item of deliveredItems) {
          if (item.shopId) shopIds.add(item.shopId);
        }

        // Parallel updates (N+1 fix — har bir item farqli quantity, updateMany mumkin emas)
        await Promise.all([
          ...deliveredItems.map(item =>
            prisma.product.update({
              where: { id: item.productId },
              data: { salesCount: { increment: item.quantity } },
            }),
          ),
          ...Array.from(shopIds).map(shopId =>
            prisma.shop.update({
              where: { id: shopId },
              data: { totalSales: { increment: 1 } },
            }),
          ),
        ]);

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

  // ============================================
  // NEW: Delivery info endpoint (O-03/F-03/B-10)
  // ============================================

  /**
   * GET /orders/delivery-info
   * Yetkazib berish narxi va vaqtini olish (checkout sahifasi uchun)
   */
  const deliveryInfoSchema = z.object({
    addressId: z.string().uuid().optional(),
    deliveryMethod: z.enum(['courier', 'pickup']).default('courier'),
    subtotal: z.coerce.number().min(0).default(0),
    scheduledDate: z.string().optional(),
    scheduledTimeSlot: z.string().optional(),
  });

  app.get('/orders/delivery-info', { preHandler: authMiddleware }, async (request, reply) => {
    const query = deliveryInfoSchema.parse(request.query);

    const info = await getDeliveryInfo({
      addressId: query.addressId,
      deliveryMethod: query.deliveryMethod,
      subtotal: query.subtotal,
      scheduledDate: query.scheduledDate,
      scheduledTimeSlot: query.scheduledTimeSlot,
    });

    return reply.send({ success: true, data: info });
  });

  // ============================================
  // NEW: Reorder endpoint (O-09)
  // ============================================

  /**
   * POST /orders/:id/reorder
   * Oldingi buyurtma mahsulotlarini savatga qayta qo'shish
   */
  app.post('/orders/:id/reorder', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const userId = request.user!.userId;

    const result = await reorderToCart(id, userId);

    return reply.send({
      success: true,
      data: result,
      message: result.skippedItems.length > 0
        ? `${result.addedItems.length} ta mahsulot qo'shildi, ${result.skippedItems.length} ta mavjud emas`
        : `${result.addedItems.length} ta mahsulot savatga qo'shildi`,
    });
  });

  // ============================================
  // NEW: Partial cancel endpoint (O-10)
  // ============================================

  /**
   * DELETE /orders/:id/items/:itemId
   * Buyurtmadan bitta mahsulotni bekor qilish
   */
  const cancelItemSchema = z.object({
    reason: z.string().max(500).optional(),
  });

  app.delete('/orders/:id/items/:itemId', { preHandler: authMiddleware }, async (request, reply) => {
    const params = z.object({
      id: z.string().uuid(),
      itemId: z.string().uuid(),
    }).parse(request.params);
    const body = cancelItemSchema.parse(request.body || {});
    const userId = request.user!.userId;

    const result = await cancelOrderItem(params.id, params.itemId, userId, body.reason);

    // Real-time update
    emitOrderStatusUpdate(params.id, result.orderCancelled ? 'cancelled' : 'item_cancelled', {
      cancelledItemId: params.itemId,
      newTotal: result.newOrderTotal,
    });

    return reply.send({
      success: true,
      data: result,
      message: result.orderCancelled
        ? 'Oxirgi mahsulot bekor qilindi — buyurtma bekor qilindi'
        : `"${result.cancelledItem.name}" buyurtmadan olib tashlandi`,
    });
  });

  // Also support POST for clients that don't send body with DELETE
  app.post('/orders/:id/items/:itemId/cancel', { preHandler: authMiddleware }, async (request, reply) => {
    const params = z.object({
      id: z.string().uuid(),
      itemId: z.string().uuid(),
    }).parse(request.params);
    const body = cancelItemSchema.parse(request.body || {});
    const userId = request.user!.userId;

    const result = await cancelOrderItem(params.id, params.itemId, userId, body.reason);

    emitOrderStatusUpdate(params.id, result.orderCancelled ? 'cancelled' : 'item_cancelled', {
      cancelledItemId: params.itemId,
      newTotal: result.newOrderTotal,
    });

    return reply.send({
      success: true,
      data: result,
      message: result.orderCancelled
        ? 'Oxirgi mahsulot bekor qilindi — buyurtma bekor qilindi'
        : `"${result.cancelledItem.name}" buyurtmadan olib tashlandi`,
    });
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

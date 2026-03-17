import { prisma } from '../../config/database.js';
import { notifyCourierNewDelivery, notifyOrderStatusChange } from '../notifications/notification.service.js';
import {
  emitOrderStatusUpdate,
  emitDeliveryOfferToCourier,
  emitToAdminDashboard,
} from '../../websocket/socket.js';
import { enqueueCourierAssignment } from '../../services/queue.service.js';

// ============================================
// Courier Service - Yandex Go style
// ============================================

/**
 * Eng yaqin online kuryerni topish va buyurtmaga tayinlash
 * 
 * FLOW:
 * 1. Buyurtma manzilini olish
 * 2. Do'kon manzilini olish
 * 3. Online/bo'sh kuryerlarni topish
 * 4. Masofani hisoblash (Haversine formula)
 * 5. Eng yaqiniga push yuborish
 * 6. 60 soniya kutish — qabul qilmasa keyingisiga
 */
const MAX_COURIER_ATTEMPTS = 10; // Maksimum 10 ta kuryerga urinib ko'rish

export async function findAndAssignCourier(orderId: string, excludedCourierIds: string[] = []): Promise<void> {
  // BL6: Cheksiz recursiyaning oldini olish
  if (excludedCourierIds.length >= MAX_COURIER_ATTEMPTS) {
    console.warn(`Order ${orderId}: ${MAX_COURIER_ATTEMPTS} ta kuryer rad etdi, to'xtatildi`);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      items: {
        include: {
          shop: { select: { id: true, name: true, address: true, latitude: true, longitude: true, ownerId: true } },
        },
      },
    },
  });

  if (!order || !order.address) {
    console.error(`Order ${orderId}: manzil topilmadi`);
    return;
  }

  const shop = order.items[0]?.shop;
  if (!shop?.latitude || !shop?.longitude) {
    console.error(`Order ${orderId}: do'kon joylashuvi topilmadi`);
    return;
  }

  // Online va bo'sh kuryerlarni topish (avval rad etganlarni chiqarib tashlash)
  const availableCouriers = await prisma.courier.findMany({
    where: {
      status: 'online',
      isVerified: true,
      currentLatitude: { not: null },
      currentLongitude: { not: null },
      ...(excludedCourierIds.length > 0 && {
        id: { notIn: excludedCourierIds },
      }),
    },
    include: {
      profile: { select: { id: true, fullName: true } },
    },
  });

  if (availableCouriers.length === 0) {
    console.warn(`Order ${orderId}: Online kuryer topilmadi`);
    // Vendorga xabar berish — kuryer topilmadi
    await prisma.notification.create({
      data: {
        userId: shop.ownerId,
        title: 'Kuryer topilmadi',
        body: `#${orderId.slice(0, 8)} buyurtma uchun online kuryer topilmadi. O'zingiz yetkazib berishingiz mumkin.`,
        type: 'system',
        data: { orderId } as any,
      },
    }).catch((err) => console.error('Vendor notification error:', err));
    return;
  }

  // Masofani hisoblash va saralash
  const couriersWithDistance = availableCouriers
    .map((courier) => ({
      ...courier,
      distanceToShop: calculateDistance(
        courier.currentLatitude!,
        courier.currentLongitude!,
        shop.latitude!,
        shop.longitude!,
      ),
    }))
    .filter((c) => c.distanceToShop <= c.maxDistance) // Faqat radius ichidagilar
    .sort((a, b) => a.distanceToShop - b.distanceToShop); // Eng yaqini birinchi

  if (couriersWithDistance.length === 0) {
    console.warn(`Order ${orderId}: Radius ichida kuryer topilmadi`);
    return;
  }

  // Eng yaqin kuryerga taklif yuborish
  const nearest = couriersWithDistance[0]!;
  const estimatedMinutes = Math.ceil((nearest.distanceToShop / 25) * 60); // ~25 km/h

  // Assignment yaratish (60 soniya muddat)
  const assignment = await prisma.deliveryAssignment.create({
    data: {
      orderId,
      courierId: nearest.id,
      status: 'pending',
      distanceKm: nearest.distanceToShop,
      estimatedMinutes,
      expiresAt: new Date(Date.now() + 60 * 1000), // 60 soniya
    },
  });

  // Kuryerga push notification
  await notifyCourierNewDelivery(
    nearest.profile.id, // profile ID for notification
    orderId,
    order.orderNumber,
    shop.name,
    nearest.distanceToShop,
    estimatedMinutes,
  );

  // Real-time: Kuryerga WebSocket orqali taklif
  emitDeliveryOfferToCourier(nearest.id, {
    orderId,
    orderNumber: order.orderNumber,
    shopName: shop.name,
    shopAddress: shop.address || '',
    deliveryAddress: order.address?.fullAddress || '',
    distanceKm: nearest.distanceToShop,
    estimatedMinutes,
    deliveryFee: Number(order.deliveryFee),
    expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
  });

  console.log(
    `Order ${order.orderNumber}: Kuryer ${nearest.profile.fullName}ga yuborildi (${nearest.distanceToShop.toFixed(1)} km)`,
  );

  // 60 soniyadan keyin tekshirish — BullMQ job queue orqali (server restart da ham saqlanadi)
  await enqueueCourierAssignment(
    {
      orderId,
      attempt: excludedCourierIds.length + 1,
      maxAttempts: MAX_COURIER_ATTEMPTS,
      excludeCourierIds: [...excludedCourierIds, nearest.id],
    },
    60 * 1000, // 60 soniya kechikish
  );
}

/**
 * Kuryer buyurtmani qabul qildi
 */
export async function courierAcceptOrder(
  courierId: string,
  orderId: string,
): Promise<void> {
  // Assignment ni topish
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: {
      orderId,
      courierId,
      status: 'pending',
    },
  });

  if (!assignment) {
    throw new Error('Taklif topilmadi yoki muddati tugagan');
  }

  const courier = await prisma.courier.findUnique({
    where: { id: courierId },
    include: { profile: true },
  });

  await prisma.$transaction(async (tx) => {
    // Assignment ni qabul qilish
    await tx.deliveryAssignment.update({
      where: { id: assignment.id },
      data: { status: 'accepted', respondedAt: new Date() },
    });

    // Buyurtmaga kuryerni tayinlash
    await tx.order.update({
      where: { id: orderId },
      data: {
        courierId,
        status: 'courier_assigned',
      },
    });

    // Kuryerni "busy" qilish
    await tx.courier.update({
      where: { id: courierId },
      data: { status: 'busy' },
    });

    // Status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'courier_assigned',
        changedBy: courier?.profileId,
      },
    });
  });

  // Bildirishnoma: Mijozga va Vendorga
  await notifyOrderStatusChange(orderId, 'order_assigned', {
    courierName: courier?.profile?.fullName || undefined,
  });

  // Real-time: Buyurtma kuzatuvchilariga
  emitOrderStatusUpdate(orderId, 'courier_assigned', {
    courierId,
    courierName: courier?.profile?.fullName,
  });

  // Real-time: Admin dashboardga kuryer tayinlangani haqida
  emitToAdminDashboard('order:courier-assigned', {
    orderId,
    courierId,
    courierName: courier?.profile?.fullName,
  });
}

/**
 * Kuryer buyurtmani rad etdi
 */
export async function courierRejectOrder(
  courierId: string,
  orderId: string,
): Promise<void> {
  await prisma.deliveryAssignment.updateMany({
    where: {
      orderId,
      courierId,
      status: 'pending',
    },
    data: { status: 'rejected', respondedAt: new Date() },
  });

  // Rad etgan kuryerlarni topish
  const rejected = await prisma.deliveryAssignment.findMany({
    where: { orderId, status: { in: ['rejected', 'expired'] } },
    select: { courierId: true },
  });
  const excludedIds = rejected.map((r) => r.courierId);

  // Keyingi kuryerga yuborish (avvalgilarni exclude qilish)
  findAndAssignCourier(orderId, excludedIds);
}

/**
 * Kuryer buyurtmani do'kondan oldi
 */
export async function courierPickedUp(
  courierId: string,
  orderId: string,
): Promise<void> {
  const courier = await prisma.courier.findUnique({
    where: { id: courierId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId, courierId },
      data: {
        status: 'courier_picked_up',
        pickedUpAt: new Date(),
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'courier_picked_up',
        changedBy: courier?.profileId,
      },
    });
  });

  await notifyOrderStatusChange(orderId, 'courier_picked_up');

  // Real-time: Buyurtma kuzatuvchilariga
  emitOrderStatusUpdate(orderId, 'courier_picked_up');

  // Real-time: Admin dashboardga
  emitToAdminDashboard('order:picked-up', { orderId });
}

/**
 * Kuryer yetkazishni boshladi (GPS tracking boshlaydi)
 */
export async function courierStartDelivery(
  courierId: string,
  orderId: string,
): Promise<void> {
  const courier = await prisma.courier.findUnique({
    where: { id: courierId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId, courierId },
      data: {
        status: 'shipping',
        shippingAt: new Date(),
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'shipping',
        changedBy: courier?.profileId,
      },
    });
  });

  await notifyOrderStatusChange(orderId, 'order_shipping');

  // Real-time: Buyurtma kuzatuvchilariga
  emitOrderStatusUpdate(orderId, 'shipping');

  // Real-time: Admin dashboardga
  emitToAdminDashboard('order:shipping', { orderId, courierId });
}

/**
 * Kuryer yetkazdi
 */
export async function courierDelivered(
  courierId: string,
  orderId: string,
): Promise<void> {
  const courier = await prisma.courier.findUnique({
    where: { id: courierId },
  });

  await prisma.$transaction(async (tx) => {
    // Avval buyurtmani olish — to'lov usulini tekshirish uchun
    const existingOrder = await tx.order.findUniqueOrThrow({
      where: { id: orderId, courierId },
      select: { paymentMethod: true, paymentStatus: true },
    });

    // BL1 FIX: Naqd to'lovda 'paid' qilmaslik — vendor tasdiqlashi kerak
    // Faqat allaqachon to'langan (karta/online) buyurtmalar 'paid' bo'ladi
    const isCashPayment = existingOrder.paymentMethod === 'cash';
    const newPaymentStatus = isCashPayment
      ? existingOrder.paymentStatus // Naqd — payment statusni o'zgartirmaslik
      : 'paid'; // Karta/online — allaqachon to'langan, 'paid' qilish

    const order = await tx.order.update({
      where: { id: orderId, courierId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(),
        paymentStatus: newPaymentStatus,
      },
      include: {
        items: {
          include: { shop: true },
        },
      },
    });

    // Status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'delivered',
        changedBy: courier?.profileId,
      },
    });

    // Kuryerni "online" ga qaytarish
    await tx.courier.update({
      where: { id: courierId },
      data: {
        status: 'online',
        totalDeliveries: { increment: 1 },
        totalEarnings: { increment: Number(order.deliveryFee) * 0.8 }, // 80% kuryerga
        balance: { increment: Number(order.deliveryFee) * 0.8 },
      },
    });

    // Vendor balansni yangilash
    for (const item of order.items) {
      const shop = item.shop;
      const itemTotal = Number(item.price) * item.quantity;
      const commission = (itemTotal * Number(shop.commissionRate)) / 100;
      const netAmount = itemTotal - commission;

      await tx.shop.update({
        where: { id: shop.id },
        data: {
          balance: { increment: netAmount },
          totalSales: { increment: 1 },
        },
      });

      await tx.vendorTransaction.create({
        data: {
          shopId: shop.id,
          orderId: order.id,
          amount: itemTotal,
          commission,
          netAmount,
          type: 'sale',
        },
      });
    }
  });

  await notifyOrderStatusChange(orderId, 'order_delivered');

  // Real-time: Buyurtma kuzatuvchilariga + Admin dashboard
  emitOrderStatusUpdate(orderId, 'delivered');
  emitToAdminDashboard('order:delivered', { orderId });
}

// ============================================
// Haversine formula — masofani hisoblash
// ============================================

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Yerning radiusi (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

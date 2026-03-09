import { prisma } from '../../config/database.js';
import { sendPushNotification, sendMulticastPush } from '../../config/firebase.js';
import { NotificationType } from '@prisma/client';

// ============================================
// Bildirishnoma xabarlari (UZ/RU)
// ============================================

interface NotificationMessage {
  title: string;
  body: string;
}

const NOTIFICATION_MESSAGES: Record<string, Record<string, (orderNum: string, extra?: string) => NotificationMessage>> = {
  // Vendorga
  vendor: {
    order_new: (orderNum) => ({
      title: '🛒 Yangi buyurtma!',
      body: `Buyurtma #${orderNum} tushdi. Qabul qiling!`,
    }),
    order_cancelled: (orderNum) => ({
      title: '❌ Buyurtma bekor qilindi',
      body: `Buyurtma #${orderNum} mijoz tomonidan bekor qilindi`,
    }),
    courier_picked_up: (orderNum) => ({
      title: '🚴 Kuryer oldi',
      body: `Buyurtma #${orderNum} kuryerga topshirildi`,
    }),
    order_delivered: (orderNum) => ({
      title: '✅ Yetkazildi!',
      body: `Buyurtma #${orderNum} muvaffaqiyatli yetkazildi`,
    }),
  },

  // Mijozga
  customer: {
    order_processing: (orderNum) => ({
      title: '👨‍🍳 Do\'kon tayyorlamoqda',
      body: `Buyurtma #${orderNum} do'kon tayyorlashni boshladi`,
    }),
    order_ready: (orderNum) => ({
      title: '📦 Tayyor!',
      body: `Buyurtma #${orderNum} tayyor. Kuryer izlamoqda...`,
    }),
    order_assigned: (orderNum, courierName) => ({
      title: '🚴 Kuryer tayinlandi',
      body: `${courierName || 'Kuryer'} buyurtma #${orderNum} ni olib keladi`,
    }),
    courier_picked_up: (orderNum) => ({
      title: '📍 Kuryer yo\'lda!',
      body: `Buyurtma #${orderNum} kuryerda. Xaritada kuzating!`,
    }),
    order_shipping: (orderNum) => ({
      title: '🚀 Yetkazilmoqda',
      body: `Buyurtma #${orderNum} sizga yo'lda!`,
    }),
    order_at_pickup_point: (orderNum, pointName) => ({
      title: '📦 Punktda tayyor!',
      body: `Buyurtma #${orderNum} ${pointName || 'topshirish punkti'}da kutmoqda. QR kodni ko'rsating!`,
    }),
    order_delivered: (orderNum) => ({
      title: '🎉 Yetkazildi!',
      body: `Buyurtma #${orderNum} yetkazildi. Baholang!`,
    }),
    order_cancelled: (orderNum, reason) => ({
      title: '❌ Bekor qilindi',
      body: `Buyurtma #${orderNum} bekor qilindi${reason ? ': ' + reason : ''}`,
    }),
  },

  // Kuryerga
  courier: {
    courier_new: (orderNum, shopName) => ({
      title: '📦 Yangi yetkazma!',
      body: `${shopName || 'Do\'kon'}dan buyurtma #${orderNum}. Qabul qilasizmi?`,
    }),
    order_cancelled: (orderNum) => ({
      title: '❌ Buyurtma bekor',
      body: `Buyurtma #${orderNum} bekor qilindi`,
    }),
  },

  // Adminga
  admin: {
    order_new: (orderNum) => ({
      title: '📊 Yangi buyurtma',
      body: `Buyurtma #${orderNum} tizimga tushdi`,
    }),
    order_delivered: (orderNum) => ({
      title: '✅ Yetkazildi',
      body: `Buyurtma #${orderNum} yetkazildi`,
    }),
  },
};

// ============================================
// Notification Service
// ============================================

/**
 * Bildirishnoma yaratish va push yuborish
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> {
  // 1. DB ga saqlash
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data || {},
    },
  });

  // 2. Push notification yuborish (barcha qurilmalarga)
  const devices = await prisma.userDevice.findMany({
    where: { userId, isActive: true },
    select: { fcmToken: true },
  });

  const tokens = devices.map((d) => d.fcmToken);

  if (tokens.length > 0) {
    const stringData: Record<string, string> = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        stringData[key] = String(value);
      }
    }
    await sendMulticastPush(tokens, title, body, stringData);
  }
}

/**
 * Buyurtma status o'zgarganda barcha tomonlarga bildirishnoma
 */
export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: string,
  extra?: { cancelReason?: string; courierName?: string },
): Promise<void> {
  // Buyurtma ma'lumotlarini olish
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true } },
      items: {
        include: {
          shop: {
            select: { id: true, ownerId: true, name: true },
          },
        },
      },
      courier: {
        include: {
          profile: { select: { id: true } },
        },
      },
      pickupPoint: { select: { name: true } },
    },
  });

  if (!order) return;

  const orderNum = order.orderNumber;
  const shopOwnerId = order.items[0]?.shop?.ownerId;
  const shopName = order.items[0]?.shop?.name;
  const customerId = order.userId;
  const courierId = order.courier?.profile?.id;
  const pickupPointName = (order as any).pickupPoint?.name;

  const notifications: Promise<void>[] = [];

  // --- Mijozga ---
  const customerMsg = NOTIFICATION_MESSAGES.customer?.[newStatus];
  if (customerMsg) {
    const extraStr = newStatus === 'order_at_pickup_point'
      ? pickupPointName
      : (extra?.courierName || extra?.cancelReason);
    const msg = customerMsg(orderNum, extraStr);
    notifications.push(
      createNotification(customerId, newStatus as NotificationType, msg.title, msg.body, {
        orderId,
        orderNumber: orderNum,
        type: 'order_status',
      }),
    );
  }

  // --- Vendorga ---
  if (shopOwnerId) {
    const vendorMsg = NOTIFICATION_MESSAGES.vendor?.[newStatus];
    if (vendorMsg) {
      const msg = vendorMsg(orderNum);
      notifications.push(
        createNotification(shopOwnerId, newStatus as NotificationType, msg.title, msg.body, {
          orderId,
          orderNumber: orderNum,
          type: 'order_status',
        }),
      );
    }
  }

  // --- Kuryerga ---
  if (courierId) {
    const courierMsg = NOTIFICATION_MESSAGES.courier?.[newStatus];
    if (courierMsg) {
      const msg = courierMsg(orderNum, shopName);
      notifications.push(
        createNotification(courierId, newStatus as NotificationType, msg.title, msg.body, {
          orderId,
          orderNumber: orderNum,
          type: 'delivery',
        }),
      );
    }
  }

  // --- Adminga ---
  const admins = await prisma.profile.findMany({
    where: { role: 'admin' },
    select: { id: true },
  });

  for (const admin of admins) {
    const adminMsg = NOTIFICATION_MESSAGES.admin?.[newStatus];
    if (adminMsg) {
      const msg = adminMsg(orderNum);
      notifications.push(
        createNotification(admin.id, newStatus as NotificationType, msg.title, msg.body, {
          orderId,
          orderNumber: orderNum,
          type: 'admin_order',
        }),
      );
    }
  }

  // Hammaga bir vaqtda yuborish
  await Promise.allSettled(notifications);
}

/**
 * Kuryerga yangi yetkazma taklifi yuborish
 */
export async function notifyCourierNewDelivery(
  courierId: string,
  orderId: string,
  orderNumber: string,
  shopName: string,
  distanceKm: number,
  estimatedMinutes: number,
): Promise<void> {
  const courierNewMsg = NOTIFICATION_MESSAGES.courier?.courier_new;
  if (!courierNewMsg) return;
  const msg = courierNewMsg(orderNumber, shopName);
  await createNotification(
    courierId,
    'courier_new' as NotificationType,
    msg.title,
    `${msg.body}\n📍 ${distanceKm.toFixed(1)} km • ⏱ ~${estimatedMinutes} min`,
    {
      orderId,
      orderNumber,
      shopName,
      distanceKm: distanceKm.toString(),
      estimatedMinutes: estimatedMinutes.toString(),
      type: 'delivery_offer',
    },
  );
}

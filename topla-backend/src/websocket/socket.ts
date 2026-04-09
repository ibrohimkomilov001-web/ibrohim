import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { z } from 'zod';
import { verifyToken, isTokenBlacklisted } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { checkRateLimit } from '../config/redis.js';

let io: SocketIOServer | null = null;

// ============================================
// Rate limiter for WS events (Redis-backed, in-memory fallback)
// ============================================
const wsRateLimitsFallback = new Map<string, { count: number; resetAt: number }>();

async function wsRateLimit(socketId: string, event: string, maxPerMinute: number): Promise<boolean> {
  // Redis-backed rate limiting (multi-node safe)
  try {
    const result = await checkRateLimit(`ws:${socketId}:${event}`, maxPerMinute, 60);
    return result.allowed;
  } catch {
    // Fallback: in-memory
    const key = `${socketId}:${event}`;
    const now = Date.now();
    const entry = wsRateLimitsFallback.get(key);

    if (!entry || now > entry.resetAt) {
      wsRateLimitsFallback.set(key, { count: 1, resetAt: now + 60000 });
      return true;
    }

    entry.count++;
    return entry.count <= maxPerMinute;
  }
}

// Har 5 daqiqada fallback tozalash
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of wsRateLimitsFallback) {
    if (now > entry.resetAt) wsRateLimitsFallback.delete(key);
  }
}, 300000);

// Validation schemas
const courierLocationSchema = z.object({
  courierId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).max(200).optional(),
  heading: z.number().min(0).max(360).optional(),
});

const uuidSchema = z.string().uuid();

// ============================================
// Active connections tracking
// ============================================

// orderId → Set<socketId> (mijozlar kuzatmoqda)
const orderWatchers = new Map<string, Set<string>>();

// courierId → socketId
const courierSockets = new Map<string, string>();

// userId → socketId
const userSockets = new Map<string, string>();

// adminId → socketId
const adminSockets = new Map<string, string>();

// socketId → token (har bir ulanish uchun token saqlash — blacklist tekshiruvi uchun)
const socketTokens = new Map<string, string>();

// ============================================
// Initialize WebSocket Server
// ============================================

export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(','),
      methods: ['GET', 'POST'],
    },
    // default path: /socket.io (matches nginx config)
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;

    // Fallback: httpOnly cookie dan token o'qish (web uchun)
    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const match = cookieHeader.match(/topla_at=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) {
      return next(new Error('Token kerak'));
    }

    try {
      // Blacklist tekshirish
      const blacklisted = await isTokenBlacklisted(token as string);
      if (blacklisted) {
        return next(new Error('Token bekor qilingan'));
      }

      const payload = verifyToken(token as string);
      (socket as any).user = payload;
      (socket as any)._token = token as string;
      next();
    } catch {
      next(new Error('Token yaroqsiz'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    // Token ni saqlash — periodic blacklist check uchun
    const connToken = (socket as any)._token;
    if (connToken) socketTokens.set(socket.id, connToken);

    // Track user socket
    userSockets.set(user.userId, socket.id);

    // Track admin socket
    if (user.role === 'admin') {
      adminSockets.set(user.userId, socket.id);
    }

    // ============================================
    // KURYER events
    // ============================================

    if (user.role === 'courier') {
      handleCourierConnection(socket, user);
    }

    // ============================================
    // MIJOZ events — buyurtmani kuzatish
    // ============================================

    // Mijoz buyurtmani kuzata boshlaydi (ownership check bilan)
    socket.on('track:order', async (orderId: string) => {
      try {
      // Input validation — UUID format tekshirish
      const parsed = uuidSchema.safeParse(orderId);
      if (!parsed.success) {
        socket.emit('error', { message: 'Noto\'g\'ri orderId formati' });
        return;
      }
      orderId = parsed.data;

      // Rate limit: 30 track requests per minute
      if (!await wsRateLimit(socket.id, 'track:order', 30)) {
        socket.emit('error', { message: 'Juda ko\'p so\'rov' });
        return;
      }

      // Ownership check — faqat o'zining buyurtmasini kuzatish mumkin
      if (user.role === 'user') {
        const order = await prisma.order.findFirst({
          where: { id: orderId, userId: user.userId },
          select: { id: true },
        });
        if (!order) {
          socket.emit('error', { message: 'Buyurtma topilmadi' });
          return;
        }
      }

      if (!orderWatchers.has(orderId)) {
        orderWatchers.set(orderId, new Set());
      }
      orderWatchers.get(orderId)!.add(socket.id);
      socket.join(`order:${orderId}`);
      } catch (err) {
        console.error('WS track:order xatolik:', err);
        socket.emit('error', { message: 'Server xatosi' });
      }
    });

    // Mijoz kuzatishni to'xtatdi
    socket.on('track:stop', (orderId: string) => {
      const parsed = uuidSchema.safeParse(orderId);
      if (!parsed.success) return;
      orderWatchers.get(parsed.data)?.delete(socket.id);
      socket.leave(`order:${parsed.data}`);
    });

    // ============================================
    // ADMIN events — dashboard kuzatish
    // ============================================

    socket.on('admin:watch-dashboard', () => {
      if (user.role !== 'admin') return;
      adminSockets.set(user.userId, socket.id);
      socket.join('admin:dashboard');
    });

    // ============================================
    // VENDOR events — buyurtmalarni kuzatish
    // ============================================

    socket.on('vendor:watch-orders', async () => {
      try {
      if (user.role !== 'vendor' && user.role !== 'admin') return;

      const shop = await prisma.shop.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (shop) {
        socket.join(`shop:${shop.id}`);
      }
      } catch (err) {
        console.error('WS vendor:watch-orders xatolik:', err);
        socket.emit('error', { message: 'Server xatosi' });
      }
    });

    // ============================================
    // CHAT events — real-time xabar almashish
    // ============================================

    // Chat roomga qo'shilish
    socket.on('chat:join', async (roomId: string) => {
      try {
      if (!roomId || typeof roomId !== 'string') return;
      if (!await wsRateLimit(socket.id, 'chat:join', 20)) return;

      // Admin har qanday roomga qo'shilishi mumkin
      if (user.role === 'admin') {
        const room = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          select: { id: true },
        });
        if (!room) {
          socket.emit('error', { message: 'Chat topilmadi' });
          return;
        }
        socket.join(`chat:${roomId}`);
        return;
      }

      // Ownership check — faqat o'zining chat roomiga qo'shilish
      const room = await prisma.chatRoom.findFirst({
        where: {
          id: roomId,
          OR: [
            { customerId: user.userId },
            { shop: { ownerId: user.userId } },
          ],
        },
        select: { id: true },
      });

      if (!room) {
        socket.emit('error', { message: 'Chat topilmadi' });
        return;
      }

      socket.join(`chat:${roomId}`);
      } catch (err) {
        console.error('WS chat:join xatolik:', err);
        socket.emit('error', { message: 'Server xatosi' });
      }
    });

    // Chat roomdan chiqish
    socket.on('chat:leave', (roomId: string) => {
      const parsed = uuidSchema.safeParse(roomId);
      if (!parsed.success) return;
      socket.leave(`chat:${parsed.data}`);
    });

    // Xabar yuborish (real-time)
    socket.on('chat:message', async (data: unknown) => {
      try {
      if (!await wsRateLimit(socket.id, 'chat:message', 30)) {
        socket.emit('error', { message: 'Juda ko\'p xabar' });
        return;
      }

      const chatMessageSchema = z.object({
        roomId: z.string().uuid(),
        content: z.string().min(1).max(2000),
      });

      const parsed = chatMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Noto\'g\'ri xabar', details: parsed.error.issues });
        return;
      }

      const { roomId, content } = parsed.data;

      // Ownership check
      const room = await prisma.chatRoom.findFirst({
        where: {
          id: roomId,
          OR: [
            { customerId: user.userId },
            { shop: { ownerId: user.userId } },
          ],
        },
        include: { shop: { select: { ownerId: true } } },
      });

      if (!room) {
        socket.emit('error', { message: 'Chat topilmadi' });
        return;
      }

      // Rol aniqlash
      const senderRole = room.customerId === user.userId ? 'user' : 'vendor';
      const senderId = user.userId;

      // Xabarni saqlash
      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          senderId,
          senderRole,
          message: content,
        },
      });

      // Room yangilash (lastMessage)
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          lastMessageAt: new Date(),
        },
      });

      // Roomdagi barcha foydalanuvchilarga yuborish
      emitToChatRoom(roomId, 'chat:new-message', {
        id: message.id,
        roomId,
        senderId,
        senderRole,
        message: content,
        createdAt: message.createdAt.toISOString(),
      });
      } catch (err) {
        console.error('WS chat:message xatolik:', err);
        socket.emit('error', { message: 'Server xatosi' });
      }
    });

    // Typing indicator
    socket.on('chat:typing', (roomId: string) => {
      const parsed = uuidSchema.safeParse(roomId);
      if (!parsed.success) return;
      if (!await wsRateLimit(socket.id, 'chat:typing', 20)) return;
      socket.to(`chat:${parsed.data}`).emit('chat:typing', {
        userId: user.userId,
        roomId: parsed.data,
      });
    });

    // Stop typing indicator
    socket.on('chat:stop-typing', (roomId: string) => {
      const parsed = uuidSchema.safeParse(roomId);
      if (!parsed.success) return;
      socket.to(`chat:${parsed.data}`).emit('chat:stop-typing', {
        userId: user.userId,
        roomId: parsed.data,
      });
    });

    // ============================================
    // DISCONNECT
    // ============================================

    socket.on('disconnect', () => {
      userSockets.delete(user.userId);
      adminSockets.delete(user.userId);
      socketTokens.delete(socket.id);

      // Kuryer disconnect
      if (user.role === 'courier') {
        const courierId = [...courierSockets.entries()].find(
          ([, sid]) => sid === socket.id,
        )?.[0];
        if (courierId) {
          courierSockets.delete(courierId);
        }
      }

      // Order watchers dan o'chirish
      for (const [orderId, watchers] of orderWatchers) {
        watchers.delete(socket.id);
        if (watchers.size === 0) {
          orderWatchers.delete(orderId);
        }
      }
    });
  });

  // Har 60 sekundda blacklist qilingan tokenli socketlarni uzish
  setInterval(async () => {
    for (const [socketId, token] of socketTokens) {
      try {
        const blacklisted = await isTokenBlacklisted(token);
        if (blacklisted) {
          const socket = io?.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit('error', { message: 'Session yakunlandi' });
            socket.disconnect(true);
          }
          socketTokens.delete(socketId);
        }
      } catch {
        // Ignore check errors
      }
    }
  }, 60_000);

  return io;
}

// ============================================
// Courier-specific handlers
// ============================================

function handleCourierConnection(socket: Socket, user: any): void {
  // Kuryerni track qilish
  socket.on('courier:online', async (courierId: string) => {
    try {
    // Tekshirish: courierId shu userga tegishlimi?
    const courier = await prisma.courier.findFirst({
      where: { id: courierId, profileId: user.userId },
    });
    if (!courier) {
      socket.emit('error', { message: 'Courier ID yaroqsiz' });
      return;
    }
    courierSockets.set(courierId, socket.id);
    socket.join(`courier:${courierId}`);
    } catch (err) {
      console.error('WS courier:online xatolik:', err);
      socket.emit('error', { message: 'Server xatosi' });
    }
  });

  // GPS joylashuvni yangilash (har 5 soniya)
  socket.on(
    'courier:location',
    async (data: unknown) => {
      try {
      // Rate limit: max 15 per minute (har 4 sekundda 1)
      if (!await wsRateLimit(socket.id, 'courier:location', 15)) {
        return; // Quietly drop — sekin yuborish kerak
      }

      // Input validation
      const parsed = courierLocationSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('error', { message: 'Noto\'g\'ri ma\'lumot', details: parsed.error.issues });
        return;
      }

      const validData = parsed.data;
      // Tekshirish: courierId shu userga tegishlimi?
      const courier = await prisma.courier.findFirst({
        where: { id: validData.courierId, profileId: user.userId },
      });
      if (!courier) {
        socket.emit('error', { message: 'Courier ID yaroqsiz' });
        return;
      }

      // DB da yangilash
      await prisma.courier.update({
        where: { id: validData.courierId },
        data: {
          currentLatitude: validData.latitude,
          currentLongitude: validData.longitude,
          lastLocationAt: new Date(),
        },
      });

      // Agar yetkazmoqda bo'lsa — tarix saqlash
      if (validData.orderId) {
        await prisma.courierLocation.create({
          data: {
            courierId: validData.courierId,
            latitude: validData.latitude,
            longitude: validData.longitude,
            speed: validData.speed,
            heading: validData.heading,
          },
        });

        // Buyurtmani kuzatayotgan mijozlarga yuborish
        emitToOrderWatchers(validData.orderId, 'tracking:location', {
          courierId: validData.courierId,
          latitude: validData.latitude,
          longitude: validData.longitude,
          speed: validData.speed,
          heading: validData.heading,
          timestamp: new Date().toISOString(),
        });
      }
      } catch (err) {
        console.error('WS courier:location xatolik:', err);
        socket.emit('error', { message: 'Server xatosi' });
      }
    },
  );
}

// ============================================
// Emit functions (boshqa modullardan chaqirish uchun)
// ============================================

/**
 * Buyurtmani kuzatayotgan barcha mijozlarga event yuborish
 */
export function emitToOrderWatchers(
  orderId: string,
  event: string,
  data: any,
): void {
  if (!io) return;
  io.to(`order:${orderId}`).emit(event, data);
}

/**
 * Vendorga (do'kon egasiga) event yuborish
 */
export function emitToShop(shopId: string, event: string, data: any): void {
  if (!io) return;
  io.to(`shop:${shopId}`).emit(event, data);
}

/**
 * Kuryerga event yuborish
 */
export function emitToCourier(courierId: string, event: string, data: any): void {
  if (!io) return;
  const socketId = courierSockets.get(courierId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

/**
 * Buyurtma status o'zgarganda — real-time yangilash
 */
export function emitOrderStatusUpdate(
  orderId: string,
  status: string,
  extra?: Record<string, any>,
): void {
  emitToOrderWatchers(orderId, 'order:status-changed', {
    orderId,
    status,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

/**
 * Vendorga yangi buyurtma keldi — real-time
 */
export function emitNewOrderToVendor(shopId: string, order: any): void {
  emitToShop(shopId, 'order:new', {
    order,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Kuryerga yangi yetkazma taklifi — real-time
 */
export function emitDeliveryOfferToCourier(
  courierId: string,
  offer: {
    orderId: string;
    orderNumber: string;
    shopName: string;
    shopAddress: string;
    deliveryAddress: string;
    distanceKm: number;
    estimatedMinutes: number;
    deliveryFee: number;
    expiresAt: string;
  },
): void {
  emitToCourier(courierId, 'delivery:offer', offer);
}

/**
 * Admin dashboard ga real-time statistika yangilanishi
 */
export function emitToAdminDashboard(event: string, data: any): void {
  if (!io) return;
  io.to('admin:dashboard').emit(event, data);
}

/**
 * Chat roomga real-time xabar/event yuborish
 */
export function emitToChatRoom(roomId: string, event: string, data: any): void {
  if (!io) return;
  io.to(`chat:${roomId}`).emit(event, data);
}

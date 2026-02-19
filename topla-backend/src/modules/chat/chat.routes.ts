// ============================================
// Chat Routes — Customer <-> Vendor messaging
// ============================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../../middleware/error.js';
import { parsePagination } from '../../utils/pagination.js';

// ============================================
// Routes
// ============================================
export async function chatRoutes(app: FastifyInstance) {

  // ==========================================
  // GET /chat/rooms — user's chat rooms
  // ==========================================
  app.get('/chat/rooms', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    let where: any;
    if (userRole === 'vendor') {
      // Vendor sees chats for their shop
      const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });
      if (!shop) return { success: true, data: [] };
      where = { shopId: shop.id };
    } else {
      // Customer sees their own chats
      where = { customerId: userId };
    }

    const rooms = await prisma.chatRoom.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
        shop: { select: { id: true, name: true, logoUrl: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { message: true, createdAt: true, senderRole: true, isRead: true },
        },
      },
    });

    // Add unread count — bitta so'rov bilan (N+1 muammoni bartaraf qilish)
    const senderRoleFilter = userRole === 'vendor' ? 'user' : 'vendor';
    const roomIds = rooms.map(r => r.id);

    const unreadCounts = roomIds.length > 0
      ? await prisma.chatMessage.groupBy({
          by: ['roomId'],
          where: {
            roomId: { in: roomIds },
            isRead: false,
            senderRole: senderRoleFilter,
          },
          _count: { id: true },
        })
      : [];

    const unreadMap = new Map(unreadCounts.map(u => [u.roomId, u._count.id]));
    const roomsWithUnread = rooms.map(room => ({
      ...room,
      unreadCount: unreadMap.get(room.id) || 0,
    }));

    return { success: true, data: roomsWithUnread };
  });

  // ==========================================
  // POST /chat/rooms — create new chat room
  // ==========================================
  app.post('/chat/rooms', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;
    const { shopId } = z.object({ shopId: z.string().uuid() }).parse(request.body);

    // Check if shop exists
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundError('Do\'kon');

    // Upsert — return existing or create new
    const room = await prisma.chatRoom.upsert({
      where: {
        customerId_shopId: { customerId: userId, shopId },
      },
      create: {
        customerId: userId,
        shopId,
      },
      update: {},
      include: {
        customer: { select: { id: true, fullName: true, avatarUrl: true } },
        shop: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return { success: true, data: room };
  });

  // ==========================================
  // GET /chat/rooms/:id/messages — message history
  // ==========================================
  app.get('/chat/rooms/:id/messages', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const userId = request.user!.userId;

    // Verify access
    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!room) throw new NotFoundError('Chat xonasi');

    const isCustomer = room.customerId === userId;
    const isVendor = room.shop.ownerId === userId;
    if (!isCustomer && !isVendor) throw new ForbiddenError();

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.chatMessage.count({ where: { roomId: id } }),
    ]);

    return {
      success: true,
      data: {
        items: messages.reverse(), // oldest first within page
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  });

  // ==========================================
  // POST /chat/rooms/:id/messages — send message
  // ==========================================
  app.post('/chat/rooms/:id/messages', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    const { message, imageUrl } = z.object({
      message: z.string().optional(),
      imageUrl: z.string().optional(),
    }).refine(data => data.message || data.imageUrl, {
      message: 'Xabar yoki rasm yuborilishi kerak',
    }).parse(request.body);

    // Verify access
    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!room) throw new NotFoundError('Chat xonasi');

    const isCustomer = room.customerId === userId;
    const isVendor = room.shop.ownerId === userId;
    if (!isCustomer && !isVendor) throw new ForbiddenError();

    const senderRole = isVendor ? 'vendor' : 'user';

    const chatMessage = await prisma.chatMessage.create({
      data: {
        roomId: id,
        senderId: userId,
        senderRole,
        message: message || null,
        imageUrl: imageUrl || null,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Update room lastMessageAt
    await prisma.chatRoom.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    return { success: true, data: chatMessage };
  });

  // ==========================================
  // PUT /chat/rooms/:id/read — mark messages read
  // ==========================================
  app.put('/chat/rooms/:id/read', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    // Mark messages from the OTHER side as read
    const otherRole = userRole === 'vendor' ? 'user' : 'vendor';

    await prisma.chatMessage.updateMany({
      where: {
        roomId: id,
        senderRole: otherRole,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true, message: 'Xabarlar o\'qildi' };
  });

  // ==========================================
  // GET /chat/unread-count — total unread
  // ==========================================
  app.get('/chat/unread-count', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;
    const userRole = request.user!.role;

    let roomWhere: any;
    if (userRole === 'vendor') {
      const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });
      if (!shop) return { success: true, data: { count: 0 } };
      roomWhere = { shopId: shop.id };
    } else {
      roomWhere = { customerId: userId };
    }

    const rooms = await prisma.chatRoom.findMany({
      where: roomWhere,
      select: { id: true },
    });

    if (rooms.length === 0) return { success: true, data: { count: 0 } };

    const otherRole = userRole === 'vendor' ? 'user' : 'vendor';

    const count = await prisma.chatMessage.count({
      where: {
        roomId: { in: rooms.map(r => r.id) },
        senderRole: otherRole,
        isRead: false,
      },
    });

    return { success: true, data: { count } };
  });
}

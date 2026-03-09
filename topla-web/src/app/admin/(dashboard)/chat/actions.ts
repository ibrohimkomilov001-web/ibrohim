import { fetchChatRooms, fetchChatMessages } from "@/lib/api/admin";
import type { PaginationMeta } from "@/components/ui/data-table-pagination";

export type ChatRoom = {
  id: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  customer: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
  shop: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  lastMessage?: {
    message: string;
    senderRole: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: 'user' | 'vendor';
  message: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
};

export type ChatRoomDetail = {
  id: string;
  customer: { id: string; fullName: string; avatarUrl?: string };
  shop: { id: string; name: string; logoUrl?: string };
};

export async function getChatRooms(params?: { search?: string; page?: number }): Promise<{
  rooms: ChatRoom[];
  pagination: PaginationMeta;
}> {
  try {
    const data = await fetchChatRooms(params);
    const rooms = (data.items || []).map((r: any) => ({
      id: r.id,
      status: r.status,
      lastMessageAt: r.lastMessageAt,
      createdAt: r.createdAt,
      customer: r.customer || { id: '', fullName: 'Noma\'lum', phone: '' },
      shop: r.shop || { id: '', name: 'Noma\'lum' },
      lastMessage: r.lastMessage || null,
      unreadCount: r.unreadCount || 0,
    }));
    return {
      rooms,
      pagination: data.pagination || { page: 1, limit: 20, total: rooms.length, totalPages: 1, hasMore: false },
    };
  } catch {
    return { rooms: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false } };
  }
}

export async function getChatMessages(roomId: string, params?: { page?: number }): Promise<{
  messages: ChatMessage[];
  room: ChatRoomDetail | null;
  pagination: PaginationMeta;
}> {
  try {
    const data = await fetchChatMessages(roomId, params);
    const messages = (data.items || []).map((m: any) => ({
      id: m.id,
      roomId: m.roomId,
      senderId: m.senderId,
      senderRole: m.senderRole,
      message: m.message,
      imageUrl: m.imageUrl,
      isRead: m.isRead,
      createdAt: m.createdAt,
      sender: m.sender,
    }));
    return {
      messages,
      room: data.room || null,
      pagination: data.pagination || { page: 1, limit: 20, total: messages.length, totalPages: 1, hasMore: false },
    };
  } catch {
    return {
      messages: [],
      room: null,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false },
    };
  }
}

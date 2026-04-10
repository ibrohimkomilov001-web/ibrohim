/**
 * Chat API — Buyer-to-Seller messaging
 * Uses user auth (httpOnly cookies) for authenticated requests.
 */

import { createRequest, createTokenHelpers } from './base-client';

// Reuse the same user auth config as user-auth.ts
const tryRefreshToken = async (): Promise<boolean> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const tokenHelpers = createTokenHelpers('topla_user');
  if (!tokenHelpers.isAuthenticated()) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
};

const chatRequest = createRequest({
  tokenKey: 'topla_user',
  loginRedirect: null,
  onUnauthorized: tryRefreshToken,
});

// ============ TYPES ============

export interface ChatRoom {
  id: string;
  customerId: string;
  shopId: string;
  status: 'active' | 'closed';
  lastMessageAt?: string;
  createdAt: string;
  customer?: { id: string; fullName?: string; avatarUrl?: string };
  shop?: { id: string; name: string; logoUrl?: string };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: 'user' | 'vendor' | 'admin';
  message?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; fullName?: string; avatarUrl?: string };
}

// ============ API ============

export const chatApi = {
  /** Create or get existing chat room with a shop */
  createRoom: (shopId: string) =>
    chatRequest<ChatRoom>('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ shopId }),
    }),

  /** Get messages for a chat room */
  getMessages: (roomId: string, page = 1) =>
    chatRequest<ChatMessage[]>(`/chat/rooms/${encodeURIComponent(roomId)}/messages?page=${page}&limit=50`),

  /** Send a message to a chat room */
  sendMessage: (roomId: string, message: string) =>
    chatRequest<ChatMessage>(`/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

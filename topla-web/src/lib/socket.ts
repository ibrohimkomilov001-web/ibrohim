// ============================================
// Socket.IO Client — real-time WebSocket connection
// ============================================

import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

/**
 * Get existing socket instance (may be null or disconnected)
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Connect to Socket.IO server.
 * Auth: httpOnly cookie (web) yoki JWT token (legacy/mobile).
 * Reuses existing connection if already connected.
 */
export function connectSocket(token?: string | null): Socket {
  if (socketInstance?.connected) return socketInstance;

  // Disconnect old instance if exists
  if (socketInstance) {
    socketInstance.disconnect();
  }

  // In browser: connect to same origin (nginx proxies /socket.io/ to backend)
  // In dev without nginx: connect to backend directly
  const wsUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, '') || 'http://localhost:3001');

  socketInstance = io(wsUrl, {
    auth: token ? { token } : undefined,
    withCredentials: true, // httpOnly cookie orqali auth (XSS himoyasi)
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    timeout: 10000,
  });

  return socketInstance;
}

/**
 * Disconnect and cleanup socket instance
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

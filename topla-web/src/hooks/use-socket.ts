'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface UseSocketOptions {
  /** JWT token for authentication */
  token: string | null;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

/**
 * Hook to manage Socket.IO connection lifecycle.
 * Connects on mount (when token is available), disconnects on unmount.
 */
export function useSocket(options: UseSocketOptions) {
  const { token, autoConnect = true } = options;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect || !token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // If already connected
    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, autoConnect]);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
  };
}

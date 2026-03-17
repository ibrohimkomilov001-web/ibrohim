'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './use-socket';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: 'user' | 'vendor' | 'admin';
  message: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface UseChatSocketOptions {
  /** JWT token for authentication (optional — httpOnly cookies preferred) */
  token?: string | null;
  /** Callback when a new message arrives */
  onNewMessage?: (msg: ChatMessage) => void;
}

/**
 * Hook for real-time chat functionality via Socket.IO.
 * Manages room join/leave, typing indicators, and message events.
 */
export function useChatSocket(options: UseChatSocketOptions) {
  const { token, onNewMessage } = options;
  const { socket, connected, emit, on } = useSocket({ token });

  // Track which rooms are joined
  const joinedRooms = useRef<Set<string>>(new Set());

  // Typing state: roomId → Set of userIds typing
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Listen for chat events
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (msg: ChatMessage) => {
      onNewMessage?.(msg);
    };

    const handleTyping = (data: { userId: string; roomId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        const roomTypers = new Set(next.get(data.roomId) || []);
        roomTypers.add(data.userId);
        next.set(data.roomId, roomTypers);
        return next;
      });

      // Auto-clear after 3s
      const key = `${data.roomId}:${data.userId}`;
      if (typingTimeouts.current.has(key)) {
        clearTimeout(typingTimeouts.current.get(key)!);
      }
      typingTimeouts.current.set(key, setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Map(prev);
          const roomTypers = new Set(next.get(data.roomId) || []);
          roomTypers.delete(data.userId);
          if (roomTypers.size === 0) next.delete(data.roomId);
          else next.set(data.roomId, roomTypers);
          return next;
        });
      }, 3000));
    };

    const handleStopTyping = (data: { userId: string; roomId: string }) => {
      const key = `${data.roomId}:${data.userId}`;
      if (typingTimeouts.current.has(key)) {
        clearTimeout(typingTimeouts.current.get(key)!);
        typingTimeouts.current.delete(key);
      }
      setTypingUsers(prev => {
        const next = new Map(prev);
        const roomTypers = new Set(next.get(data.roomId) || []);
        roomTypers.delete(data.userId);
        if (roomTypers.size === 0) next.delete(data.roomId);
        else next.set(data.roomId, roomTypers);
        return next;
      });
    };

    socket.on('chat:new-message', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stop-typing', handleStopTyping);

    return () => {
      socket.off('chat:new-message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stop-typing', handleStopTyping);
      typingTimeouts.current.forEach(t => clearTimeout(t));
    };
  }, [socket, connected, onNewMessage]);

  const joinRoom = useCallback((roomId: string) => {
    if (joinedRooms.current.has(roomId)) return;
    emit('chat:join', roomId);
    joinedRooms.current.add(roomId);
  }, [emit]);

  const leaveRoom = useCallback((roomId: string) => {
    emit('chat:leave', roomId);
    joinedRooms.current.delete(roomId);
  }, [emit]);

  const sendMessage = useCallback((roomId: string, content: string) => {
    emit('chat:message', { roomId, content });
  }, [emit]);

  const startTyping = useCallback((roomId: string) => {
    emit('chat:typing', roomId);
  }, [emit]);

  const stopTyping = useCallback((roomId: string) => {
    emit('chat:stop-typing', roomId);
  }, [emit]);

  const isRoomTyping = useCallback((roomId: string) => {
    const typers = typingUsers.get(roomId);
    return typers ? typers.size > 0 : false;
  }, [typingUsers]);

  return {
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    isRoomTyping,
    typingUsers,
  };
}

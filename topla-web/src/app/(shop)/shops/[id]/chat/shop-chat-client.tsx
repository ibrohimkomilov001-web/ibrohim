'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { chatApi, type ChatMessage, type ChatRoom } from '@/lib/api/chat';
import { shopApi } from '@/lib/api/shop';
import { resolveImageUrl } from '@/lib/api/upload';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/store/locale-store';
import Image from 'next/image';

interface ShopChatClientProps {
  shopId: string;
}

export default function ShopChatClient({ shopId }: ShopChatClientProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to profile/login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/profile');
    }
  }, [isAuthenticated, router]);

  // Fetch shop info
  const { data: shop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => shopApi.getShop(shopId),
    enabled: !!shopId,
  });

  // Create or get chat room
  const { data: room, isLoading: isCreatingRoom } = useQuery({
    queryKey: ['chat-room', shopId],
    queryFn: () => chatApi.createRoom(shopId),
    enabled: !!shopId && isAuthenticated,
  });

  useEffect(() => {
    if (room?.id) setRoomId(room.id);
  }, [room]);

  // Socket.IO for real-time messages
  const onNewMessage = useCallback(
    (msg: ChatMessage) => {
      if (msg.roomId === roomId) {
        queryClient.setQueryData(
          ['chat-messages', roomId],
          (old: any) => {
            const list: ChatMessage[] = Array.isArray(old) ? old : old?.data ?? [];
            if (list.some((m) => m.id === msg.id)) return old;
            return [...list, msg];
          },
        );
      }
    },
    [roomId, queryClient],
  );

  const { joinRoom, leaveRoom, connected, startTyping, stopTyping, isRoomTyping } = useChatSocket({
    onNewMessage,
  });

  const sellerIsTyping = roomId ? isRoomTyping(roomId) : false;

  // Fetch messages (only poll when socket disconnected)
  const { data: messagesRaw, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => chatApi.getMessages(roomId!),
    enabled: !!roomId,
    refetchInterval: connected ? false : 5000,
  });
  const messages: ChatMessage[] = Array.isArray(messagesRaw) ? messagesRaw : (messagesRaw as any)?.data ?? [];

  useEffect(() => {
    if (roomId && connected) {
      joinRoom(roomId);
      return () => leaveRoom(roomId);
    }
  }, [roomId, connected, joinRoom, leaveRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sellerIsTyping]);

  // Send message
  const sendMutation = useMutation({
    mutationFn: ({ roomId, message }: { roomId: string; message: string }) =>
      chatApi.sendMessage(roomId, message),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(
        ['chat-messages', roomId],
        (old: any) => {
          const list: ChatMessage[] = Array.isArray(old) ? old : old?.data ?? [];
          if (list.some((m) => m.id === newMsg.id)) return old;
          return [...list, newMsg];
        },
      );
      setInput('');
      if (roomId) stopTyping(roomId);
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !roomId || sendMutation.isPending) return;
    sendMutation.mutate({ roomId, message: trimmed });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (roomId && connected) {
      startTyping(roomId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (roomId) stopTyping(roomId);
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return t('today');
    if (isYesterday) return t('yesterday');
    return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="site-container text-center py-20">
        <p className="text-lg">{t('loginToChat')}</p>
      </div>
    );
  }

  const isLoading = isCreatingRoom || isLoadingMessages;

  return (
    <div className="site-container max-w-2xl mx-auto py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {shop && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
              {shop.logoUrl ? (
                <Image
                  src={resolveImageUrl(shop.logoUrl)}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">
                  🏪
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{shop.name}</p>
              <p className="text-xs text-muted-foreground">
                {sellerIsTyping
                  ? (locale === 'ru' ? 'печатает...' : 'yozmoqda...')
                  : connected
                    ? (locale === 'ru' ? 'Онлайн' : 'Onlayn')
                    : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="h-[60vh] overflow-y-auto p-4 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {locale === 'ru'
                ? 'Напишите первое сообщение продавцу'
                : 'Sotuvchiga birinchi xabar yozing'}
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                const showDate =
                  i === 0 ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(messages[i - 1].createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                        {msg.imageUrl && (
                          <Image
                            src={resolveImageUrl(msg.imageUrl)}
                            alt=""
                            width={240}
                            height={180}
                            className="rounded-lg mt-1"
                            unoptimized
                          />
                        )}
                        <p
                          className={`text-[10px] mt-0.5 ${
                            isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
          {/* Typing indicator */}
          {sellerIsTyping && (
            <div className="flex justify-start mb-1 px-1">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            rows={1}
            className="flex-1 resize-none bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all max-h-32"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

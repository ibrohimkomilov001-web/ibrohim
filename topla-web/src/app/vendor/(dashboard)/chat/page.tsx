'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, ArrowLeft, User, Clock, Wifi, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDateTime, formatTime } from '@/lib/utils';
import api from '@/lib/api/client';
import { useChatSocket, type ChatMessage as SocketMessage } from '@/hooks/use-chat-socket';
import { useTranslation } from '@/store/locale-store';

function getVendorToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface ChatRoom {
  id: string;
  status: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  customer?: { id: string; fullName: string; avatarUrl?: string; phone?: string };
  messages?: { message: string; createdAt: string; senderRole: string; isRead: boolean }[];
}

interface ChatMessage {
  id: string;
  message: string;
  content?: string;
  senderId: string;
  senderRole: string;
  senderType?: string;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; fullName: string; avatarUrl?: string };
}

/* ── Room List Panel ── */
function RoomList({
  rooms,
  selectedRoom,
  onSelect,
  isLoading,
  typingRoomCheck,
}: {
  rooms: ChatRoom[];
  selectedRoom: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  typingRoomCheck: (roomId: string) => boolean;
}) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="font-medium">{t('noChatYet')}</p>
        <p className="text-sm text-muted-foreground">{t('chatsAppearHere')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y overflow-y-auto">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelect(room.id)}
          className={cn(
            "w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
            selectedRoom === room.id && "bg-primary/5 border-l-2 border-primary"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative flex-shrink-0">
            <User className="w-6 h-6 text-primary" />
            {(room.unreadCount ?? 0) > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                {room.unreadCount}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">
                {room.customer?.fullName || t('customer')}
              </p>
              {room.lastMessageAt && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(room.lastMessageAt)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {typingRoomCheck(room.id) ? (
                <span className="text-primary italic">{t('typing')}</span>
              ) : (
                room.messages?.[0]?.message || ''
              )}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ── Chat Panel ── */
function ChatPanel({
  room,
  messages,
  message,
  setMessage,
  onSend,
  isSending,
  onBack,
  messagesEndRef,
  isTyping,
}: {
  room?: ChatRoom;
  messages: ChatMessage[];
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
  onBack: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isTyping: boolean;
}) {
  const { t } = useTranslation();
  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">{t('selectChat')}</p>
          <p className="text-sm mt-1">{t('selectChatDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="lg:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">
            {room.customer?.fullName || t('customer')}
          </p>
          {isTyping ? (
            <p className="text-xs text-primary animate-pulse">{t('typing')}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {room.status === 'active' ? t('activeChatStatus') : t('closedChatStatus')}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isVendor = msg.senderRole === 'vendor' || msg.senderType === 'vendor';
          return (
            <div key={msg.id} className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isVendor
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              }`}>
                <p className="text-sm">{msg.message || msg.content}</p>
                <p className={`text-[10px] mt-1 ${isVendor ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatTime(msg.createdAt)}
                  {isVendor && msg.isRead && ' ✓✓'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
            placeholder={t('writeMessage')}
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={onSend}
            disabled={!message.trim() || isSending}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function VendorChatPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [token] = useState(() => getVendorToken());
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Socket.IO real-time connection
  const handleNewMessage = useCallback((msg: SocketMessage) => {
    setRealtimeMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, {
        id: msg.id,
        message: msg.message,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        isRead: false,
        createdAt: msg.createdAt,
      }];
    });
    // Refresh room list to update last message / unread count
    queryClient.invalidateQueries({ queryKey: ['vendor-chat-rooms'] });
  }, [queryClient]);

  const { connected, joinRoom, leaveRoom, sendMessage, startTyping, stopTyping, isRoomTyping } = useChatSocket({
    token,
    onNewMessage: handleNewMessage,
  });

  // Fetch rooms (initial load, no polling)
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['vendor-chat-rooms'],
    queryFn: () => api.get<ChatRoom[]>('/chat/rooms'),
  });

  const rooms = Array.isArray(roomsData) ? roomsData : [];

  // Fetch messages for selected room (initial load, no polling)
  const { data: messagesData } = useQuery({
    queryKey: ['vendor-chat-messages', selectedRoom],
    queryFn: () =>
      api.get<{ items: ChatMessage[]; pagination: any }>(`/chat/rooms/${selectedRoom}/messages`),
    enabled: !!selectedRoom,
  });

  const fetchedMessages: ChatMessage[] = (messagesData as any)?.items || (Array.isArray(messagesData) ? messagesData : []);

  // Merge fetched + real-time messages (deduplicated)
  const allMessages = [
    ...fetchedMessages,
    ...realtimeMessages.filter(rm => !fetchedMessages.some(fm => fm.id === rm.id)),
  ];

  // Select a room
  const handleSelectRoom = useCallback((roomId: string) => {
    if (selectedRoom) leaveRoom(selectedRoom);
    setSelectedRoom(roomId);
    setRealtimeMessages([]);
    if (connected) joinRoom(roomId);
  }, [selectedRoom, connected, joinRoom, leaveRoom]);

  // Join room when connection established
  useEffect(() => {
    if (connected && selectedRoom) joinRoom(selectedRoom);
  }, [connected, selectedRoom, joinRoom]);

  // Mark as read
  useEffect(() => {
    if (selectedRoom) {
      api.put(`/chat/rooms/${selectedRoom}/read`).catch(() => {});
    }
  }, [selectedRoom, allMessages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  // Send message via Socket.IO (with REST fallback)
  const handleSend = useCallback(async () => {
    if (!message.trim() || !selectedRoom) return;
    const content = message.trim();
    setMessage('');
    setIsSending(true);
    stopTyping(selectedRoom);

    if (connected) {
      sendMessage(selectedRoom, content);
      setIsSending(false);
    } else {
      try {
        // REST fallback — backend expects { message } not { content }
        await api.post(`/chat/rooms/${selectedRoom}/messages`, { message: content });
        queryClient.invalidateQueries({ queryKey: ['vendor-chat-messages', selectedRoom] });
      } catch {
        setMessage(content);
      } finally {
        setIsSending(false);
      }
    }
  }, [message, selectedRoom, connected, sendMessage, stopTyping, queryClient]);

  // Handle typing indicator
  const handleInputChange = useCallback((value: string) => {
    setMessage(value);
    if (!selectedRoom || !connected) return;
    if (value.trim()) {
      startTyping(selectedRoom);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => stopTyping(selectedRoom), 2000);
    } else {
      stopTyping(selectedRoom);
    }
  }, [selectedRoom, connected, startTyping, stopTyping]);

  const currentRoom = rooms.find((r) => r.id === selectedRoom);

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* Left panel — Room list */}
      <div className={cn(
        "w-full lg:w-80 lg:border-r flex flex-col flex-shrink-0",
        selectedRoom ? "hidden lg:flex" : "flex"
      )}>
        <div className="px-5 py-4 border-b flex-shrink-0">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> {t('vendorChatTitle')}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('chatWithCustomers')}</span>
            {connected ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>
        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelect={handleSelectRoom}
          isLoading={roomsLoading}
          typingRoomCheck={isRoomTyping}
        />
      </div>

      {/* Right panel — Chat */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        !selectedRoom ? "hidden lg:flex" : "flex"
      )}>
        <ChatPanel
          room={currentRoom}
          messages={allMessages}
          message={message}
          setMessage={handleInputChange}
          onSend={handleSend}
          isSending={isSending}
          onBack={() => { if (selectedRoom) leaveRoom(selectedRoom); setSelectedRoom(null); }}
          messagesEndRef={messagesEndRef}
          isTyping={selectedRoom ? isRoomTyping(selectedRoom) : false}
        />
      </div>
    </div>
  );
}

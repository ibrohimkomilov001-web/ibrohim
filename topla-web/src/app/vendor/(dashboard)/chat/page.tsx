'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, ArrowLeft, User, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDateTime, formatTime } from '@/lib/utils';
import api from '@/lib/api/client';

interface ChatRoom {
  id: string;
  status: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  customer?: { id: string; firstName: string; lastName?: string; avatarUrl?: string };
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: string;
  isRead: boolean;
  createdAt: string;
}

/* ── Room List Panel ── */
function RoomList({
  rooms,
  selectedRoom,
  onSelect,
  isLoading,
}: {
  rooms: ChatRoom[];
  selectedRoom: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
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
        <p className="font-medium">Hozircha chat yo&apos;q</p>
        <p className="text-sm text-muted-foreground">Mijozlar sizga yozganda bu yerda ko&apos;rinadi</p>
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
                {room.customer?.firstName} {room.customer?.lastName || ''}
              </p>
              {room.lastMessageAt && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(room.lastMessageAt)}
                </span>
              )}
            </div>
            {room.lastMessage && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{room.lastMessage}</p>
            )}
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
}: {
  room?: ChatRoom;
  messages: ChatMessage[];
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
  onBack: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Chatni tanlang</p>
          <p className="text-sm mt-1">Chap paneldan suhbatni tanlang</p>
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
            {room.customer?.firstName} {room.customer?.lastName || ''}
          </p>
          <p className="text-xs text-muted-foreground">
            {room.status === 'active' ? 'Faol' : 'Yopilgan'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isVendor = msg.senderType === 'vendor';
          return (
            <div key={msg.id} className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isVendor
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isVendor ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatTime(msg.createdAt)}
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
            placeholder="Xabar yozing..."
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
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['vendor-chat-rooms'],
    queryFn: () => api.get<{ data: ChatRoom[] }>('/chat/rooms').then((r) => r.data),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['vendor-chat-messages', selectedRoom],
    queryFn: () =>
      api.get<{ data: ChatMessage[] }>(`/chat/rooms/${selectedRoom}/messages`).then((r) => r.data),
    enabled: !!selectedRoom,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/chat/rooms/${selectedRoom}/messages`, { content }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['vendor-chat-messages', selectedRoom] });
      queryClient.invalidateQueries({ queryKey: ['vendor-chat-rooms'] });
    },
  });

  // Mark as read
  useEffect(() => {
    if (selectedRoom) {
      api.put(`/chat/rooms/${selectedRoom}/read`).catch(() => {});
    }
  }, [selectedRoom, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !selectedRoom) return;
    sendMutation.mutate(message.trim());
  };

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
            <MessageCircle className="w-5 h-5" /> Chat
          </h1>
          <p className="text-sm text-muted-foreground">Mijozlar bilan muloqot</p>
        </div>
        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelect={setSelectedRoom}
          isLoading={roomsLoading}
        />
      </div>

      {/* Right panel — Chat */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        !selectedRoom ? "hidden lg:flex" : "flex"
      )}>
        <ChatPanel
          room={currentRoom}
          messages={messages}
          message={message}
          setMessage={setMessage}
          onSend={handleSend}
          isSending={sendMutation.isPending}
          onBack={() => setSelectedRoom(null)}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  );
}

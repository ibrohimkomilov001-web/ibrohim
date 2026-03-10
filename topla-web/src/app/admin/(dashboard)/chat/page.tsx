'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, MessageCircle, Search, ArrowLeft, Wifi, WifiOff, User, Store } from 'lucide-react'
import { getChatRooms, getChatMessages, type ChatRoom, type ChatMessage, type ChatRoomDetail } from './actions'
import { toast } from 'sonner'
import { useChatSocket, type ChatMessage as SocketMessage } from '@/hooks/use-chat-socket'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { DataTablePagination, type PaginationMeta } from '@/components/ui/data-table-pagination'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/store/locale-store'

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return 'Kecha'
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })
}

function formatFullTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Bugun'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Kecha'
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AdminChatPage() {
  const [token] = useState(() => getAdminToken())
  const { t } = useTranslation()

  const queryClient = useQueryClient()

  // Room list state
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [roomsPage, setRoomsPage] = useState(1)

  // Rooms query (HTTP)
  const roomsQuery = useQuery({
    queryKey: ['admin-chat-rooms', debouncedSearch, roomsPage],
    queryFn: () => getChatRooms({ search: debouncedSearch || undefined, page: roomsPage }),
  })
  const rooms = roomsQuery.data?.rooms ?? []
  const roomsPagination = roomsQuery.data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false }
  const roomsLoading = roomsQuery.isLoading

  // Active chat state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Messages query (HTTP)
  const messagesQuery = useQuery({
    queryKey: ['admin-chat-messages', activeRoomId],
    queryFn: () => getChatMessages(activeRoomId!),
    enabled: !!activeRoomId,
  })
  const messages = messagesQuery.data?.messages ?? []
  const activeRoom = messagesQuery.data?.room ?? null
  const messagesLoading = messagesQuery.isLoading && !!activeRoomId

  // Socket connection for real-time
  const handleNewMessage = useCallback((msg: SocketMessage) => {
    // Update messages cache for the specific room
    queryClient.setQueryData(
      ['admin-chat-messages', msg.roomId],
      (old: { messages: ChatMessage[]; room: ChatRoomDetail | null } | undefined) => {
        if (!old) return old
        if (old.messages.some(m => m.id === msg.id)) return old
        return {
          ...old,
          messages: [...old.messages, {
            id: msg.id,
            roomId: msg.roomId,
            senderId: msg.senderId,
            senderRole: msg.senderRole as 'user' | 'vendor',
            message: msg.message,
            isRead: false,
            createdAt: msg.createdAt,
          }],
        }
      }
    )

    // Update room list caches (all page/search variants)
    queryClient.setQueriesData<{ rooms: ChatRoom[]; pagination: PaginationMeta }>({
      queryKey: ['admin-chat-rooms'],
    }, (old) => {
      if (!old) return old
      return {
        ...old,
        rooms: old.rooms.map(r => {
          if (r.id === msg.roomId) {
            return {
              ...r,
              lastMessage: {
                message: msg.message,
                senderRole: msg.senderRole,
                createdAt: msg.createdAt,
                isRead: false,
              },
              lastMessageAt: msg.createdAt,
              unreadCount: r.id === activeRoomId ? r.unreadCount : r.unreadCount + 1,
            }
          }
          return r
        }),
      }
    })
  }, [activeRoomId, queryClient])

  const { connected, joinRoom, leaveRoom, isRoomTyping } = useChatSocket({
    token,
    onNewMessage: handleNewMessage,
  })

  // Reset page on search
  useEffect(() => {
    if (roomsPage > 1) setRoomsPage(1)
  }, [debouncedSearch])

  // Select a room
  const selectRoom = useCallback((roomId: string) => {
    // Leave previous room
    if (activeRoomId) leaveRoom(activeRoomId)

    setActiveRoomId(roomId)

    // Join room for real-time updates
    if (connected) joinRoom(roomId)
  }, [activeRoomId, connected, joinRoom, leaveRoom])

  // Join room when connection established
  useEffect(() => {
    if (connected && activeRoomId) {
      joinRoom(activeRoomId)
    }
  }, [connected, activeRoomId, joinRoom])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Go back to room list (mobile)
  const goBack = useCallback(() => {
    if (activeRoomId) leaveRoom(activeRoomId)
    setActiveRoomId(null)
  }, [activeRoomId, leaveRoom])

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: ChatMessage[] }[]>((groups, msg) => {
    const dateStr = new Date(msg.createdAt).toDateString()
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && new Date(lastGroup.messages[0].createdAt).toDateString() === dateStr) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ date: dateStr, messages: [msg] })
    }
    return groups
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          {activeRoomId && (
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{t('chatMonitoring')}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {connected ? (
                <><Wifi className="h-3 w-3 text-green-500" /> <span className="text-green-600">Online</span></>
              ) : (
                <><WifiOff className="h-3 w-3 text-red-500" /> <span className="text-red-600">Offline</span></>
              )}
              <span>| {roomsPagination.total} {t('conversationsCount')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Room List */}
        <div className={cn(
          "w-full sm:w-80 lg:w-96 border-r flex flex-col",
          activeRoomId ? "hidden sm:flex" : "flex"
        )}>
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchUserOrShop')}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Room List */}
          <ScrollArea className="flex-1">
            <div className="relative">
              {roomsLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {rooms.length === 0 && !roomsLoading ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t('chatsNotFound')}</p>
                </div>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room.id)}
                    className={cn(
                      "w-full text-left p-3 border-b hover:bg-muted/50 transition-colors",
                      activeRoomId === room.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={room.customer.avatarUrl || ''} />
                        <AvatarFallback className="text-xs">
                          {room.customer.fullName?.slice(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {room.customer.fullName || room.customer.phone}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {room.lastMessageAt ? formatTime(room.lastMessageAt) : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Store className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{room.shop.name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {isRoomTyping(room.id) ? (
                              <span className="text-primary italic">{t('typing')}</span>
                            ) : room.lastMessage ? (
                              <>
                                <span className="font-medium">
                                  {room.lastMessage.senderRole === 'user' ? t('customer') : t('seller')}:
                                </span>
                                {' '}{room.lastMessage.message}
                              </>
                            ) : (
                              t('noMessages')
                            )}
                          </p>
                          {room.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] text-xs px-1.5">
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Rooms pagination */}
          <div className="border-t p-2">
            <DataTablePagination
              pagination={roomsPagination}
              onPageChange={(p) => setRoomsPage(p)}
            />
          </div>
        </div>

        {/* Right: Messages */}
        <div className={cn(
          "flex-1 flex flex-col",
          !activeRoomId ? "hidden sm:flex" : "flex"
        )}>
          {!activeRoomId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('selectChat')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('selectChatFromLeft')}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              {activeRoom && (
                <div className="px-4 py-3 border-b bg-background">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex -space-x-2">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={activeRoom.customer.avatarUrl || ''} />
                          <AvatarFallback className="text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={activeRoom.shop.logoUrl || ''} />
                          <AvatarFallback className="text-xs">
                            <Store className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {activeRoom.customer.fullName}
                          <span className="text-muted-foreground font-normal"> ↔ </span>
                          {activeRoom.shop.name}
                        </div>
                        {isRoomTyping(activeRoomId) && (
                          <p className="text-xs text-primary animate-pulse">{t('typing')}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Monitoring
                    </Badge>
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{t('noMessages')}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <div className="flex justify-center my-4">
                          <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                            {formatDateDivider(group.messages[0].createdAt)}
                          </span>
                        </div>
                        {group.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex mb-2",
                              msg.senderRole === 'vendor' ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2",
                              msg.senderRole === 'vendor'
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className={cn(
                                  "text-[10px] font-medium",
                                  msg.senderRole === 'vendor' ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  {msg.senderRole === 'user' ? (
                                    <>{msg.sender?.fullName || t('customer')}</>
                                  ) : (
                                    <>{msg.sender?.fullName || t('seller')}</>
                                  )}
                                </span>
                              </div>
                              {msg.imageUrl && (
                                <img
                                  src={msg.imageUrl}
                                  alt="Rasm"
                                  className="rounded-lg max-w-[200px] mb-1"
                                />
                              )}
                              <p className="text-sm break-words">{msg.message}</p>
                              <div className={cn(
                                "text-[10px] mt-1 text-right",
                                msg.senderRole === 'vendor' ? "text-primary-foreground/60" : "text-muted-foreground"
                              )}>
                                {formatFullTime(msg.createdAt)}
                                {msg.isRead && ' ✓✓'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Admin notice (read-only) */}
              <div className="px-4 py-3 border-t bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  {t('adminMonitoringNotice')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

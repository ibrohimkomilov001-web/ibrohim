'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Send, ArrowLeft, Headphones, CheckCircle2, RotateCcw, MessageSquare, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  getSupportTickets,
  getSupportTicketMessages,
  sendSupportAdminReply,
  updateSupportTicketStatus,
} from '@/lib/api/admin'

// ─── Types ────────────────────────────────────────────────
interface SupportTicket {
  id: string
  status: 'open' | 'closed'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
    phone: string | null
  }
  messages: {
    message: string
    senderType: string
    createdAt: string
  }[]
}

interface SupportMessage {
  id: string
  ticketId: string
  senderId: string | null
  senderType: 'user' | 'admin' | 'bot'
  message: string
  imageUrl: string | null
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    fullName: string
    avatarUrl: string | null
  } | null
}

// ─── Helpers ──────────────────────────────────────────────
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isToday) return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === yesterday.toDateString()) return 'Kecha'
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

// ─── Main Component ───────────────────────────────────────
export default function AdminSupportPage() {
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState<'open' | 'closed'>('open')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Ticket list ──
  const ticketsQuery = useQuery({
    queryKey: ['admin-support-tickets', activeStatus],
    queryFn: () => getSupportTickets({ status: activeStatus, limit: 50 }),
    refetchInterval: 15000, // Poll every 15s for new tickets
  })
  const tickets: SupportTicket[] = (ticketsQuery.data?.data?.items ?? []) as SupportTicket[]
  const ticketsLoading = ticketsQuery.isLoading

  // ── Messages for selected ticket ──
  const messagesQuery = useQuery({
    queryKey: ['admin-support-messages', selectedTicketId],
    queryFn: () => getSupportTicketMessages(selectedTicketId!),
    enabled: !!selectedTicketId,
    refetchInterval: 8000, // Poll every 8s for new messages
  })
  const rawMessages = messagesQuery.data?.data?.items ?? []
  const messages: SupportMessage[] = rawMessages as SupportMessage[]
  const messagesLoading = messagesQuery.isLoading && !!selectedTicketId

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) ?? null

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Select ticket ──
  const selectTicket = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId)
    setReplyText('')
  }, [])

  // ── Reply mutation ──
  const replyMutation = useMutation({
    mutationFn: () => sendSupportAdminReply(selectedTicketId!, replyText.trim()),
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedTicketId] })
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets', activeStatus] })
    },
    onError: () => {
      toast.error('Javob yuborishda xatolik')
    },
  })

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicketId) return
    replyMutation.mutate()
  }

  // ── Status mutation ──
  const statusMutation = useMutation({
    mutationFn: (status: 'open' | 'closed') => updateSupportTicketStatus(selectedTicketId!, status),
    onSuccess: (_data, status) => {
      toast.success(status === 'closed' ? 'Murojaat yopildi' : 'Murojaat qayta ochildi')
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets', 'open'] })
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets', 'closed'] })
      setSelectedTicketId(null)
    },
    onError: () => {
      toast.error('Xatolik yuz berdi')
    },
  })

  // ── Group messages by date ──
  const groupedMessages = messages.reduce<{ date: string; messages: SupportMessage[] }[]>((groups, msg) => {
    const dateStr = new Date(msg.createdAt).toDateString()
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && new Date(lastGroup.messages[0].createdAt).toDateString() === dateStr) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ date: dateStr, messages: [msg] })
    }
    return groups
  }, [])

  // ── Filtered tickets ──
  const filteredTickets = tickets.filter(t => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      t.user.fullName?.toLowerCase().includes(q) ||
      t.user.phone?.includes(q) ||
      t.messages[0]?.message?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          {selectedTicketId && (
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSelectedTicketId(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Support Chat</h1>
              <p className="text-xs text-muted-foreground">
                {ticketsQuery.data?.data?.pagination?.total ?? 0} ta murojaat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Ticket List */}
        <div className={cn(
          'w-full sm:w-80 lg:w-96 border-r flex flex-col',
          selectedTicketId ? 'hidden sm:flex' : 'flex'
        )}>
          {/* Status Tabs */}
          <div className="p-3 border-b">
            <Tabs value={activeStatus} onValueChange={(v) => {
              setActiveStatus(v as 'open' | 'closed')
              setSelectedTicketId(null)
            }}>
              <TabsList className="w-full">
                <TabsTrigger value="open" className="flex-1">Ochiq</TabsTrigger>
                <TabsTrigger value="closed" className="flex-1">Yopilgan</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Foydalanuvchi qidirish..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Ticket List */}
          <ScrollArea className="flex-1">
            <div className="relative">
              {ticketsLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {filteredTickets.length === 0 && !ticketsLoading ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {activeStatus === 'open' ? 'Ochiq murojaatlar yo\'q' : 'Yopilgan murojaatlar yo\'q'}
                  </p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const lastMsg = ticket.messages[0]
                  const initials = (ticket.user.fullName || 'U').slice(0, 2).toUpperCase()
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => selectTicket(ticket.id)}
                      className={cn(
                        'w-full text-left p-3 border-b hover:bg-muted/50 transition-colors',
                        selectedTicketId === ticket.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={ticket.user.avatarUrl || ''} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-sm truncate">
                              {ticket.user.fullName || ticket.user.phone || 'Foydalanuvchi'}
                            </span>
                            {lastMsg && (
                              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                {formatTime(lastMsg.createdAt)}
                              </span>
                            )}
                          </div>
                          {lastMsg && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {lastMsg.senderType === 'admin' ? '↩ ' : lastMsg.senderType === 'bot' ? '🤖 ' : ''}
                              {lastMsg.message || '[Rasm]'}
                            </p>
                          )}
                          {ticket.user.phone && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{ticket.user.phone}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Chat Area */}
        <div className={cn(
          'flex-1 flex flex-col',
          !selectedTicketId ? 'hidden sm:flex' : 'flex'
        )}>
          {!selectedTicketId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Headphones className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Murojaatni tanlang</p>
                <p className="text-sm mt-1">Chap paneldan foydalanuvchi murojaatini tanlang</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedTicket?.user.avatarUrl || ''} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {(selectedTicket?.user.fullName || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">
                      {selectedTicket?.user.fullName || selectedTicket?.user.phone || 'Foydalanuvchi'}
                    </p>
                    {selectedTicket?.user.phone && (
                      <p className="text-xs text-muted-foreground">{selectedTicket.user.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={selectedTicket?.status === 'open' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      selectedTicket?.status === 'open'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    )}
                  >
                    {selectedTicket?.status === 'open' ? 'Ochiq' : 'Yopilgan'}
                  </Badge>
                  {selectedTicket?.status === 'open' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate('closed')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Yopish
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-[#2AABEE] hover:bg-blue-50"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate('open')}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Ochish
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">Hali xabarlar yo&apos;q</p>
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
                        {group.messages.map((msg) => {
                          const isAdmin = msg.senderType === 'admin'
                          const isBot = msg.senderType === 'bot'
                          const isUser = msg.senderType === 'user'

                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                'flex mb-2',
                                (isAdmin || isBot) ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {isUser && (
                                <Avatar className="h-6 w-6 mr-2 flex-shrink-0 mt-1">
                                  <AvatarImage src={selectedTicket?.user.avatarUrl || ''} />
                                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                    {(selectedTicket?.user.fullName || 'U').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                'max-w-[75%] rounded-2xl px-3.5 py-2',
                                isAdmin
                                  ? 'bg-[#2AABEE] text-white rounded-br-md'
                                  : isBot
                                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100 rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              )}>
                                <div className={cn(
                                  'text-[10px] font-medium mb-0.5',
                                  isAdmin ? 'text-white/70' : isBot ? 'text-purple-600 dark:text-purple-300' : 'text-muted-foreground'
                                )}>
                                  {isAdmin ? 'Admin' : isBot ? '🤖 Bot' : (selectedTicket?.user.fullName || 'Foydalanuvchi')}
                                </div>
                                {msg.imageUrl && (
                                  <div className="rounded-lg overflow-hidden max-w-[200px] mb-1">
                                    <Image
                                      src={msg.imageUrl}
                                      alt="Rasm"
                                      width={200}
                                      height={200}
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                                <div className={cn(
                                  'text-[10px] mt-1 text-right',
                                  isAdmin ? 'text-white/60' : 'text-muted-foreground'
                                )}>
                                  {formatFullTime(msg.createdAt)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Reply input */}
              {selectedTicket?.status === 'open' ? (
                <div className="px-4 py-3 border-t">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Javob yozing..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendReply()
                          }
                        }}
                        className="pr-3 rounded-2xl"
                        disabled={replyMutation.isPending}
                      />
                    </div>
                    <Button
                      size="icon"
                      className="rounded-full h-9 w-9 bg-[#2AABEE] hover:bg-[#1A9FE2] text-white border-0 flex-shrink-0"
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || replyMutation.isPending}
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 border-t bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">
                    Bu murojaat yopilgan. Javob yuborish uchun murojaatni qayta oching.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

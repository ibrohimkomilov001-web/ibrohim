'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Bell, Trash2, Send, CheckCircle } from 'lucide-react'
import { getNotifications, getNotificationStats, createNotification, sendNotification, deleteNotification, type Notification } from './actions'
import { useToast } from '@/components/ui/use-toast'

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'news' as 'system' | 'order' | 'promo' | 'news',
    target_type: 'all' as 'all' | 'users' | 'vendors' | 'specific'
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [notificationsData, statsData] = await Promise.all([
        getNotifications(),
        getNotificationStats()
      ])
      setNotifications(notificationsData)
      setStats(statsData)
    } catch (error) {
      console.error(error)
      toast({ title: "Xatolik", description: "Ma'lumotlarni yuklashda xatolik", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.body.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async () => {
    if (!formData.title || !formData.body) {
      toast({ title: "Xatolik", description: "Sarlavha va matnni kiriting", variant: "destructive" })
      return
    }

    try {
      setActionLoading(true)
      await createNotification(formData)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Bildirishnoma yaratildi" })
      setCreateDialogOpen(false)
      setFormData({ title: '', body: '', type: 'news', target_type: 'all' })
    } catch (error) {
      toast({ title: "Xatolik", description: "Yaratishda xatolik", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSend = async (id: string) => {
    try {
      await sendNotification(id)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Bildirishnoma yuborildi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "Yuborishda xatolik", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bildirishnomani o'chirishni xohlaysizmi?")) return
    try {
      await deleteNotification(id)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Bildirishnoma o'chirildi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "O'chirishda xatolik", variant: "destructive" })
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-blue-100 text-blue-800'
      case 'order': return 'bg-green-100 text-green-800'
      case 'promo': return 'bg-purple-100 text-purple-800'
      case 'news': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Bildirishnomalar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Push-bildirishnomalarni boshqaring</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi bildirishnoma
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Jami</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Yuborilgan</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Kutilmoqda</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Bildirishnomalar ro'yxati</CardTitle>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Bildirishnomalar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        {notification.is_sent && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.is_sent && (
                        <Button variant="ghost" size="sm" onClick={() => handleSend(notification.id)} className="text-primary">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(notification.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeBadgeColor(notification.type)} variant="outline">
                      {notification.type === 'system' && 'Tizim'}
                      {notification.type === 'order' && 'Buyurtma'}
                      {notification.type === 'promo' && 'Aksiya'}
                      {notification.type === 'news' && 'Yangiliklar'}
                    </Badge>
                    <Badge variant="outline">
                      {notification.target_type === 'all' && 'Hammaga'}
                      {notification.target_type === 'users' && 'Foydalanuvchilar'}
                      {notification.target_type === 'vendors' && 'Sotuvchilar'}
                      {notification.target_type === 'specific' && 'Tanlangan'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi bildirishnoma</DialogTitle>
            <DialogDescription>Push bildirishnoma yaratish va yuborish</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sarlavha *</Label>
              <Input
                placeholder="Yangi aksiya!"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Matn *</Label>
              <Textarea
                placeholder="Bildirishnoma matni..."
                value={formData.body}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, body: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select value={formData.type} onValueChange={(v: typeof formData.type) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">Yangilik</SelectItem>
                    <SelectItem value="promo">Aksiya</SelectItem>
                    <SelectItem value="system">Tizim</SelectItem>
                    <SelectItem value="order">Buyurtma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kimga</Label>
                <Select value={formData.target_type} onValueChange={(v: typeof formData.target_type) => setFormData({ ...formData, target_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Hammaga</SelectItem>
                    <SelectItem value="users">Foydalanuvchilar</SelectItem>
                    <SelectItem value="vendors">Sotuvchilar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

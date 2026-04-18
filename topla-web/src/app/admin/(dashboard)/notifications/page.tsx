'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Bell, Trash2, Send, CheckCircle, Image, Link, Upload, X } from 'lucide-react'
import { getNotifications, getNotificationStats, createNotification, sendNotification, deleteNotification, type Notification } from './actions'
import { adminUploadImage } from '@/lib/api/admin'
import { toast } from 'sonner'
import { useTranslation } from '@/store/locale-store';

export default function AdminNotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'news' as 'system' | 'order' | 'promo' | 'news',
    target_type: 'all' as 'all' | 'users' | 'vendors' | 'specific',
    imageUrl: '',
    linkUrl: '',
  })

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => getNotifications(),
  })

  const { data: stats = { total: 0, sent: 0, pending: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'notificationStats'],
    queryFn: () => getNotificationStats(),
  })

  const loading = notificationsLoading || statsLoading

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'notificationStats'] })
      toast.success(t('notificationCreated'))
      setCreateDialogOpen(false)
      setFormData({ title: '', body: '', type: 'news', target_type: 'all', imageUrl: '', linkUrl: '' })
    },
    onError: () => {
      toast.error(t('createError'))
    },
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => sendNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'notificationStats'] })
      toast.success(t('notificationSent'))
    },
    onError: () => {
      toast.error(t('sendError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'notificationStats'] })
      toast.success(t('notificationDeleted'))
    },
    onError: () => {
      toast.error(t('deleteError'))
    },
  })

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.body.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = () => {
    if (!formData.title || !formData.body) {
      toast.error(t('titleAndTextRequired'))
      return
    }
    createMutation.mutate(formData)
  }

  const handleSend = (id: string) => {
    sendMutation.mutate(id)
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDeleteNotification'))) return
    deleteMutation.mutate(id)
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'order': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'promo': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'news': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
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
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('notifications')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('pushNotifications')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newNotification')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalItems')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('sent')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('pending')}</CardTitle>
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
            <CardTitle className="text-base sm:text-lg">{t('notificationsList')}</CardTitle>
            <Input
              placeholder={t('searchPlaceholderGeneric')}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">{t('notificationsNotFound')}</p>
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
                      {notification.imageUrl && (
                        <div className="mt-2">
                          <img src={notification.imageUrl} alt="" className="h-16 rounded-md object-cover" />
                        </div>
                      )}
                      {notification.linkUrl && (
                        <a href={notification.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 flex items-center gap-1">
                          <Link className="h-3 w-3" />{notification.linkUrl}
                        </a>
                      )}
                      {notification.sent_count > 0 && (
                        <p className="text-xs text-green-600 mt-1">{notification.sent_count} ta foydalanuvchiga yuborildi</p>
                      )}
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
                      {notification.type === 'system' && t('systemType')}
                      {notification.type === 'order' && t('orderType')}
                      {notification.type === 'promo' && t('promoType')}
                      {notification.type === 'news' && t('newsType')}
                    </Badge>
                    <Badge variant="outline">
                      {notification.target_type === 'all' && t('toAll')}
                      {notification.target_type === 'users' && t('toUsers')}
                      {notification.target_type === 'vendors' && t('toVendors')}
                      {notification.target_type === 'specific' && t('toSelected')}
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
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Image className="h-4 w-4" /> Rasm</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    setImageUploading(true)
                    const url = await adminUploadImage(file, 'notification')
                    setFormData(prev => ({ ...prev, imageUrl: url }))
                    toast.success('Rasm yuklandi')
                  } catch (err) {
                    toast.error('Rasmni yuklashda xatolik')
                  } finally {
                    setImageUploading(false)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }
                }}
              />
              {formData.imageUrl ? (
                <div className="relative inline-block">
                  <img src={formData.imageUrl} alt="" className="h-32 rounded-lg object-cover border" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  disabled={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuklanmoqda...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Rasm tanlash</>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Link className="h-4 w-4" /> Havola</Label>
              <Input
                placeholder="https://topla.uz/..."
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getBanners, createBanner, updateBanner, deleteBanner, type Banner } from './actions'

const positionLabels: Record<string, string> = {
  home_top: 'Bosh sahifa (yuqori)',
  home_middle: 'Bosh sahifa (o\'rta)',
  home_bottom: 'Bosh sahifa (pastki)',
  category_top: 'Kategoriya sahifasi',
  product_sidebar: 'Mahsulot sahifasi',
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    position: '',
    startDate: '',
    endDate: '',
  })

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getBanners()
      setBanners(data)
    } catch {
      toast.error('Bannerlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBanners() }, [loadBanners])

  const handleAdd = async () => {
    if (!formData.title.trim()) { toast.error('Sarlavha kiritilishi kerak'); return }
    try {
      setActionLoading(true)
      await createBanner({
        title: formData.title.trim(),
        link: formData.link.trim() || undefined,
        position: formData.position || 'home_top',
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: true,
      })
      toast.success('Banner yaratildi')
      setAddDialogOpen(false)
      setFormData({ title: '', link: '', position: '', startDate: '', endDate: '' })
      loadBanners()
    } catch {
      toast.error('Banner yaratishda xatolik')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (banner: Banner) => {
    try {
      await updateBanner(banner.id, { isActive: !banner.isActive })
      toast.success(banner.isActive ? "Banner o'chirildi" : 'Banner yoqildi')
      loadBanners()
    } catch {
      toast.error('Xatolik yuz berdi')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bannerni o'chirishni xohlaysizmi?")) return
    try {
      await deleteBanner(id)
      toast.success("Banner o'chirildi")
      loadBanners()
    } catch {
      toast.error("O'chirishda xatolik")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bannerlar</h1>
          <p className="text-muted-foreground">
            Reklama bannerlarini boshqaring
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Banner qo'shish</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Yangi banner</DialogTitle>
              <DialogDescription>
                Yangi reklama banneri qo'shing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sarlavha</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Banner sarlavhasi"
                />
              </div>

              <div className="space-y-2">
                <Label>Rasm</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Rasmni bu yerga tashlang yoki
                  </p>
                  <Button variant="outline" size="sm">Fayl tanlash</Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tavsiya: 1200x400 px, max 2MB
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Havola (link)</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/category/electronics yoki https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Joylashuv</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Joylashuvni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(positionLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Boshlanish sanasi</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tugash sanasi</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleAdd} disabled={actionLoading}>
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Qo&apos;shish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami bannerlar</CardTitle>
            <span className="text-2xl">🖼️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faol</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {banners.filter(b => b.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nofaol</CardTitle>
            <span className="text-2xl">⏸️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {banners.filter(b => !b.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-3">🖼️</div>
            <p className="font-medium">Hali bannerlar yo&apos;q</p>
            <p className="text-sm text-muted-foreground mt-1">Yangi banner qo&apos;shishni boshlang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.isActive ? 'opacity-60' : ''}>
              <div className="aspect-[3/1] bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover rounded-t-lg" />
                ) : (
                  <span className="text-white text-4xl">🖼️</span>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{banner.title}</CardTitle>
                  <Badge className={banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {banner.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
                <CardDescription>{positionLabels[banner.position || ''] || banner.position || '-'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {banner.startDate && banner.endDate && (
                  <div className="text-sm text-muted-foreground">
                    {banner.startDate} - {banner.endDate}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant={banner.isActive ? 'destructive' : 'default'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggle(banner)}
                  >
                    {banner.isActive ? "O'chirish" : 'Yoqish'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(banner.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

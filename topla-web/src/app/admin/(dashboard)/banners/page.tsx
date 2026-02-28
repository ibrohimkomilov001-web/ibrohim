'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getBanners, createBanner, updateBanner, deleteBanner, type Banner } from './actions'
import { adminUploadImage } from '@/lib/api/admin'

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
    subtitle: '',
    link: '',
    actionType: 'none',
    position: '',
    startDate: '',
    endDate: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Faqat rasm fayllari ruxsat etilgan (JPG, PNG, WebP, GIF)')
      return
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Rasm hajmi 5MB dan oshmasligi kerak')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any
      handleFileSelect(fakeEvent)
    }
  }

  const handleAdd = async () => {
    if (!formData.title.trim()) { toast.error('Sarlavha kiritilishi kerak'); return }
    if (!selectedFile) { toast.error('Rasm tanlash shart'); return }

    try {
      setActionLoading(true)

      // 1. Rasmni upload qilish
      setUploadLoading(true)
      let imageUrl: string
      try {
        imageUrl = await adminUploadImage(selectedFile, 'banner')
      } catch (uploadErr: any) {
        toast.error(`Rasm yuklashda xatolik: ${uploadErr.message || 'Noma\'lum xato'}`)
        return
      } finally {
        setUploadLoading(false)
      }

      if (!imageUrl) {
        toast.error('Rasm URL olinmadi')
        return
      }

      // 2. Bannerni yaratish
      await createBanner({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        imageUrl,
        actionType: formData.actionType || 'none',
        link: formData.link.trim() || undefined,
        position: formData.position || 'home_top',
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: true,
      })
      toast.success('Banner yaratildi')
      setAddDialogOpen(false)
      setFormData({ title: '', subtitle: '', link: '', actionType: 'none', position: '', startDate: '', endDate: '' })
      handleRemoveImage()
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label>Qo&apos;shimcha matn</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Qisqa tavsif (ixtiyoriy)"
                />
              </div>

              <div className="space-y-2">
                <Label>Rasm *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="w-full h-40 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Rasmni bu yerga tashlang yoki
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Fayl tanlash
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG, WebP — max 5MB, tavsiya: 1200x400 px
                    </p>
                  </div>
                )}
                {uploadLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rasm yuklanmoqda...
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Harakat turi</Label>
                <Select
                  value={formData.actionType}
                  onValueChange={(value) => setFormData({ ...formData, actionType: value, link: value === 'none' ? '' : formData.link })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Harakat turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Harakatsiz</SelectItem>
                    <SelectItem value="link">Tashqi havola (URL)</SelectItem>
                    <SelectItem value="product">Mahsulot</SelectItem>
                    <SelectItem value="category">Kategoriya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.actionType !== 'none' && (
                <div className="space-y-2">
                  <Label>
                    {formData.actionType === 'link' ? 'Havola (URL)' : formData.actionType === 'product' ? 'Mahsulot ID' : 'Kategoriya ID'}
                  </Label>
                  <Input
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder={formData.actionType === 'link' ? 'https://t.me/topla_market' : 'ID kiriting'}
                  />
                </div>
              )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Boshlanish sanasi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="flex-1"
                    />
                    {formData.startDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setFormData({ ...formData, startDate: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tugash sanasi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="flex-1"
                    />
                    {formData.endDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setFormData({ ...formData, endDate: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3 pt-4">
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
                  <img src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `/api/v1${banner.imageUrl.startsWith('/') ? '' : '/'}${banner.imageUrl}`} alt={banner.title} className="w-full h-full object-cover rounded-t-lg" />
                ) : (
                  <span className="text-white text-4xl">🖼️</span>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base truncate mr-2">{banner.title}</CardTitle>
                  <Badge className={banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {banner.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
                {banner.link && (
                  <p className="text-xs text-blue-600 truncate mt-1">{banner.link}</p>
                )}
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

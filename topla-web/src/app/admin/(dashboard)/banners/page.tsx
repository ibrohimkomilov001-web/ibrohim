'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, X, Image as ImageIcon, Pencil, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { getBanners, createBanner, updateBanner, deleteBanner, type Banner } from './actions'
import { adminUploadImage } from '@/lib/api/admin'

type BannerFormData = {
  titleUz: string
  titleRu: string
  subtitleUz: string
  subtitleRu: string
  actionType: string
  actionValue: string
  sortOrder: number
}

const emptyForm: BannerFormData = {
  titleUz: '',
  titleRu: '',
  subtitleUz: '',
  subtitleRu: '',
  actionType: 'none',
  actionValue: '',
  sortOrder: 0,
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<BannerFormData>({ ...emptyForm })
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

  // ---- File handling ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Faqat rasm fayllari ruxsat etilgan (JPG, PNG, WebP, GIF)')
      return
    }
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

  // ---- Upload helper ----
  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null
    setUploadLoading(true)
    try {
      const url = await adminUploadImage(selectedFile, 'banner')
      if (!url) { toast.error('Rasm URL olinmadi'); return null }
      return url
    } catch (err: any) {
      toast.error(`Rasm yuklashda xatolik: ${err.message || "Noma'lum xato"}`)
      return null
    } finally {
      setUploadLoading(false)
    }
  }

  // ---- Create ----
  const handleAdd = async () => {
    if (!formData.titleUz.trim()) { toast.error('Sarlavha (uz) kiritilishi kerak'); return }
    if (!selectedFile) { toast.error('Rasm tanlash shart'); return }

    try {
      setActionLoading(true)
      const imageUrl = await uploadImage()
      if (!imageUrl) return

      await createBanner({
        titleUz: formData.titleUz.trim(),
        titleRu: formData.titleRu.trim() || undefined,
        subtitleUz: formData.subtitleUz.trim() || undefined,
        subtitleRu: formData.subtitleRu.trim() || undefined,
        imageUrl,
        actionType: formData.actionType,
        actionValue: formData.actionValue.trim() || undefined,
        sortOrder: formData.sortOrder,
      })
      toast.success('Banner yaratildi')
      setAddDialogOpen(false)
      setFormData({ ...emptyForm })
      handleRemoveImage()
      loadBanners()
    } catch {
      toast.error('Banner yaratishda xatolik')
    } finally {
      setActionLoading(false)
    }
  }

  // ---- Edit ----
  const openEditDialog = (banner: Banner) => {
    setEditBanner(banner)
    setFormData({
      titleUz: banner.titleUz,
      titleRu: banner.titleRu,
      subtitleUz: banner.subtitleUz,
      subtitleRu: banner.subtitleRu,
      actionType: banner.actionType || 'none',
      actionValue: banner.actionValue,
      sortOrder: banner.sortOrder,
    })
    setImagePreview(banner.imageUrl || null)
    setSelectedFile(null)
  }

  const handleEdit = async () => {
    if (!editBanner) return
    if (!formData.titleUz.trim()) { toast.error('Sarlavha (uz) kiritilishi kerak'); return }

    try {
      setActionLoading(true)
      let imageUrl: string | undefined
      if (selectedFile) {
        const url = await uploadImage()
        if (!url) return
        imageUrl = url
      }

      await updateBanner(editBanner.id, {
        titleUz: formData.titleUz.trim(),
        titleRu: formData.titleRu.trim(),
        subtitleUz: formData.subtitleUz.trim(),
        subtitleRu: formData.subtitleRu.trim(),
        ...(imageUrl ? { imageUrl } : {}),
        actionType: formData.actionType,
        actionValue: formData.actionValue.trim(),
        sortOrder: formData.sortOrder,
      })
      toast.success('Banner yangilandi')
      setEditBanner(null)
      setFormData({ ...emptyForm })
      handleRemoveImage()
      loadBanners()
    } catch {
      toast.error('Banner yangilashda xatolik')
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

  // ---- Shared form UI ----
  const renderBannerForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sarlavha (uz) *</Label>
          <Input
            value={formData.titleUz}
            onChange={(e) => setFormData({ ...formData, titleUz: e.target.value })}
            placeholder="Banner sarlavhasi (o'zbekcha)"
          />
        </div>
        <div className="space-y-2">
          <Label>Sarlavha (ru)</Label>
          <Input
            value={formData.titleRu}
            onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
            placeholder="Заголовок баннера (русский)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Qo&apos;shimcha matn (uz)</Label>
          <Input
            value={formData.subtitleUz}
            onChange={(e) => setFormData({ ...formData, subtitleUz: e.target.value })}
            placeholder="Qisqa tavsif (ixtiyoriy)"
          />
        </div>
        <div className="space-y-2">
          <Label>Qo&apos;shimcha matn (ru)</Label>
          <Input
            value={formData.subtitleRu}
            onChange={(e) => setFormData({ ...formData, subtitleRu: e.target.value })}
            placeholder="Краткое описание (необязательно)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{isEdit ? 'Rasmni almashtirish' : 'Rasm *'}</Label>
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
            {(selectedFile || !isEdit) && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isEdit && !selectedFile && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Almashtirish
              </Button>
            )}
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
              JPG, PNG, WebP — max 5MB, tavsiya: 1200×400 px
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Harakat turi</Label>
          <Select
            value={formData.actionType}
            onValueChange={(value) => setFormData({ ...formData, actionType: value, actionValue: value === 'none' ? '' : formData.actionValue })}
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

        <div className="space-y-2">
          <Label>Tartib raqami</Label>
          <Input
            type="number"
            min={0}
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      {formData.actionType !== 'none' && (
        <div className="space-y-2">
          <Label>
            {formData.actionType === 'link' ? 'Havola (URL)' : formData.actionType === 'product' ? 'Mahsulot ID' : 'Kategoriya ID'}
          </Label>
          <Input
            value={formData.actionValue}
            onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
            placeholder={formData.actionType === 'link' ? 'https://t.me/topla_market' : 'ID kiriting'}
          />
        </div>
      )}
    </div>
  )

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

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) { setFormData({ ...emptyForm }); handleRemoveImage() } }}>
          <DialogTrigger asChild>
            <Button>+ Banner qo&apos;shish</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yangi banner</DialogTitle>
              <DialogDescription>
                Yangi reklama banneri qo&apos;shing
              </DialogDescription>
            </DialogHeader>
            {renderBannerForm(false)}
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

      {/* Edit Dialog */}
      <Dialog open={!!editBanner} onOpenChange={(open) => { if (!open) { setEditBanner(null); setFormData({ ...emptyForm }); handleRemoveImage() } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bannerni tahrirlash</DialogTitle>
            <DialogDescription>
              Banner ma&apos;lumotlarini o&apos;zgartiring
            </DialogDescription>
          </DialogHeader>
          {renderBannerForm(true)}
          <DialogFooter className="gap-3 pt-4">
            <Button variant="outline" onClick={() => { setEditBanner(null); setFormData({ ...emptyForm }); handleRemoveImage() }}>
              Bekor qilish
            </Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami bannerlar</CardTitle>
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faol</CardTitle>
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Faol</Badge>
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
            <Badge variant="secondary">Nofaol</Badge>
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
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Hali bannerlar yo&apos;q</p>
            <p className="text-sm text-muted-foreground mt-1">Yangi banner qo&apos;shishni boshlang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.isActive ? 'opacity-60' : ''}>
              <div className="aspect-[3/1] bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center overflow-hidden">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.titleUz}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-white/60" />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base truncate mr-2">{banner.titleUz}</CardTitle>
                  <Badge className={banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {banner.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
                {banner.titleRu && (
                  <p className="text-xs text-muted-foreground truncate">{banner.titleRu}</p>
                )}
                {banner.actionValue && (
                  <p className="text-xs text-blue-600 truncate mt-1">{banner.actionValue}</p>
                )}
                <CardDescription className="flex items-center gap-2">
                  <GripVertical className="h-3 w-3" />
                  Tartib: {banner.sortOrder}
                  {banner.actionType !== 'none' && (
                    <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                      {banner.actionType}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(banner)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Tahrirlash
                  </Button>
                  <Button
                    variant={banner.isActive ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => handleToggle(banner)}
                  >
                    {banner.isActive ? "O'chirish" : 'Yoqish'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <X className="h-4 w-4" />
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

'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, X, Image as ImageIcon, Pencil, GripVertical, Eye, MousePointerClick, Calendar, Palette, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { getBanners, createBanner, updateBanner, deleteBanner, type Banner } from './actions'
import { adminUploadImage } from '@/lib/api/admin'
import { useTranslation } from '@/store/locale-store'

type BannerFormData = {
  titleUz: string
  titleRu: string
  subtitleUz: string
  subtitleRu: string
  actionType: string
  actionValue: string
  ctaText: string
  ctaTextRu: string
  bgColor: string
  textColor: string
  textPosition: 'left' | 'center' | 'right'
  startsAt: string
  endsAt: string
  sortOrder: number
}

const emptyForm: BannerFormData = {
  titleUz: '',
  titleRu: '',
  subtitleUz: '',
  subtitleRu: '',
  actionType: 'none',
  actionValue: '',
  ctaText: '',
  ctaTextRu: '',
  bgColor: '',
  textColor: '',
  textPosition: 'left',
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
}

const GRADIENT_PRESETS = [
  { label: 'Ko\'k', value: 'linear-gradient(135deg, #2AABEE 0%, #1A9FE2 100%)' },
  { label: 'Pushti', value: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' },
  { label: 'Yashil', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { label: 'To\'q sariq', value: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)' },
  { label: 'Binafsha', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
]

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(local: string): string | null {
  if (!local) return null
  const d = new Date(local)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient()
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => getBanners(),
  })

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<BannerFormData>({ ...emptyForm })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  // ---- Resolve banner image URL ----
  const resolveImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    // Already absolute URL (S3, https, http, data:)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
    // Relative /uploads/... — nginx on manage.topla.uz proxies /uploads/ to the backend
    return url
  }

  // ---- File handling ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error(t('onlyImagesAllowed'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageSizeLimit'))
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
      if (!url) { toast.error(t('imageUrlNotReceived')); return null }
      return url
    } catch (err: any) {
      toast.error(`Rasm yuklashda xatolik: ${err.message || "Noma'lum xato"}`)
      return null
    } finally {
      setUploadLoading(false)
    }
  }

  // ---- Create ----
  const createMutation = useMutation({
    mutationFn: async () => {
      const imageUrl = await uploadImage()
      if (!imageUrl) throw new Error('UPLOAD_FAILED')
      return createBanner({
        titleUz: formData.titleUz.trim() || undefined,
        titleRu: formData.titleRu.trim() || undefined,
        subtitleUz: formData.subtitleUz.trim() || undefined,
        subtitleRu: formData.subtitleRu.trim() || undefined,
        imageUrl,
        actionType: formData.actionType,
        actionValue: formData.actionValue.trim() || undefined,
        ctaText: formData.ctaText.trim() || undefined,
        ctaTextRu: formData.ctaTextRu.trim() || undefined,
        bgColor: formData.bgColor.trim() || undefined,
        textColor: formData.textColor.trim() || undefined,
        textPosition: formData.textPosition,
        startsAt: fromLocalInput(formData.startsAt),
        endsAt: fromLocalInput(formData.endsAt),
        sortOrder: formData.sortOrder,
      })
    },
    onSuccess: () => {
      toast.success(t('bannerCreated'))
      setAddDialogOpen(false)
      setFormData({ ...emptyForm })
      handleRemoveImage()
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
    onError: (error) => {
      if (error.message !== 'UPLOAD_FAILED') {
        toast.error(error.message || t('bannerCreateError'))
      }
    },
  })

  const handleAdd = () => {
    if (!selectedFile) { toast.error(t('imageRequired')); return }
    if (formData.startsAt && formData.endsAt && new Date(formData.endsAt) <= new Date(formData.startsAt)) {
      toast.error('Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak'); return
    }
    createMutation.mutate()
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
      ctaText: banner.ctaText || '',
      ctaTextRu: banner.ctaTextRu || '',
      bgColor: banner.bgColor || '',
      textColor: banner.textColor || '',
      textPosition: banner.textPosition || 'left',
      startsAt: toLocalInput(banner.startsAt),
      endsAt: toLocalInput(banner.endsAt),
      sortOrder: banner.sortOrder,
    })
    setImagePreview(resolveImageUrl(banner.imageUrl) || null)
    setSelectedFile(null)
    setShowAdvanced(
      Boolean(banner.startsAt || banner.endsAt || banner.bgColor || banner.textColor || banner.ctaText || banner.ctaTextRu)
    )
  }

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editBanner) throw new Error('NO_BANNER')
      let imageUrl: string | undefined
      if (selectedFile) {
        const url = await uploadImage()
        if (!url) throw new Error('UPLOAD_FAILED')
        imageUrl = url
      }
      return updateBanner(editBanner.id, {
        titleUz: formData.titleUz.trim(),
        titleRu: formData.titleRu.trim(),
        subtitleUz: formData.subtitleUz.trim(),
        subtitleRu: formData.subtitleRu.trim(),
        ...(imageUrl ? { imageUrl } : {}),
        actionType: formData.actionType,
        actionValue: formData.actionValue.trim(),
        ctaText: formData.ctaText.trim(),
        ctaTextRu: formData.ctaTextRu.trim(),
        bgColor: formData.bgColor.trim(),
        textColor: formData.textColor.trim(),
        textPosition: formData.textPosition,
        startsAt: fromLocalInput(formData.startsAt),
        endsAt: fromLocalInput(formData.endsAt),
        sortOrder: formData.sortOrder,
      })
    },
    onSuccess: () => {
      toast.success(t('bannerUpdated'))
      setEditBanner(null)
      setFormData({ ...emptyForm })
      handleRemoveImage()
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
    onError: (error) => {
      if (error.message !== 'UPLOAD_FAILED') {
        toast.error(error.message || t('bannerUpdateError'))
      }
    },
  })

  const handleEdit = () => {
    if (!editBanner) return
    if (formData.startsAt && formData.endsAt && new Date(formData.endsAt) <= new Date(formData.startsAt)) {
      toast.error('Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak'); return
    }
    editMutation.mutate()
  }

  const toggleMutation = useMutation({
    mutationFn: (banner: Banner) => updateBanner(banner.id, { isActive: !banner.isActive }),
    onSuccess: (_data, banner) => {
      toast.success(banner.isActive ? t('bannerDeactivated') : t('bannerActivated'))
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
    onError: () => {
      toast.error(t('errorOccurred'))
    },
  })

  const handleToggle = (banner: Banner) => {
    toggleMutation.mutate(banner)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      toast.success(t('bannerDeleted'))
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
    },
    onError: () => {
      toast.error(t('deleteError'))
    },
  })

  const handleDelete = (id: string) => {
    if (!confirm(t('confirmDeleteBanner'))) return
    deleteMutation.mutate(id)
  }

  // ---- Shared form UI ----
  const renderBannerForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('titleUz')} <span className="text-xs text-muted-foreground">(ixtiyoriy)</span></Label>
          <Input
            value={formData.titleUz}
            onChange={(e) => setFormData({ ...formData, titleUz: e.target.value })}
            placeholder={t('bannerTitleUzPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('titleRu')}</Label>
          <Input
            value={formData.titleRu}
            onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
            placeholder={t('bannerTitleRuPlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('subtitleUz')}</Label>
          <Input
            value={formData.subtitleUz}
            onChange={(e) => setFormData({ ...formData, subtitleUz: e.target.value })}
            placeholder={t('shortDescOptional')}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('subtitleRu')}</Label>
          <Input
            value={formData.subtitleRu}
            onChange={(e) => setFormData({ ...formData, subtitleRu: e.target.value })}
            placeholder={t('shortDescOptionalRu')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{isEdit ? t('replaceImage') : `${t('image')} *`}</Label>
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
              alt="Banner ko'rinishi"
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
                {t('replaceImage')}
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
              {t('dragImageHere')}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
              <ImageIcon className="h-4 w-4 mr-2" />
              {t('selectFile')}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t('imageRequirements')}
            </p>
          </div>
        )}
        {uploadLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('imageUploading')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('actionType')}</Label>
          <Select
            value={formData.actionType}
            onValueChange={(value) => setFormData({ ...formData, actionType: value, actionValue: value === 'none' ? '' : formData.actionValue })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Harakat turini tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('noAction')}</SelectItem>
              <SelectItem value="link">{t('externalLink')}</SelectItem>
              <SelectItem value="product">{t('product')}</SelectItem>
              <SelectItem value="category">{t('category')}</SelectItem>
              <SelectItem value="shop">Do'kon (shop)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('sortOrder')}</Label>
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
            {formData.actionType === 'link' ? t('linkUrl') :
             formData.actionType === 'product' ? t('productId') :
             formData.actionType === 'shop' ? 'Shop ID' :
             t('categoryId')}
          </Label>
          <Input
            value={formData.actionValue}
            onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
            placeholder={formData.actionType === 'link' ? 'https://t.me/topla_market' : 'ID kiriting'}
          />
        </div>
      )}

      {/* ===== ADVANCED SETTINGS ===== */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Qo'shimcha sozlamalar (vaqt, dizayn, CTA)
      </button>

      {showAdvanced && (
        <div className="space-y-4 border-l-2 border-muted pl-4 ml-1">
          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Boshlanish vaqti</Label>
              <Input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Tugash vaqti</Label>
              <Input
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA tugma matni (uz)</Label>
              <Input
                maxLength={50}
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                placeholder="Xarid qilish"
              />
            </div>
            <div className="space-y-2">
              <Label>CTA tugma matni (ru)</Label>
              <Input
                maxLength={50}
                value={formData.ctaTextRu}
                onChange={(e) => setFormData({ ...formData, ctaTextRu: e.target.value })}
                placeholder="Купить"
              />
            </div>
          </div>

          {/* Design */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Orqa fon (rasm o'rniga ishlatiladi)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, bgColor: g.value })}
                  className={`h-8 w-12 rounded border-2 transition-all ${formData.bgColor === g.value ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ background: g.value }}
                  title={g.label}
                />
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, bgColor: '' })}
                className={`h-8 w-12 rounded border-2 text-xs flex items-center justify-center bg-muted ${formData.bgColor === '' ? 'border-foreground' : 'border-transparent'}`}
              >
                Yo'q
              </button>
            </div>
            <Input
              value={formData.bgColor}
              onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
              placeholder="#2AABEE yoki linear-gradient(...)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Matn rangi</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.textColor || '#ffffff'}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="h-10 w-14 rounded border"
                />
                <Input
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Matn pozitsiyasi</Label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFormData({ ...formData, textPosition: pos })}
                    className={`flex-1 h-10 rounded border text-xs font-medium transition-all ${formData.textPosition === pos ? 'border-foreground bg-foreground text-background' : 'border-input hover:bg-muted'}`}
                  >
                    {pos === 'left' ? 'Chap' : pos === 'center' ? "O'rta" : "O'ng"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">{t('banners')}</h1>
          <p className="text-muted-foreground">
            {t('manageBanners')}
          </p>
        </div>

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) { setFormData({ ...emptyForm }); handleRemoveImage() } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#2AABEE] hover:bg-[#1A9FE2] text-white rounded-full px-6 font-semibold border-0 shadow-[0_4px_14px_rgba(42,171,238,0.35)] hover:shadow-[0_6px_20px_rgba(42,171,238,0.5)] transition-all duration-200 hover:scale-[1.02]">
              + {t('addBanner')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('newBanner')}</DialogTitle>
              <DialogDescription>
                {t('addNewBannerDesc')}
              </DialogDescription>
            </DialogHeader>
            {renderBannerForm(false)}
            <DialogFooter className="gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleAdd} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editBanner} onOpenChange={(open) => { if (!open) { setEditBanner(null); setFormData({ ...emptyForm }); handleRemoveImage() } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
              <DialogTitle>{t('editBanner')}</DialogTitle>
              <DialogDescription>
                {t('editBannerDesc')}
            </DialogDescription>
          </DialogHeader>
          {renderBannerForm(true)}
          <DialogFooter className="gap-3 pt-4">
            <Button variant="outline" onClick={() => { setEditBanner(null); setFormData({ ...emptyForm }); handleRemoveImage() }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending}>
              {editMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalBanners')}</CardTitle>
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('active')}</CardTitle>
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100">{t('active')}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {banners.filter(b => b.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inactive')}</CardTitle>
            <Badge variant="secondary">{t('inactive')}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
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
            <p className="font-medium">{t('noBannersYet')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('startAddingBanners')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.isActive ? 'opacity-60' : ''}>
              <div className="aspect-[3/1] bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg flex items-center justify-center overflow-hidden">
                {banner.imageUrl ? (
                  <img
                    src={resolveImageUrl(banner.imageUrl)}
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
                  <Badge className={banner.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                    {banner.isActive ? t('active') : t('inactive')}
                  </Badge>
                </div>
                {banner.titleRu && (
                  <p className="text-xs text-muted-foreground truncate">{banner.titleRu}</p>
                )}
                {banner.actionValue && (
                  <p className="text-xs text-blue-600 truncate mt-1">{banner.actionValue}</p>
                )}
                <CardDescription className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-0.5 bg-muted rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <GripVertical className="h-2.5 w-2.5 opacity-70" />
                    {banner.sortOrder}
                  </span>
                  {banner.actionType !== 'none' && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {banner.actionType}
                    </Badge>
                  )}
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground" title="Ko'rishlar">
                    <Eye className="h-3 w-3" />
                    {banner.viewCount}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground" title="Bosishlar">
                    <MousePointerClick className="h-3 w-3" />
                    {banner.clickCount}
                  </span>
                  {(banner.startsAt || banner.endsAt) && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <Calendar className="h-2.5 w-2.5 mr-0.5" />
                      Vaqt jadvali
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 rounded-full border border-[#2AABEE] text-[#2AABEE] hover:bg-[#2AABEE] hover:text-white transition-all duration-200 font-medium"
                    onClick={() => openEditDialog(banner)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    {t('edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={banner.isActive
                      ? 'rounded-full bg-red-500 hover:bg-red-600 text-white font-medium border-0 shadow-sm transition-all duration-200'
                      : 'rounded-full bg-[#2AABEE] hover:bg-[#1A9FE2] text-white font-medium border-0 shadow-sm transition-all duration-200'
                    }
                    onClick={() => handleToggle(banner)}
                  >
                    {banner.isActive ? t('deactivate') : t('activate')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
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

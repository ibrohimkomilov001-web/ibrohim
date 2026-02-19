'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Ticket, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getPromoCodes, getPromoCodeStats, createPromoCode, togglePromoCodeStatus, deletePromoCode, type PromoCode } from './actions'
import { useToast } from '@/components/ui/use-toast'

export default function AdminPromoCodesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalUsage: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [codesData, statsData] = await Promise.all([
        getPromoCodes(),
        getPromoCodeStats()
      ])
      setCodes(codesData)
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

  const filteredCodes = codes.filter(code =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async () => {
    if (!formData.code || !formData.discount_value) {
      toast({ title: "Xatolik", description: "Kod va chegirma qiymatini kiriting", variant: "destructive" })
      return
    }

    try {
      setActionLoading(true)
      await createPromoCode({
        code: formData.code,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : undefined,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : undefined,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined
      })
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Promo kod yaratildi" })
      setCreateDialogOpen(false)
      setFormData({
        code: '', description: '', discount_type: 'percentage', discount_value: '',
        min_order_amount: '', max_discount_amount: '', usage_limit: '', start_date: '', end_date: ''
      })
    } catch (error) {
      toast({ title: "Xatolik", description: "Promo kod yaratishda xatolik", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await togglePromoCodeStatus(id, !isActive)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: isActive ? "Promo kod o'chirildi" : "Promo kod yoqildi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "Statusni o'zgartirishda xatolik", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Promo kodni o'chirishni xohlaysizmi?")) return
    try {
      await deletePromoCode(id)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Promo kod o'chirildi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "O'chirishda xatolik", variant: "destructive" })
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
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Promo Kodlar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Chegirma kodlarini boshqaring</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi kod
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
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
            <CardTitle className="text-xs sm:text-sm font-medium">Faol</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Nofaol</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-500">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ishlatilgan</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Promo kodlar ro'yxati</CardTitle>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          {filteredCodes.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Promo kodlar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCodes.map((code) => (
                <div key={code.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-sm sm:text-base font-bold">
                        {code.code}
                      </code>
                      <Badge variant={code.is_active ? 'default' : 'secondary'}>
                        {code.is_active ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(code.id, code.is_active)}>
                        {code.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(code.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{code.description || 'Tavsif yo\'q'}</p>
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                    <span className="bg-muted px-2 py-1 rounded">
                      {code.discount_type === 'percentage' ? `${code.discount_value}%` : formatPrice(code.discount_value)}
                    </span>
                    {(code.min_order_amount ?? 0) > 0 && (
                      <span className="bg-muted px-2 py-1 rounded">Min: {formatPrice(code.min_order_amount!)}</span>
                    )}
                    {code.usage_limit && (
                      <span className="bg-muted px-2 py-1 rounded">Limit: {code.used_count}/{code.usage_limit}</span>
                    )}
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
            <DialogTitle>Yangi promo kod</DialogTitle>
            <DialogDescription>Yangi chegirma kodini yarating</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kod *</Label>
              <Input
                placeholder="CHEGIRMA20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Input
                placeholder="20% chegirma"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select value={formData.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Foiz (%)</SelectItem>
                    <SelectItem value="fixed">Qat'iy summa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qiymat *</Label>
                <Input
                  type="number"
                  placeholder={formData.discount_type === 'percentage' ? '20' : '50000'}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min. buyurtma</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ishlatish limiti</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                />
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

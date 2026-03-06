'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, Dices, Trash2, Pencil, Trophy, Gift, Percent, Truck, X, History } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  getPrizes,
  createPrize,
  updatePrize,
  deletePrize,
  getSpins,
  type LuckyWheelPrize,
  type LuckyWheelStats,
  type SpinRecord,
  type PrizeType,
} from './actions'

const PRIZE_TYPE_LABELS: Record<PrizeType, string> = {
  discount_percent: 'Foiz chegirma',
  discount_fixed: 'Qat\'iy chegirma',
  free_delivery: 'Bepul yetkazish',
  physical_gift: 'Fizik sovg\'a',
  nothing: 'Omadsiz',
}

const PRIZE_TYPE_ICONS: Record<PrizeType, typeof Percent> = {
  discount_percent: Percent,
  discount_fixed: Percent,
  free_delivery: Truck,
  physical_gift: Gift,
  nothing: X,
}

const emptyForm = {
  nameUz: '',
  nameRu: '',
  type: 'discount_percent' as PrizeType,
  value: '',
  probability: '',
  color: '#4CAF50',
  promoCodePrefix: '',
  stock: '',
  sortOrder: '',
  isActive: true,
}

export default function AdminLuckyWheelPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [prizes, setPrizes] = useState<LuckyWheelPrize[]>([])
  const [stats, setStats] = useState<LuckyWheelStats>({ totalSpins: 0, todaySpins: 0, totalWinners: 0 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrize, setEditingPrize] = useState<LuckyWheelPrize | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  // Spin history
  const [historyOpen, setHistoryOpen] = useState(false)
  const [spins, setSpins] = useState<SpinRecord[]>([])
  const [spinsLoading, setSpinsLoading] = useState(false)
  const [spinsPage, setSpinsPage] = useState(1)
  const [spinsPagination, setSpinsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getPrizes()
      setPrizes(data.prizes)
      setStats(data.stats)
    } catch {
      toast({ title: 'Xatolik', description: "Ma'lumotlarni yuklashda xatolik", variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadSpins = async (page = 1) => {
    try {
      setSpinsLoading(true)
      const data = await getSpins({ page, limit: 20 })
      setSpins(data.spins)
      setSpinsPagination(data.pagination)
      setSpinsPage(page)
    } catch {
      toast({ title: 'Xatolik', description: 'Tarixni yuklashda xatolik', variant: 'destructive' })
    } finally {
      setSpinsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setEditingPrize(null)
    setFormData({ ...emptyForm, sortOrder: String(prizes.length + 1) })
    setDialogOpen(true)
  }

  const openEdit = (prize: LuckyWheelPrize) => {
    setEditingPrize(prize)
    setFormData({
      nameUz: prize.nameUz,
      nameRu: prize.nameRu,
      type: prize.type,
      value: prize.value || '',
      probability: String(prize.probability),
      color: prize.color,
      promoCodePrefix: prize.promoCodePrefix || '',
      stock: prize.stock !== null ? String(prize.stock) : '',
      sortOrder: String(prize.sortOrder),
      isActive: prize.isActive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nameUz || !formData.probability) {
      toast({ title: 'Xatolik', description: 'Nom va ehtimollikni kiriting', variant: 'destructive' })
      return
    }

    try {
      setActionLoading(true)
      const payload = {
        nameUz: formData.nameUz,
        nameRu: formData.nameRu,
        type: formData.type,
        value: formData.value || null,
        probability: parseFloat(formData.probability),
        color: formData.color,
        promoCodePrefix: formData.promoCodePrefix || null,
        stock: formData.stock ? parseInt(formData.stock) : null,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : 0,
        isActive: formData.isActive,
      }

      if (editingPrize) {
        await updatePrize(editingPrize.id, payload)
        toast({ title: 'Muvaffaqiyatli', description: "Sovg'a yangilandi" })
      } else {
        await createPrize(payload)
        toast({ title: 'Muvaffaqiyatli', description: "Sovg'a qo'shildi" })
      }

      setDialogOpen(false)
      await loadData()
    } catch (error: any) {
      toast({ title: 'Xatolik', description: error.message || "Saqlashda xatolik", variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Sovg'ani o'chirmoqchimisiz?")) return

    try {
      await deletePrize(id)
      toast({ title: 'Muvaffaqiyatli', description: "Sovg'a o'chirildi" })
      await loadData()
    } catch {
      toast({ title: 'Xatolik', description: "O'chirishda xatolik", variant: 'destructive' })
    }
  }

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Omad G&apos;ildiragi</h1>
          <p className="text-muted-foreground">Baraban sovg&apos;alarini boshqarish</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setHistoryOpen(true); loadSpins(1) }}>
            <History className="h-4 w-4 mr-2" />
            Tarix
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Sovg&apos;a qo&apos;shish
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami aylantirishlar</CardTitle>
            <Dices className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugun</CardTitle>
            <Dices className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySpins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">G&apos;oliblar</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWinners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ehtimollik jami</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Math.abs(totalProbability - 1) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
              {(totalProbability * 100).toFixed(1)}%
            </div>
            {Math.abs(totalProbability - 1) >= 0.01 && (
              <p className="text-xs text-red-500 mt-1">100% bo&apos;lishi kerak!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prizes List */}
      <Card>
        <CardHeader>
          <CardTitle>Sovg&apos;alar ({prizes.length})</CardTitle>
          <CardDescription>Baraban segmentlari va ehtimolliklari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prizes.map((prize) => {
              const Icon = PRIZE_TYPE_ICONS[prize.type] || Gift
              return (
                <div key={prize.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: prize.color + '20', color: prize.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {prize.nameUz}
                        {!prize.isActive && <Badge variant="secondary">O&apos;chirilgan</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{PRIZE_TYPE_LABELS[prize.type]}</span>
                        {prize.value && <span>• Qiymat: {prize.value}</span>}
                        <span>• Ehtimollik: {(prize.probability * 100).toFixed(1)}%</span>
                        {prize.stock !== null && <span>• Qoldiq: {prize.stock}</span>}
                        <span>• Yutilgan: {prize.totalWon}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(prize)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prize.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            {prizes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Sovg&apos;alar yo&apos;q. Yangi sovg&apos;a qo&apos;shing.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPrize ? "Sovg'ani tahrirlash" : "Yangi sovg'a"}</DialogTitle>
            <DialogDescription>Baraban segmenti ma&apos;lumotlari</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomi (UZ) *</Label>
                <Input
                  value={formData.nameUz}
                  onChange={(e) => setFormData(f => ({ ...f, nameUz: e.target.value }))}
                  placeholder="5% chegirma"
                />
              </div>
              <div className="space-y-2">
                <Label>Nomi (RU)</Label>
                <Input
                  value={formData.nameRu}
                  onChange={(e) => setFormData(f => ({ ...f, nameRu: e.target.value }))}
                  placeholder="Скидка 5%"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(f => ({ ...f, type: v as PrizeType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIZE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qiymat {formData.type === 'discount_percent' ? '(%)' : formData.type === 'discount_fixed' ? "(so'm)" : ''}</Label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData(f => ({ ...f, value: e.target.value }))}
                  placeholder={formData.type === 'nothing' ? 'Kerak emas' : '10'}
                  disabled={formData.type === 'nothing' || formData.type === 'free_delivery'}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ehtimollik * (0-1)</Label>
                <Input
                  value={formData.probability}
                  onChange={(e) => setFormData(f => ({ ...f, probability: e.target.value }))}
                  placeholder="0.25"
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Rang</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tartib</Label>
                <Input
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(f => ({ ...f, sortOrder: e.target.value }))}
                  type="number"
                />
              </div>
            </div>

            {(formData.type === 'discount_percent' || formData.type === 'discount_fixed' || formData.type === 'free_delivery') && (
              <div className="space-y-2">
                <Label>Promo kod prefiksi</Label>
                <Input
                  value={formData.promoCodePrefix}
                  onChange={(e) => setFormData(f => ({ ...f, promoCodePrefix: e.target.value }))}
                  placeholder="WHEEL5"
                />
              </div>
            )}

            {formData.type === 'physical_gift' && (
              <div className="space-y-2">
                <Label>Qoldiq (stock)</Label>
                <Input
                  value={formData.stock}
                  onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))}
                  type="number"
                  placeholder="5"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData(f => ({ ...f, isActive: v }))}
              />
              <Label>Aktiv</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPrize ? 'Saqlash' : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spin History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aylantirish tarixi</DialogTitle>
            <DialogDescription>Oxirgi aylantirishlar</DialogDescription>
          </DialogHeader>

          {spinsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {spins.map((spin) => (
                <div key={spin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: spin.prize.color }}
                    >
                      {spin.prizeName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{spin.user.fullName || spin.user.phone}</div>
                      <div className="text-xs text-muted-foreground">
                        {spin.prizeName}
                        {spin.promoCode && <span className="ml-2 font-mono text-primary">{spin.promoCode}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(spin.createdAt).toLocaleString('uz-UZ')}
                  </div>
                </div>
              ))}
              {spins.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">Tarix bo&apos;sh</div>
              )}

              {/* Pagination */}
              {spinsPagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={spinsPage <= 1}
                    onClick={() => loadSpins(spinsPage - 1)}
                  >
                    Oldingi
                  </Button>
                  <span className="flex items-center text-sm text-muted-foreground">
                    {spinsPage} / {spinsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={spinsPage >= spinsPagination.totalPages}
                    onClick={() => loadSpins(spinsPage + 1)}
                  >
                    Keyingi
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

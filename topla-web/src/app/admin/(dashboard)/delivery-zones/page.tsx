'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, MapPin, Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getDeliveryZones, getDeliveryZoneStats, createDeliveryZone, toggleDeliveryZoneStatus, deleteDeliveryZone, type DeliveryZone } from './actions'
import { useToast } from '@/components/ui/use-toast'

export default function AdminDeliveryZonesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    region: '',
    districts: '',
    delivery_fee: '',
    min_order_amount: '',
    estimated_time: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [zonesData, statsData] = await Promise.all([
        getDeliveryZones(),
        getDeliveryZoneStats()
      ])
      setZones(zonesData)
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

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.region?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async () => {
    if (!formData.name) {
      toast({ title: "Xatolik", description: "Zona nomini kiriting", variant: "destructive" })
      return
    }

    try {
      setActionLoading(true)
      await createDeliveryZone({
        name: formData.name,
        region: formData.region || undefined,
        districts: formData.districts ? formData.districts.split(',').map(d => d.trim()) : [],
        delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 0,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        estimated_time: formData.estimated_time || undefined
      })
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Zona yaratildi" })
      setCreateDialogOpen(false)
      setFormData({ name: '', region: '', districts: '', delivery_fee: '', min_order_amount: '', estimated_time: '' })
    } catch (error) {
      toast({ title: "Xatolik", description: "Zona yaratishda xatolik", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleDeliveryZoneStatus(id, !isActive)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: isActive ? "Zona o'chirildi" : "Zona yoqildi" })
    } catch (error) {
      toast({ title: "Xatolik", description: "Statusni o'zgartirishda xatolik", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Zonani o'chirishni xohlaysizmi?")) return
    try {
      await deleteDeliveryZone(id)
      await loadData()
      toast({ title: "Muvaffaqiyatli", description: "Zona o'chirildi" })
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
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Yetkazib berish zonalari</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Yetkazib berish hududlarini boshqaring</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi zona
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
      </div>

      {/* Zones List */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Zonalar ro'yxati</CardTitle>
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          {filteredZones.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Zonalar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredZones.map((zone) => (
                <div key={zone.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-medium">{zone.name}</span>
                      <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                        {zone.is_active ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(zone.id, zone.is_active)}>
                        {zone.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(zone.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {zone.region && <p className="text-sm text-muted-foreground">{zone.region}</p>}
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                    <span className="bg-muted px-2 py-1 rounded">
                      Yetkazib berish: {zone.delivery_fee > 0 ? formatPrice(zone.delivery_fee) : 'Bepul'}
                    </span>
                    {zone.min_order_amount > 0 && (
                      <span className="bg-muted px-2 py-1 rounded">Min: {formatPrice(zone.min_order_amount)}</span>
                    )}
                    {zone.estimated_time && (
                      <span className="bg-muted px-2 py-1 rounded">⏱️ {zone.estimated_time}</span>
                    )}
                  </div>
                  {zone.districts && zone.districts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {zone.districts.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                      ))}
                    </div>
                  )}
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
            <DialogTitle>Yangi zona</DialogTitle>
            <DialogDescription>Yangi yetkazib berish zonasini yarating</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Zona nomi *</Label>
              <Input
                placeholder="Toshkent shahri"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Viloyat</Label>
              <Input
                placeholder="Toshkent"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tumanlar (vergul bilan)</Label>
              <Input
                placeholder="Yunusobod, Mirzo Ulug'bek, Shayxontohur"
                value={formData.districts}
                onChange={(e) => setFormData({ ...formData, districts: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Yetkazib berish narxi</Label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Taxminiy vaqt</Label>
                <Input
                  placeholder="30-60 min"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
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

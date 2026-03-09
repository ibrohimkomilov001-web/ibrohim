'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getPlatformSettings, updatePlatformSettings, getAdminUsers, type AdminUser } from './actions'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [settings, setSettings] = useState<Record<string, any>>({
    // General
    siteName: 'TOPLA.UZ',
    siteDescription: 'O\'zbekistondagi eng yaxshi marketplace',
    supportEmail: 'support@topla.uz',
    supportPhone: '+998 71 123 45 67',
    // Commission
    defaultCommission: '10',
    minPayout: '100000',
    commissionElektronika: '8',
    commissionKiyim: '12',
    commissionOziqOvqat: '15',
    // Delivery
    freeDeliveryMin: '500000',
    deliveryPrice: '25000',
    deliveryPriceToshkent: '25000',
    deliveryPriceViloyat: '35000',
    // Notifications
    orderNotification: true,
    vendorNotification: true,
    payoutNotification: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const [data, adminList] = await Promise.all([
          getPlatformSettings(),
          getAdminUsers(),
        ])
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }))
        }
        setAdmins(adminList)
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updatePlatformSettings(settings)
      toast.success('Sozlamalar saqlandi')
    } catch {
      toast.error('Saqlashda xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
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
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Sozlamalar</h1>
        <p className="text-muted-foreground">
          Platforma sozlamalarini boshqaring
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Umumiy</TabsTrigger>
          <TabsTrigger value="commission">Komissiya</TabsTrigger>
          <TabsTrigger value="delivery">Yetkazib berish</TabsTrigger>
          <TabsTrigger value="notifications">Bildirishnomalar</TabsTrigger>
          <TabsTrigger value="admins">Adminlar</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy sozlamalar</CardTitle>
              <CardDescription>Sayt haqida asosiy ma'lumotlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sayt nomi</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sayt tavsifi</Label>
                  <Input
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Support email</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support telefon</Label>
                  <Input
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Komissiya sozlamalari</CardTitle>
              <CardDescription>Vendor komissiyasi va to'lov sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Standart komissiya (%)</Label>
                  <Input
                    type="number"
                    value={settings.defaultCommission}
                    onChange={(e) => setSettings({ ...settings, defaultCommission: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Barcha yangi vendorlar uchun amal qiladi
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Minimal pul yechish (so'm)</Label>
                  <Input
                    type="number"
                    value={settings.minPayout}
                    onChange={(e) => setSettings({ ...settings, minPayout: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Vendorlar shu summadan kam yecha olmaydi
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3">Kategoriya bo'yicha komissiya</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { key: 'commissionElektronika', label: 'Elektronika' },
                    { key: 'commissionKiyim', label: 'Kiyim' },
                    { key: 'commissionOziqOvqat', label: 'Oziq-ovqat' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b">
                      <span>{label}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings[key] || ''}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className="w-20 h-8"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Yetkazib berish sozlamalari</CardTitle>
              <CardDescription>Delivery narxlari va shartlari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bepul yetkazish uchun minimal summa (so'm)</Label>
                  <Input
                    type="number"
                    value={settings.freeDeliveryMin}
                    onChange={(e) => setSettings({ ...settings, freeDeliveryMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Standart yetkazish narxi (so'm)</Label>
                  <Input
                    type="number"
                    value={settings.deliveryPrice}
                    onChange={(e) => setSettings({ ...settings, deliveryPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3">Shahar bo'yicha narxlar</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { key: 'deliveryPriceToshkent', label: 'Toshkent' },
                    { key: 'deliveryPriceViloyat', label: 'Viloyatlar' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b">
                      <span>{label}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings[key] || ''}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className="w-28 h-8"
                        />
                        <span>so'm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirishnoma sozlamalari</CardTitle>
              <CardDescription>Email va push bildirishnomalar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: 'orderNotification', title: 'Yangi buyurtma', desc: 'Yangi buyurtma kelganda admin va vendorga xabar berish' },
                  { key: 'vendorNotification', title: 'Yangi vendor', desc: 'Yangi vendor ro\'yxatdan o\'tganda admin ga xabar' },
                  { key: 'payoutNotification', title: 'Pul yechish so\'rovi', desc: 'Vendor pul yechmoqchi bo\'lganda admin ga xabar' },
                ].map(({ key, title, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="text-sm text-muted-foreground">{desc}</div>
                    </div>
                    <Button
                      variant={settings[key] ? 'default' : 'outline'}
                      onClick={() => toggleSetting(key)}
                    >
                      {settings[key] ? 'Yoqilgan' : 'O\'chirilgan'}
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins */}
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Admin foydalanuvchilar</CardTitle>
                  <CardDescription>Platforma adminlarini boshqaring</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Admin foydalanuvchilar topilmadi</p>
              ) : (
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(admin.fullName || admin.email || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{admin.fullName || 'Noma\'lum'}</div>
                          <div className="text-sm text-muted-foreground">{admin.email || admin.phone || '-'}</div>
                        </div>
                      </div>
                      <Badge variant="default">Admin</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

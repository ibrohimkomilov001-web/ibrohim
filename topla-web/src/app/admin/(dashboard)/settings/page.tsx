'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getPlatformSettings, updatePlatformSettings } from './actions'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // General
    siteName: 'TOPLA.UZ',
    siteDescription: 'O\'zbekistondagi eng yaxshi marketplace',
    supportEmail: 'support@topla.uz',
    supportPhone: '+998 71 123 45 67',

    // Commission
    defaultCommission: '10',
    minPayout: '100000',

    // Delivery
    freeDeliveryMin: '500000',
    deliveryPrice: '25000',

    // Notifications
    orderNotification: true,
    vendorNotification: true,
    payoutNotification: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlatformSettings()
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }))
        }
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
        <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
        <p className="text-muted-foreground">
          Platforma sozlamalarini boshqaring
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Elektronika</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="8" className="w-20 h-8" />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Kiyim</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="12" className="w-20 h-8" />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Oziq-ovqat</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="15" className="w-20 h-8" />
                      <span>%</span>
                    </div>
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Toshkent</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="25000" className="w-28 h-8" />
                      <span>so'm</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Viloyatlar</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="35000" className="w-28 h-8" />
                      <span>so'm</span>
                    </div>
                  </div>
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
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Yangi buyurtma</div>
                    <div className="text-sm text-muted-foreground">
                      Yangi buyurtma kelganda admin va vendorga xabar berish
                    </div>
                  </div>
                  <Button variant={settings.orderNotification ? 'default' : 'outline'}>
                    {settings.orderNotification ? 'Yoqilgan' : 'O\'chirilgan'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Yangi vendor</div>
                    <div className="text-sm text-muted-foreground">
                      Yangi vendor ro'yxatdan o'tganda admin ga xabar
                    </div>
                  </div>
                  <Button variant={settings.vendorNotification ? 'default' : 'outline'}>
                    {settings.vendorNotification ? 'Yoqilgan' : 'O\'chirilgan'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Pul yechish so'rovi</div>
                    <div className="text-sm text-muted-foreground">
                      Vendor pul yechmoqchi bo'lganda admin ga xabar
                    </div>
                  </div>
                  <Button variant={settings.payoutNotification ? 'default' : 'outline'}>
                    {settings.payoutNotification ? 'Yoqilgan' : 'O\'chirilgan'}
                  </Button>
                </div>
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
                <Button>+ Admin qo'shish</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <div className="font-medium">Super Admin</div>
                      <div className="text-sm text-muted-foreground">admin@topla.uz</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      Super Admin
                    </span>
                    <Button variant="outline" size="sm">Tahrirlash</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <div className="font-medium">Moderator</div>
                      <div className="text-sm text-muted-foreground">moderator@topla.uz</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                      Moderator
                    </span>
                    <Button variant="outline" size="sm">Tahrirlash</Button>
                    <Button variant="destructive" size="sm">O'chirish</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

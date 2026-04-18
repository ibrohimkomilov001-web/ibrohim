'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Search, UserPlus, Shield, Monitor, Smartphone, Globe, LogOut, Key, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { getPlatformSettings, updatePlatformSettings, getAdminUsers, searchUsers, promoteToAdmin, removeAdmin, getSessions, revokeSession, revokeAllOtherSessions, changePassword, type AdminUser, type Session } from './actions'
import { AdminPasskeysCard, Admin2FACard } from './security-cards'
import { useTranslation } from '@/store/locale-store';

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // UI state
  const [addAdminOpen, setAddAdminOpen] = useState(false)
  const [removeAdminId, setRemoveAdminId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sessionsTabActive, setSessionsTabActive] = useState(false)
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  // Settings form state
  const [settings, setSettings] = useState<Record<string, any>>({
    // General
    siteName: 'TOPLA.UZ',
    siteDescription: 'O\'zbekistondagi eng yaxshi marketplace',
    supportEmail: 'support@topla.uz',
    supportPhone: '+998 20 002 49 20',
    telegramLink: 'https://t.me/toplauz',
    instagramLink: 'https://instagram.com/topla.uz',
    youtubeLink: 'https://youtube.com/@toplauz',
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

  // --- Queries ---
  const settingsQuery = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettings,
  })

  const adminsQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  })

  const searchUsersQuery = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
  })

  const sessionsQuery = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: getSessions,
    enabled: sessionsTabActive,
  })

  // Sync fetched settings into form state
  useEffect(() => {
    if (settingsQuery.data && Object.keys(settingsQuery.data).length > 0) {
      setSettings(prev => ({ ...prev, ...settingsQuery.data }))
    }
  }, [settingsQuery.data])

  // --- Mutations ---
  const saveSettingsMutation = useMutation({
    mutationFn: (s: Record<string, any>) => updatePlatformSettings(s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      toast.success(t('settingsSaved'))
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  const promoteAdminMutation = useMutation({
    mutationFn: (userId: string) => promoteToAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(t('adminAdded'))
      setAddAdminOpen(false)
      setSearchQuery('')
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  const removeAdminMutation = useMutation({
    mutationFn: (adminId: string) => removeAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(t('adminRemoved'))
      setRemoveAdminId(null)
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (deviceId: string) => revokeSession(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] })
      toast.success(t('sessionRevoked'))
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  const revokeAllSessionsMutation = useMutation({
    mutationFn: () => revokeAllOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] })
      toast.success(t('allSessionsRevoked'))
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ current, newPw }: { current: string; newPw: string }) => changePassword(current, newPw),
    onSuccess: () => {
      toast.success(t('passwordChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (e: any) => {
      toast.error(e.message || t('saveError'))
    },
  })

  // --- Derived values ---
  const admins = adminsQuery.data ?? []
  const searchResults = searchQuery.length >= 2 ? (searchUsersQuery.data ?? []) : []
  const sessions = sessionsQuery.data ?? []
  const loading = settingsQuery.isLoading || adminsQuery.isLoading
  const saving = saveSettingsMutation.isPending
  const searching = searchUsersQuery.isFetching
  const promoting = promoteAdminMutation.isPending
  const removing = removeAdminMutation.isPending
  const sessionsLoading = sessionsQuery.isLoading
  const revokingAll = revokeAllSessionsMutation.isPending
  const changingPassword = changePasswordMutation.isPending

  // --- Handlers ---
  const handleSave = () => saveSettingsMutation.mutate(settings)

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSearchUsers = (q: string) => {
    setSearchQuery(q)
  }

  const handlePromoteToAdmin = (userId: string) => {
    promoteAdminMutation.mutate(userId)
  }

  const handleRemoveAdmin = () => {
    if (!removeAdminId) return
    removeAdminMutation.mutate(removeAdminId)
  }

  const handleRevokeSession = (deviceId: string) => {
    revokeSessionMutation.mutate(deviceId)
  }

  const handleRevokeAllOther = () => {
    revokeAllSessionsMutation.mutate()
  }

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) return
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }
    if (newPassword.length < 8) {
      toast.error(t('passwordTooShort'))
      return
    }
    changePasswordMutation.mutate({ current: currentPassword, newPw: newPassword })
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
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t('settingsTitle')}</h1>
        <p className="text-muted-foreground">
          {t('settingsDesc')}
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="general">{t('generalSettings')}</TabsTrigger>
            <TabsTrigger value="commission">{t('commissionTab')}</TabsTrigger>
            <TabsTrigger value="delivery">{t('deliveryTab')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('notificationsTab')}</TabsTrigger>
            <TabsTrigger value="admins">{t('adminsTab')}</TabsTrigger>
            <TabsTrigger value="security" onClick={() => { if (!sessionsTabActive) setSessionsTabActive(true) }}>
              <Shield className="w-3.5 h-3.5 mr-1" />{t('securityTab')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('generalSettingsTitle')}</CardTitle>
              <CardDescription>{t('generalSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('siteName')}</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('siteDescription')}</Label>
                  <Input
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('supportEmail')}</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('supportPhone')}</Label>
                  <Input
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('telegramLink')}</Label>
                  <Input
                    value={settings.telegramLink}
                    onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                    placeholder="https://t.me/toplauz"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('instagramLink')}</Label>
                  <Input
                    value={settings.instagramLink}
                    onChange={(e) => setSettings({ ...settings, instagramLink: e.target.value })}
                    placeholder="https://instagram.com/topla.uz"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('youtubeLink')}</Label>
                  <Input
                    value={settings.youtubeLink}
                    onChange={(e) => setSettings({ ...settings, youtubeLink: e.target.value })}
                    placeholder="https://youtube.com/@toplauz"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>{t('commissionSettings')}</CardTitle>
              <CardDescription>{t('commissionSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('defaultCommission')}</Label>
                  <Input
                    type="number"
                    value={settings.defaultCommission}
                    onChange={(e) => setSettings({ ...settings, defaultCommission: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('defaultCommissionHint')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t('minPayoutAmount')}</Label>
                  <Input
                    type="number"
                    value={settings.minPayout}
                    onChange={(e) => setSettings({ ...settings, minPayout: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('minPayoutHint')}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3">{t('commissionByCategory')}</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { key: 'commissionElektronika', label: t('electronics') },
                    { key: 'commissionKiyim', label: t('clothing') },
                    { key: 'commissionOziqOvqat', label: t('food') },
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
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>{t('deliverySettings')}</CardTitle>
              <CardDescription>{t('deliverySettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('freeDeliveryMin')}</Label>
                  <Input
                    type="number"
                    value={settings.freeDeliveryMin}
                    onChange={(e) => setSettings({ ...settings, freeDeliveryMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('standardDeliveryPrice')}</Label>
                  <Input
                    type="number"
                    value={settings.deliveryPrice}
                    onChange={(e) => setSettings({ ...settings, deliveryPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3">{t('pricesPerCity')}</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { key: 'deliveryPriceToshkent', label: t('tashkent') },
                    { key: 'deliveryPriceViloyat', label: t('regions') },
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
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationSettings')}</CardTitle>
              <CardDescription>{t('notificationSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: 'orderNotification', title: t('newOrderNotif'), desc: t('newOrderNotifDesc') },
                  { key: 'vendorNotification', title: t('newVendorNotif'), desc: t('newVendorNotifDesc') },
                  { key: 'payoutNotification', title: t('payoutNotif'), desc: t('payoutNotifDesc') },
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
                      {settings[key] ? t('enabled') : t('disabled')}
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('save')}
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
                  <CardTitle>{t('adminUsers')}</CardTitle>
                  <CardDescription>{t('adminUsersDesc')}</CardDescription>
                </div>
                <Button onClick={() => setAddAdminOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  {t('addAdmin')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('noAdminsFound')}</p>
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
                          <div className="font-medium">{admin.fullName || t('unknownUser')}</div>
                          <div className="text-sm text-muted-foreground">{admin.email || admin.phone || '-'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Admin</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setRemoveAdminId(admin.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('activeSessions')}</CardTitle>
                    <CardDescription>{t('activeSessionsDesc')}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevokeAllOther}
                    disabled={revokingAll || sessions.filter(s => !s.isCurrent).length === 0}
                  >
                    {revokingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <LogOut className="w-4 h-4 mr-1" />}
                    {t('revokeAllOther')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">{t('noActiveSessions')}</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className={`flex items-center justify-between p-4 border rounded-lg ${session.isCurrent ? 'border-primary/30 bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          {session.platform === 'mobile' ? (
                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                          ) : session.platform === 'desktop' ? (
                            <Monitor className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Globe className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {session.deviceName || session.browser || t('unknownDevice')}
                              {session.isCurrent && <Badge variant="secondary" className="ml-2 text-xs">{t('currentDevice')}</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.ipAddress || '-'} &middot; {new Date(session.lastActiveAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={revokeSessionMutation.isPending && revokeSessionMutation.variables === session.id}
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            {revokeSessionMutation.isPending && revokeSessionMutation.variables === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  {t('changePassword')}
                </CardTitle>
                <CardDescription>{t('changePasswordDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>{t('currentPassword')}</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('newPassword')}</Label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowNewPw(!showNewPw)}
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 8 && (
                    <p className="text-xs text-destructive">{t('passwordTooShort')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('confirmPassword')}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-destructive">{t('passwordMismatch')}</p>
                  )}
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                >
                  {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('changePassword')}
                </Button>
              </CardContent>
            </Card>

            {/* Passkey management */}
            <AdminPasskeysCard />

            {/* 2FA management */}
            <Admin2FACard />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addAdmin')}</DialogTitle>
            <DialogDescription>{t('addAdminDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('searchUserPlaceholder')}
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noUsersFound')}</p>
              )}
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(user.fullName || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.fullName || t('unknownUser')}</div>
                      <div className="text-xs text-muted-foreground">{user.email || user.phone || '-'}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={promoting}
                    onClick={() => handlePromoteToAdmin(user.id)}
                  >
                    {promoting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />}
                    {t('addAdmin')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Confirmation Dialog */}
      <Dialog open={!!removeAdminId} onOpenChange={() => setRemoveAdminId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('removeAdmin')}</DialogTitle>
            <DialogDescription>{t('removeAdminDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveAdminId(null)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleRemoveAdmin} disabled={removing}>
              {removing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
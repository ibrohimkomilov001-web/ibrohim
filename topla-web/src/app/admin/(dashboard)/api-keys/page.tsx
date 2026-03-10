"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Key, Plus, Trash2, Copy, Globe, Webhook,
  Shield, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchApiKeys, createApiKey, deleteApiKey, createWebhook, deleteWebhook } from "@/lib/api/admin";
import { useTranslation } from '@/store/locale-store';

const availablePermissions = [
  { id: "products:read", label: "Mahsulotlarni ko'rish" },
  { id: "products:write", label: "Mahsulotlarni boshqarish" },
  { id: "orders:read", label: "Buyurtmalarni ko'rish" },
  { id: "orders:write", label: "Buyurtmalarni boshqarish" },
  { id: "users:read", label: "Foydalanuvchilarni ko'rish" },
  { id: "analytics:read", label: "Analitikani ko'rish" },
  { id: "categories:read", label: "Kategoriyalarni ko'rish" },
  { id: "shops:read", label: "Do'konlarni ko'rish" },
];

const webhookEvents = [
  { id: "order.created", label: "Buyurtma yaratildi" },
  { id: "order.updated", label: "Buyurtma yangilandi" },
  { id: "order.completed", label: "Buyurtma yakunlandi" },
  { id: "product.created", label: "Mahsulot qo'shildi" },
  { id: "product.updated", label: "Mahsulot yangilandi" },
  { id: "payment.completed", label: "To'lov bajarildi" },
  { id: "user.registered", label: "Yangi foydalanuvchi" },
];

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: apiKeysData, isLoading: loading } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: fetchApiKeys,
  });
  const apiKeys = Array.isArray(apiKeysData) ? apiKeysData : [];

  const [showCreate, setShowCreate] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  // Create API Key form
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyUserId, setNewKeyUserId] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState("1000");

  // Create Webhook form
  const [webhookApiKeyId, setWebhookApiKeyId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents_sel, setWebhookEvents_sel] = useState<string[]>([]);

  const createKeyMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      toast.success(t('apiKeyCreated'));
      setShowCreate(false);
      setNewKeyName(""); setNewKeyUserId(""); setNewKeyPermissions([]); setNewKeyRateLimit("1000");
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      toast.success(t('apiKeyDeleted'));
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  const createWebhookMutation = useMutation({
    mutationFn: (params: { apiKeyId: string; url: string; events: string[] }) => createWebhook(params),
    onSuccess: () => {
      toast.success(t('webhookCreated'));
      setShowWebhook(false);
      setWebhookApiKeyId(""); setWebhookUrl(""); setWebhookEvents_sel([]);
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      toast.success(t('webhookDeleted'));
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  function handleCreateKey() {
    if (!newKeyName || !newKeyUserId) {
      toast.error(t('nameAndUserRequired'));
      return;
    }
    createKeyMutation.mutate({
      userId: newKeyUserId,
      name: newKeyName,
      permissions: newKeyPermissions,
      rateLimit: parseInt(newKeyRateLimit) || 1000,
    });
  }

  function handleDeleteKey(id: string) {
    if (!confirm(t('confirmDeleteApiKey'))) return;
    deleteKeyMutation.mutate(id);
  }

  function handleCreateWebhook() {
    if (!webhookApiKeyId || !webhookUrl || webhookEvents_sel.length === 0) {
      toast.error(t('fillAllFields'));
      return;
    }
    createWebhookMutation.mutate({ apiKeyId: webhookApiKeyId, url: webhookUrl, events: webhookEvents_sel });
  }

  function handleDeleteWebhook(id: string) {
    deleteWebhookMutation.mutate(id);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(t('copied'));
  }

  function togglePerm(perm: string) {
    setNewKeyPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  }

  function toggleWebhookEvent(ev: string) {
    setWebhookEvents_sel(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <Key className="w-7 h-7 text-primary" />
            {t('apiMarketplace')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('apiKeysManagement')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showWebhook} onOpenChange={setShowWebhook}>
            <DialogTrigger asChild>
              <Button variant="outline"><Webhook className="w-4 h-4 mr-2" /> Webhook</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('newWebhook')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>API Key ID</Label>
                  <Input value={webhookApiKeyId} onChange={e => setWebhookApiKeyId(e.target.value)} placeholder={t('apiKeyId')} />
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-site.com/webhook" />
                </div>
                <div>
                  <Label>{t('events')}</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {webhookEvents.map(ev => (
                      <label key={ev.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={webhookEvents_sel.includes(ev.id)}
                          onCheckedChange={() => toggleWebhookEvent(ev.id)}
                        />
                        {ev.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateWebhook}><Plus className="w-4 h-4 mr-2" /> {t('create')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> {t('apiKey')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('newApiKey')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('apiKeyName')}</Label>
                  <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Masalan: Mobile App" />
                </div>
                <div>
                  <Label>{t('userId')}</Label>
                  <Input value={newKeyUserId} onChange={e => setNewKeyUserId(e.target.value)} placeholder="UUID" />
                </div>
                <div>
                  <Label>{t('rateLimitPerHour')}</Label>
                  <Input type="number" value={newKeyRateLimit} onChange={e => setNewKeyRateLimit(e.target.value)} />
                </div>
                <div>
                  <Label>{t('permissions')}</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {availablePermissions.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={newKeyPermissions.includes(perm.id)}
                          onCheckedChange={() => togglePerm(perm.id)}
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateKey}><Plus className="w-4 h-4 mr-2" /> {t('create')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">{t('apiKeys')}</TabsTrigger>
          <TabsTrigger value="docs">{t('documentation')}</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4 mt-4">
          {loading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">{t('loading')}</CardContent></Card>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('noApiKeys')}</p>
                <Button className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" /> {t('createFirstKey')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((key: any) => (
              <Card key={key.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold">{key.name}</h3>
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono bg-muted px-3 py-1.5 rounded mt-2 max-w-full overflow-hidden">
                        <span className="truncate">{key.key || key.id}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(key.key || key.id)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(key.permissions || []).map((p: string) => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Rate: {key.rateLimit || 1000}{t('perHour')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : t('notUsed')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Calls: {key.requestCount || 0}
                        </span>
                      </div>

                      {/* Webhooks */}
                      {key.webhooks && key.webhooks.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Webhook className="w-3 h-3" /> Webhooklar
                          </p>
                          {key.webhooks.map((wh: any) => (
                            <div key={wh.id} className="flex items-center justify-between text-xs bg-muted px-3 py-2 rounded">
                              <div>
                                <p className="font-mono truncate max-w-[200px] sm:max-w-[400px]">{wh.url}</p>
                                <div className="flex gap-1 mt-1">
                                  {(wh.events || []).map((ev: string) => (
                                    <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                                  ))}
                                </div>
                              </div>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteWebhook(wh.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => handleDeleteKey(key.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" /> API Hujjatlari
              </CardTitle>
              <CardDescription>Topla.uz API dan foydalanish uchun qo&apos;llanma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">Autentifikatsiya</h3>
                <div className="bg-muted p-4 rounded font-mono text-sm">
                  <p className="text-muted-foreground">// Har bir so&apos;rovda Header ga API kalitni qo&apos;shing:</p>
                  <p className="mt-1">Authorization: Bearer YOUR_API_KEY</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Asosiy Endpointlar</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">GET</Badge>
                      <span className="font-mono">/api/v1/products</span>
                    </div>
                    <span className="text-muted-foreground">Mahsulotlar ro&apos;yxati</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">GET</Badge>
                      <span className="font-mono">/api/v1/products/:id</span>
                    </div>
                    <span className="text-muted-foreground">Mahsulot tafsilotlari</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">GET</Badge>
                      <span className="font-mono">/api/v1/categories</span>
                    </div>
                    <span className="text-muted-foreground">Kategoriyalar</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">GET</Badge>
                      <span className="font-mono">/api/v1/orders</span>
                    </div>
                    <span className="text-muted-foreground">Buyurtmalar</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Rate Limiting</h3>
                <p className="text-sm text-muted-foreground">
                  Har bir API kalit uchun soatlik so&apos;rovlar soni cheklangan. Standart limit — 1000 so&apos;rov/soat.
                  Rate limitga yetganda 429 Too Many Requests xatosi qaytariladi.
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Webhook Formatı</h3>
                <div className="bg-muted p-4 rounded font-mono text-xs sm:text-sm">
                  <pre>{`{
  "event": "order.created",
  "data": { ... },
  "timestamp": "2025-01-15T12:00:00Z",
  "signature": "hmac-sha256-signature"
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

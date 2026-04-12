"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Key, Plus, Trash2, Copy, Globe, Webhook,
  Shield, Clock, CheckCircle2, XCircle, Play,
  Code2, Book, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { vendorApi, type VendorApiKey, type VendorWebhook } from "@/lib/api/vendor";
import { useTranslation } from "@/store/locale-store";

type VendorPermission = {
  id: string;
  labelKey: string;
};

const VENDOR_PERMISSIONS: VendorPermission[] = [
  { id: "products.read",    labelKey: "vendorPermProducts" },
  { id: "products.write",   labelKey: "vendorPermProductsWrite" },
  { id: "orders.read",      labelKey: "vendorPermOrders" },
  { id: "orders.write",     labelKey: "vendorPermOrdersWrite" },
  { id: "inventory.write",  labelKey: "vendorPermInventory" },
  { id: "shop.read",        labelKey: "vendorPermShop" },
  { id: "stats.read",       labelKey: "vendorPermStats" },
];

const WEBHOOK_EVENTS = [
  { id: "order.created",         label: "Yangi buyurtma" },
  { id: "order.status_changed",  label: "Buyurtma statusi o'zgardi" },
  { id: "order.cancelled",       label: "Buyurtma bekor qilindi" },
  { id: "product.approved",      label: "Mahsulot tasdiqlandi" },
  { id: "product.rejected",      label: "Mahsulot rad etildi" },
  { id: "product.low_stock",     label: "Ombor tugayapti" },
  { id: "payment.received",      label: "To'lov qabul qilindi" },
];

const PARTNER_ENDPOINTS = [
  { method: "GET",    path: "/api/v1/partner/shop",                perm: "shop.read",        desc: "Do'kon ma'lumotlari" },
  { method: "GET",    path: "/api/v1/partner/products",            perm: "products.read",    desc: "Mahsulotlar ro'yxati" },
  { method: "POST",   path: "/api/v1/partner/products",            perm: "products.write",   desc: "Mahsulot qo'shish" },
  { method: "PUT",    path: "/api/v1/partner/products/:id",        perm: "products.write",   desc: "Mahsulot yangilash" },
  { method: "DELETE", path: "/api/v1/partner/products/:id",        perm: "products.write",   desc: "Mahsulot o'chirish" },
  { method: "PATCH",  path: "/api/v1/partner/products/:id/stock",  perm: "inventory.write",  desc: "Ombor yangilash" },
  { method: "PATCH",  path: "/api/v1/partner/products/:id/price",  perm: "products.write",   desc: "Narx yangilash" },
  { method: "POST",   path: "/api/v1/partner/products/bulk",       perm: "products.write",   desc: "Ommaviy import" },
  { method: "GET",    path: "/api/v1/partner/orders",              perm: "orders.read",      desc: "Buyurtmalar ro'yxati" },
  { method: "GET",    path: "/api/v1/partner/orders/:id",          perm: "orders.read",      desc: "Buyurtma tafsilotlari" },
  { method: "PUT",    path: "/api/v1/partner/orders/:id/status",   perm: "orders.write",     desc: "Buyurtma statusini yangilash" },
  { method: "POST",   path: "/api/v1/partner/orders/:id/tracking", perm: "orders.write",     desc: "Kuzatuv raqami qo'shish" },
  { method: "GET",    path: "/api/v1/partner/categories",          perm: "(ommaviy)",        desc: "Kategoriyalar daraxti" },
  { method: "GET",    path: "/api/v1/partner/stats",               perm: "stats.read",       desc: "Do'kon statistikasi" },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  POST:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PUT:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  PATCH:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function VendorApiKeysPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery<VendorApiKey[]>({
    queryKey: ["vendor-api-keys"],
    queryFn: vendorApi.getApiKeys,
  });

  // Create key dialog state
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyPermissions, setKeyPermissions] = useState<string[]>(["products.read", "orders.read"]);
  const [keyRateLimit, setKeyRateLimit] = useState("1000");
  const [createdKeyData, setCreatedKeyData] = useState<{ key: string; secret: string } | null>(null);

  // Create webhook dialog state
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [webhookApiKeyId, setWebhookApiKeyId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);

  // Mutations
  const createKeyMutation = useMutation({
    mutationFn: vendorApi.createApiKey,
    onSuccess: (data) => {
      setCreatedKeyData({ key: data.key, secret: data.secret });
      setKeyName("");
      setKeyPermissions(["products.read", "orders.read"]);
      setKeyRateLimit("1000");
      queryClient.invalidateQueries({ queryKey: ["vendor-api-keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateKeyMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; isActive?: boolean; name?: string }) =>
      vendorApi.updateApiKey(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-api-keys"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: vendorApi.deleteApiKey,
    onSuccess: () => {
      toast.success(t("keyRevoked"));
      queryClient.invalidateQueries({ queryKey: ["vendor-api-keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createWebhookMutation = useMutation({
    mutationFn: vendorApi.createWebhook,
    onSuccess: () => {
      toast.success(t("webhookCreated"));
      setShowCreateWebhook(false);
      setWebhookApiKeyId("");
      setWebhookUrl("");
      setWebhookEvents([]);
      queryClient.invalidateQueries({ queryKey: ["vendor-api-keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: vendorApi.deleteWebhook,
    onSuccess: () => {
      toast.success(t("webhookDeleted"));
      queryClient.invalidateQueries({ queryKey: ["vendor-api-keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const testWebhookMutation = useMutation({
    mutationFn: vendorApi.testWebhook,
    onSuccess: (data) => {
      if (data.ok) toast.success(`${t("webhookTestSent")} (${data.statusCode})`);
      else toast.error(`${t("webhookTestFailed")} (${data.statusCode || data.error})`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function copyToClipboard(text: string, label = "") {
    navigator.clipboard.writeText(text);
    toast.success(label ? `${label} ${t("copied")}` : t("copied"));
  }

  function togglePermission(perm: string) {
    setKeyPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }

  function toggleWebhookEvent(ev: string) {
    setWebhookEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    );
  }

  function handleCreateKey() {
    if (!keyName.trim()) { toast.error(t("apiKeyName") + " " + t("required")); return; }
    createKeyMutation.mutate({
      name: keyName.trim(),
      permissions: keyPermissions,
      rateLimit: parseInt(keyRateLimit) || 1000,
    });
  }

  function handleCreateWebhook() {
    if (!webhookApiKeyId || !webhookUrl || webhookEvents.length === 0) {
      toast.error(t("fillAllFields")); return;
    }
    createWebhookMutation.mutate({ apiKeyId: webhookApiKeyId, url: webhookUrl, events: webhookEvents });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            {t("vendorApiKeysTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("vendorApiKeysDesc")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showCreateWebhook} onOpenChange={setShowCreateWebhook}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Webhook className="w-4 h-4 mr-2" /> {t("createWebhookBtn")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("newWebhook")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>API Kalit</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background mt-1"
                    value={webhookApiKeyId}
                    onChange={e => setWebhookApiKeyId(e.target.value)}
                  >
                    <option value="">— Kalit tanlang —</option>
                    {apiKeys.map(k => (
                      <option key={k.id} value={k.id}>{k.name} ({k.key})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder={t("webhookUrlPlaceholder")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{t("webhookEventsLabel")}</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {WEBHOOK_EVENTS.map(ev => (
                      <label key={ev.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={webhookEvents.includes(ev.id)}
                          onCheckedChange={() => toggleWebhookEvent(ev.id)}
                        />
                        {ev.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateWebhook} disabled={createWebhookMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> {t("create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showCreateKey}
            onOpenChange={(open) => { setShowCreateKey(open); if (!open) setCreatedKeyData(null); }}
          >
            <DialogTrigger asChild>
              <Button size="sm" disabled={apiKeys.length >= 5}>
                <Plus className="w-4 h-4 mr-2" />
                {t("createApiKey")}
                {apiKeys.length >= 5 && (
                  <span className="ml-2 text-xs opacity-70">(max 5)</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("newApiKey")}</DialogTitle>
              </DialogHeader>

              {createdKeyData ? (
                /* Show after creation — full key + secret visible ONCE */
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      {t("apiKeyCreatedOnce")}
                    </p>
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <div className="flex items-center gap-2 mt-1 font-mono text-xs bg-muted px-3 py-2 rounded">
                      <span className="flex-1 break-all">{createdKeyData.key}</span>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0"
                        onClick={() => copyToClipboard(createdKeyData.key, "API Key")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Secret</Label>
                    <div className="flex items-center gap-2 mt-1 font-mono text-xs bg-muted px-3 py-2 rounded">
                      <span className="flex-1 break-all">{createdKeyData.secret}</span>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0"
                        onClick={() => copyToClipboard(createdKeyData.secret, "Secret")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setShowCreateKey(false); setCreatedKeyData(null); }}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Saqlash tasdiqlandi
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                /* Creation form */
                <div className="space-y-4">
                  <div>
                    <Label>{t("apiKeyName")}</Label>
                    <Input
                      value={keyName}
                      onChange={e => setKeyName(e.target.value)}
                      placeholder={t("apiKeyNamePlaceholder")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("rateLimitPerHour")}</Label>
                    <Input
                      type="number" min={100} max={5000}
                      value={keyRateLimit}
                      onChange={e => setKeyRateLimit(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("permissionsLabel")}</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {VENDOR_PERMISSIONS.map(p => (
                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={keyPermissions.includes(p.id)}
                            onCheckedChange={() => togglePermission(p.id)}
                          />
                          <span>{t(p.labelKey)}</span>
                          <code className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {p.id}
                          </code>
                        </label>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending}>
                      <Plus className="w-4 h-4 mr-2" /> {t("create")}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">
            <Key className="w-4 h-4 mr-2" /> {t("apiKeys_tab")}
          </TabsTrigger>
          <TabsTrigger value="docs">
            <Book className="w-4 h-4 mr-2" /> Partner API
          </TabsTrigger>
        </TabsList>

        {/* -------- API Keys Tab -------- */}
        <TabsContent value="keys" className="space-y-4 mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">{t("loading")}</CardContent>
            </Card>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground text-sm">{t("noApiKeys")}</p>
                <Button className="mt-4" size="sm" onClick={() => setShowCreateKey(true)}>
                  <Plus className="w-4 h-4 mr-2" /> {t("createFirstKey")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey: VendorApiKey) => (
              <Card key={apiKey.id} className={!apiKey.isActive ? "opacity-60" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        <Badge variant={apiKey.isActive ? "default" : "secondary"} className="text-xs">
                          {apiKey.isActive ? t("active") : t("inactive")}
                        </Badge>
                        {apiKey.webhooks.some(w => w.failCount > 0) && (
                          <Badge variant="destructive" className="text-xs">
                            {apiKey.webhooks.filter(w => w.failCount > 0).length} webhook error
                          </Badge>
                        )}
                      </div>

                      {/* Key value */}
                      <div className="flex items-center gap-2 font-mono text-xs bg-muted px-3 py-2 rounded">
                        <Key className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">{apiKey.key}</span>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0"
                          onClick={() => copyToClipboard(apiKey.key)}
                          title="Nusxalash"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Permissions */}
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map(p => (
                          <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
                        ))}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {apiKey.rateLimit}{t("perHour")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apiKey.lastUsedAt
                            ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                            : t("notUsed")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {apiKey.webhooks.length} webhook
                        </span>
                      </div>

                      {/* Webhooks */}
                      {apiKey.webhooks.length > 0 && (
                        <div className="pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Webhook className="w-3 h-3" /> Webhooklar
                          </p>
                          {apiKey.webhooks.map((wh: VendorWebhook) => (
                            <div key={wh.id} className="flex items-center gap-2 text-xs bg-muted/60 px-3 py-2 rounded">
                              <div className="flex-1 min-w-0">
                                <p className="font-mono truncate">{wh.url}</p>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {wh.events.map(ev => (
                                    <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                                  ))}
                                </div>
                                {wh.failCount > 0 && (
                                  <p className="text-red-500 mt-1 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> {wh.failCount} ta xatolik
                                    {!wh.isActive && " (nofaol)"}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
                                  title="Test yuborish"
                                  onClick={() => testWebhookMutation.mutate(wh.id)}
                                  disabled={testWebhookMutation.isPending}
                                >
                                  <Play className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                  onClick={() => deleteWebhookMutation.mutate(wh.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Switch
                        checked={apiKey.isActive}
                        onCheckedChange={() => updateKeyMutation.mutate({ id: apiKey.id, isActive: !apiKey.isActive })}
                        aria-label="Faol/nofaol"
                      />
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (!confirm(t("confirmDeleteApiKey"))) return;
                          deleteKeyMutation.mutate(apiKey.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {apiKeys.length > 0 && apiKeys.length < 5 && (
            <p className="text-xs text-muted-foreground text-center">
              {apiKeys.length}/5 ta kalit yaratilgan
            </p>
          )}
        </TabsContent>

        {/* -------- Partner API Docs Tab -------- */}
        <TabsContent value="docs" className="mt-4 space-y-6">
          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Autentifikatsiya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Barcha <code>/api/v1/partner/*</code> endpointlari uchun{" "}
                <code className="bg-muted px-1 rounded">X-API-Key</code> headerida{" "}
                <code className="bg-muted px-1 rounded">tpk_...</code> prefiks bilan API kalitni yuboring.
              </p>
              <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
                <p className="text-muted-foreground"># Har bir so&apos;rovda qo&apos;shiladi:</p>
                <p>X-API-Key: tpk_your_api_key_here</p>
              </div>
              <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
                <p className="text-muted-foreground"># Curl misol:</p>
                <p>curl https://api.topla.uz/api/v1/partner/products \</p>
                <p>&nbsp;&nbsp;-H &quot;X-API-Key: tpk_your_key&quot;</p>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" /> Endpointlar
              </CardTitle>
              <CardDescription>
                Base URL: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">https://api.topla.uz</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {PARTNER_ENDPOINTS.map((ep, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  >
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono min-w-[52px] text-center ${METHOD_COLORS[ep.method] || ""}`}>
                      {ep.method}
                    </span>
                    <code className="flex-1 text-xs text-primary truncate">{ep.path}</code>
                    <Badge variant="outline" className="text-[10px] hidden sm:flex">
                      {ep.perm}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:block min-w-[180px] text-right">
                      {ep.desc}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Webhook format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="w-4 h-4 text-primary" /> Webhook formati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Webhook so&apos;rovlari HMAC-SHA256 imzosi bilan yuboriladi.
                Imzo <code className="bg-muted px-1 rounded">X-Topla-Signature</code> headerida bo&apos;ladi.
              </p>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs">
                <pre>{`// POST https://your-site.com/webhook
// Headers:
// X-Topla-Signature: sha256=<hmac>
// X-Topla-Event: order.created
// X-Topla-Timestamp: 2025-01-01T12:00:00Z

{
  "event": "order.created",
  "timestamp": "2025-01-01T12:00:00Z",
  "data": {
    "orderId": "...",
    "totalAmount": 150000,
    "status": "pending"
  }
}`}</pre>
              </div>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs">
                <pre>{`// Imzoni tekshirish (Node.js):
const crypto = require('crypto');
const sig = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');
const expected = \`sha256=\${sig}\`;
const received = req.headers['x-topla-signature'];
const isValid = crypto.timingSafeEqual(
  Buffer.from(expected),
  Buffer.from(received)
);`}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Rate limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Har bir API kalit uchun soatiga so&apos;rovlar soni cheklangan.</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Standart: 1,000 so&apos;rov/soat</li>
                <li>Kalit yaratilganda sozlanishi mumkin (maks. 5,000)</li>
                <li>Limit oshilganda: <code className="bg-muted px-1 rounded">429 Too Many Requests</code></li>
                <li>Javobda: <code className="bg-muted px-1 rounded">retryAfter</code> (soniya)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

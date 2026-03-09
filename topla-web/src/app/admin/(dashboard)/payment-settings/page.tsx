"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard, Smartphone, Shield, Building2,
  Check, ArrowDownToLine, Wallet,
  Clock, CheckCircle2, XCircle, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Bank provayderlari
const bankProviders = [
  {
    id: "aliance" as const,
    name: "Aliance Bank",
    logo: "🏦",
    description: "Aliance Bank orqali karta yechish (Humo/Uzcard)",
    cards: ["Humo", "Uzcard"],
    color: "bg-emerald-50 border-emerald-200",
    minAmount: 50_000,
    maxAmount: 100_000_000,
    commission: 1.0,
    processingTime: "1-3 soat",
    envLogin: "ALIANCE_API_LOGIN",
    envSecret: "ALIANCE_API_SECRET",
  },
  {
    id: "octobank" as const,
    name: "Octobank",
    logo: "🐙",
    description: "Octobank orqali karta yechish (Humo/Uzcard/Visa/Mastercard)",
    cards: ["Humo", "Uzcard", "Visa", "Mastercard"],
    color: "bg-blue-50 border-blue-200",
    minAmount: 10_000,
    maxAmount: 200_000_000,
    commission: 0.8,
    processingTime: "15-60 daqiqa",
    envLogin: "OCTOBANK_API_LOGIN",
    envSecret: "OCTOBANK_API_SECRET",
  },
];

type WithdrawalStatus = "pending" | "processing" | "completed" | "failed";

const statusConfig: Record<WithdrawalStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Kutilmoqda", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { label: "Jarayonda", color: "bg-blue-100 text-blue-800", icon: ArrowDownToLine },
  completed: { label: "Bajarildi", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  failed: { label: "Xatolik", color: "bg-red-100 text-red-800", icon: XCircle },
};

interface ProviderStatus {
  configured: boolean;
  name: string;
}

interface PaymentSettingsData {
  settings: Array<{ key: string; value: string; isSecret: boolean; description?: string }>;
  providers: { aliance: ProviderStatus; octobank: ProviderStatus };
  installmentRates: Record<string, number>;
}

async function fetchWithAuth(url: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `API xatosi: ${res.status}`);
  }
  return res.json();
}

export default function PaymentSettingsPage() {
  const [activeProvider, setActiveProvider] = useState("aliance");
  const [cashOnDelivery, setCashOnDelivery] = useState(true);
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [autoWithdrawThreshold, setAutoWithdrawThreshold] = useState("500000");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsData, setSettingsData] = useState<PaymentSettingsData | null>(null);

  // Bank config formlar
  const [alianceLogin, setAlianceLogin] = useState("");
  const [alianceSecret, setAlianceSecret] = useState("");
  const [alianceMerchantId, setAlianceMerchantId] = useState("");
  const [octobankLogin, setOctobankLogin] = useState("");
  const [octobankSecret, setOctobankSecret] = useState("");
  const [octobankMerchantId, setOctobankMerchantId] = useState("");

  // Security
  const [webhookIPs, setWebhookIPs] = useState("");
  const [dailyLimit, setDailyLimit] = useState("50000000");
  const [dailyCountLimit, setDailyCountLimit] = useState("10");

  // Yechish tarixi
  const [withdrawals, setWithdrawals] = useState<Array<{
    id: string; amount: number; bank: string; card: string;
    status: WithdrawalStatus; date: string;
  }>>([]);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/payments/settings`);
      const data = res.data as PaymentSettingsData;
      setSettingsData(data);

      // Sozlamalarni formga yuklash
      const getVal = (key: string) => data.settings.find(s => s.key === key)?.value || "";
      setAlianceLogin(getVal("aliance_api_login"));
      setAlianceSecret(getVal("aliance_api_secret"));
      setAlianceMerchantId(getVal("aliance_merchant_id"));
      setOctobankLogin(getVal("octobank_api_login"));
      setOctobankSecret(getVal("octobank_api_secret"));
      setOctobankMerchantId(getVal("octobank_merchant_id"));
      setWebhookIPs(getVal("webhook_ips"));
      setDailyLimit(getVal("daily_limit") || "50000000");
      setDailyCountLimit(getVal("daily_count_limit") || "10");
      setCashOnDelivery(getVal("cash_on_delivery") !== "false");
      setAutoWithdraw(getVal("auto_withdraw") === "true");
      setAutoWithdrawThreshold(getVal("auto_withdraw_threshold") || "500000");
      setActiveProvider(getVal("active_provider") || "aliance");
    } catch (err) {
      console.error('Payment settings yuklashda xatolik:', err);
      // API ulanmasa, bo'sh holat qo'yish (demo data yo'q)
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSetting = async (key: string, value: string, isSecret = false) => {
    try {
      await fetchWithAuth(`${API_BASE}/payments/settings`, {
        method: "POST",
        body: JSON.stringify({ key, value, isSecret }),
      });
      return true;
    } catch (e) {
      toast.error(`Saqlashda xatolik: ${(e as Error).message}`);
      return false;
    }
  };

  const saveProviderConfig = async () => {
    setIsSaving(true);
    try {
      const isAliance = activeProvider === "aliance";
      const settings = isAliance
        ? [
            { key: "aliance_api_login", value: alianceLogin, secret: true },
            { key: "aliance_api_secret", value: alianceSecret, secret: true },
            { key: "aliance_merchant_id", value: alianceMerchantId, secret: false },
          ]
        : [
            { key: "octobank_api_login", value: octobankLogin, secret: true },
            { key: "octobank_api_secret", value: octobankSecret, secret: true },
            { key: "octobank_merchant_id", value: octobankMerchantId, secret: false },
          ];

      await Promise.all(settings.map(s => saveSetting(s.key, s.value, s.secret)));
      await saveSetting("active_provider", activeProvider);

      toast.success(`${isAliance ? "Aliance Bank" : "Octobank"} sozlamalari saqlandi`);
    } catch (e) {
      toast.error(`Xatolik: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveGeneralSettings = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveSetting("cash_on_delivery", String(cashOnDelivery)),
        saveSetting("auto_withdraw", String(autoWithdraw)),
        saveSetting("auto_withdraw_threshold", autoWithdrawThreshold),
        saveSetting("active_provider", activeProvider),
      ]);
      toast.success("Sozlamalar saqlandi");
    } catch (e) {
      toast.error(`Xatolik: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveSetting("webhook_ips", webhookIPs),
        saveSetting("daily_limit", dailyLimit),
        saveSetting("daily_count_limit", dailyCountLimit),
      ]);
      toast.success("Xavfsizlik sozlamalari saqlandi");
    } catch (e) {
      toast.error(`Xatolik: ${(e as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            To&apos;lov Tizimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Karta orqali yechish — Aliance Bank / Octobank
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSettings}>
          <RefreshCw className="w-4 h-4 mr-2" /> Yangilash
        </Button>
      </div>

      {/* Provider status badges */}
      {settingsData?.providers && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(settingsData.providers).map(([key, provider]) => (
            <Badge
              key={key}
              variant={provider.configured ? "default" : "secondary"}
              className={provider.configured ? "bg-green-500" : ""}
            >
              {provider.configured ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {provider.name}: {provider.configured ? "Sozlangan" : "Sozlanmagan"}
            </Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="banks">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="banks">Bank Provayderlari</TabsTrigger>
          <TabsTrigger value="withdrawals">Yechishlar Tarixi</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
          <TabsTrigger value="security">Xavfsizlik</TabsTrigger>
        </TabsList>

        {/* Bank Providers */}
        <TabsContent value="banks" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Bank integratsiyalari
              </CardTitle>
              <CardDescription>
                Sotuvchilar balansi karta orqali yechiladi. API kalitlarini .env faylda yoki quyida kiriting.
              </CardDescription>
            </CardHeader>
          </Card>

          {bankProviders.map(bank => {
            const providerStatus = settingsData?.providers?.[bank.id];
            return (
            <Card key={bank.id} className={activeProvider === bank.id ? bank.color : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="text-3xl">{bank.logo}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-lg">{bank.name}</h3>
                        {providerStatus?.configured ? (
                          <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Sozlangan</Badge>
                        ) : activeProvider === bank.id ? (
                          <Badge variant="default"><Check className="w-3 h-3 mr-1" /> Tanlangan</Badge>
                        ) : (
                          <Badge variant="secondary">Nofaol</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{bank.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {bank.cards.map(c => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Komissiya:</span>
                          <p className="font-semibold">{bank.commission}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min summa:</span>
                          <p className="font-semibold">{bank.minAmount.toLocaleString()} so&apos;m</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max summa:</span>
                          <p className="font-semibold">{bank.maxAmount.toLocaleString()} so&apos;m</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ishlash vaqti:</span>
                          <p className="font-semibold">{bank.processingTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={activeProvider === bank.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveProvider(bank.id)}
                    className="shrink-0"
                  >
                    {activeProvider === bank.id ? "Tanlangan" : "Tanlash"}
                  </Button>
                </div>

                {activeProvider === bank.id && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>API Login</Label>
                      <Input
                        placeholder={`${bank.name} API login`}
                        type="password"
                        value={bank.id === "aliance" ? alianceLogin : octobankLogin}
                        onChange={e => bank.id === "aliance" ? setAlianceLogin(e.target.value) : setOctobankLogin(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">env: {bank.envLogin}</p>
                    </div>
                    <div>
                      <Label>API Secret Key</Label>
                      <Input
                        placeholder={`${bank.name} secret key`}
                        type="password"
                        value={bank.id === "aliance" ? alianceSecret : octobankSecret}
                        onChange={e => bank.id === "aliance" ? setAlianceSecret(e.target.value) : setOctobankSecret(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">env: {bank.envSecret}</p>
                    </div>
                    <div>
                      <Label>Merchant ID</Label>
                      <Input
                        placeholder="Merchant identifikatori"
                        value={bank.id === "aliance" ? alianceMerchantId : octobankMerchantId}
                        onChange={e => bank.id === "aliance" ? setAlianceMerchantId(e.target.value) : setOctobankMerchantId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Callback URL</Label>
                      <Input value={`https://api.topla.uz/api/v1/payments/callback`} readOnly className="bg-muted" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <Button onClick={saveProviderConfig} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Saqlash
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}

          {/* Bo'lib to'lash stavkalari */}
          {settingsData?.installmentRates && (
            <Card>
              <CardHeader>
                <CardTitle>Bo&apos;lib to&apos;lash stavkalari</CardTitle>
                <CardDescription>Mijozlar uchun bo&apos;lib to&apos;lash foiz stavkalari</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(settingsData.installmentRates).map(([months, rate]) => (
                    <div key={months} className="p-3 rounded-lg border text-center">
                      <p className="text-2xl font-bold text-primary">{months}</p>
                      <p className="text-xs text-muted-foreground">oy</p>
                      <p className="text-sm font-semibold mt-1">{rate}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Withdrawals */}
        <TabsContent value="withdrawals" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5" />
                So&apos;nggi yechishlar
              </CardTitle>
              <CardDescription>
                Sotuvchilarning karta orqali yechish so&apos;rovlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowDownToLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hali yechish so&apos;rovlari yo&apos;q</p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 sm:hidden">
                    {withdrawals.map(w => {
                      const st = statusConfig[w.status];
                      const StatusIcon = st.icon;
                      return (
                        <div key={w.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono text-muted-foreground">{w.id}</span>
                            <Badge className={st.color}><StatusIcon className="w-3 h-3 mr-1" />{st.label}</Badge>
                          </div>
                          <p className="font-bold text-lg">{w.amount.toLocaleString()} so&apos;m</p>
                          <div className="text-sm text-muted-foreground">
                            <p>{w.bank} &middot; {w.card}</p>
                            <p>{w.date}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4">ID</th>
                          <th className="pb-2 pr-4">Summa</th>
                          <th className="pb-2 pr-4">Bank</th>
                          <th className="pb-2 pr-4">Karta</th>
                          <th className="pb-2 pr-4">Status</th>
                          <th className="pb-2">Sana</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map(w => {
                          const st = statusConfig[w.status];
                          const StatusIcon = st.icon;
                          return (
                            <tr key={w.id} className="border-b last:border-0">
                              <td className="py-3 pr-4 font-mono text-xs">{w.id}</td>
                              <td className="py-3 pr-4 font-semibold">{w.amount.toLocaleString()} so&apos;m</td>
                              <td className="py-3 pr-4">{w.bank}</td>
                              <td className="py-3 pr-4 font-mono text-xs">{w.card}</td>
                              <td className="py-3 pr-4">
                                <Badge className={st.color}><StatusIcon className="w-3 h-3 mr-1" />{st.label}</Badge>
                              </td>
                              <td className="py-3 text-muted-foreground">{w.date}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>To&apos;lov usullari</CardTitle>
              <CardDescription>Mijozlar qanday to&apos;lashi mumkinligini sozlash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Karta orqali to&apos;lov</p>
                    <p className="text-sm text-muted-foreground">Humo, Uzcard karta orqali avtomatik yechish</p>
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Naqd to&apos;lov</p>
                    <p className="text-sm text-muted-foreground">Yetkazib berishda naqd to&apos;lov</p>
                  </div>
                </div>
                <Switch checked={cashOnDelivery} onCheckedChange={setCashOnDelivery} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avtomatik yechish</CardTitle>
              <CardDescription>Sotuvchi balansi ma&apos;lum summaga yetganda avtomatik karta orqali yechish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Avtomatik yechish</p>
                  <p className="text-sm text-muted-foreground">Balans chegaraga yetganda avtomatik o&apos;tkazma</p>
                </div>
                <Switch checked={autoWithdraw} onCheckedChange={setAutoWithdraw} />
              </div>
              {autoWithdraw && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Chegara summasi (so&apos;m)</Label>
                    <Input
                      type="number"
                      value={autoWithdrawThreshold}
                      onChange={e => setAutoWithdrawThreshold(e.target.value)}
                      min="50000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Balans shu summaga yetganda avtomatik yechiladi</p>
                  </div>
                  <div>
                    <Label>Asosiy bank</Label>
                    <Select value={activeProvider} onValueChange={setActiveProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aliance">Aliance Bank</SelectItem>
                        <SelectItem value="octobank">Octobank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={saveGeneralSettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Saqlash
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Xavfsizlik sozlamalari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Callback IP Whitelist</p>
                  <p className="text-sm text-muted-foreground">Faqat bank IP manzillardan callback qabul qilish</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div>
                <Label>Ruxsat etilgan IP manzillar</Label>
                <Input
                  placeholder="Bank IP manzillarini kiriting"
                  className="mt-1"
                  value={webhookIPs}
                  onChange={e => setWebhookIPs(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Vergul bilan ajrating. env: PAYMENT_WEBHOOK_IPS</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">HMAC imzo tekshiruvi</p>
                  <p className="text-sm text-muted-foreground">Callback imzosini HMAC-SHA256 bilan tasdiqlash (doim yoqiq)</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Kunlik yechish limiti</p>
                  <p className="text-sm text-muted-foreground">Bir kunda maksimal yechish miqdorini cheklash</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Kunlik limit (so&apos;m)</Label>
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={e => setDailyLimit(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Kunlik yechish soni limiti</Label>
                  <Input
                    type="number"
                    value={dailyCountLimit}
                    onChange={e => setDailyCountLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Fraud Prevention</p>
                  <p className="text-sm text-muted-foreground">Shubhali tranzaksiyalarni avtomatik bloklash</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSecuritySettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Xavfsizlik sozlamalarini saqlash
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
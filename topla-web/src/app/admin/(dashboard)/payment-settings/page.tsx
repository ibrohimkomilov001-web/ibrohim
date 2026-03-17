"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTranslation } from '@/store/locale-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

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
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
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
  pending: { label: "pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  processing: { label: "inProcess", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: ArrowDownToLine },
  completed: { label: "done", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  failed: { label: "errorOccurred", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
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
  const { getCsrfToken } = await import('@/lib/api/base-client');
  const csrf = getCsrfToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
      ...options?.headers,
    },
    credentials: 'include', // httpOnly cookie orqali auth
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `API xatosi: ${res.status}`);
  }
  return res.json();
}

export default function PaymentSettingsPage() {
  const { t } = useTranslation();
  const [activeProvider, setActiveProvider] = useState("aliance");
  const [cashOnDelivery, setCashOnDelivery] = useState(true);
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [autoWithdrawThreshold, setAutoWithdrawThreshold] = useState("500000");
  const queryClient = useQueryClient();

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

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const res = await fetchWithAuth(`${API_BASE}/payments/settings`);
      return res.data as PaymentSettingsData;
    },
  });

  // Sync form state when settings data loads
  useEffect(() => {
    if (!settingsData) return;
    const getVal = (key: string) => settingsData.settings.find(s => s.key === key)?.value || "";
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
  }, [settingsData]);

  const saveSetting = async (key: string, value: string, isSecret = false) => {
    try {
      await fetchWithAuth(`${API_BASE}/payments/settings`, {
        method: "POST",
        body: JSON.stringify({ key, value, isSecret }),
      });
      return true;
    } catch (e) {
      toast.error(`${t('saveError')}: ${(e as Error).message}`);
      return false;
    }
  };

  const saveProviderMutation = useMutation({
    mutationFn: async () => {
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
      return isAliance;
    },
    onSuccess: (isAliance) => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success(`${isAliance ? "Aliance Bank" : "Octobank"} ${t('providerSettingsSaved')}`);
    },
    onError: (e: Error) => {
      toast.error(`${t('errorOccurred')}: ${e.message}`);
    },
  });

  const saveGeneralMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSetting("cash_on_delivery", String(cashOnDelivery)),
        saveSetting("auto_withdraw", String(autoWithdraw)),
        saveSetting("auto_withdraw_threshold", autoWithdrawThreshold),
        saveSetting("active_provider", activeProvider),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success(t('settingsSaved'));
    },
    onError: (e: Error) => {
      toast.error(`${t('errorOccurred')}: ${e.message}`);
    },
  });

  const saveSecurityMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSetting("webhook_ips", webhookIPs),
        saveSetting("daily_limit", dailyLimit),
        saveSetting("daily_count_limit", dailyCountLimit),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success(t('securitySettingsSaved'));
    },
    onError: (e: Error) => {
      toast.error(`${t('errorOccurred')}: ${e.message}`);
    },
  });

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
            {t('paymentSettingsTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('paymentSettingsDesc')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" /> {t('refresh')}
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
              {provider.name}: {provider.configured ? t('configured') : t('notConfigured')}
            </Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="banks">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="banks">{t('bankProviders')}</TabsTrigger>
          <TabsTrigger value="withdrawals">{t('withdrawalsHistory')}</TabsTrigger>
          <TabsTrigger value="settings">{t('settingsTab')}</TabsTrigger>
          <TabsTrigger value="security">{t('securityTab')}</TabsTrigger>
        </TabsList>

        {/* Bank Providers */}
        <TabsContent value="banks" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t('bankIntegrations')}
              </CardTitle>
              <CardDescription>
                {t('bankIntegrationsDesc')}
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
                          <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" /> {t('configured')}</Badge>
                        ) : activeProvider === bank.id ? (
                          <Badge variant="default"><Check className="w-3 h-3 mr-1" /> {t('selected')}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('inactive')}</Badge>
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
                          <span className="text-muted-foreground">{t('commission')}:</span>
                          <p className="font-semibold">{bank.commission}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('minAmount')}:</span>
                          <p className="font-semibold">{bank.minAmount.toLocaleString()} so&apos;m</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('maxAmount')}:</span>
                          <p className="font-semibold">{bank.maxAmount.toLocaleString()} so&apos;m</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('processingTime')}:</span>
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
                    {activeProvider === bank.id ? t('selected') : t('selectBank')}
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
                      <Label>{t('merchantId')}</Label>
                      <Input
                        placeholder={t('merchantId')}
                        value={bank.id === "aliance" ? alianceMerchantId : octobankMerchantId}
                        onChange={e => bank.id === "aliance" ? setAlianceMerchantId(e.target.value) : setOctobankMerchantId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Callback URL</Label>
                      <Input value={`https://api.topla.uz/api/v1/payments/callback`} readOnly className="bg-muted" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <Button onClick={() => saveProviderMutation.mutate()} disabled={saveProviderMutation.isPending}>
                        {saveProviderMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        {t('save')}
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
                <CardTitle>{t('installmentRates')}</CardTitle>
                <CardDescription>{t('installmentRatesDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(settingsData.installmentRates).map(([months, rate]) => (
                    <div key={months} className="p-3 rounded-lg border text-center">
                      <p className="text-2xl font-bold text-primary">{months}</p>
                      <p className="text-xs text-muted-foreground">{t('month')}</p>
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
                {t('recentWithdrawals')}
              </CardTitle>
              <CardDescription>
                {t('recentWithdrawalsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowDownToLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t('noWithdrawalsYet')}</p>
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
                            <Badge className={st.color}><StatusIcon className="w-3 h-3 mr-1" />{t(st.label)}</Badge>
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
                          <th className="pb-2 pr-4">{t('amount')}</th>
                          <th className="pb-2 pr-4">{t('bank')}</th>
                          <th className="pb-2 pr-4">{t('card')}</th>
                          <th className="pb-2 pr-4">{t('status')}</th>
                          <th className="pb-2">{t('date')}</th>
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
                                <Badge className={st.color}><StatusIcon className="w-3 h-3 mr-1" />{t(st.label)}</Badge>
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
              <CardTitle>{t('paymentMethods')}</CardTitle>
              <CardDescription>{t('paymentMethodsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{t('cardPayment')}</p>
                    <p className="text-sm text-muted-foreground">{t('cardPaymentDesc')}</p>
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{t('cashPayment')}</p>
                    <p className="text-sm text-muted-foreground">{t('cashPaymentDesc')}</p>
                  </div>
                </div>
                <Switch checked={cashOnDelivery} onCheckedChange={setCashOnDelivery} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('autoWithdraw')}</CardTitle>
              <CardDescription>{t('autoWithdrawDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">{t('autoWithdraw')}</p>
                  <p className="text-sm text-muted-foreground">{t('autoWithdrawThreshold')}</p>
                </div>
                <Switch checked={autoWithdraw} onCheckedChange={setAutoWithdraw} />
              </div>
              {autoWithdraw && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('thresholdAmount')}</Label>
                    <Input
                      type="number"
                      value={autoWithdrawThreshold}
                      onChange={e => setAutoWithdrawThreshold(e.target.value)}
                      min="50000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('thresholdHint')}</p>
                  </div>
                  <div>
                    <Label>{t('primaryBank')}</Label>
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
                <Button onClick={() => saveGeneralMutation.mutate()} disabled={saveGeneralMutation.isPending}>
                  {saveGeneralMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {t('save')}
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
                {t('securitySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">{t('callbackIpWhitelist')}</p>
                  <p className="text-sm text-muted-foreground">{t('callbackIpWhitelistDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div>
                <Label>{t('allowedIps')}</Label>
                <Input
                  placeholder={t('allowedIpsPlaceholder')}
                  className="mt-1"
                  value={webhookIPs}
                  onChange={e => setWebhookIPs(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">{t('allowedIpsHint')}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">{t('hmacVerification')}</p>
                  <p className="text-sm text-muted-foreground">{t('hmacVerificationDesc')}</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">{t('dailyWithdrawLimit')}</p>
                  <p className="text-sm text-muted-foreground">{t('dailyWithdrawLimitDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t('dailyLimitSom')}</Label>
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={e => setDailyLimit(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t('dailyCountLimit')}</Label>
                  <Input
                    type="number"
                    value={dailyCountLimit}
                    onChange={e => setDailyCountLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">{t('fraudPrevention')}</p>
                  <p className="text-sm text-muted-foreground">{t('fraudPreventionDesc')}</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveSecurityMutation.mutate()} disabled={saveSecurityMutation.isPending}>
                  {saveSecurityMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  {t('saveSecuritySettings')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle, ChevronRight, Store, Package, CreditCard,
  Truck, Star, BarChart3, Settings, FileText, Play,
  BookOpen, GraduationCap, ExternalLink, Rocket, Loader2,
  FileSignature, AlertCircle, Clock, ShieldCheck, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { useTranslation } from '@/store/locale-store';
import { useTelegramLink } from '@/hooks/useSettings';
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";

const STEP_ICONS: Record<string, any> = {
  shop_info: Store,
  contact_info: Settings,
  business_info: CreditCard,
  contract: FileSignature,
  documents: FileText,
  first_product: Package,
  delivery_setup: Truck,
  social_links: Star,
};

const VIDEO_GUIDES = [
  {
    titleKey: "videoRegistration",
    duration: "3:45",
    thumbnail: "📹",
  },
  {
    titleKey: "videoAddProduct",
    duration: "5:20",
    thumbnail: "📦",
  },
  {
    titleKey: "videoOrders",
    duration: "4:15",
    thumbnail: "📋",
  },
  {
    titleKey: "videoPayments",
    duration: "3:50",
    thumbnail: "💰",
  },
  {
    titleKey: "videoAnalytics",
    duration: "6:10",
    thumbnail: "📊",
  },
];

const QUICK_TIPS = [
  {
    icon: Star,
    titleKey: "tipImages",
    descKey: "tipImagesDesc",
  },
  {
    icon: BarChart3,
    titleKey: "tipAnalytics",
    descKey: "tipAnalyticsDesc",
  },
  {
    icon: Settings,
    titleKey: "tipPricing",
    descKey: "tipPricingDesc",
  },
  {
    icon: Rocket,
    titleKey: "tipBoost",
    descKey: "tipBoostDesc",
  },
];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const telegramLink = useTelegramLink();
  const { shopStatus, contractStatus: authContractStatus, refreshProfile } = useAuth();
  const isPending = shopStatus === "pending";

  // Fetch onboarding progress from backend API (V-NEW-02)
  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["vendor-onboarding"],
    queryFn: vendorApi.getOnboarding,
  });

  // Fetch contract status with auto-refresh every 30s for pending vendors
  const { data: contractData, isLoading: contractLoading } = useQuery({
    queryKey: ["vendor-contract-status"],
    queryFn: () => api.get<{
      contractStatus: string;
      contractId?: string;
      contractUrl?: string;
      contractSentAt?: string;
      contractSignedAt?: string;
      contractNote?: string;
    }>("/vendor/contract-status"),
    enabled: isPending,
    refetchInterval: isPending ? 30000 : false,
  });

  // Refresh auth profile when contract status changes
  useEffect(() => {
    if (contractData?.contractStatus === "signed" && authContractStatus !== "signed") {
      refreshProfile();
    }
  }, [contractData?.contractStatus, authContractStatus, refreshProfile]);

  const steps = onboarding?.steps || [];
  const completedSteps = onboarding?.completed || 0;
  const totalSteps = onboarding?.total || 7;
  const progress = onboarding?.percentage || 0;
  const contract = contractData || onboarding?.contract;

  // Pending vendor uchun maxsus kutish sahifasi
  if (isPending) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Do&apos;koningiz tekshirilmoqda</h1>
          <p className="text-muted-foreground">
            Ro&apos;yxatdan muvaffaqiyatli o&apos;tdingiz! Quyidagi bosqichlar bajarilishi kerak.
          </p>
        </div>

        {/* Status Steps */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Step 1: Registration - always completed */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50/50 border border-green-200 dark:bg-green-900/10 dark:border-green-800">
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Ro&apos;yxatdan o&apos;tish</div>
                <div className="text-sm text-muted-foreground">Ma&apos;lumotlaringiz qabul qilindi</div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" /> Bajarildi
              </Badge>
            </div>

            {/* Step 2: Contract */}
            {(() => {
              const cs = contract?.contractStatus || "not_sent";
              const isContractDone = cs === "signed";
              const isContractSent = cs === "sent" || cs === "pending_signature";
              const isRejected = cs === "rejected";

              return (
                <div className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border",
                  isContractDone ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800" :
                  isRejected ? "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800" :
                  isContractSent ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800" :
                  "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
                )}>
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    isContractDone ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                    isRejected ? "bg-red-100 text-red-600" :
                    isContractSent ? "bg-blue-100 text-blue-600" :
                    "bg-yellow-100 text-yellow-600"
                  )}>
                    {isContractDone ? <CheckCircle className="h-5 w-5" /> :
                     isRejected ? <AlertCircle className="h-5 w-5" /> :
                     <FileSignature className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {isContractDone ? "Shartnoma imzolandi" :
                       isRejected ? "Shartnoma rad etildi" :
                       isContractSent ? "Shartnomani imzolang" :
                       "Shartnoma kutilmoqda"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {isContractDone ? "Shartnoma muvaffaqiyatli imzolandi." :
                       isRejected ? (contract?.contractNote || "Iltimos, admin bilan bog'laning.") :
                       isContractSent ? "DiDox orqali shartnoma yuborildi. Iltimos, ko'rib chiqing va imzolang." :
                       "Ma'lumotlaringiz tekshirilmoqda. Tez orada shartnoma yuboriladi."}
                    </div>
                    {isContractSent && contract?.contractUrl && (
                      <Button size="sm" className="mt-3" onClick={() => window.open(contract.contractUrl!, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Shartnomani ochish va imzolash
                      </Button>
                    )}
                  </div>
                  <Badge variant="secondary" className={cn(
                    isContractDone ? "bg-green-100 text-green-700" :
                    isRejected ? "bg-red-100 text-red-700" :
                    isContractSent ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  )}>
                    {isContractDone ? "Imzolandi" :
                     isRejected ? "Rad etildi" :
                     isContractSent ? "Imzolang" :
                     "Kutilmoqda"}
                  </Badge>
                </div>
              );
            })()}

            {/* Step 3: Admin Approval */}
            {(() => {
              const cs = contract?.contractStatus || "not_sent";
              const isContractSigned = cs === "signed";
              return (
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border",
                  isContractSigned ? "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800" : "bg-muted/30 border-muted"
                )}>
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    isContractSigned ? "bg-yellow-100 text-yellow-600" : "bg-muted text-muted-foreground"
                  )}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className={cn("font-medium", !isContractSigned && "text-muted-foreground")}>
                      Admin tasdiqlashi
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {isContractSigned
                        ? "Shartnoma imzolandi. Admin tez orada do'koningizni tasdiqlaydi."
                        : "Shartnoma imzolangandan keyin admin do'koningizni tasdiqlaydi."}
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn(
                    isContractSigned ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
                  )}>
                    {isContractSigned ? "Kutilmoqda" : "Navbatda"}
                  </Badge>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Holat har 30 soniyada avtomatik yangilanadi</span>
        </div>

        {/* Settings link */}
        <Card>
          <CardContent className="p-4">
            <Link href="/vendor/settings" className="flex items-center gap-3 text-sm hover:underline">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span>Do&apos;kon ma&apos;lumotlarini to&apos;ldirish va tahrirlash</span>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Savollaringiz bormi?</p>
            <a href={telegramLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full">
                <ExternalLink className="mr-2 h-4 w-4" /> Telegram orqali yordam
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Contract Status Banner */}
      {contract && contract.contractStatus !== 'signed' && (
        <Card className={cn(
          "border-2",
          contract.contractStatus === 'not_sent' ? "border-yellow-300 bg-yellow-50/50" :
          contract.contractStatus === 'sent' || contract.contractStatus === 'pending_signature' ? "border-blue-300 bg-blue-50/50" :
          contract.contractStatus === 'rejected' ? "border-red-300 bg-red-50/50" : ""
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {contract.contractStatus === 'rejected' ? (
                <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <FileSignature className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                {contract.contractStatus === 'not_sent' && (
                  <>
                    <h3 className="font-semibold">Shartnoma kutilmoqda</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ma&apos;lumotlaringiz ko&apos;rib chiqilmoqda. Admin tez orada shartnoma yuboradi.
                    </p>
                  </>
                )}
                {(contract.contractStatus === 'sent' || contract.contractStatus === 'pending_signature') && (
                  <>
                    <h3 className="font-semibold">Shartnomani imzolang</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Didox orqali shartnoma yuborildi. Iltimos, shartnomani ko&apos;rib chiqing va imzolang.
                    </p>
                    {contract.contractUrl && (
                      <Button size="sm" className="mt-2" onClick={() => window.open(contract.contractUrl!, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Shartnomani ochish
                      </Button>
                    )}
                  </>
                )}
                {contract.contractStatus === 'rejected' && (
                  <>
                    <h3 className="font-semibold text-red-600">Shartnoma rad etildi</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.contractNote || "Shartnoma rad etildi. Iltimos, admin bilan bog'laning."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">TOPLA Academy</h1>
        <p className="text-muted-foreground text-lg">
          {t('academyDesc')}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">{t('startSteps')}</h2>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {completedSteps}/{totalSteps} {t('stepsCompleted')}
            </Badge>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <div className="space-y-3">
            {steps.map((step, i) => {
              const stepKey = step.key || step.id || '';
              const stepLabel = step.label || step.title || '';
              const StepIcon = STEP_ICONS[stepKey] || Settings;
              return (
                <Link key={stepKey} href={step.href}>
                  <div
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm",
                      step.completed
                        ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      step.completed ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground",
                    )}>
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium",
                        step.completed && "line-through text-muted-foreground",
                      )}>
                        {stepLabel}
                      </div>
                    </div>
                    <StepIcon className={cn(
                      "h-5 w-5 shrink-0",
                      step.completed ? "text-green-500" : "text-muted-foreground",
                    )} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Video Guides */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> {t('videoGuides')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIDEO_GUIDES.map((video, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <div className="text-4xl">{video.thumbnail}</div>
                  <div className="absolute">
                    <Play className="h-8 w-8 text-primary opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <h3 className="font-medium text-sm mb-1">{t(video.titleKey)}</h3>
                <span className="text-xs text-muted-foreground">{video.duration}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div>
        <h2 className="text-xl font-bold mb-4">{t('usefulTips')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUICK_TIPS.map((tip, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <tip.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{t(tip.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(tip.descKey)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Support CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">{t('haveQuestion')}</p>
          <a href={telegramLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full">
              <ExternalLink className="mr-2 h-4 w-4" /> {t('telegramHelp')}
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

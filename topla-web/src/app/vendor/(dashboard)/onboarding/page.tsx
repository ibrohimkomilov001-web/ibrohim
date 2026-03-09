"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle, ChevronRight, Store, Package, CreditCard,
  Truck, Star, BarChart3, Settings, FileText, Play,
  BookOpen, GraduationCap, ExternalLink, Rocket,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  checkFn: (data: any) => boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "shop",
    title: "Do'kon sozlamalari",
    description: "Do'kon nomi, logotipi va tavsifini to'ldiring",
    icon: Store,
    href: "/vendor/settings",
    checkFn: (d) => !!d.shop?.name && !!d.shop?.logo,
  },
  {
    id: "product",
    title: "Birinchi mahsulot",
    description: "Kamida bitta mahsulot qo'shing (nom, narx, rasm)",
    icon: Package,
    href: "/vendor/products",
    checkFn: (d) => (d.stats?.products?.total || 0) > 0,
  },
  {
    id: "documents",
    title: "Hujjatlarni yuklash",
    description: "STIR/INN guvohnoma va litsenziya hujjatlari",
    icon: FileText,
    href: "/vendor/documents",
    checkFn: (d) => d.shop?.isVerified === true,
  },
  {
    id: "balance",
    title: "To'lov ma'lumotlari",
    description: "Bank kartangizni qo'shing (pul yechish uchun)",
    icon: CreditCard,
    href: "/vendor/balance",
    checkFn: (d) => !!d.shop?.bankCard || !!d.shop?.bankAccount,
  },
  {
    id: "delivery",
    title: "Yetkazib berish",
    description: "Yetkazib berish modelini tanlang (FBS yoki DBS)",
    icon: Truck,
    href: "/vendor/settings",
    checkFn: (d) => !!d.shop?.fulfillmentType,
  },
];

const VIDEO_GUIDES = [
  {
    title: "Platformaga kirish va ro'yxatdan o'tish",
    duration: "3:45",
    thumbnail: "📹",
  },
  {
    title: "Mahsulot qo'shish bo'yicha qo'llanma",
    duration: "5:20",
    thumbnail: "📦",
  },
  {
    title: "Buyurtmalarni boshqarish",
    duration: "4:15",
    thumbnail: "📋",
  },
  {
    title: "To'lovlar va moliyaviy hisobotlar",
    duration: "3:50",
    thumbnail: "💰",
  },
  {
    title: "Analitika va reklama",
    duration: "6:10",
    thumbnail: "📊",
  },
];

const QUICK_TIPS = [
  {
    icon: Star,
    title: "Sifatli rasmlar yuklang",
    description: "800x800 pikseldan katta, oq fonda, kamida 3 ta rasm",
  },
  {
    icon: BarChart3,
    title: "Analitikani kuzating",
    description: "Konversiya va savdo trendlaringizni muntazam tekshirib turing",
  },
  {
    icon: Settings,
    title: "Narxlarni raqobatbardosh qiling",
    description: "Bozordagi narxlarni tekshirib, mos narx qo'ying",
  },
  {
    icon: Rocket,
    title: "Reklamadan foydalaning",
    description: "Mahsulotlaringizni TOP ga chiqarish uchun reklama bering",
  },
];

export default function OnboardingPage() {
  const { data: shop } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: vendorApi.getShop,
  });
  const { data: stats } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: vendorApi.getStats,
  });

  const checkData = { shop, stats };
  const completedSteps = ONBOARDING_STEPS.filter((s) => s.checkFn(checkData)).length;
  const progress = Math.round((completedSteps / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">TOPLA Academy</h1>
        <p className="text-muted-foreground text-lg">
          Sotuvchi sifatida muvaffaqiyatga erishish uchun qo&apos;llanma
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Boshlash qadamlari</h2>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {completedSteps}/{ONBOARDING_STEPS.length} bajarildi
            </Badge>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-3">
            {ONBOARDING_STEPS.map((step, i) => {
              const completed = step.checkFn(checkData);
              return (
                <Link key={step.id} href={step.href}>
                  <div
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm",
                      completed
                        ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      completed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground",
                    )}>
                      {completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium",
                        completed && "line-through text-muted-foreground",
                      )}>
                        {step.title}
                      </div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                    <step.icon className={cn(
                      "h-5 w-5 shrink-0",
                      completed ? "text-green-500" : "text-muted-foreground",
                    )} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Video Guides */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Video qo&apos;llanmalar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIDEO_GUIDES.map((video, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <div className="text-4xl">{video.thumbnail}</div>
                  <div className="absolute">
                    <Play className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <h3 className="font-medium text-sm mb-1">{video.title}</h3>
                <span className="text-xs text-muted-foreground">{video.duration}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div>
        <h2 className="text-xl font-bold mb-4">Foydali maslahatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUICK_TIPS.map((tip, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <tip.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{tip.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{tip.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Support CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Savolingiz bormi?</p>
          <a href="https://t.me/topla_support" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full">
              <ExternalLink className="mr-2 h-4 w-4" /> Telegram yordam
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

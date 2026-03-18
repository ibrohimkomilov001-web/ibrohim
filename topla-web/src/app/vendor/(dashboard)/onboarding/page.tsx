"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle, ChevronRight, Store, Package, CreditCard,
  Truck, Star, BarChart3, Settings, FileText, Play,
  BookOpen, GraduationCap, ExternalLink, Rocket, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import { useTranslation } from '@/store/locale-store';

const STEP_ICONS: Record<string, any> = {
  shop_info: Store,
  contact_info: Settings,
  business_info: CreditCard,
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

  // Fetch onboarding progress from backend API (V-NEW-02)
  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["vendor-onboarding"],
    queryFn: vendorApi.getOnboarding,
  });

  const steps = onboarding?.steps || [];
  const completedSteps = onboarding?.completed || 0;
  const totalSteps = onboarding?.total || 7;
  const progress = onboarding?.percentage || 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
              const StepIcon = STEP_ICONS[step.key] || Settings;
              return (
                <Link key={step.key} href={step.href}>
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
                        {step.label}
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
          <a href="https://t.me/topla_support" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full">
              <ExternalLink className="mr-2 h-4 w-4" /> {t('telegramHelp')}
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  StackedBarChart,
  FunnelChart,
  CohortHeatmap,
} from "@/components/charts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHeatmap, fetchFunnel, fetchCohort, fetchABTests, createABTest, updateABTest } from "@/lib/api/admin";
import {
  Flame, Filter, Users, FlaskConical, Plus, Play, Pause, CheckCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from '@/store/locale-store';

export default function ExtendedAnalyticsPage() {
  const [period, setPeriod] = useState("month");
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">{t('extendedAnalytics')}</h1>
          <p className="text-muted-foreground">{t('extendedAnalyticsDesc')}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('weekLabel')}</SelectItem>
            <SelectItem value="month">{t('monthLabel')}</SelectItem>
            <SelectItem value="quarter">{t('quarterLabel')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="heatmap">
        <TabsList className="overflow-x-auto w-full justify-start">
          <TabsTrigger value="heatmap" className="gap-1"><Flame className="w-4 h-4" /> {t('heatmapTab')}</TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1"><Filter className="w-4 h-4" /> {t('funnelTab')}</TabsTrigger>
          <TabsTrigger value="cohort" className="gap-1"><Users className="w-4 h-4" /> {t('cohortTab')}</TabsTrigger>
          <TabsTrigger value="ab-tests" className="gap-1"><FlaskConical className="w-4 h-4" /> {t('abTestTab')}</TabsTrigger>
        </TabsList>

        {/* HEATMAP */}
        <TabsContent value="heatmap">
          <HeatmapTab period={period} />
        </TabsContent>

        {/* FUNNEL */}
        <TabsContent value="funnel">
          <FunnelTab period={period} />
        </TabsContent>

        {/* COHORT */}
        <TabsContent value="cohort">
          <CohortTab />
        </TabsContent>

        {/* A/B TESTS */}
        <TabsContent value="ab-tests">
          <ABTestTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── HEATMAP TAB ──────────────────
function HeatmapTab({ period }: { period: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-heatmap", period],
    queryFn: () => fetchHeatmap(period),
  });

  if (isLoading) return <SkeletonCards />;

  const products = data?.products || [];
  const categories = data?.categories || [];

  return (
    <div className="space-y-6 mt-4">
      {/* Category heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>{t('categoryViews')}</CardTitle>
          <CardDescription>{t('categoryViewsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <StackedBarChart
              categories={categories.map((c: any) => c.name)}
              series={[
                { name: "Ko'rishlar", data: categories.map((c: any) => c.views) },
                { name: "Sotilgan", data: categories.map((c: any) => c.sales) },
              ]}
              height={288}
              grouped
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
          )}
        </CardContent>
      </Card>

      {/* Top Products Heatmap Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('topProductsHeatmap')}</CardTitle>
          <CardDescription>{t('topProductsHeatmapDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">{t('product')}</th>
                  <th className="pb-2 font-medium text-right">{t('views')}</th>
                  <th className="pb-2 font-medium text-right">{t('soldCount')}</th>
                  <th className="pb-2 font-medium text-right">{t('conversion')}</th>
                  <th className="pb-2 font-medium">{t('intensity')}</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 20).map((p: any, i: number) => {
                  const maxViews = products[0]?.views || 1;
                  const intensity = Math.round((p.views / maxViews) * 100);
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="max-w-[200px] truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category}{p.subcategory ? ` > ${p.subcategory}` : ''}</div>
                      </td>
                      <td className="py-2 text-right font-medium">{p.views.toLocaleString()}</td>
                      <td className="py-2 text-right">{p.soldCount.toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <Badge variant={p.conversionRate > 5 ? "default" : p.conversionRate > 2 ? "secondary" : "outline"}>
                          {p.conversionRate}%
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${intensity}%`,
                              backgroundColor: `hsl(${Math.max(0, 130 - intensity * 1.3)}, 80%, 50%)`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FUNNEL TAB ──────────────────
function FunnelTab({ period }: { period: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-funnel", period],
    queryFn: () => fetchFunnel(period),
  });

  if (isLoading) return <SkeletonCards />;

  const stages = data?.stages || [];

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('conversionFunnel')}</CardTitle>
          <CardDescription>{t('conversionFunnelDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {stages.length > 0 ? (
            <FunnelChart
              data={stages.map((s: any) => ({
                name: s.name,
                value: s.count,
                percentage: s.percentage,
              }))}
              height={320}
              showDropOff
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
          )}

          {/* Conversion rates */}
          {stages.length >= 4 && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t dark:border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Ko&apos;rish → Savat</p>
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {stages[0].count > 0 ? ((stages[1].count / stages[0].count) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Savat → Buyurtma</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stages[1].count > 0 ? ((stages[2].count / stages[1].count) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Buyurtma → Yetkazish</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {stages[2].count > 0 ? ((stages[3].count / stages[2].count) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── COHORT TAB ──────────────────
function CohortTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cohort"],
    queryFn: fetchCohort,
  });

  if (isLoading) return <SkeletonCards />;

  const cohorts = data || [];

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('repeatBuyersCohort')}</CardTitle>
          <CardDescription>{t('repeatBuyersCohortDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {cohorts.length > 0 ? (
            <CohortHeatmap
              cohorts={cohorts.map((c: any) => c.month)}
              periods={["+1 oy", "+2 oy", "+3 oy", "+4 oy", "+5 oy"]}
              data={cohorts.map((c: any) => (c.retention || []).slice(0, 5))}
              suffix="%"
            />
          ) : (
            <p className="text-center py-8 text-muted-foreground">{t('noCohortData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── A/B TEST TAB ──────────────────
function ABTestTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [newTest, setNewTest] = useState({ name: "", testType: "price", description: "" });
  const queryClient = useQueryClient();

  const { data: tests, isLoading } = useQuery({
    queryKey: ["admin-ab-tests"],
    queryFn: fetchABTests,
  });

  const createMutation = useMutation({
    mutationFn: createABTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ab-tests"] });
      setShowCreate(false);
      setNewTest({ name: "", testType: "price", description: "" });
      toast.success("A/B test yaratildi");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateABTest(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ab-tests"] });
      toast.success("Status yangilandi");
    },
  });

  const testList = tests || [];

  const statusColors: Record<string, string> = {
    draft: "secondary",
    running: "default",
    paused: "outline",
    completed: "destructive",
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">A/B Testlar</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi Test</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi A/B Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Test nomi"
                value={newTest.name}
                onChange={e => setNewTest(p => ({ ...p, name: e.target.value }))}
              />
              <Select value={newTest.testType} onValueChange={v => setNewTest(p => ({ ...p, testType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Narx</SelectItem>
                  <SelectItem value="image">Rasm</SelectItem>
                  <SelectItem value="title">Sarlavha</SelectItem>
                  <SelectItem value="layout">Joylashuv</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Tavsif (ixtiyoriy)"
                value={newTest.description}
                onChange={e => setNewTest(p => ({ ...p, description: e.target.value }))}
              />
              <Button
                className="w-full"
                disabled={!newTest.name || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  name: newTest.name,
                  testType: newTest.testType,
                  description: newTest.description || undefined,
                  variants: [
                    { id: "A", label: "Asl variant", config: {} },
                    { id: "B", label: "B variant", config: {} },
                  ],
                })}
              >
                Yaratish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <SkeletonCards />
      ) : testList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground">Hozircha A/B testlar yo&apos;q</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testList.map((test: any) => (
            <Card key={test.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{test.name}</h3>
                      <Badge variant={statusColors[test.status] as any}>{test.status}</Badge>
                    </div>
                    {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Turi: {test.testType}</span>
                      <span>Variantlar: {(test.variants as any[])?.length || 0}</span>
                      <span>Maqsad: {test.targetPercent}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {test.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: test.id, status: "running" })}>
                        <Play className="w-3 h-3 mr-1" /> Boshlash
                      </Button>
                    )}
                    {test.status === "running" && (
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: test.id, status: "paused" })}>
                        <Pause className="w-3 h-3 mr-1" /> Pauza
                      </Button>
                    )}
                    {test.status === "paused" && (
                      <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: test.id, status: "running" })}>
                        <Play className="w-3 h-3 mr-1" /> Davom
                      </Button>
                    )}
                    {(test.status === "running" || test.status === "paused") && (
                      <Button size="sm" variant="destructive" onClick={() => statusMutation.mutate({ id: test.id, status: "completed" })}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Tugatish
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SKELETON ──────────────────
function SkeletonCards() {
  return (
    <div className="space-y-4 mt-4">
      {[1, 2].map(i => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

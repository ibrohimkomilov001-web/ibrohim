"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusDonutChart, StatCard } from "@/components/charts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLoyaltyAccounts, fetchLoyaltyStats, adjustLoyaltyPoints } from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils";
import {
  Crown, Medal, Star, Award, Users, Gift, TrendingUp,
  Plus, Minus, Search,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from '@/store/locale-store';

const tierConfig: Record<string, { icon: typeof Crown; color: string; label: string }> = {
  bronze: { icon: Medal, color: "text-amber-700", label: "Bronze" },
  silver: { icon: Medal, color: "text-gray-400", label: "Silver" },
  gold: { icon: Crown, color: "text-yellow-500", label: "Gold" },
  platinum: { icon: Crown, color: "text-blue-500", label: "Platinum" },
};

export default function LoyaltyPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [adjustData, setAdjustData] = useState({ userId: "", points: 0, description: "" });
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["loyalty-stats"],
    queryFn: fetchLoyaltyStats,
  });

  const { data: accountsRes, isLoading: accountsLoading } = useQuery({
    queryKey: ["loyalty-accounts", tierFilter, search, page],
    queryFn: () => fetchLoyaltyAccounts({ tier: tierFilter === 'all' ? undefined : tierFilter, search: search || undefined, page }),
  });

  const adjustMutation = useMutation({
    mutationFn: adjustLoyaltyPoints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-stats"] });
      setAdjustDialog(false);
      setAdjustData({ userId: "", points: 0, description: "" });
      toast.success(t('pointsChanged'));
    },
    onError: () => toast.error(t('errorOccurred')),
  });

  const accounts = accountsRes?.data || [];

  const tierChartData = stats ? [
    { name: "Bronze", value: stats.byTier?.bronze || 0 },
    { name: "Silver", value: stats.byTier?.silver || 0 },
    { name: "Gold", value: stats.byTier?.gold || 0 },
    { name: "Platinum", value: stats.byTier?.platinum || 0 },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
          <Gift className="w-7 h-7 text-primary" />
          {t('rewardSystem')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('loyaltyPointsDesc')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard icon={Users} label={t('totalMembers')} value={stats?.totalAccounts || 0} color="primary" />
            <StatCard icon={Star} label={t('availablePoints')} value={(stats?.totalAvailablePoints || 0).toLocaleString()} color="warning" />
            <StatCard icon={TrendingUp} label={t('totalGiven')} value={(stats?.totalLifetimePoints || 0).toLocaleString()} color="success" />
            <StatCard icon={Crown} label="Platinum" value={stats?.byTier?.platinum || 0} color="purple" />
          </>
        )}
      </div>

      {/* Tier Distribution Chart */}
      {tierChartData.some(d => d.value > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('tierDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonutChart
              data={tierChartData}
              centerLabel="Jami"
              centerValue={tierChartData.reduce((s, d) => s + d.value, 0).toLocaleString()}
            />
          </CardContent>
        </Card>
      )}

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{t('loyaltyAccounts')}</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholderGeneric')}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={tierFilter} onValueChange={v => { setTierFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('tier')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">{t('loyaltyAccountsNotFound')}</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc: any) => {
                const tier = tierConfig[acc.tier] || tierConfig.bronze;
                const TierIcon = tier.icon;
                return (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 ${tier.color}`}>
                        <TierIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{acc.user?.fullName || acc.user?.phone}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{tier.label}</Badge>
                          <span>{acc.availablePoints.toLocaleString()} {t('points')}</span>
                          <span className="hidden sm:inline">{t('totalLifetime')}: {acc.lifetimePoints.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAdjustData({ userId: acc.userId, points: 0, description: "" });
                        setAdjustDialog(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> {t('points')}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Points Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addRemovePoints')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('pointsAmount')}</Label>
              <Input
                type="number"
                placeholder={t('positiveAdd')}
                value={adjustData.points || ""}
                onChange={e => setAdjustData(p => ({ ...p, points: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>{t('reason')}</Label>
              <Textarea
                placeholder={t('pointsChangeReason')}
                value={adjustData.description}
                onChange={e => setAdjustData(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={!adjustData.points || !adjustData.description || adjustMutation.isPending}
              onClick={() => adjustMutation.mutate(adjustData)}
            >
              {t('confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

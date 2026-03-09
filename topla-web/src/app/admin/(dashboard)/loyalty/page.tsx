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
import { DonutChart } from "@tremor/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLoyaltyAccounts, fetchLoyaltyStats, adjustLoyaltyPoints } from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils";
import {
  Crown, Medal, Star, Award, Users, Gift, TrendingUp,
  Plus, Minus, Search,
} from "lucide-react";
import { toast } from "sonner";

const tierConfig: Record<string, { icon: typeof Crown; color: string; label: string }> = {
  bronze: { icon: Medal, color: "text-amber-700", label: "Bronze" },
  silver: { icon: Medal, color: "text-gray-400", label: "Silver" },
  gold: { icon: Crown, color: "text-yellow-500", label: "Gold" },
  platinum: { icon: Crown, color: "text-violet-500", label: "Platinum" },
};

export default function LoyaltyPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
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
    queryFn: () => fetchLoyaltyAccounts({ tier: tierFilter || undefined, search: search || undefined, page }),
  });

  const adjustMutation = useMutation({
    mutationFn: adjustLoyaltyPoints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-stats"] });
      setAdjustDialog(false);
      setAdjustData({ userId: "", points: 0, description: "" });
      toast.success("Ball muvaffaqiyatli o'zgartirildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
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
          Mukofot Tizimi
        </h1>
        <p className="text-muted-foreground mt-1">
          Loyalty ball, darajalar va foydalanuvchi mukofotlar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="w-4 h-4" /> Jami a&apos;zolar
                </div>
                <p className="text-2xl font-bold">{stats?.totalAccounts || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Star className="w-4 h-4 text-amber-500" /> Mavjud ball
                </div>
                <p className="text-2xl font-bold">{(stats?.totalAvailablePoints || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Jami berilgan
                </div>
                <p className="text-2xl font-bold">{(stats?.totalLifetimePoints || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Crown className="w-4 h-4 text-violet-500" /> Platinum
                </div>
                <p className="text-2xl font-bold text-violet-500">{stats?.byTier?.platinum || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tier Distribution Chart */}
      {tierChartData.some(d => d.value > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Daraja taqsimoti</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={tierChartData}
              index="name"
              category="value"
              colors={["amber", "slate", "yellow", "violet"]}
              className="h-52"
            />
          </CardContent>
        </Card>
      )}

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Loyalty Hisoblar</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={tierFilter} onValueChange={v => { setTierFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Daraja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Barchasi</SelectItem>
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
            <p className="text-center py-10 text-muted-foreground">Loyalty hisoblari topilmadi</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc: any) => {
                const tier = tierConfig[acc.tier] || tierConfig.bronze;
                const TierIcon = tier.icon;
                return (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 ${tier.color}`}>
                        <TierIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{acc.user?.fullName || acc.user?.phone}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{tier.label}</Badge>
                          <span>{acc.availablePoints.toLocaleString()} ball</span>
                          <span className="hidden sm:inline">Jami: {acc.lifetimePoints.toLocaleString()}</span>
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
                      <Plus className="w-3 h-3 mr-1" /> Ball
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
            <DialogTitle>Ball qo&apos;shish / ayirish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ball miqdori</Label>
              <Input
                type="number"
                placeholder="Ijobiy = qo'shish, Salbiy = ayirish"
                value={adjustData.points || ""}
                onChange={e => setAdjustData(p => ({ ...p, points: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Sabab</Label>
              <Textarea
                placeholder="Ball o'zgarishi sababi..."
                value={adjustData.description}
                onChange={e => setAdjustData(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={!adjustData.points || !adjustData.description || adjustMutation.isPending}
              onClick={() => adjustMutation.mutate(adjustData)}
            >
              Tasdiqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

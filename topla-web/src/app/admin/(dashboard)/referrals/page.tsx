"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReferrals,
  updateReferralSettings,
  updateReferral,
} from "@/lib/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  DollarSign,
  CheckCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { StatCard } from "@/components/charts";
import { useTranslation } from '@/store/locale-store';

interface ReferralUser {
  id: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  bonusAmount: number;
  referrerPaid: boolean;
  referredPaid: boolean;
  createdAt: string;
  referrer: ReferralUser;
  referred: ReferralUser;
}

interface Stats {
  totalReferrals: number;
  totalPaidBonuses: number;
  totalBonusAmount: number;
  currentBonusAmount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminReferralsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bonusInput, setBonusInput] = useState("");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["referrals", page],
    queryFn: () => fetchReferrals({ page, limit: 20 }),
  });

  const referrals = data?.referrals ?? [];
  const stats: Stats | null = data?.stats ?? null;
  const pagination: Pagination | null = data?.pagination ?? null;

  const settingsMutation = useMutation({
    mutationFn: (amount: number) => updateReferralSettings({ bonusAmount: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      setSettingsOpen(false);
    },
  });

  const togglePaidMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: Record<string, boolean> }) =>
      updateReferral(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });

  const handleSaveSettings = () => {
    const amount = parseFloat(bonusInput);
    if (isNaN(amount) || amount < 0) return;
    settingsMutation.mutate(amount);
  };

  const handleTogglePaid = (
    referral: Referral,
    field: "referrerPaid" | "referredPaid"
  ) => {
    togglePaidMutation.mutate({
      id: referral.id,
      update: { [field]: !referral[field] },
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("uz-UZ") + " so'm";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('referralsTitle')}</h1>
          <p className="text-muted-foreground">
            {t('referralsDesc')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setBonusInput(stats?.currentBonusAmount?.toString() || "50000");
            setSettingsOpen(true);
          }}
        >
          <Settings className="w-4 h-4 mr-2" />
          {t('settings')}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label={t('totalReferrals')} value={stats.totalReferrals} color="info" />
          <StatCard icon={CheckCircle} label={t('bonusPaid')} value={stats.totalPaidBonuses} color="success" />
          <StatCard icon={DollarSign} label={t('totalBonusAmount')} value={formatMoney(stats.totalBonusAmount)} color="warning" />
          <StatCard icon={UserPlus} label={t('currentBonus')} value={formatMoney(stats.currentBonusAmount)} color="purple" />
        </div>
      )}

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('allReferrals')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('noReferralsYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref: any) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Referrer */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t('referrer')}
                      </p>
                      <p className="font-medium truncate">
                        {ref.referrer.fullName || t('unknown')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ref.referrer.phone || "—"}
                      </p>
                    </div>

                    <div className="text-muted-foreground text-lg">→</div>

                    {/* Referred */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t('referred')}
                      </p>
                      <p className="font-medium truncate">
                        {ref.referred.fullName || t('unknown')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ref.referred.phone || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Status & Amount */}
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMoney(ref.bonusAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(ref.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={ref.referrerPaid ? "default" : "secondary"}
                        className="text-xs cursor-pointer"
                        onClick={() => handleTogglePaid(ref, "referrerPaid")}
                      >
                        {ref.referrerPaid
                          ? `✓ ${t('referrer')}`
                          : `○ ${t('referrer')}`}
                      </Badge>
                      <Badge
                        variant={ref.referredPaid ? "default" : "secondary"}
                        className="text-xs cursor-pointer"
                        onClick={() => handleTogglePaid(ref, "referredPaid")}
                      >
                        {ref.referredPaid
                          ? `✓ ${t('referred')}`
                          : `○ ${t('referred')}`}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t('total')}: {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('referralSettings')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>{t('bonusAmountLabel')}</Label>
              <Input
                type="number"
                value={bonusInput}
                onChange={(e) => setBonusInput(e.target.value)}
                placeholder="50000"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('bonusDescription')}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleSaveSettings} disabled={settingsMutation.isPending}>
                {settingsMutation.isPending ? t('saving') : t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

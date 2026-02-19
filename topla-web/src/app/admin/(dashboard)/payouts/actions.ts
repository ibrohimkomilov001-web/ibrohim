import { fetchPayouts, processPayout as apiProcessPayout } from "@/lib/api/admin";

export type PayoutRequest = {
  id: string;
  amount: number;
  status: string;
  [key: string]: any;
};

export async function getPayouts(): Promise<PayoutRequest[]> {
  try {
    const data = await fetchPayouts();
    return (data.payouts || []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount || 0),
      status: p.status,
      shopName: p.shop?.name,
      bankAccount: p.bankAccount,
      createdAt: p.createdAt,
      processedAt: p.processedAt,
    }));
  } catch {
    return [];
  }
}

export async function getPayoutStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
  try {
    const payouts = await getPayouts();
    return {
      total: payouts.length,
      pending: payouts.filter(p => p.status === 'pending').length,
      approved: payouts.filter(p => p.status === 'completed').length,
      rejected: payouts.filter(p => p.status === 'rejected').length,
    };
  } catch {
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
}

export async function approvePayout(id: string): Promise<void> {
  await apiProcessPayout(id, { status: 'completed' });
}

export async function rejectPayout(id: string, reason?: string): Promise<void> {
  await apiProcessPayout(id, { status: 'rejected', rejectionReason: reason });
}
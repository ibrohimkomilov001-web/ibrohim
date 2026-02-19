import { fetchLogs } from "@/lib/api/admin";

export type ActivityLog = {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  created_at: string;
  [key: string]: any;
};

export async function getActivityLogs(limit = 100): Promise<ActivityLog[]> {
  try {
    const data = await fetchLogs({ limit });
    return (data.logs || []).map((l: any) => ({
      id: l.id,
      action: l.action,
      entity_type: l.entityType,
      entity_id: l.entityId,
      details: l.details,
      created_at: l.createdAt,
      user: l.user,
      ip_address: l.ipAddress,
    }));
  } catch {
    return [];
  }
}

export async function getLogStats(): Promise<{ total: number; today: number; topActions: { action: string; count: number }[] }> {
  try {
    const data = await fetchLogs({ limit: 500 });
    const logs = data.logs || [];
    const today = new Date().toDateString();
    const actionCounts: Record<string, number> = {};
    logs.forEach((l: any) => {
      actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    });
    return {
      total: data.pagination?.total || logs.length,
      today: logs.filter((l: any) => new Date(l.createdAt).toDateString() === today).length,
      topActions: Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  } catch {
    return { total: 0, today: 0, topActions: [] };
  }
}

export async function clearOldLogs(_days: number): Promise<void> {
  // Managed by backend cron
  return;
}
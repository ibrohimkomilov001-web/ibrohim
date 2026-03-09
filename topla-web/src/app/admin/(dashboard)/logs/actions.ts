import { fetchLogs, clearLogs } from "@/lib/api/admin";
import type { PaginationMeta } from "@/components/ui/data-table-pagination";

export type ActivityLog = {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  created_at: string;
  user?: any;
  ip_address?: string;
};

export type LogsParams = {
  page?: number;
  search?: string;
};

export async function getLogs(params?: LogsParams): Promise<{
  logs: ActivityLog[];
  pagination: PaginationMeta;
}> {
  try {
    const data = await fetchLogs({
      search: params?.search,
      page: params?.page,
    });
    const items = data.items || data.logs || [];
    const logs = items.map((l: any) => ({
      id: l.id,
      action: l.action,
      entity_type: l.entityType,
      entity_id: l.entityId,
      details: l.details,
      created_at: l.createdAt,
      user: l.user,
      ip_address: l.ipAddress,
    }));
    const pagination = data.pagination || { page: 1, limit: 20, total: logs.length, totalPages: 1, hasMore: false };
    return { logs, pagination };
  } catch {
    return { logs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false } };
  }
}

export async function clearOldLogs(days: number): Promise<void> {
  await clearLogs(days);
}
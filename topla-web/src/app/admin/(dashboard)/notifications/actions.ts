import { broadcastNotification, fetchNotifications, createNotification as apiCreateNotification, sendNotification as apiSendNotification, deleteNotification as apiDeleteNotification } from "@/lib/api/admin";

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: "system" | "order" | "promo" | "news";
  target_type: "all" | "users" | "vendors" | "specific";
  is_sent: boolean;
  created_at: string;
  [key: string]: any;
};

export async function getNotifications(): Promise<Notification[]> {
  try {
    const data = await fetchNotifications();
    const items = data.items || data.notifications || data || [];
    return items.map((n: any) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type || 'system',
      target_type: n.targetRole || 'all',
      is_sent: n.isSent || n.is_sent || false,
      created_at: n.createdAt || n.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getNotificationStats(): Promise<{ total: number; sent: number; pending: number }> {
  return { total: 0, sent: 0, pending: 0 };
}

export async function createNotification(data: Partial<Notification>): Promise<void> {
  await broadcastNotification({
    title: data.title || '',
    body: data.body || '',
    type: data.type,
    targetRole: data.target_type === 'all' ? undefined : data.target_type === 'users' ? 'customer' : 'vendor',
  });
}

export async function sendNotification(id: string): Promise<void> {
  await apiSendNotification(id);
}

export async function deleteNotification(id: string): Promise<void> {
  await apiDeleteNotification(id);
}
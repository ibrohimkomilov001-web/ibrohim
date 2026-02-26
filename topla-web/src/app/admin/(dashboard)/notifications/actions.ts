import {
  broadcastNotification,
  fetchNotifications,
  createNotification as apiCreateNotification,
  sendNotification as apiSendNotification,
  deleteNotification as apiDeleteNotification,
} from "@/lib/api/admin";

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: "system" | "order" | "promo" | "news";
  target_type: "all" | "users" | "vendors" | "specific";
  is_sent: boolean;
  sent_count: number;
  created_at: string;
  imageUrl?: string;
  linkUrl?: string;
  [key: string]: any;
};

export async function getNotifications(): Promise<Notification[]> {
  try {
    const data = await fetchNotifications();
    const items = data.items || data.notifications || data || [];
    return items.map((n: any) => {
      const nData = n.data || {};
      return {
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type || "system",
        target_type: nData.targetRole === "user"
          ? "users"
          : nData.targetRole === "vendor"
            ? "vendors"
            : nData.targetRole === "courier"
              ? "specific"
              : "all",
        is_sent: nData.isDraft === false || (nData.sentCount || 0) > 0,
        sent_count: nData.sentCount || 0,
        created_at: n.createdAt || n.created_at,
        imageUrl: n.imageUrl || n.image_url || undefined,
        linkUrl: n.linkUrl || n.link_url || undefined,
      };
    });
  } catch {
    return [];
  }
}

export async function getNotificationStats(): Promise<{
  total: number;
  sent: number;
  pending: number;
}> {
  try {
    const data = await fetchNotifications();
    const items = data.items || data.notifications || data || [];
    let sent = 0;
    let pending = 0;
    for (const n of items) {
      const nData = n.data || {};
      if (nData.isDraft === false || (nData.sentCount || 0) > 0) {
        sent++;
      } else {
        pending++;
      }
    }
    return { total: items.length, sent, pending };
  } catch {
    return { total: 0, sent: 0, pending: 0 };
  }
}

/**
 * Frontend target_type → backend targetRole mapping
 * Backend expects: 'user' | 'vendor' | 'courier' | 'all'
 */
function mapTargetRole(target: string): string {
  switch (target) {
    case "users":
      return "user";
    case "vendors":
      return "vendor";
    case "all":
    default:
      return "all";
  }
}

export async function createNotification(
  data: Partial<Notification>
): Promise<void> {
  const payload: any = {
    title: data.title || "",
    body: data.body || "",
    type: data.type || "system",
    targetRole: mapTargetRole(data.target_type || "all"),
  };
  if (data.imageUrl) payload.imageUrl = data.imageUrl;
  if (data.linkUrl) payload.linkUrl = data.linkUrl;
  await broadcastNotification(payload);
}

export async function sendNotification(id: string): Promise<void> {
  await apiSendNotification(id);
}

export async function deleteNotification(id: string): Promise<void> {
  await apiDeleteNotification(id);
}
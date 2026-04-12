import crypto from 'crypto';
import { prisma } from '../config/database.js';

/**
 * Dispatch a webhook event to all active webhook subscribers for a shop.
 * Called after order status changes, product approvals, payments, etc.
 * Fire-and-forget: does not block the calling request.
 */
export async function dispatchWebhookEvent(
  shopId: string,
  event: string,
  data: Record<string, any>,
): Promise<void> {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });
    if (!shop) return;

    const activeKeys = await prisma.apiKey.findMany({
      where: { userId: shop.ownerId, isActive: true },
      include: {
        webhooks: {
          where: { isActive: true },
        },
      },
    });

    const payload = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data,
    });

    for (const key of activeKeys) {
      for (const webhook of key.webhooks) {
        // Only deliver to webhooks that subscribed to this event
        if (!webhook.events.includes(event)) continue;

        // Fire-and-forget delivery (retry logic inside)
        deliverWebhook(webhook.id, webhook.url, webhook.secret, event, payload).catch(() => {});
      }
    }
  } catch {
    // Never let webhook errors bubble up to the caller
  }
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  payload: string,
  attempt = 1,
): Promise<void> {
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Topla-Signature': `sha256=${sig}`,
        'X-Topla-Event': event,
        'X-Topla-Timestamp': timestamp,
        'User-Agent': 'Topla.uz-Webhooks/1.0',
      },
      body: payload,
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      // Reset fail count on success
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { failCount: 0 },
      });
    } else {
      await handleDeliveryFailure(webhookId, url, secret, event, payload, attempt);
    }
  } catch {
    await handleDeliveryFailure(webhookId, url, secret, event, payload, attempt);
  }
}

async function handleDeliveryFailure(
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  payload: string,
  attempt: number,
): Promise<void> {
  const updated = await prisma.webhook.update({
    where: { id: webhookId },
    data: { failCount: { increment: 1 } },
    select: { failCount: true },
  });

  // Auto-disable after 10 consecutive failures
  if (updated.failCount >= 10) {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { isActive: false },
    });
    return;
  }

  // Retry up to 3 times with exponential backoff
  if (attempt < 3) {
    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
    await new Promise(resolve => setTimeout(resolve, delay));
    await deliverWebhook(webhookId, url, secret, event, payload, attempt + 1);
  }
}

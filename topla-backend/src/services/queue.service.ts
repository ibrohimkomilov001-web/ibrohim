// ============================================
// BullMQ Queue Service
// Background jobs: notifications, search indexing, courier assignment
// ============================================

import { Queue, Worker, Job, type ConnectionOptions } from 'bullmq';
import { env } from '../config/env.js';

// ============================================
// Redis Connection config for BullMQ
// ============================================
function getConnectionOpts(): ConnectionOptions {
  const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
  const url = new URL(redisUrl);
  return {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

// ============================================
// Queue Definitions
// ============================================
let notificationQueue: Queue | null = null;
let searchIndexQueue: Queue | null = null;
let courierQueue: Queue | null = null;

function getNotificationQueue(): Queue {
  if (!notificationQueue) {
    notificationQueue = new Queue('notifications', { connection: getConnectionOpts() });
  }
  return notificationQueue;
}

function getSearchIndexQueue(): Queue {
  if (!searchIndexQueue) {
    searchIndexQueue = new Queue('search-index', { connection: getConnectionOpts() });
  }
  return searchIndexQueue;
}

function getCourierQueue(): Queue {
  if (!courierQueue) {
    courierQueue = new Queue('courier', { connection: getConnectionOpts() });
  }
  return courierQueue;
}

// ============================================
// Job Types
// ============================================
export interface NotificationJobData {
  type: 'push_multicast' | 'order_status' | 'courier_delivery' | 'broadcast';
  // push_multicast
  tokens?: string[];
  title?: string;
  body?: string;
  data?: Record<string, string>;
  // order_status
  orderId?: string;
  newStatus?: string;
  extra?: { cancelReason?: string; courierName?: string };
  // courier_delivery
  courierId?: string;
  orderNumber?: string;
  shopName?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
}

export interface SearchIndexJobData {
  type: 'index_product' | 'remove_product' | 'bulk_reindex';
  productId?: string;
  product?: any;
}

export interface CourierAssignJobData {
  orderId: string;
  attempt: number;
  maxAttempts: number;
  excludeCourierIds: string[];
}

// ============================================
// Enqueue Functions (called from route handlers)
// ============================================

/**
 * Enqueue push notification (non-blocking)
 */
export async function enqueueNotification(data: NotificationJobData): Promise<void> {
  try {
    await getNotificationQueue().add('send', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  } catch (err) {
    console.error('Failed to enqueue notification:', err);
    // Fallback: execute inline (import on demand)
  }
}

/**
 * Enqueue Meilisearch indexing (non-blocking)
 */
export async function enqueueSearchIndex(data: SearchIndexJobData): Promise<void> {
  try {
    const opts: any = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 50,
      removeOnFail: 200,
    };
    // Bulk reindex gets higher priority timeout
    if (data.type === 'bulk_reindex') {
      opts.timeout = 300000; // 5 min
    }
    await getSearchIndexQueue().add(data.type, data, opts);
  } catch (err) {
    console.error('Failed to enqueue search index job:', err);
  }
}

/**
 * Enqueue courier assignment with delay (replaces setTimeout)
 */
export async function enqueueCourierAssignment(data: CourierAssignJobData, delayMs = 0): Promise<void> {
  try {
    await getCourierQueue().add('assign', data, {
      delay: delayMs,
      attempts: 1,
      removeOnComplete: 50,
      removeOnFail: 200,
    });
  } catch (err) {
    console.error('Failed to enqueue courier assignment:', err);
  }
}

// ============================================
// Workers (processors)
// ============================================

export async function startWorkers(): Promise<void> {
  const conn = getConnectionOpts();

  // ---- Notification Worker ----
  const notifWorker = new Worker(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      const { sendMulticastPush } = await import('../config/firebase.js');
      const { data } = job;

      switch (data.type) {
        case 'push_multicast': {
          if (data.tokens && data.tokens.length > 0 && data.title) {
            // Batch in groups of 500
            for (let i = 0; i < data.tokens.length; i += 500) {
              const batch = data.tokens.slice(i, i + 500);
              await sendMulticastPush(batch, data.title, data.body || '', data.data || {});
              await job.updateProgress(Math.round(((i + 500) / data.tokens.length) * 100));
            }
          }
          break;
        }
        case 'order_status': {
          if (data.orderId && data.newStatus) {
            const { notifyOrderStatusChange } = await import('../modules/notifications/notification.service.js');
            await notifyOrderStatusChange(data.orderId, data.newStatus, data.extra);
          }
          break;
        }
        case 'courier_delivery': {
          if (data.courierId && data.orderId) {
            const { notifyCourierNewDelivery } = await import('../modules/notifications/notification.service.js');
            await notifyCourierNewDelivery(
              data.courierId,
              data.orderId,
              data.orderNumber || '',
              data.shopName || '',
              data.distanceKm || 0,
              data.estimatedMinutes || 0,
            );
          }
          break;
        }
        case 'broadcast': {
          // Already handled by push_multicast
          break;
        }
      }
    },
    { connection: conn, concurrency: 3 },
  );

  // ---- Search Index Worker ----
  const searchWorker = new Worker(
    'search-index',
    async (job: Job<SearchIndexJobData>) => {
      const { indexProduct, removeProductFromIndex, bulkIndexProducts } = await import('../services/search.service.js');
      const { data } = job;

      switch (data.type) {
        case 'index_product': {
          if (data.product) {
            await indexProduct(data.product);
          }
          break;
        }
        case 'remove_product': {
          if (data.productId) {
            await removeProductFromIndex(data.productId);
          }
          break;
        }
        case 'bulk_reindex': {
          const { prisma } = await import('../config/database.js');
          const products = await prisma.product.findMany({
            where: { isActive: true, status: 'active' },
            include: {
              shop: { select: { id: true, name: true } },
              category: { select: { id: true, nameUz: true, nameRu: true } },
            },
          });
          // Batch in groups of 500
          for (let i = 0; i < products.length; i += 500) {
            const batch = products.slice(i, i + 500);
            await bulkIndexProducts(batch);
            await job.updateProgress(Math.round(((i + 500) / products.length) * 100));
          }
          break;
        }
      }
    },
    { connection: conn, concurrency: 2 },
  );

  // ---- Kuryer Tayinlash Worker ----
  // 60 soniya kechikishdan keyin ishga tushadi:
  //   1. Assignment hali "pending" bo'lsa → "expired" qilish
  //   2. Keyingi kuryerga yuborish (exclude list bilan)
  const courierWorker = new Worker(
    'courier',
    async (job: Job<CourierAssignJobData>) => {
      const { prisma } = await import('../config/database.js');
      const { findAndAssignCourier } = await import('../modules/courier/courier.service.js');
      const { data } = job;

      // Avval: bu buyurtma uchun pending assignment larni tekshirish
      const pendingAssignment = await prisma.deliveryAssignment.findFirst({
        where: {
          orderId: data.orderId,
          status: 'pending',
        },
      });

      if (pendingAssignment) {
        // Muddat tugadi — "expired" qilish
        await prisma.deliveryAssignment.update({
          where: { id: pendingAssignment.id },
          data: { status: 'expired' },
        });
        console.log(`[Courier Queue] Assignment ${pendingAssignment.id} expired, keyingi kuryerga o'tilmoqda...`);
      }

      // Buyurtma hali kuryer tayinlanmaganligini tekshirish
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { status: true, courierId: true },
      });

      // Agar buyurtma bekor qilingan yoki allaqachon kuryer tayinlangan bo'lsa — to'xtatish
      if (!order || order.courierId || order.status === 'cancelled' || order.status === 'delivered') {
        return;
      }

      // Urinishlar limitini tekshirish
      if (data.attempt >= data.maxAttempts) {
        console.warn(`[Courier Queue] Buyurtma ${data.orderId}: ${data.maxAttempts} ta urinish tugadi`);
        return;
      }

      // Keyingi kuryerga tayinlash
      await findAndAssignCourier(data.orderId, data.excludeCourierIds);
    },
    { connection: conn, concurrency: 1 },
  );

  // Error handlers
  [notifWorker, searchWorker, courierWorker].forEach((worker) => {
    worker.on('failed', (job, err) => {
      console.error(`[Queue] Job ${job?.name} failed:`, err.message);
    });
    worker.on('completed', (job) => {
      // Silent completion — logged via BullMQ internals
    });
  });

  console.log('✅ BullMQ workers started (notifications, search-index, courier)');
}

// ============================================
// Graceful Shutdown
// ============================================
export async function closeQueues(): Promise<void> {
  const queues = [notificationQueue, searchIndexQueue, courierQueue].filter(Boolean) as Queue[];
  await Promise.allSettled(queues.map((q) => q.close()));
  console.log('🛑 BullMQ queues closed');
}

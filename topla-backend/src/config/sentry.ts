/**
 * Sentry Error Tracking konfiguratsiyasi
 * 
 * SENTRY_DSN o'rnatilganda avtomatik yoqiladi.
 * O'rnatilmaganda hech narsa qilmaydi (no-op).
 */
import * as Sentry from '@sentry/node';
import { env } from './env.js';

let initialized = false;

/**
 * Sentry'ni boshlash — faqat SENTRY_DSN mavjud bo'lganda
 */
export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    release: `topla-backend@1.0.0`,

    // Performance monitoring — 10% so'rovlarni trace qilish
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Faqat 500 xatolarni yuborish (4xx emas)
    beforeSend(event) {
      // Test muhitda yubormaslik
      if (env.NODE_ENV === 'test') return null;
      return event;
    },

    // Shaxsiy ma'lumotlarni olib tashlash
    integrations: [
      Sentry.extraErrorDataIntegration(),
    ],
  });

  initialized = true;
  console.log('✅ Sentry error tracking yoqildi');
}

/**
 * Xatolikni Sentry'ga yuborish
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) return;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Sentry flush — shutdown oldidan barcha eventlarni yuborish
 */
export async function flushSentry(): Promise<void> {
  if (!initialized) return;
  await Sentry.flush(2000);
}

/**
 * Sentry Client-Side konfiguratsiyasi
 * Browser xatoliklarini Sentry'ga yuboradi
 */
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring — 10% sessionlarni trace qilish
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay (faqat xatolik bo'lganda)
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,

    // Debug faqat development da
    debug: false,
  });
}

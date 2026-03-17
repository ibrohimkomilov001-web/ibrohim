/**
 * Sentry Server-Side konfiguratsiyasi
 * Server componentlari va API route xatoliklarini Sentry'ga yuboradi
 */
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Debug faqat development da
    debug: false,
  });
}

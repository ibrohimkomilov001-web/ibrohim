import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  eslint: {
    // Uzbek text contains apostrophes that trigger react/no-unescaped-entities
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.yandexcloud.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'topla.uz',
      },
      {
        protocol: 'https',
        hostname: 'api.topla.uz',
      },
      // localhost faqat development muhitda
      ...(process.env.NODE_ENV !== 'production' ? [{
        protocol: 'http',
        hostname: 'localhost',
      }] : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // CSP moved to middleware.ts for nonce-based policy
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Source map'larni Sentry'ga yuklash (SENTRY_AUTH_TOKEN kerak)
  silent: true,
  // Org va project — Sentry dashboard'da ko'rinadi
  org: process.env.SENTRY_ORG || '',
  project: process.env.SENTRY_PROJECT || '',
  // SENTRY_DSN yo'q bo'lsa, hech narsa qilmaydi
  disableServerWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  disableClientWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
});

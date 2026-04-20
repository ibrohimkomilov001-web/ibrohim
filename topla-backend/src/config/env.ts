import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string().optional(),

  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string().default(''),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('ru-central1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET_PRODUCTS: z.string().default('topla-products'),
  S3_BUCKET_SHOPS: z.string().default('topla-shops'),
  S3_BUCKET_AVATARS: z.string().default('topla-avatars'),

  FCM_SERVER_KEY: z.string().optional(),

  // Eskiz SMS
  ESKIZ_EMAIL: z.string().optional(),
  ESKIZ_PASSWORD: z.string().optional(),

  // OTP
    OTP_LENGTH: z.coerce.number().default(5),
  OTP_TTL_SECONDS: z.coerce.number().default(120),

  // Payment Webhooks (Aliance Bank / Octobank)
  ALIANCE_WEBHOOK_SECRET: z.string().optional(),
  OCTOBANK_WEBHOOK_SECRET: z.string().optional(),
  ALIANCE_API_LOGIN: z.string().optional(),
  ALIANCE_API_SECRET: z.string().optional(),
  OCTOBANK_API_LOGIN: z.string().optional(),
  OCTOBANK_API_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_IPS: z.string().optional(), // Comma-separated allowed IPs for bank webhooks

  // Meilisearch
  MEILISEARCH_URL: z.string().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: z.string().default('topla_meili_master_key'),

  // CLIP image search
  CLIP_SERVICE_URL: z.string().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  COOKIE_SECRET: z.string().default('topla-dev-cookie-secret-change-in-prod'),

  LOG_LEVEL: z.string().default('info'),

  // Google OAuth (admin panel "Sign in with Google")
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Didox e-contract
  DIDOX_API_URL: z.string().default('https://api.didox.uz'),
  DIDOX_API_TOKEN: z.string().optional(),
  DIDOX_COMPANY_TIN: z.string().optional(), // Topla's INN/TIN for contracts
  DIDOX_WEBHOOK_SECRET: z.string().optional(),

  // Error tracking (Sentry)
  SENTRY_DSN: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),
  SENTRY_ENVIRONMENT: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),

  // Gemini AI (product moderation)
  GEMINI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

// Production fail-fast: kritik secretlar default qiymatda bo'lmasligi kerak
if (env.NODE_ENV === 'production') {
  const insecureDefaults: string[] = [];
  const warnings: string[] = [];

  // Secretlar default/bo'sh qiymatda bo'lmasligi
  if (env.COOKIE_SECRET === 'topla-dev-cookie-secret-change-in-prod') {
    insecureDefaults.push('COOKIE_SECRET (default dev qiymat)');
  }
  if (env.MEILISEARCH_API_KEY === 'topla_meili_master_key') {
    insecureDefaults.push('MEILISEARCH_API_KEY (default qiymat)');
  }
  if (!env.JWT_REFRESH_SECRET) {
    insecureDefaults.push("JWT_REFRESH_SECRET (bo'sh)");
  }

  // Secret entropiyasi — 32 char dan kam bo'lmasligi (~256 bit)
  if (env.JWT_SECRET.length < 32) {
    insecureDefaults.push(`JWT_SECRET (faqat ${env.JWT_SECRET.length} char, kamida 32)`);
  }
  if (env.JWT_REFRESH_SECRET && env.JWT_REFRESH_SECRET.length < 32) {
    insecureDefaults.push(`JWT_REFRESH_SECRET (faqat ${env.JWT_REFRESH_SECRET.length} char, kamida 32)`);
  }
  if (env.COOKIE_SECRET.length < 32) {
    insecureDefaults.push(`COOKIE_SECRET (faqat ${env.COOKIE_SECRET.length} char, kamida 32)`);
  }

  // JWT_SECRET === JWT_REFRESH_SECRET bo'lmasligi
  if (env.JWT_REFRESH_SECRET && env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    insecureDefaults.push("JWT_SECRET va JWT_REFRESH_SECRET bir xil — ikki xil bo'lishi shart");
  }

  // CORS localhost'ni o'z ichiga olmasligi
  if (/localhost|127\.0\.0\.1/.test(env.CORS_ORIGINS)) {
    warnings.push('CORS_ORIGINS prod-da localhost/127.0.0.1 ga ruxsat bermoqda');
  }

  // Database SSL tavsiya etiladi (Yandex Managed PG uchun majburiy)
  if (!/sslmode=(require|verify-full|verify-ca)/.test(env.DATABASE_URL)) {
    warnings.push("DATABASE_URL da sslmode=require yo'q");
  }

  if (warnings.length > 0) {
    console.warn('[env] Production ogohlantirishlar:\n  - ' + warnings.join('\n  - '));
  }

  if (insecureDefaults.length > 0) {
    throw new Error(
      `[env] Production muhit xavfsizlik xatosi — quyidagilar to'g'ri sozlanmagan:\n  - ${insecureDefaults.join('\n  - ')}\n.env faylini tekshiring.`,
    );
  }
}

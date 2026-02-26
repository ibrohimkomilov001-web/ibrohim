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

  // Telegram Gateway (https://gateway.telegram.org)
  TELEGRAM_GATEWAY_TOKEN: z.string().optional(),

  // OTP
  OTP_LENGTH: z.coerce.number().default(6),
  OTP_TTL_SECONDS: z.coerce.number().default(120),

  // Payment Webhooks
  PAYME_WEBHOOK_SECRET: z.string().optional(),
  CLICK_WEBHOOK_SECRET: z.string().optional(),

  // Meilisearch
  MEILISEARCH_URL: z.string().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: z.string().default('topla_meili_master_key'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  LOG_LEVEL: z.string().default('info'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

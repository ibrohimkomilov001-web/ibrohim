/**
 * Test uchun Fastify ilova yaratuvchi — haqiqiy DB/Redis o'rniga mock'lardan foydalanadi.
 * Har bir test faylida `buildTestApp()` chaqirib, `app.inject()` orqali so'rov yuborish mumkin.
 */
import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';

/**
 * Minimal Fastify test ilovasini yaratish.
 * Faqat kerakli route plugin ni register qilasiz.
 *
 * Misol:
 * ```
 * const app = await buildTestApp();
 * await app.register(cartRoutes, { prefix: '/api/v1' });
 * await app.ready();
 * ```
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // testlarda log kerak emas
  });

  await app.register(cookie, { secret: 'test-cookie-secret' });

  // DELETE body fix (app.ts dagi kabi)
  app.addHook('onRequest', async (request) => {
    if (request.method === 'DELETE' && (!request.body || request.headers['content-length'] === '0')) {
      request.headers['content-type'] = undefined as any;
    }
  });

  return app;
}

/**
 * Test so'rovi uchun auth header tayyorlash
 */
export function authHeader(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
  };
}

/**
 * Test so'rovi uchun auth cookie tayyorlash
 */
export function authCookie(token: string): string {
  return `topla_at=${token}`;
}

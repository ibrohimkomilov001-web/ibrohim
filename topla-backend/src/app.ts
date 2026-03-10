import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase, prisma } from './config/database.js';
import { initFirebase } from './config/firebase.js';
import { initStorage } from './config/storage.js';
import { initWebSocket } from './websocket/socket.js';
import { errorHandler } from './middleware/error.js';
import { registerRequestLogging } from './middleware/logging.js';

// Route modules
import { authRoutes } from './modules/auth/auth.routes.js';
import { productRoutes } from './modules/products/product.routes.js';
import { cartRoutes } from './modules/products/cart.routes.js';
import { favoriteRoutes } from './modules/products/favorite.routes.js';
import { shopRoutes } from './modules/shops/shop.routes.js';
import { orderRoutes } from './modules/orders/order.routes.js';
import { courierRoutes } from './modules/courier/courier.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { addressRoutes } from './modules/addresses/address.routes.js';
import { bannerRoutes } from './modules/banners/banner.routes.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { vendorRoutes } from './modules/vendor/vendor.routes.js';
import { documentRoutes } from './modules/vendor/document.routes.js';
import { paymentRoutes } from './modules/payments/payment.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { returnRoutes } from './modules/returns/return.routes.js';
import { referralRoutes } from './modules/referral/referral.routes.js';
import { pickupPointRoutes } from './modules/pickup-points/pickup-point.routes.js';
import { supportRoutes } from './modules/support/support.routes.js';
import { luckyWheelRoutes } from './modules/lucky-wheel/lucky-wheel.routes.js';
import { initRedis, getRedis } from './config/redis.js';
import { initMeilisearch } from './services/search.service.js';
import { startWorkers, closeQueues } from './services/queue.service.js';
import fastifyStatic from '@fastify/static';
import path from 'path';

// ============================================
// Create Fastify App
// ============================================

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// ============================================
// Plugins
// ============================================

// DELETE so'rovlarida bo'sh body bilan Content-Type: application/json kelganda xatolik chiqmaslik uchun
app.addHook('onRequest', async (request) => {
  if (request.method === 'DELETE' && (!request.body || request.headers['content-length'] === '0')) {
    request.headers['content-type'] = undefined as any;
  }
});

await app.register(cors, {
  origin: env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: false,
});

// Swagger API docs — faqat development da
if (env.NODE_ENV !== 'production') {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'TOPLA API',
        description: 'TOPLA Marketplace Backend API hujjatlari',
        version: '1.0.0',
      },
      servers: [
        { url: `http://localhost:${env.PORT}`, description: 'Local dev server' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
});

// Static files (uploaded images)
await app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});

// ============================================
// Request Logging
// ============================================

registerRequestLogging(app);

// ============================================
// Error Handler
// ============================================

app.setErrorHandler(errorHandler);

// ============================================
// Health Check
// ============================================

app.get('/health', async (_request, reply) => {
  const checks: Record<string, string> = {};

  // Database check
  try {
    await prisma.$executeRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Redis check
  try {
    const redis = getRedis();
    if (redis) {
      await redis.ping();
      checks.redis = 'ok';
    } else {
      checks.redis = 'unavailable';
    }
  } catch {
    checks.redis = 'error';
  }

  const allOk = checks.database === 'ok';
  const statusCode = allOk ? 200 : 503;

  return reply.status(statusCode).send({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    checks,
  });
});

// ============================================
// API Routes (v1)
// ============================================

await app.register(
  async (api) => {
    await api.register(authRoutes);
    await api.register(productRoutes);
    await api.register(cartRoutes);
    await api.register(favoriteRoutes);
    await api.register(shopRoutes);
    await api.register(orderRoutes);
    await api.register(courierRoutes);
    await api.register(notificationRoutes);
    await api.register(addressRoutes);
    await api.register(bannerRoutes);
    await api.register(uploadRoutes);
    await api.register(vendorRoutes);
    await api.register(documentRoutes);
    await api.register(paymentRoutes);
    await api.register(adminRoutes);
    await api.register(chatRoutes);
    await api.register(returnRoutes);
    await api.register(referralRoutes);
    await api.register(pickupPointRoutes);
    await api.register(supportRoutes);
    await api.register(luckyWheelRoutes);
  },
  { prefix: '/api/v1' },
);

// ============================================
// Start Server
// ============================================

async function start(): Promise<void> {
  try {
    // 1. Database
    await connectDatabase();

    // 2. Redis (cache, OTP, rate limiting)
    await initRedis();

    // 3. Firebase (push notifications)
    initFirebase();

    // 4. S3 Storage
    initStorage();

    // 5. Meilisearch (product search)
    await initMeilisearch();

    // 5.5 BullMQ Workers (background jobs)
    try {
      await startWorkers();
    } catch (err) {
      console.warn('⚠️ BullMQ workers not started:', (err as Error).message);
    }

    // 6. Start HTTP server
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0', // Force listen on all interfaces
    });

    // 7. WebSocket (Socket.IO) — same HTTP server
    const httpServer = app.server as any;
    initWebSocket(httpServer);

    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 TOPLA Backend API Server               ║
║                                              ║
║   HTTP:  ${address}                          
║   WS:    ${address.replace('http', 'ws')}/ws 
║   Env:   ${env.NODE_ENV}                     
║                                              ║
║   API:   ${address}/api/v1                   
║   Docs:  ${address}/health                   
║                                              ║
╚══════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Server start failed:', error);
    process.exit(1);
  }
}

// ============================================
// Graceful Shutdown
// ============================================

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await app.close();
  await closeQueues();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start!
start();

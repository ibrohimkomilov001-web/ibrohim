/**
 * Global test setup — barcha testlar boshlanishidan oldin ishlaydi.
 * Muhit o'zgaruvchilarini test uchun sozlaydi.
 */

// Test muhit o'zgaruvchilari — haqiqiy database/redis kerak emas
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/topla_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret-key-topla-2024';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-topla-2024';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.PORT = '0'; // random port
process.env.HOST = '127.0.0.1';
process.env.LOG_LEVEL = 'silent';

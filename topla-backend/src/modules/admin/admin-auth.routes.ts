/**
 * Admin Auth Routes — Login, Google OAuth, Secret Key, Refresh, Logout, Me
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, blacklistToken } from '../../utils/jwt.js';
import { setAuthCookies, clearAuthCookies, extractRefreshToken } from '../../utils/cookie.js';
import { AppError } from '../../middleware/error.js';
import { checkRateLimit } from '../../config/redis.js';
import bcrypt from 'bcryptjs';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function adminAuthRoutes(app: FastifyInstance) {
  // ==========================================
  // AUTH: Admin Login
  // ==========================================
  app.post('/auth/admin/login', async (request, reply) => {
    const { email, password } = adminLoginSchema.parse(request.body);

    const rateLimitKey = `login:admin:${email}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 20, 1800);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Juda ko'p urinish. ${Math.ceil((rateCheck.retryAfter || 1800) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    const user = await prisma.profile.findFirst({
      where: { email, role: 'admin' },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    const adminRole = await prisma.adminRole.findUnique({
      where: { userId: user.id },
    });

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(reply, token, refreshToken);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.login',
        entityType: 'profile',
        entityId: user.id,
        ipAddress: request.ip,
      },
    });

    return reply.send({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        adminRole: adminRole ? {
          level: adminRole.level,
          permissions: adminRole.permissions,
        } : {
          level: 'super_admin',
          permissions: [],
        },
      },
    });
  });

  // ==========================================
  // AUTH: Admin Login — Google OAuth (ID token)
  // ==========================================
  app.post('/auth/admin/google', async (request, reply) => {
    const { credential } = z.object({ credential: z.string().min(10) }).parse(request.body);

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new AppError('Google OAuth server tomonida sozlanmagan', 503);
    }

    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    let tokenInfo: any;
    try {
      const res = await fetch(tokenInfoUrl);
      tokenInfo = await res.json();
      if (!res.ok || tokenInfo.error) {
        throw new AppError('Google token yaroqsiz', 401);
      }
    } catch {
      throw new AppError('Google token tekshirishda xatolik', 401);
    }

    if (tokenInfo.aud !== googleClientId) {
      throw new AppError('Google token client ID mos kelmadi', 401);
    }

    const email = tokenInfo.email as string | undefined;
    if (!email || !tokenInfo.email_verified) {
      throw new AppError('Google hisobi tasdiqlanmagan', 401);
    }

    const user = await prisma.profile.findFirst({
      where: { email, role: 'admin' },
    });
    if (!user) {
      throw new AppError('Bu Google hisob bilan admin topilmadi', 403);
    }

    const adminRole = await prisma.adminRole.findUnique({
      where: { userId: user.id },
    });

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(reply, token, refreshToken);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.login.google',
        entityType: 'profile',
        entityId: user.id,
        ipAddress: request.ip,
      },
    });

    return reply.send({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        adminRole: adminRole
          ? { level: adminRole.level, permissions: adminRole.permissions }
          : { level: 'super_admin', permissions: [] },
      },
    });
  });

  // ==========================================
  // AUTH: Admin Login — Secret Key
  // ==========================================
  app.post('/auth/admin/key-login', async (request, reply) => {
    const { key } = z.object({ key: z.string().min(10) }).parse(request.body);

    const rateLimitKey = `login:admin:key:${request.ip}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 1800);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Juda ko'p urinish. ${Math.ceil((rateCheck.retryAfter || 1800) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    if (!adminSecretKey) {
      throw new AppError('Kalit orqali kirish sozlanmagan', 503);
    }

    const crypto = await import('crypto');
    const keyBuf = Buffer.from(key);
    const secretBuf = Buffer.from(adminSecretKey);
    if (keyBuf.length !== secretBuf.length || !crypto.timingSafeEqual(keyBuf, secretBuf)) {
      throw new AppError('Kalit noto\'g\'ri', 401);
    }

    const adminRoleRecord = await prisma.adminRole.findFirst({
      where: { level: 'super_admin' },
      include: { user: true },
    });

    if (!adminRoleRecord || !adminRoleRecord.user) {
      throw new AppError('Admin topilmadi', 500);
    }

    const user = adminRoleRecord.user;

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(reply, token, refreshToken);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.login.key',
        entityType: 'profile',
        entityId: user.id,
        ipAddress: request.ip,
      },
    });

    return reply.send({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        adminRole: {
          level: adminRoleRecord.level,
          permissions: adminRoleRecord.permissions,
        },
      },
    });
  });

  // ==========================================
  // AUTH: Admin Token Refresh
  // ==========================================
  app.post('/auth/admin/refresh', async (request, reply) => {
    const refreshToken = extractRefreshToken(request);
    if (!refreshToken) {
      throw new AppError('Refresh token topilmadi', 401);
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      clearAuthCookies(reply);
      throw new AppError('Refresh token yaroqsiz yoki muddati tugagan', 401);
    }

    const user = await prisma.profile.findFirst({
      where: { id: payload.userId, role: 'admin' },
    });
    if (!user) {
      clearAuthCookies(reply);
      throw new AppError('Admin topilmadi', 401);
    }

    await blacklistToken(refreshToken);

    const newPayload = { userId: user.id, role: user.role, phone: user.phone };
    const newAccessToken = generateToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    setAuthCookies(reply, newAccessToken, newRefreshToken);

    return reply.send({ success: true, data: { token: newAccessToken } });
  });

  // ==========================================
  // AUTH: Admin Logout
  // ==========================================
  app.post('/auth/admin/logout', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const token = request.cookies?.['topla_at'];
    const refreshToken = request.cookies?.['topla_rt'];

    if (token) await blacklistToken(token);
    if (refreshToken) await blacklistToken(refreshToken);

    clearAuthCookies(reply);
    return reply.send({ success: true, message: 'Chiqish muvaffaqiyatli' });
  });

  // ==========================================
  // ADMIN ME
  // ==========================================
  app.get('/admin/me', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const user = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      select: { id: true, email: true, fullName: true, role: true, avatarUrl: true, phone: true },
    });

    if (!user) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    const adminRole = await prisma.adminRole.findUnique({
      where: { userId: user.id },
    });

    return reply.send({
      success: true,
      data: {
        user,
        adminRole: adminRole ? {
          level: adminRole.level,
          permissions: adminRole.permissions,
        } : {
          level: 'super_admin',
          permissions: [],
        },
      },
    });
  });
}

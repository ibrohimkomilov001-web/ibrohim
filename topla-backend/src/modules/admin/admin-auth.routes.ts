/**
 * Admin Auth Routes — Login, Google OAuth, 2FA, Refresh, Logout, Me
 *
 * Security layers:
 *  1) IP allowlist (env ADMIN_IP_ALLOWLIST, optional)
 *  2) Cloudflare Turnstile CAPTCHA on password login (env TURNSTILE_SECRET_KEY, optional)
 *  3) Brute-force lockout: 5 fails/15min per email + 20 fails/1h per IP
 *  4) TOTP 2FA (per-admin opt-in) with bcrypt-hashed backup codes
 *  5) Telegram alert on every successful admin login (env ADMIN_TG_BOT_TOKEN/_CHAT_ID)
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
} from '../../utils/jwt.js';
import {
  setAuthCookies,
  clearAuthCookies,
  extractRefreshToken,
} from '../../utils/cookie.js';
import { AppError } from '../../middleware/error.js';
import { setWithExpiry, getValue, deleteKey } from '../../config/redis.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { verifyCaptcha } from '../../lib/captcha.js';
import { sendTelegramAlert } from '../../lib/telegram-notify.js';
import {
  getLockStatus,
  recordLoginFailure,
  clearLoginFailures,
  adminIpAllowlistGuard,
} from '../../lib/admin-security.js';
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeCurrentRefreshToken,
  revokeAllUserSessions,
  RefreshTokenError,
} from '../../services/refresh-token.service.js';


// ============================================
// Schemas
// ============================================
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  captchaToken: z.string().optional(),
});

const twoFactorLoginSchema = z.object({
  tempToken: z.string().min(10),
  code: z.string().min(6).max(10),
});

const setup2FAVerifySchema = z.object({
  code: z.string().min(6).max(10),
});

// ============================================
// Helpers
// ============================================
async function adminTokens(
  user: { id: string; role: string; phone: string | null },
  request: { ip?: string; headers: Record<string, any> },
) {
  const pair = await issueTokenPair({
    userId: user.id,
    role: user.role,
    phone: user.phone,
    ipAddress:
      (request.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() || request.ip,
    userAgent: request.headers['user-agent'] as string | undefined,
  });
  return { accessToken: pair.accessToken, refreshToken: pair.refreshToken };
}

async function getAdminRoleSafe(userId: string) {
  const adminRole = await prisma.adminRole.findUnique({ where: { userId } });
  return adminRole
    ? { level: adminRole.level, permissions: adminRole.permissions }
    : { level: 'super_admin', permissions: [] };
}

function userPublic(user: any) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

async function notifyLoginAlert(user: any, request: any, method: string) {
  const ua = (request.headers['user-agent'] || 'unknown').toString().slice(0, 200);
  const text =
    `🛡 <b>Admin login</b>\n` +
    `👤 ${user.fullName || user.email || user.id}\n` +
    `📧 ${user.email || '—'}\n` +
    `🔑 Method: <b>${method}</b>\n` +
    `🌐 IP: <code>${request.ip}</code>\n` +
    `🖥 UA: ${ua}\n` +
    `🕐 ${new Date().toISOString()}`;
  try {
    await sendTelegramAlert(text);
  } catch {
    /* never block login on alert failure */
  }
}

// ============================================
// MAIN ROUTE GROUP
// ============================================
export async function adminAuthRoutes(app: FastifyInstance) {
  // All admin auth routes are guarded by IP allowlist (no-op when env missing)
  app.addHook('preHandler', async (request, reply) => {
    const url = request.url;
    if (
      url.startsWith('/auth/admin/') ||
      url.startsWith('/admin/me') ||
      url.startsWith('/admin/2fa/')
    ) {
      await adminIpAllowlistGuard(request, reply);
    }
  });

  // ==========================================
  // AUTH: Admin Login (password + optional 2FA)
  // ==========================================
  app.post('/auth/admin/login', async (request, reply) => {
    const { email, password, captchaToken } = adminLoginSchema.parse(request.body);

    const lock = await getLockStatus(email, request.ip);
    if (lock.locked) {
      return reply.code(423).send({
        success: false,
        error: 'LOCKED',
        message: `Juda ko'p urinish. ${Math.ceil((lock.retryAfterSec || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        retryAfter: lock.retryAfterSec,
      });
    }

    const captcha = await verifyCaptcha(captchaToken, request.ip, 'admin_login');
    if (!captcha.success) {
      const softMode = process.env.TURNSTILE_SOFT_MODE === 'true';
      request.log.warn({ captcha, ip: request.ip, email, softMode }, 'admin login captcha failed');
      if (!softMode) {
        throw new AppError(`CAPTCHA tasdiqlanmadi (${(captcha.errors || ['unknown']).join(',')}). Sahifani yangilab qayta urinib ko'ring.`, 400);
      }
      // Soft mode: log warning but allow login to proceed.
    }

    const user = await prisma.profile.findFirst({ where: { email, role: 'admin' } });
    if (!user || !user.passwordHash) {
      await recordLoginFailure(email, request.ip);
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await recordLoginFailure(email, request.ip);
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    if (user.totpEnabled) {
      const tempToken = crypto.randomUUID();
      await setWithExpiry(`admin:2fa:pending:${tempToken}`, user.id, 300);
      return reply.send({
        success: true,
        data: { requires2FA: true, tempToken },
      });
    }

    const { accessToken, refreshToken } = await adminTokens(user, request);
    setAuthCookies(reply, accessToken, refreshToken);
    await clearLoginFailures(email, request.ip);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.login',
        entityType: 'profile',
        entityId: user.id,
        ipAddress: request.ip,
      },
    });

    void notifyLoginAlert(user, request, 'password');

    return reply.send({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: userPublic(user),
        adminRole: await getAdminRoleSafe(user.id),
      },
    });
  });

  // ==========================================
  // AUTH: Admin 2FA Verify (after password)
  // ==========================================
  app.post('/auth/admin/login/2fa', async (request, reply) => {
    const { tempToken, code } = twoFactorLoginSchema.parse(request.body);

    const userId = await getValue(`admin:2fa:pending:${tempToken}`);
    if (!userId) {
      throw new AppError('2FA sessiyasi muddati tugagan. Qayta kirish.', 401);
    }

    const user = await prisma.profile.findFirst({ where: { id: userId, role: 'admin' } });
    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new AppError('2FA sozlanmagan', 400);
    }

    let verified = false;
    if (code.length === 6 && /^\d+$/.test(code)) {
      verified = authenticator.verify({ token: code, secret: user.totpSecret });
    }

    let usedBackupIndex = -1;
    if (!verified && user.totpBackupCodes.length > 0) {
      for (let i = 0; i < user.totpBackupCodes.length; i++) {
        const hashed = user.totpBackupCodes[i];
        if (hashed && (await bcrypt.compare(code, hashed))) {
          verified = true;
          usedBackupIndex = i;
          break;
        }
      }
    }

    if (!verified) {
      await recordLoginFailure(user.email || tempToken, request.ip);
      throw new AppError('2FA kod noto\'g\'ri', 401);
    }

    if (usedBackupIndex >= 0) {
      const updated = user.totpBackupCodes.filter((_, i) => i !== usedBackupIndex);
      await prisma.profile.update({
        where: { id: user.id },
        data: { totpBackupCodes: updated },
      });
    }

    await deleteKey(`admin:2fa:pending:${tempToken}`);
    await clearLoginFailures(user.email || '', request.ip);

    const { accessToken, refreshToken } = await adminTokens(user, request);
    setAuthCookies(reply, accessToken, refreshToken);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.login.2fa',
        entityType: 'profile',
        entityId: user.id,
        ipAddress: request.ip,
      },
    });

    void notifyLoginAlert(user, request, usedBackupIndex >= 0 ? 'password+backup' : 'password+totp');

    return reply.send({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: userPublic(user),
        adminRole: await getAdminRoleSafe(user.id),
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

    const user = await prisma.profile.findFirst({ where: { email, role: 'admin' } });
    if (!user) {
      throw new AppError('Bu Google hisob bilan admin topilmadi', 403);
    }

    const { accessToken, refreshToken } = await adminTokens(user, request);
    setAuthCookies(reply, accessToken, refreshToken);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'admin.login.google',
        entityType: 'profile',
        entityId: user.id,
        ipAddress: request.ip,
      },
    });

    void notifyLoginAlert(user, request, 'google');

    return reply.send({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: userPublic(user),
        adminRole: await getAdminRoleSafe(user.id),
      },
    });
  });

  // ==========================================
  // 2FA: Setup Begin
  // ==========================================
  app.post('/admin/2fa/setup/begin', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const u = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      select: { id: true, email: true, totpEnabled: true },
    });
    if (!u) throw new AppError('Foydalanuvchi topilmadi', 404);
    if (u.totpEnabled) throw new AppError('2FA allaqachon yoqilgan', 400);

    const secret = authenticator.generateSecret();
    await setWithExpiry(`admin:2fa:setup:${u.id}`, secret, 600);

    const issuer = 'TOPLA Admin';
    const label = u.email || u.id;
    const otpauth = authenticator.keyuri(label, issuer, secret);

    return reply.send({ success: true, data: { secret, otpauth } });
  });

  // ==========================================
  // 2FA: Setup Verify (enable)
  // ==========================================
  app.post('/admin/2fa/setup/verify', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { code } = setup2FAVerifySchema.parse(request.body);
    const userId = request.user!.userId;

    const secret = await getValue(`admin:2fa:setup:${userId}`);
    if (!secret) throw new AppError('Setup sessiyasi muddati tugagan', 400);

    const ok = authenticator.verify({ token: code, secret });
    if (!ok) throw new AppError('Kod noto\'g\'ri', 400);

    const rawBackupCodes: string[] = [];
    const hashedBackupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const c = crypto.randomBytes(5).toString('base64')
        .replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase();
      rawBackupCodes.push(c);
      hashedBackupCodes.push(await bcrypt.hash(c, 10));
    }

    await prisma.profile.update({
      where: { id: userId },
      data: {
        totpSecret: secret,
        totpEnabled: true,
        totpBackupCodes: hashedBackupCodes,
      },
    });
    await deleteKey(`admin:2fa:setup:${userId}`);

    return reply.send({
      success: true,
      message: '2FA yoqildi. Backup kodlarni saqlang!',
      data: { backupCodes: rawBackupCodes },
    });
  });

  // ==========================================
  // 2FA: Disable
  // ==========================================
  app.post('/admin/2fa/disable', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const { code } = setup2FAVerifySchema.parse(request.body);
    const u = await prisma.profile.findUnique({ where: { id: request.user!.userId } });
    if (!u || !u.totpEnabled || !u.totpSecret) throw new AppError('2FA yoqilmagan', 400);

    const ok = authenticator.verify({ token: code, secret: u.totpSecret });
    if (!ok) throw new AppError('Kod noto\'g\'ri', 400);

    await prisma.profile.update({
      where: { id: u.id },
      data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
    });

    return reply.send({ success: true, message: '2FA o\'chirildi' });
  });

  // ==========================================
  // 2FA: Status
  // ==========================================
  app.get('/admin/2fa/status', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const u = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      select: { totpEnabled: true, totpBackupCodes: true },
    });
    return reply.send({
      success: true,
      data: {
        enabled: !!u?.totpEnabled,
        backupCodesRemaining: u?.totpBackupCodes.length || 0,
      },
    });
  });

  // ==========================================
  // AUTH: Admin Token Refresh (rotation + reuse detection — B2)
  // ==========================================
  app.post(
    '/auth/admin/refresh',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const refreshToken = extractRefreshToken(request);
      if (!refreshToken) throw new AppError('Refresh token topilmadi', 401);

      try {
        const pair = await rotateRefreshToken({
          rawRefreshToken: refreshToken,
          requireRole: 'admin',
          ipAddress:
            (request.headers['x-forwarded-for'] as string | undefined)
              ?.split(',')[0]
              ?.trim() || request.ip,
          userAgent: request.headers['user-agent'] as string | undefined,
        });

        setAuthCookies(reply, pair.accessToken, pair.refreshToken);
        return reply.send({ success: true, data: { token: pair.accessToken } });
      } catch (err) {
        clearAuthCookies(reply);
        if (err instanceof RefreshTokenError) {
          throw new AppError(err.message, 401);
        }
        throw err;
      }
    },
  );

  // ==========================================
  // AUTH: Admin Logout
  // ==========================================
  app.post('/auth/admin/logout', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const token = request.cookies?.['topla_at'];
    const refreshToken = request.cookies?.['topla_rt'];

    if (token) await blacklistToken(token);
    await revokeCurrentRefreshToken(refreshToken, 'logout');

    clearAuthCookies(reply);
    return reply.send({ success: true, message: 'Chiqish muvaffaqiyatli' });
  });

  // ==========================================
  // AUTH: Admin Logout All Devices (B2)
  // ==========================================
  app.post('/auth/admin/logout-all', {
    preHandler: [authMiddleware, requireRole('admin')],
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const userId = request.user!.userId;
    const result = await revokeAllUserSessions(userId, 'logout_all');

    const token = request.cookies?.['topla_at'];
    if (token) await blacklistToken(token);

    clearAuthCookies(reply);
    return reply.send({
      success: true,
      data: {
        refreshTokensRevoked: result.refreshTokensRevoked,
        newTokenVersion: result.newVersion,
      },
    });
  });

  // ==========================================
  // ADMIN ME
  // ==========================================
  app.get('/admin/me', {
    preHandler: [authMiddleware, requireRole('admin')],
  }, async (request, reply) => {
    const user = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true, email: true, fullName: true, role: true,
        avatarUrl: true, phone: true, totpEnabled: true,
      },
    });

    if (!user) throw new AppError('Foydalanuvchi topilmadi', 404);

    return reply.send({
      success: true,
      data: {
        user,
        adminRole: await getAdminRoleSafe(user.id),
      },
    });
  });
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { verifyFirebaseToken } from '../../config/firebase.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, blacklistToken } from '../../utils/jwt.js';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { env } from '../../config/env.js';
import { checkRateLimit, setWithExpiry, getValue, deleteKey } from '../../config/redis.js';
import { sendOtp, verifyOtp, getOtpForTesting, isTelegramConfigured, type OtpChannel } from '../../services/otp.service.js';
import { randomUUID } from 'crypto';

// ============================================
// Helper: Extract device info from request
// ============================================
function extractDeviceInfo(request: any) {
  const ua = request.headers['user-agent'] || '';
  const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || request.headers['x-real-ip']
    || request.ip
    || '';

  // Custom header dan qurilma nomi (Flutter app yuboradi)
  const customDeviceName = request.headers['x-device-name'];
  const customPlatform = request.headers['x-device-platform'];

  // Parse device name from user-agent
  let deviceName = 'Unknown';
  let browser = '';

  if (customDeviceName) {
    // Flutter ilovadan kelgan qurilma nomi
    deviceName = customDeviceName;
  } else if (ua.includes('Android')) {
    const match = ua.match(/Android[^;]*;\s*([^)]+)\)/);
    deviceName = match ? match[1].trim() : 'Android Device';
  } else if (ua.includes('iPhone')) {
    deviceName = 'iPhone';
  } else if (ua.includes('iPad')) {
    deviceName = 'iPad';
  } else if (ua.includes('Windows')) {
    deviceName = 'Windows PC';
  } else if (ua.includes('Macintosh')) {
    deviceName = 'Mac';
  } else if (ua.includes('Linux')) {
    deviceName = 'Linux PC';
  } else if (ua.includes('Dart')) {
    // Flutter/Dart HTTP client
    deviceName = customPlatform === 'ios' ? 'iPhone' : 'Android Device';
  }

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Dart')) browser = 'TOPLA App';

  return { deviceName, browser, ipAddress: ip };
}

// ============================================
// Validation Schemas
// ============================================

const loginSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase token kerak'),
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  fcmToken: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(9).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['uz', 'ru']).optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const vendorRegisterSchema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
  password: z.string().min(6, 'Kamida 6 ta belgi kerak'),
  fullName: z.string().min(2, 'Ism kerak'),
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  shopName: z.string().min(2, 'Do\'kon nomi kerak'),
  shopDescription: z.string().optional(),
  shopAddress: z.string().optional(),
  shopPhone: z.string().optional(),
});

const vendorLoginSchema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
  password: z.string().min(1, 'Parol kerak'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
});

const confirmResetSchema = z.object({
  token: z.string().uuid('Token noto\'g\'ri'),
  newPassword: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
});

const googleLoginSchema = z.object({
  firebaseToken: z.string().optional(),
  googleAccessToken: z.string().optional(),
  fcmToken: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
}).refine(data => data.firebaseToken || data.googleAccessToken, {
  message: 'firebaseToken yoki googleAccessToken kerak',
});

// === OTP Schemas ===
const sendOtpSchema = z.object({
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  channel: z.enum(['sms', 'telegram']).default('sms'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  code: z.string().min(4, 'Kod kerak').max(6),
  fcmToken: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

// ============================================
// Routes
// ============================================

export async function authRoutes(app: FastifyInstance): Promise<void> {

  // ============================================
  // DUAL CHANNEL OTP (Telegram + Eskiz SMS)
  // ============================================

  /**
   * POST /auth/send-otp
   * OTP yuborish — Telegram yoki SMS orqali
   */
  app.post('/auth/send-otp', async (request, reply) => {
    const body = sendOtpSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    const channel: OtpChannel = body.channel || 'sms';
    const result = await sendOtp(phone, channel);

    if (!result.success) {
      throw new AppError(result.error || 'OTP yuborib bo\'lmadi', 429);
    }

    // Dev mode: OTP'ni faqat server logga yozish (responsga HECH QACHON bermang!)
    if (env.NODE_ENV !== 'production') {
      const devOtp = await getOtpForTesting(phone);
      if (devOtp) {
        console.log(`[DEV] OTP for ${phone}: ${devOtp}`);
      }
    }

    const channelMessage = result.channel === 'telegram'
      ? 'Telegram orqali kod yuborildi'
      : 'SMS kod yuborildi';

    return reply.send({
      success: true,
      data: {
        phone,
        channel: result.channel,
        telegramAvailable: isTelegramConfigured(),
      },
      message: channelMessage,
    });
  });

  /**
   * POST /auth/verify-otp
   * OTP tekshirish va JWT token berish
   */
  app.post('/auth/verify-otp', async (request, reply) => {
    const body = verifyOtpSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    // 1. OTP tekshirish
    const otpResult = await verifyOtp(phone, body.code);
    if (!otpResult.valid) {
      throw new AppError(otpResult.error || 'Noto\'g\'ri kod', 401);
    }

    // 2. Profilni topish yoki yaratish
    let profile = await prisma.profile.findUnique({
      where: { phone },
    });

    let isNewUser = false;

    if (!profile) {
      // Yangi foydalanuvchi
      isNewUser = true;
      profile = await prisma.profile.create({
        data: {
          phone,
          fcmToken: body.fcmToken || null,
        },
      });
    } else {
      // FCM tokenni yangilash
      if (body.fcmToken) {
        profile = await prisma.profile.update({
          where: { id: profile.id },
          data: { fcmToken: body.fcmToken },
        });
      }
    }

    // 3. FCM device saqlash
    const deviceInfo = extractDeviceInfo(request);
    if (body.fcmToken) {
      await prisma.userDevice.upsert({
        where: {
          userId_fcmToken: {
            userId: profile.id,
            fcmToken: body.fcmToken,
          },
        },
        update: { isActive: true, platform: body.platform, ...deviceInfo, lastActiveAt: new Date() },
        create: {
          userId: profile.id,
          fcmToken: body.fcmToken,
          platform: body.platform,
          ...deviceInfo,
        },
      });
    }

    // 4. JWT token yaratish
    const tokenPayload = {
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return reply.send({
      success: true,
      data: {
        user: {
          id: profile.id,
          phone: profile.phone,
          fullName: profile.fullName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          role: profile.role,
          language: profile.language,
        },
        isNewUser,
        accessToken,
        refreshToken,
      },
    });
  });

  // ============================================
  // FIREBASE AUTH (Legacy — backward compatibility)
  // ============================================

  /**
   * POST /auth/login
   * Firebase OTP orqali kirish. Yangi foydalanuvchi bo'lsa yaratadi.
   */
  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // 1. Firebase token tekshirish
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseToken(body.firebaseToken);
    } catch (error) {
      throw new AppError('Firebase token yaroqsiz', 401);
    }

    // 2. Profilni topish yoki yaratish
    let profile = await prisma.profile.findUnique({
      where: { phone: body.phone },
    });

    let isNewUser = false;

    if (!profile) {
      // Yangi foydalanuvchi
      isNewUser = true;
      profile = await prisma.profile.create({
        data: {
          phone: body.phone,
          firebaseUid: firebaseUser.uid,
          fcmToken: body.fcmToken || null,
        },
      });
    } else {
      // Mavjud foydalanuvchi - Firebase UID va FCM tokenni yangilash
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          firebaseUid: firebaseUser.uid,
          fcmToken: body.fcmToken || profile.fcmToken,
        },
      });
    }

    // 3. FCM token qurilmaga saqlash
    const deviceInfo2 = extractDeviceInfo(request);
    if (body.fcmToken) {
      await prisma.userDevice.upsert({
        where: {
          userId_fcmToken: {
            userId: profile.id,
            fcmToken: body.fcmToken,
          },
        },
        update: { isActive: true, platform: body.platform, ...deviceInfo2, lastActiveAt: new Date() },
        create: {
          userId: profile.id,
          fcmToken: body.fcmToken,
          platform: body.platform,
          ...deviceInfo2,
        },
      });
    }

    // 4. JWT token yaratish
    const tokenPayload = {
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return reply.send({
      success: true,
      data: {
        user: {
          id: profile.id,
          phone: profile.phone,
          fullName: profile.fullName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          role: profile.role,
          language: profile.language,
        },
        isNewUser,
        accessToken,
        refreshToken,
      },
    });
  });

  /**
   * POST /auth/refresh
   * Token yangilash
   */
  app.post('/auth/refresh', async (request, reply) => {
    const body = refreshTokenSchema.parse(request.body);

    try {
      const payload = verifyRefreshToken(body.refreshToken);

      // Eski refresh tokenni blacklist ga qo'shish (token rotation)
      await blacklistToken(body.refreshToken);

      // Profil hali ham borligini tekshirish
      const profile = await prisma.profile.findUnique({
        where: { id: payload.userId },
      });

      if (!profile || profile.status === 'blocked') {
        throw new AppError('Foydalanuvchi topilmadi yoki bloklangan', 401);
      }

      const newPayload = {
        userId: profile.id,
        role: profile.role,
        phone: profile.phone,
      };

      return reply.send({
        success: true,
        data: {
          accessToken: generateToken(newPayload),
          refreshToken: generateRefreshToken(newPayload),
        },
      });
    } catch {
      throw new AppError('Refresh token yaroqsiz', 401);
    }
  });

  /**
   * GET /auth/me
   * Joriy foydalanuvchi ma'lumotlari
   */
  app.get('/auth/me', { preHandler: authMiddleware }, async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { id: request.user!.userId },
      include: {
        shop: true,
        courier: true,
        addresses: { orderBy: { isDefault: 'desc' } },
      },
    });

    if (!profile) {
      throw new AppError('Profil topilmadi', 404);
    }

    return reply.send({
      success: true,
      data: {
        id: profile.id,
        phone: profile.phone,
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        language: profile.language,
        status: profile.status,
        shop: profile.shop,
        courier: profile.courier,
        addresses: profile.addresses,
      },
    });
  });

  /**
   * PUT /auth/profile
   * Profilni yangilash
   */
  app.put('/auth/profile', { preHandler: authMiddleware }, async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);

    // Telefon raqam yangilanayotgan bo'lsa, unikal ekanligini tekshirish
    if (body.phone) {
      // Normalize phone
      let normalizedPhone = body.phone.replace(/[^0-9+]/g, '');
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = normalizedPhone.startsWith('998') ? `+${normalizedPhone}` : `+998${normalizedPhone}`;
      }
      body.phone = normalizedPhone;

      const existing = await prisma.profile.findFirst({
        where: {
          phone: normalizedPhone,
          id: { not: request.user!.userId },
        },
      });
      if (existing) {
        throw new AppError('Bu telefon raqam boshqa foydalanuvchiga bog\'langan', 400);
      }
    }

    const profile = await prisma.profile.update({
      where: { id: request.user!.userId },
      data: body,
    });

    return reply.send({
      success: true,
      data: profile,
    });
  });

  /**
   * POST /auth/fcm-token
   * FCM tokenni yangilash
   */
  const fcmTokenSchema = z.object({
    fcmToken: z.string().min(1, 'FCM token bo\'sh bo\'lmasligi kerak'),
    platform: z.enum(['android', 'ios', 'web']).default('android'),
  });

  app.post('/auth/fcm-token', { preHandler: authMiddleware }, async (request, reply) => {
    const { fcmToken, platform } = fcmTokenSchema.parse(request.body);

    if (!fcmToken) {
      throw new AppError('FCM token kerak');
    }

    // Profile va device ni yangilash
    await Promise.all([
      prisma.profile.update({
        where: { id: request.user!.userId },
        data: { fcmToken },
      }),
      prisma.userDevice.upsert({
        where: {
          userId_fcmToken: {
            userId: request.user!.userId,
            fcmToken,
          },
        },
        update: { isActive: true, ...extractDeviceInfo(request), lastActiveAt: new Date() },
        create: {
          userId: request.user!.userId,
          fcmToken,
          platform: platform || 'android',
          ...extractDeviceInfo(request),
        },
      }),
    ]);

    return reply.send({ success: true });
  });

  /**
   * POST /auth/logout
   * Chiqish - FCM tokenni o'chirish
   */
  const logoutSchema = z.object({ fcmToken: z.string().optional() });

  app.post('/auth/logout', { preHandler: authMiddleware }, async (request, reply) => {
    const { fcmToken } = logoutSchema.parse(request.body || {});

    // Access token ni blacklist ga qo'shish
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      await blacklistToken(accessToken);
    }

    const updates: Promise<any>[] = [
      prisma.profile.update({
        where: { id: request.user!.userId },
        data: { fcmToken: null },
      }),
    ];

    if (fcmToken) {
      updates.push(
        prisma.userDevice.updateMany({
          where: { userId: request.user!.userId, fcmToken },
          data: { isActive: false },
        }),
      );
    }

    await Promise.all(updates);

    return reply.send({ success: true });
  });

  // ============================================
  // VENDOR: Email + Password Authentication
  // ============================================

  /**
   * POST /auth/vendor/register
   * Vendor ro'yxatdan o'tishi (email + parol)
   */
  app.post('/auth/vendor/register', async (request, reply) => {
    const body = vendorRegisterSchema.parse(request.body);

    // Email band emasligini tekshirish
    const existing = await prisma.profile.findFirst({
      where: {
        OR: [
          { email: body.email },
          { phone: body.phone },
        ],
      },
    });

    if (existing) {
      if (existing.email === body.email) {
        throw new AppError('Bu email allaqachon ro\'yxatdan o\'tgan');
      }
      throw new AppError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
    }

    // Parolni hashlash
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Profile + Shop yaratish
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          email: body.email,
          phone: body.phone,
          fullName: body.fullName,
          passwordHash,
          role: 'vendor',
        },
      });

      const shop = await tx.shop.create({
        data: {
          name: body.shopName,
          description: body.shopDescription,
          address: body.shopAddress,
          phone: body.shopPhone || body.phone,
          ownerId: profile.id,
          status: 'pending', // Admin tasdiqlashi kerak
        },
      });

      return { profile, shop };
    });

    // JWT token yaratish
    const tokenPayload = {
      userId: result.profile.id,
      role: result.profile.role,
      phone: result.profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: result.profile.id,
          phone: result.profile.phone,
          fullName: result.profile.fullName,
          email: result.profile.email,
          role: result.profile.role,
        },
        shop: result.shop,
        accessToken,
        refreshToken,
      },
    });
  });

  /**
   * POST /auth/vendor/login
   * Vendor kirish (email + parol)
   */
  app.post('/auth/vendor/login', async (request, reply) => {
    const body = vendorLoginSchema.parse(request.body);

    // Rate limiting: 5 urinish / 15 daqiqa
    const rateLimitKey = `login:vendor:${body.email}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Juda ko'p urinish. ${Math.ceil((rateCheck.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    // Profilni email orqali topish
    const profile = await prisma.profile.findFirst({
      where: { email: body.email },
      include: { shop: true },
    });

    if (!profile || !profile.passwordHash) {
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    // Parolni tekshirish
    const isValid = await bcrypt.compare(body.password, profile.passwordHash);
    if (!isValid) {
      throw new AppError('Email yoki parol noto\'g\'ri', 401);
    }

    // Bloklangan emasmi?
    if (profile.status === 'blocked') {
      throw new AppError('Hisobingiz bloklangan. Admin bilan bog\'laning.', 403);
    }

    // JWT generatsiya
    const tokenPayload = {
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return reply.send({
      success: true,
      data: {
        user: {
          id: profile.id,
          phone: profile.phone,
          fullName: profile.fullName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          role: profile.role,
          language: profile.language,
        },
        shop: profile.shop,
        accessToken,
        refreshToken,
      },
    });
  });

  /**
   * POST /auth/reset-password
   * Parol tiklash — email bo'yicha reset token yaratish
   */
  app.post('/auth/reset-password', async (request, reply) => {
    const body = resetPasswordSchema.parse(request.body);

    const profile = await prisma.profile.findFirst({
      where: { email: body.email },
    });

    // Xavfsizlik uchun har doim "yuborildi" deb javob beramiz
    if (!profile) {
      return reply.send({
        success: true,
        message: 'Agar email mavjud bo\'lsa, tiklash ko\'rsatmalari yuboriladi',
      });
    }

    // Foydalanuvchida password bo'lishi kerak (ya'ni vendor/admin)
    if (!profile.passwordHash) {
      return reply.send({
        success: true,
        message: 'Agar email mavjud bo\'lsa, tiklash ko\'rsatmalari yuboriladi',
      });
    }

    // Reset token yaratish va Redis'ga saqlash (15 daqiqa TTL)
    const resetToken = randomUUID();
    const RESET_TTL = 15 * 60; // 15 daqiqa
    await setWithExpiry(`password_reset:${resetToken}`, profile.id, RESET_TTL);

    request.log.info({ email: body.email }, 'Password reset token created');

    // Development rejimda tokenni javobda qaytaramiz
    if (env.NODE_ENV === 'development') {
      return reply.send({
        success: true,
        message: 'Tiklash tokeni yaratildi',
        resetToken, // faqat dev uchun
        expiresIn: RESET_TTL,
      });
    }

    // Production: email orqali yuborish kerak
    // TODO: email service ulanganida bu qismni yoqish
    // await emailService.sendPasswordReset(profile.email, resetToken);

    return reply.send({
      success: true,
      message: 'Agar email mavjud bo\'lsa, tiklash ko\'rsatmalari yuboriladi',
    });
  });

  /**
   * POST /auth/confirm-reset
   * Reset token + yangi parol bilan parolni yangilash
   */
  app.post('/auth/confirm-reset', async (request, reply) => {
    const body = confirmResetSchema.parse(request.body);

    // Redis'dan token tekshirish
    const userId = await getValue(`password_reset:${body.token}`);
    if (!userId) {
      throw new AppError('Token yaroqsiz yoki muddati tugagan', 400);
    }

    // Foydalanuvchini topish
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new AppError('Token yaroqsiz', 400);
    }

    // Yangi parolni xeshlash va yangilash
    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.profile.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Tokenni o'chirish (bir martalik ishlatish)
    await deleteKey(`password_reset:${body.token}`);

    request.log.info({ userId }, 'Password reset completed');

    return reply.send({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi',
    });
  });

  /**
   * POST /auth/google
   * Google Sign-In orqali kirish. Firebase token qabul qiladi.
   * Yangi foydalanuvchi bo'lsa yaratadi.
   */
  app.post('/auth/google', async (request, reply) => {
    const body = googleLoginSchema.parse(request.body);

    let email: string | undefined;
    let name: string = '';
    let picture: string = '';
    let phone: string = '';
    let googleUid: string = '';

    // 1. Token tekshirish - Firebase yoki Google direct
    if (body.firebaseToken) {
      // Firebase token orqali
      try {
        const firebaseUser = await verifyFirebaseToken(body.firebaseToken);
        email = firebaseUser.email;
        name = firebaseUser.name || firebaseUser.displayName || '';
        picture = firebaseUser.picture || '';
        phone = firebaseUser.phone_number || '';
        googleUid = firebaseUser.uid;
      } catch (error) {
        console.warn('Firebase token verification failed, trying Google direct...');
        // Firebase ishlamasa, googleAccessToken bormi tekshiramiz
        if (!body.googleAccessToken) {
          throw new AppError('Firebase token yaroqsiz va Google token yuborilmagan', 401);
        }
      }
    }

    if (!googleUid && body.googleAccessToken) {
      // Google Access Token orqali to'g'ridan-to'g'ri
      try {
        const googleResponse = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          {
            headers: { Authorization: `Bearer ${body.googleAccessToken}` },
          }
        );

        if (!googleResponse.ok) {
          throw new Error(`Google API error: ${googleResponse.status}`);
        }

        const googleUser = await googleResponse.json() as any;
        email = googleUser.email;
        name = googleUser.name || '';
        picture = googleUser.picture || '';
        googleUid = googleUser.sub; // Google user ID
      } catch (error) {
        console.error('Google token verification error:', error);
        throw new AppError('Google token yaroqsiz', 401);
      }
    }

    if (!googleUid) {
      throw new AppError('Autentifikatsiya amalga oshmadi', 401);
    }

    // 2. Profilni topish - avval firebaseUid, keyin email bo'yicha
    let profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { firebaseUid: googleUid },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (!profile) {
      // phone maydoni majburiy va unique, Google foydalanuvchilarda telefon yo'q bo'lishi mumkin
      // Shuning uchun vaqtincha unique placeholder yaratamiz
      const tempPhone = phone || `google_${googleUid}`;

      // Yangi foydalanuvchi yaratish
      profile = await prisma.profile.create({
        data: {
          firebaseUid: googleUid,
          email: email || null,
          fullName: name || null,
          avatarUrl: picture || null,
          phone: tempPhone,
          fcmToken: body.fcmToken || null,
        },
      });
    } else {
      // Mavjud foydalanuvchini yangilash
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          firebaseUid: googleUid,
          ...(email && !profile.email ? { email } : {}),
          ...(name && !profile.fullName ? { fullName: name } : {}),
          ...(picture && !profile.avatarUrl ? { avatarUrl: picture } : {}),
          fcmToken: body.fcmToken || profile.fcmToken,
        },
      });
    }

    // 3. FCM token saqlash
    const googleDeviceInfo = extractDeviceInfo(request);
    if (body.fcmToken) {
      await prisma.userDevice.upsert({
        where: {
          userId_fcmToken: {
            userId: profile.id,
            fcmToken: body.fcmToken,
          },
        },
        update: { isActive: true, platform: body.platform, ...googleDeviceInfo, lastActiveAt: new Date() },
        create: {
          userId: profile.id,
          fcmToken: body.fcmToken,
          platform: body.platform,
          ...googleDeviceInfo,
        },
      });
    }

    // 4. JWT token yaratish
    const tokenPayload = {
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return reply.send({
      success: true,
      data: {
        user: {
          id: profile.id,
          phone: profile.phone,
          fullName: profile.fullName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          role: profile.role,
          language: profile.language,
        },
        accessToken,
        refreshToken,
      },
    });
  });

  // ============================================
  // DEVICE MANAGEMENT
  // ============================================

  /**
   * GET /auth/devices
   * Foydalanuvchining barcha qurilmalarini olish
   */
  app.get('/auth/devices', { preHandler: authMiddleware }, async (request, reply) => {
    const devices = await prisma.userDevice.findMany({
      where: { userId: request.user!.userId },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        platform: true,
        deviceId: true,
        deviceName: true,
        browser: true,
        ipAddress: true,
        lastActiveAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return reply.send({
      success: true,
      data: devices,
    });
  });

  /**
   * DELETE /auth/devices/:id
   * Qurilmani o'chirish (boshqa qurilmadan chiqarish)
   */
  app.delete('/auth/devices/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const device = await prisma.userDevice.findFirst({
      where: { id, userId: request.user!.userId },
    });

    if (!device) {
      throw new AppError('Qurilma topilmadi', 404);
    }

    await prisma.userDevice.delete({ where: { id } });

    return reply.send({
      success: true,
      message: 'Qurilma o\'chirildi',
    });
  });

  /**
   * POST /auth/devices/terminate-others
   * Boshqa barcha qurilmalarni o'chirish (joriy qurilmadan tashqari)
   */
  app.post('/auth/devices/terminate-others', { preHandler: authMiddleware }, async (request, reply) => {
    const { currentDeviceId } = (request.body || {}) as { currentDeviceId?: string };

    const where: any = { userId: request.user!.userId };
    if (currentDeviceId) {
      where.id = { not: currentDeviceId };
    }

    const result = await prisma.userDevice.deleteMany({ where });

    return reply.send({
      success: true,
      message: `${result.count} ta qurilma o'chirildi`,
      data: { count: result.count },
    });
  });

  // ============================================
  // Account Deletion (GDPR)
  // ============================================

  /**
   * DELETE /auth/account
   * Hisobni o'chirish (GDPR/App Store talabi)
   * Barcha ma'lumotlarni anonim qiladi
   */
  app.delete('/auth/account', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        shop: { select: { id: true, status: true } },
      },
    });

    if (!profile) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    // Aktiv buyurtmalar bormi tekshirish
    const activeOrders = await prisma.order.count({
      where: {
        userId,
        status: { notIn: ['delivered', 'cancelled'] },
      },
    });

    if (activeOrders > 0) {
      throw new AppError(`Sizda ${activeOrders} ta aktiv buyurtma bor. Avval ularni yakunlang yoki bekor qiling`, 400);
    }

    // Agar vendor bo'lsa — do'konga tegishli aktiv buyurtmalarni tekshirish
    if (profile.shop) {
      const shopActiveOrders = await prisma.orderItem.count({
        where: {
          product: { shopId: profile.shop.id },
          order: { status: { notIn: ['delivered', 'cancelled'] } },
        },
      });

      if (shopActiveOrders > 0) {
        throw new AppError(`Do\'koningizda ${shopActiveOrders} ta aktiv buyurtma bor. Avval ularni yakunlang`, 400);
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Ma'lumotlarni anonim qilish
      await tx.profile.update({
        where: { id: userId },
        data: {
          phone: `deleted_${userId.slice(0, 8)}`,
          fullName: 'O\'chirilgan foydalanuvchi',
          email: null,
          avatarUrl: null,
          passwordHash: null,
          firebaseUid: null,
          fcmToken: null,
          status: 'blocked',
        },
      });

      // 2. Savatni tozalash
      await tx.cartItem.deleteMany({ where: { userId } });

      // 3. Sevimlilarni o'chirish
      await tx.favorite.deleteMany({ where: { userId } });

      // 4. Manzillarni o'chirish
      await tx.address.deleteMany({ where: { userId } });

      // 5. Qurilmalarni o'chirish
      await tx.userDevice.deleteMany({ where: { userId } });

      // 6. Agar vendor bo'lsa — do'konni deaktivatsiya qilish
      if (profile.shop) {
        await tx.shop.update({
          where: { id: profile.shop.id },
          data: {
            status: 'blocked',
            name: 'O\'chirilgan do\'kon',
          },
        });

        // Barcha mahsulotlarni deaktivatsiya qilish
        await tx.product.updateMany({
          where: { shopId: profile.shop.id },
          data: { isActive: false },
        });
      }
    });

    // Joriy tokenni blacklist qilish
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const token = authHeader.substring(7);
      await blacklistToken(token);
    }

    request.log.info({ userId }, 'Account deleted');

    return reply.send({
      success: true,
      message: 'Hisobingiz muvaffaqiyatli o\'chirildi',
    });
  });
}

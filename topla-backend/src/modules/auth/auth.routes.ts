import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { verifyFirebaseToken } from '../../config/firebase.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, blacklistToken } from '../../utils/jwt.js';
import { setAuthCookies, clearAuthCookies, extractToken, extractRefreshToken } from '../../utils/cookie.js';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { env } from '../../config/env.js';
import { checkRateLimit, setWithExpiry, getValue, deleteKey } from '../../config/redis.js';
import { sendOtp, verifyOtp, getOtpForTesting, type OtpChannel } from '../../services/otp.service.js';
import { getLocationFromIp } from '../../utils/geolocation.js';
import { generateUniqueSlug, generateSlugBase } from '../../utils/slug.js';
import crypto from 'crypto';
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  listUserPasskeys,
  deletePasskey,
} from '../../services/passkey.service.js';

// Reserved slugs — mavjud routelar bilan conflict bo'lmasligi uchun
const RESERVED_SLUGS = new Set([
  'admin', 'vendor', 'pickup', 'faq', 'terms', 'privacy', 'about',
  'cart', 'checkout', 'search', 'categories', 'shops', 'products',
  'favorites', 'orders', 'profile', 'payments', 'reviews', 'help',
  'addresses', 'offline', 'invite', 'api', 'auth', 'login', 'register',
  'sitemap', 'robots', 'manifest', 'sw', 'app', 'topla',
]);
import { randomUUID } from 'crypto';

// ============================================
// Helper: Extract device info from request
// ============================================
async function extractDeviceInfo(request: any) {
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

  // IP dan joylashuvni aniqlash
  const location = await getLocationFromIp(ip);

  return { deviceName, browser, ipAddress: ip, location };
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
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().max(60).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(9).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['uz', 'ru']).optional(),
  gender: z.enum(['male', 'female', 'unspecified']).optional(),
  birthDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  region: z.string().max(100).optional(),
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
  category: z.string().optional(),
  city: z.string().optional(),
  businessType: z.string().optional(),
  inn: z.string().optional().refine(
    (val) => !val || /^\d{9,12}$/.test(val.replace(/\s/g, '')),
    { message: 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak' }
  ),
  bankName: z.string().optional(),
  bankAccount: z.string().optional().refine(
    (val) => !val || /^\d{16,20}$/.test(val.replace(/\s/g, '')),
    { message: 'Hisob raqam 16-20 ta raqamdan iborat bo\'lishi kerak' }
  ),
  mfo: z.string().optional().refine(
    (val) => !val || /^\d{5}$/.test(val.replace(/\s/g, '')),
    { message: 'MFO 5 ta raqamdan iborat bo\'lishi kerak' }
  ),
  oked: z.string().optional(),
});

const vendorLoginSchema = z.object({
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  password: z.string().min(1, 'Parol kerak'),
});

const vendorRegisterOtpSchema = z.object({
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  code: z.string().length(5, '5 xonali OTP kod kerak'),
  fullName: z.string().min(2, 'Ism kerak'),
  password: z.string().min(8, 'Parol kamida 8 belgidan iborat bo\'lishi kerak'),
  email: z.string().email('Email noto\'g\'ri').optional().or(z.literal('')),
  shopName: z.string().min(2, 'Do\'kon nomi kerak'),
  shopDescription: z.string().optional(),
  slug: z.string().min(3, 'Slug kamida 3 belgidan iborat bo\'lishi kerak').max(60).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug faqat lotin harflar, raqamlar va tire bo\'lishi mumkin').optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  businessType: z.enum(['yatt', 'mchj'], { required_error: 'Biznes turini tanlang' }),
  inn: z.string().refine(
    (val) => /^\d{9,12}$/.test(val.replace(/\s/g, '')),
    { message: 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak' }
  ),
  bankName: z.string().optional(),
  bankAccount: z.string().optional().refine(
    (val) => !val || /^\d{16,20}$/.test(val.replace(/\s/g, '')),
    { message: 'Hisob raqam 16-20 ta raqamdan iborat bo\'lishi kerak' }
  ),
  mfo: z.string().optional().refine(
    (val) => !val || /^\d{5}$/.test(val.replace(/\s/g, '')),
    { message: 'MFO 5 ta raqamdan iborat bo\'lishi kerak' }
  ),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'Oferta shartnomasini qabul qiling' }) }),
});

const vendorLoginOtpSchema = z.object({
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  code: z.string().length(5, '5 xonali OTP kod kerak'),
});

const vendorSendOtpByEmailSchema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
});

const confirmResetSchema = z.object({
  token: z.string().min(6, 'Kod noto\'g\'ri'),
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
  channel: z.enum(['sms']).default('sms'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  code: z.string().length(5, '5 xonali kod kerak'),
  fcmToken: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

// ============================================
// Routes
// ============================================

export async function authRoutes(app: FastifyInstance): Promise<void> {

  // ============================================
  // CHECK AVAILABILITY (phone, email, slug, shopName)
  // ============================================

  const checkAvailabilitySchema = z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    shopName: z.string().optional(),
    slug: z.string().optional(),
  });

  /**
   * POST /auth/check-availability
   * Telefon, email, slug, dokon nomi bandligini tekshirish
   */
  app.post('/auth/check-availability', async (request, reply) => {
    const body = checkAvailabilitySchema.parse(request.body);
    const result: Record<string, { available: boolean; message?: string }> = {};

    if (body.phone) {
      const phone = body.phone.startsWith('+998')
        ? body.phone
        : body.phone.startsWith('998')
          ? `+${body.phone}`
          : `+998${body.phone}`;
      const existing = await prisma.profile.findUnique({ where: { phone } });
      const hasShop = existing ? await prisma.shop.findUnique({ where: { ownerId: existing.id } }) : null;
      result.phone = {
        available: !existing || !hasShop,
        message: hasShop ? 'Bu telefon raqamda allaqachon do\'kon mavjud' : undefined,
      };
    }

    if (body.email && body.email.trim()) {
      const existing = await prisma.profile.findFirst({
        where: { email: body.email.trim(), shop: { isNot: null } },
      });
      result.email = {
        available: !existing,
        message: existing ? 'Bu email allaqachon ishlatilgan' : undefined,
      };
    }

    if (body.slug) {
      const slugLower = body.slug.toLowerCase().trim();
      if (RESERVED_SLUGS.has(slugLower)) {
        result.slug = { available: false, message: 'Bu sahifa nomi band (tizim tomonidan)' };
      } else {
        const existing = await prisma.shop.findUnique({ where: { slug: slugLower } });
        result.slug = {
          available: !existing,
          message: existing ? 'Bu sahifa nomi allaqachon band' : undefined,
        };
      }
    }

    if (body.shopName) {
      const existing = await prisma.shop.findFirst({
        where: { name: { equals: body.shopName.trim(), mode: 'insensitive' } },
      });
      result.shopName = {
        available: !existing,
        message: existing ? 'Bu nomdagi do\'kon allaqachon mavjud' : undefined,
      };
    }

    return reply.send({ success: true, data: result });
  });

  // ============================================
  // OTP (Eskiz SMS)
  // ============================================

  /**
   * POST /auth/send-otp
   * OTP yuborish — SMS orqali
   */
  app.post('/auth/send-otp', async (request, reply) => {
    const body = sendOtpSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    // Rate limiting: 3 OTP / 15 daqiqa (telefon raqam bo'yicha)
    const otpRateKey = `otp:send:${phone}`;
    const otpRate = await checkRateLimit(otpRateKey, 3, 900);
    if (!otpRate.allowed) {
      throw new AppError(
        `Juda ko'p OTP so'rovi. ${Math.ceil((otpRate.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    // IP bo'yicha ham rate limiting: 10 OTP / 15 daqiqa
    const ipRateKey = `otp:send:ip:${request.ip}`;
    const ipRate = await checkRateLimit(ipRateKey, 10, 900);
    if (!ipRate.allowed) {
      throw new AppError('Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.', 429);
    }

    const channel: OtpChannel = body.channel || 'sms';
    const result = await sendOtp(phone, channel);

    if (!result.success) {
      request.log.error({ error: result.error, phone }, 'OTP yuborish xatoligi');
      throw new AppError('SMS yuborib bo\'lmadi. Iltimos keyinroq urinib ko\'ring.', 503);
    }

    // Dev mode: OTP'ni faqat server logga yozish (responsga HECH QACHON bermang!)
    if (env.NODE_ENV !== 'production') {
      const devOtp = await getOtpForTesting(phone);
      if (devOtp) {
        console.log(`[DEV] OTP for ${phone}: ${devOtp}`);
      }
    }

    return reply.send({
      success: true,
      data: {
        phone,
        channel: 'sms',
      },
      message: 'SMS kod yuborildi',
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

    // Brute-force himoyasi: 5 urinish / 15 daqiqa
    const verifyRateKey = `otp:verify:${phone}`;
    const verifyRate = await checkRateLimit(verifyRateKey, 5, 900);
    if (!verifyRate.allowed) {
      throw new AppError(
        `Juda ko'p noto'g'ri urinish. ${Math.ceil((verifyRate.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

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

      // Generate unique referral code
      let referralCode: string;
      let isUnique = false;
      do {
        referralCode = 'TOPLA-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        const existing = await prisma.profile.findUnique({ where: { referralCode } });
        isUnique = !existing;
      } while (!isUnique);

      profile = await prisma.profile.create({
        data: {
          phone,
          fcmToken: body.fcmToken || null,
          referralCode,
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
    const deviceInfo = await extractDeviceInfo(request);
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

    // httpOnly cookie o'rnatish (web uchun xavfsiz)
    setAuthCookies(reply, accessToken, refreshToken);

    return reply.send({
      success: true,
      data: {
        user: {
          id: profile.id,
          phone: profile.phone,
          fullName: profile.fullName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          role: profile.role,
          language: profile.language,
          gender: profile.gender,
          birthDate: profile.birthDate,
          region: profile.region,
          referralCode: profile.referralCode,
          referralPoints: profile.referralPoints,
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

    // Login rate limiting: 10 urinish / 15 daqiqa (IP bo'yicha)
    const loginRateKey = `auth:login:ip:${request.ip}`;
    const loginRate = await checkRateLimit(loginRateKey, 10, 900);
    if (!loginRate.allowed) {
      throw new AppError(
        `Juda ko'p kirish urinishlari. ${Math.ceil((loginRate.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

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

      // Generate unique referral code
      let referralCode2: string;
      let isUnique2 = false;
      do {
        referralCode2 = 'TOPLA-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        const existing = await prisma.profile.findUnique({ where: { referralCode: referralCode2 } });
        isUnique2 = !existing;
      } while (!isUnique2);

      profile = await prisma.profile.create({
        data: {
          phone: body.phone,
          firebaseUid: firebaseUser.uid,
          fcmToken: body.fcmToken || null,
          referralCode: referralCode2,
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
    const deviceInfo2 = await extractDeviceInfo(request);
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

    // httpOnly cookie o'rnatish (web uchun xavfsiz)
    setAuthCookies(reply, accessToken, refreshToken);

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
    // Refresh tokenni cookie yoki body dan olish
    const bodyData = refreshTokenSchema.parse(request.body || {});
    const refreshTokenValue = extractRefreshToken(request, bodyData.refreshToken);

    if (!refreshTokenValue) {
      throw new AppError('Refresh token topilmadi', 401);
    }

    try {
      const payload = verifyRefreshToken(refreshTokenValue);

      // Eski refresh tokenni blacklist ga qo'shish (token rotation)
      await blacklistToken(refreshTokenValue);

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

      const newAccessToken = generateToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      // httpOnly cookie yangilash
      setAuthCookies(reply, newAccessToken, newRefreshToken);

      return reply.send({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
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
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        language: profile.language,
        status: profile.status,
        gender: profile.gender,
        birthDate: profile.birthDate,
        region: profile.region,
        referralCode: profile.referralCode,
        referralPoints: profile.referralPoints,
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

    // firstName/lastName → auto-build fullName if not explicitly provided
    const updateData: any = { ...body };
    if ((body.firstName || body.lastName) && !body.fullName) {
      const currentProfile = await prisma.profile.findUnique({
        where: { id: request.user!.userId },
        select: { firstName: true, lastName: true },
      });
      const fn = body.firstName ?? currentProfile?.firstName ?? '';
      const ln = body.lastName ?? currentProfile?.lastName ?? '';
      updateData.fullName = [fn, ln].filter(Boolean).join(' ') || undefined;
    }

    const profile = await prisma.profile.update({
      where: { id: request.user!.userId },
      data: updateData,
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
    const fcmDeviceInfo = await extractDeviceInfo(request);
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
        update: { isActive: true, ...fcmDeviceInfo, lastActiveAt: new Date() },
        create: {
          userId: request.user!.userId,
          fcmToken,
          platform: platform || 'android',
          ...fcmDeviceInfo,
        },
      }),
    ]);

    return reply.send({ success: true });
  });

  /**
   * POST /auth/logout
   * Chiqish - FCM tokenni o'chirish
   */
  const logoutSchema = z.object({
    fcmToken: z.string().optional(),
    refreshToken: z.string().optional(),
  });

  app.post('/auth/logout', { preHandler: authMiddleware }, async (request, reply) => {
    const { fcmToken, refreshToken } = logoutSchema.parse(request.body || {});

    // Access token ni blacklist ga qo'shish (header yoki cookie dan)
    const accessToken = extractToken(request);
    if (accessToken) {
      await blacklistToken(accessToken);
    }

    // Refresh token ni ham blacklist ga qo'shish (body yoki cookie dan)
    const refreshTokenValue = extractRefreshToken(request, refreshToken);
    if (refreshTokenValue) {
      await blacklistToken(refreshTokenValue);
    }

    // Cookie larni tozalash
    clearAuthCookies(reply);

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

    // Email/telefon orqali mavjud profilni tekshirish
    const existing = await prisma.profile.findFirst({
      where: {
        OR: [
          { email: body.email },
          { phone: body.phone },
        ],
      },
      include: { shop: true },
    });

    let result: { profile: any; shop: any };

    if (existing) {
      // Agar mavjud foydalanuvchining allaqachon do'koni bor bo'lsa — rad etamiz
      if (existing.shop) {
        throw new AppError('Bu foydalanuvchining allaqachon do\'koni bor');
      }

      // Mavjud foydalanuvchi uchun do'kon yaratish (parolni yangilash bilan)
      const passwordHash = await bcrypt.hash(body.password, 12);
      const slug = await generateUniqueSlug(body.shopName);

      result = await prisma.$transaction(async (tx) => {
        const profile = await tx.profile.update({
          where: { id: existing.id },
          data: {
            email: body.email,
            fullName: body.fullName || existing.fullName,
            passwordHash,
            role: 'vendor',
          },
        });

        const shop = await tx.shop.create({
          data: {
            name: body.shopName,
            slug,
            description: body.shopDescription,
            address: body.shopAddress,
            phone: body.shopPhone || body.phone || existing.phone,
            ownerId: existing.id,
            status: 'pending',
            category: body.category,
            city: body.city,
            businessType: body.businessType,
            inn: body.inn?.replace(/\s/g, ''),
            bankName: body.bankName,
            bankAccount: body.bankAccount?.replace(/\s/g, ''),
            mfo: body.mfo?.replace(/\s/g, ''),
            oked: body.oked,
          },
        });

        // Admin ga notification yuborish
        const admins = await tx.profile.findMany({ where: { role: 'admin' } });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              type: 'system',
              title: '🏪 Yangi sotuvchi arizasi!',
              body: `"${body.shopName}" do'koni ro'yxatdan o'tdi. Tasdiqlash kutilmoqda.`,
            })),
          });
        }

        return { profile, shop };
      });
    } else {
      // Yangi foydalanuvchi — profil + do'kon yaratish
      const passwordHash = await bcrypt.hash(body.password, 12);
      const slug = await generateUniqueSlug(body.shopName);

      result = await prisma.$transaction(async (tx) => {
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
            slug,
            description: body.shopDescription,
            address: body.shopAddress,
            phone: body.shopPhone || body.phone,
            ownerId: profile.id,
            status: 'pending',
            category: body.category,
            city: body.city,
            businessType: body.businessType,
            inn: body.inn?.replace(/\s/g, ''),
            bankName: body.bankName,
            bankAccount: body.bankAccount?.replace(/\s/g, ''),
            mfo: body.mfo?.replace(/\s/g, ''),
            oked: body.oked,
          },
        });

        // Admin ga notification yuborish
        const admins = await tx.profile.findMany({ where: { role: 'admin' } });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              type: 'system',
              title: '🏪 Yangi sotuvchi arizasi!',
              body: `"${body.shopName}" do'koni ro'yxatdan o'tdi. Tasdiqlash kutilmoqda.`,
            })),
          });
        }

        return { profile, shop };
      });
    }

    // JWT token yaratish
    const tokenPayload = {
      userId: result.profile.id,
      role: result.profile.role,
      phone: result.profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // httpOnly cookie o'rnatish
    setAuthCookies(reply, accessToken, refreshToken);

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
   * Vendor kirish (telefon + parol)
   */
  app.post('/auth/vendor/login', async (request, reply) => {
    const body = vendorLoginSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    // Rate limiting: 5 urinish / 15 daqiqa
    const rateLimitKey = `login:vendor:${phone}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Juda ko'p urinish. ${Math.ceil((rateCheck.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    // Profilni telefon orqali topish
    const profile = await prisma.profile.findUnique({
      where: { phone },
      include: { shop: true },
    });

    if (!profile || !profile.passwordHash) {
      throw new AppError('Telefon raqam yoki parol noto\'g\'ri', 401);
    }

    // Parolni tekshirish
    const isValid = await bcrypt.compare(body.password, profile.passwordHash);
    if (!isValid) {
      throw new AppError('Telefon raqam yoki parol noto\'g\'ri', 401);
    }

    // Bloklangan emasmi?
    if (profile.status === 'blocked') {
      throw new AppError('Hisobingiz bloklangan. Admin bilan bog\'laning.', 403);
    }

    // Vendor yoki admin ekanligini tekshirish
    if (profile.role !== 'vendor' && profile.role !== 'admin') {
      if (!profile.shop) {
        throw new AppError('Sizda do\'kon mavjud emas. Iltimos, avval ro\'yxatdan o\'ting.', 403);
      }
      if (profile.shop.status === 'pending') {
        throw new AppError('Do\'koningiz hali admin tomonidan tasdiqlanmagan. Iltimos kuting.', 403);
      }
      throw new AppError('Sizda vendor huquqi yo\'q. Iltimos, ro\'yxatdan o\'ting.', 403);
    }

    // JWT generatsiya
    const tokenPayload = {
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // httpOnly cookie o'rnatish
    setAuthCookies(reply, accessToken, refreshToken);

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

  // ============================================
  // VENDOR: Phone OTP Authentication
  // ============================================

  /**
   * POST /auth/vendor/register-otp
   * Vendor ro'yxatdan o'tishi (telefon OTP + parol)
   */
  app.post('/auth/vendor/register-otp', async (request, reply) => {
    const body = vendorRegisterOtpSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    // Rate limiting: 5 urinish / 15 daqiqa
    const rateLimitKey = `register:vendor:otp:${phone}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Juda ko'p urinish. ${Math.ceil((rateCheck.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    // 1. OTP tekshirish
    const otpResult = await verifyOtp(phone, body.code);
    if (!otpResult.valid) {
      throw new AppError(otpResult.error || 'Noto\'g\'ri kod', 401);
    }

    // 2. Parolni xeshlash
    const passwordHash = await bcrypt.hash(body.password, 12);

    // 3. Slug tayyorlash — foydalanuvchi bergan yoki auto-generate
    let slug: string;
    if (body.slug) {
      const slugLower = body.slug.toLowerCase().trim();
      if (RESERVED_SLUGS.has(slugLower)) {
        throw new AppError('Bu sahifa nomi band (tizim tomonidan)', 400);
      }
      const existingSlug = await prisma.shop.findUnique({ where: { slug: slugLower } });
      if (existingSlug) {
        throw new AppError('Bu sahifa nomi allaqachon band', 409);
      }
      slug = slugLower;
    } else {
      slug = await generateUniqueSlug(body.shopName);
      if (RESERVED_SLUGS.has(slug)) {
        slug = await generateUniqueSlug(body.shopName + '-shop');
      }
    }

    // 4. Telefon raqam bo'yicha mavjud profilni tekshirish
    const existing = await prisma.profile.findUnique({
      where: { phone },
      include: { shop: true },
    });

    let result: { profile: any; shop: any };

    try {
      if (existing) {
        // Agar allaqachon do'koni bor bo'lsa — rad etamiz
        if (existing.shop) {
          throw new AppError('Bu telefon raqamda allaqachon do\'kon mavjud', 409);
        }

        // Mavjud foydalanuvchi — role ni vendor ga o'zgartirish + shop yaratish
        result = await prisma.$transaction(async (tx) => {
          const profile = await tx.profile.update({
            where: { id: existing.id },
            data: {
              fullName: body.fullName || existing.fullName,
              email: body.email || existing.email,
              passwordHash,
              role: 'vendor',
              termsAcceptedAt: new Date(),
            },
          });

          const shop = await tx.shop.create({
            data: {
              name: body.shopName,
              slug,
              description: body.shopDescription,
              phone: existing.phone,
              ownerId: existing.id,
              status: 'pending',
              category: body.category,
              city: body.city,
              businessType: body.businessType,
              inn: body.inn.replace(/\s/g, ''),
              bankName: body.bankName,
              bankAccount: body.bankAccount?.replace(/\s/g, ''),
              mfo: body.mfo?.replace(/\s/g, ''),
            },
          });

          // Admin ga notification yuborish
          const admins = await tx.profile.findMany({ where: { role: 'admin' } });
          if (admins.length > 0) {
            await tx.notification.createMany({
              data: admins.map(admin => ({
                userId: admin.id,
                type: 'system',
                title: '🏪 Yangi sotuvchi arizasi!',
                body: `"${body.shopName}" do'koni ro'yxatdan o'tdi. Tasdiqlash kutilmoqda.`,
              })),
            });
          }

          return { profile, shop };
        });
      } else {
        // Yangi foydalanuvchi — profil + shop yaratish
        result = await prisma.$transaction(async (tx) => {
          const profile = await tx.profile.create({
            data: {
              phone,
              fullName: body.fullName,
              email: body.email || null,
              passwordHash,
              role: 'vendor',
              termsAcceptedAt: new Date(),
            },
          });

          const shop = await tx.shop.create({
            data: {
              name: body.shopName,
              slug,
              description: body.shopDescription,
              phone,
              ownerId: profile.id,
              status: 'pending',
              category: body.category,
              city: body.city,
              businessType: body.businessType,
              inn: body.inn.replace(/\s/g, ''),
              bankName: body.bankName,
              bankAccount: body.bankAccount?.replace(/\s/g, ''),
              mfo: body.mfo?.replace(/\s/g, ''),
            },
          });

          // Admin ga notification yuborish
          const admins = await tx.profile.findMany({ where: { role: 'admin' } });
          if (admins.length > 0) {
            await tx.notification.createMany({
              data: admins.map(admin => ({
                userId: admin.id,
                type: 'system',
                title: '🏪 Yangi sotuvchi arizasi!',
                body: `"${body.shopName}" do'koni ro'yxatdan o'tdi. Tasdiqlash kutilmoqda.`,
              })),
            });
          }

          return { profile, shop };
        });
      }
    } catch (err: any) {
      // Prisma unique constraint xatolarini aniq xabar bilan qaytarish
      if (err instanceof AppError) throw err;
      if (err?.code === 'P2002') {
        const target = err.meta?.target;
        if (Array.isArray(target)) {
          if (target.includes('phone')) throw new AppError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan', 409);
          if (target.includes('slug')) throw new AppError('Bu sahifa nomi allaqachon band', 409);
          if (target.includes('owner_id')) throw new AppError('Bu foydalanuvchining allaqachon do\'koni bor', 409);
        }
        throw new AppError('Bu ma\'lumot allaqachon mavjud', 409);
      }
      throw err;
    }

    // JWT token yaratish
    const tokenPayload = {
      userId: result.profile.id,
      role: result.profile.role,
      phone: result.profile.phone,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    setAuthCookies(reply, accessToken, refreshToken);

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
   * POST /auth/vendor/login-otp
   * Vendor kirish (telefon OTP)
   */
  app.post('/auth/vendor/login-otp', async (request, reply) => {
    const body = vendorLoginOtpSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    // Rate limiting: 5 urinish / 15 daqiqa
    const rateLimitKey = `login:vendor:otp:${phone}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (!rateCheck.allowed) {
      throw new AppError(
        `Juda ko'p urinish. ${Math.ceil((rateCheck.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    // 1. OTP tekshirish
    const otpResult = await verifyOtp(phone, body.code);
    if (!otpResult.valid) {
      throw new AppError(otpResult.error || 'Noto\'g\'ri kod', 401);
    }

    // 2. Profilni topish
    const profile = await prisma.profile.findUnique({
      where: { phone },
      include: { shop: true },
    });

    if (!profile) {
      throw new AppError('Bu telefon raqam bilan ro\'yxatdan o\'tilmagan. Avval ro\'yxatdan o\'ting.', 404);
    }

    // Vendor yoki admin bo'lishi kerak
    if (profile.role !== 'vendor' && profile.role !== 'admin') {
      throw new AppError('Sizda vendor huquqi yo\'q. Iltimos, ro\'yxatdan o\'ting.', 403);
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

    setAuthCookies(reply, accessToken, refreshToken);

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
   * POST /auth/vendor/send-otp-by-email
   * Email bilan ro'yxatdan o'tgan vendor uchun — telefoniga OTP yuborish
   */
  app.post('/auth/vendor/send-otp-by-email', async (request, reply) => {
    const body = vendorSendOtpByEmailSchema.parse(request.body);

    const profile = await prisma.profile.findFirst({
      where: {
        email: body.email,
        role: { in: ['vendor', 'admin'] },
      },
    });

    if (!profile || !profile.phone) {
      throw new AppError("Bu email bilan ro'yxatdan o'tilmagan vendor topilmadi", 404);
    }

    if (profile.status === 'blocked') {
      throw new AppError("Hisobingiz bloklangan. Admin bilan bog'laning.", 403);
    }

    const emailRateLimitKey = `otp:email:${body.email}`;
    const emailRateCheck = await checkRateLimit(emailRateLimitKey, 3, 900);
    if (!emailRateCheck.allowed) {
      throw new AppError(
        `Juda ko'p OTP so'rovi. ${Math.ceil((emailRateCheck.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    const otpSendResult = await sendOtp(profile.phone, 'sms');
    if (!otpSendResult.success) {
      request.log.error({ error: otpSendResult.error, phone: profile.phone }, 'OTP yuborish xatoligi (email flow)');
      throw new AppError('SMS yuborib bo\'lmadi. Iltimos keyinroq urinib ko\'ring.', 503);
    }

    if (env.NODE_ENV !== 'production') {
      const devOtp = await getOtpForTesting(profile.phone);
      if (devOtp) {
        console.log(`[DEV] OTP for ${profile.phone} (via email ${body.email}): ${devOtp}`);
      }
    }

    const phoneDigits = profile.phone.replace(/\D/g, '');
    const maskedPhone = phoneDigits.length >= 12
      ? `+${phoneDigits.slice(0, 3)} ${phoneDigits[3]}X *** **${phoneDigits.slice(-2)}`
      : profile.phone;
    const phoneForLogin = phoneDigits.startsWith('998') ? phoneDigits : `998${phoneDigits}`;

    return reply.send({
      success: true,
      data: { maskedPhone, phone: phoneForLogin },
      message: 'SMS kod yuborildi',
    });
  });

  /**
   * POST /auth/reset-password
   * Parol tiklash — email bo'yicha reset kod yaratish va SMS orqali yuborish
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
        message: 'Agar email mavjud bo\'lsa, tiklash kodi yuboriladi',
      });
    }

    // Foydalanuvchida password bo'lishi kerak (ya'ni vendor/admin)
    if (!profile.passwordHash) {
      return reply.send({
        success: true,
        message: 'Agar email mavjud bo\'lsa, tiklash kodi yuboriladi',
      });
    }

    // Rate limiting — 60 sekundda 1 marta
    const rateLimitKey = `password_reset_rate:${profile.id}`;
    const lastSent = await getValue(rateLimitKey);
    if (lastSent) {
      throw new AppError('Iltimos, 60 soniya kutib qayta urinib ko\'ring', 429);
    }

    // 6 xonali tasodifiy kod yaratish (crypto-safe)
    const resetCode = String(crypto.randomInt(100000, 999999));
    const RESET_TTL = 15 * 60; // 15 daqiqa
    
    // Kodni hash qilib Redis'ga saqlash (Redis access orqali code sizmashi oldini oladi)
    const codeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
    await setWithExpiry(`password_reset:${codeHash}`, profile.id, RESET_TTL);
    // Rate limit o'rnatish
    await setWithExpiry(rateLimitKey, '1', 60);

    request.log.info({ email: body.email, phone: profile.phone }, 'Password reset code created');

    // Telefon raqamini yashirish (998901234567 -> ****4567)
    const maskedPhone = profile.phone ? '****' + profile.phone.slice(-4) : '';

    // Development rejimda kodni javobda qaytaramiz
    if (env.NODE_ENV === 'development') {
      return reply.send({
        success: true,
        message: `Tiklash kodi ${maskedPhone} raqamiga yuborildi`,
        resetToken: resetCode, // faqat dev uchun
        expiresIn: RESET_TTL,
        phone: maskedPhone,
      });
    }

    // Production: SMS orqali kod yuborish
    if (profile.phone) {
      const { sendSmsViaEskiz } = await import('../../config/eskiz.js');
      const smsResult = await sendSmsViaEskiz(
        profile.phone,
        `TOPLA parol tiklash kodi: ${resetCode}. Kod 15 daqiqa amal qiladi.`,
      );
      if (!smsResult.success) {
        request.log.error({ error: smsResult.error }, 'Failed to send password reset SMS');
      }
    }

    return reply.send({
      success: true,
      message: `Tiklash kodi ${maskedPhone} raqamiga yuborildi`,
      phone: maskedPhone,
    });
  });

  /**
   * POST /auth/confirm-reset
   * Reset token + yangi parol bilan parolni yangilash
   */
  app.post('/auth/confirm-reset', async (request, reply) => {
    const body = confirmResetSchema.parse(request.body);

    // Redis'dan hash qilingan token tekshirish
    const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');
    const userId = await getValue(`password_reset:${tokenHash}`);
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
    await deleteKey(`password_reset:${tokenHash}`);

    request.log.info({ userId }, 'Password reset completed');

    return reply.send({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi',
    });
  });

  // ============================================
  // VENDOR: Phone-based Password Reset
  // ============================================

  const resetPasswordPhoneSchema = z.object({
    phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
  });

  const confirmResetPhoneSchema = z.object({
    phone: z.string().min(9, 'Telefon raqam noto\'g\'ri'),
    code: z.string().length(5, '5 xonali kod kerak'),
    newPassword: z.string().min(8, 'Parol kamida 8 belgidan iborat bo\'lishi kerak'),
  });

  /**
   * POST /auth/reset-password-phone
   * Parol tiklash — telefon raqamiga SMS kod yuborish
   */
  app.post('/auth/reset-password-phone', async (request, reply) => {
    const body = resetPasswordPhoneSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    const profile = await prisma.profile.findUnique({
      where: { phone },
    });

    // Xavfsizlik uchun har doim muvaffaqiyatli javob beramiz
    if (!profile || !profile.passwordHash) {
      return reply.send({
        success: true,
        message: 'Agar telefon raqam ro\'yxatdan o\'tgan bo\'lsa, SMS kod yuboriladi',
      });
    }

    // Rate limiting — 60 sekundda 1 marta
    const rateLimitKey = `password_reset_phone_rate:${phone}`;
    const lastSent = await getValue(rateLimitKey);
    if (lastSent) {
      throw new AppError('Iltimos, 60 soniya kutib qayta urinib ko\'ring', 429);
    }

    // OTP yuborish
    const otpResult = await sendOtp(phone, 'sms');
    if (!otpResult.success) {
      request.log.error({ error: otpResult.error, phone }, 'OTP yuborish xatoligi (password reset)');
      throw new AppError('SMS yuborib bo\'lmadi. Iltimos keyinroq urinib ko\'ring.', 503);
    }

    // Rate limit o'rnatish
    await setWithExpiry(rateLimitKey, '1', 60);

    if (env.NODE_ENV !== 'production') {
      const devOtp = await getOtpForTesting(phone);
      if (devOtp) {
        console.log(`[DEV] Password reset OTP for ${phone}: ${devOtp}`);
      }
    }

    return reply.send({
      success: true,
      message: 'SMS kod yuborildi',
    });
  });

  /**
   * POST /auth/reset-password-phone/confirm
   * Telefon raqamiga yuborilgan OTP bilan parolni tiklash
   */
  app.post('/auth/reset-password-phone/confirm', async (request, reply) => {
    const body = confirmResetPhoneSchema.parse(request.body);
    const phone = body.phone.startsWith('+998')
      ? body.phone
      : body.phone.startsWith('998')
        ? `+${body.phone}`
        : `+998${body.phone}`;

    // Brute-force himoyasi
    const verifyRateKey = `reset:phone:verify:${phone}`;
    const verifyRate = await checkRateLimit(verifyRateKey, 5, 900);
    if (!verifyRate.allowed) {
      throw new AppError(
        `Juda ko'p noto'g'ri urinish. ${Math.ceil((verifyRate.retryAfter || 900) / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        429
      );
    }

    // OTP tekshirish
    const otpResult = await verifyOtp(phone, body.code);
    if (!otpResult.valid) {
      throw new AppError(otpResult.error || 'Noto\'g\'ri kod', 401);
    }

    const profile = await prisma.profile.findUnique({
      where: { phone },
    });

    if (!profile) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.profile.update({
      where: { id: profile.id },
      data: { passwordHash },
    });

    request.log.info({ userId: profile.id }, 'Password reset via phone completed');

    return reply.send({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi',
    });
  });

  // ============================================
  // VENDOR: Google OAuth
  // ============================================

  const vendorGoogleSchema = z.object({
    googleAccessToken: z.string().min(1, 'Google token kerak'),
  });

  /**
   * POST /auth/vendor/google
   * Vendor uchun Google Sign-In. Mavjud vendor bo'lsa kiradi, yangi bo'lsa xatolik beradi.
   */
  app.post('/auth/vendor/google', async (request, reply) => {
    const body = vendorGoogleSchema.parse(request.body);

    // Google Access Token orqali foydalanuvchi ma'lumotlarini olish
    let googleEmail: string;
    let googleName: string = '';
    let googlePicture: string = '';
    let googleId: string;

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
      if (!googleUser.email) {
        throw new Error('Google hisobda email topilmadi');
      }

      googleEmail = googleUser.email;
      googleName = googleUser.name || '';
      googlePicture = googleUser.picture || '';
      googleId = googleUser.sub;
    } catch (error) {
      console.error('Google token verification error:', error);
      throw new AppError('Google token yaroqsiz', 401);
    }

    // Profilni topish — avval googleId, keyin email bo'yicha
    let profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { googleId },
          { email: googleEmail },
        ],
      },
      include: { shop: true },
    });

    if (!profile) {
      // Vendor uchun Google bilan faqat kirish mumkin — ro'yxatdan o'tish kerak
      throw new AppError('Bu Google hisob bilan ro\'yxatdan o\'tilmagan. Iltimos, avval ro\'yxatdan o\'ting.', 404);
    }

    // googleId ni saqlash (agar hali saqlanmagan bo'lsa)
    if (!profile.googleId) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { googleId },
      });
    }

    // Vendor yoki admin bo'lishi kerak
    if (profile.role !== 'vendor' && profile.role !== 'admin') {
      throw new AppError('Sizda vendor huquqi yo\'q. Iltimos, ro\'yxatdan o\'ting.', 403);
    }

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

    setAuthCookies(reply, accessToken, refreshToken);

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
        shop: (profile as any).shop,
        accessToken,
        refreshToken,
      },
    });
  });

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  const sendEmailCodeSchema = z.object({
    email: z.string().email('Email noto\'g\'ri'),
  });

  const verifyEmailCodeSchema = z.object({
    code: z.string().length(6, '6 xonali kod kerak'),
  });

  /**
   * POST /auth/send-email-code
   * Email tasdiqlash kodi yuborish
   */
  app.post('/auth/send-email-code', { preHandler: authMiddleware }, async (request, reply) => {
    const body = sendEmailCodeSchema.parse(request.body);
    const userId = request.user!.userId;

    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    if (profile.emailVerified) {
      return reply.send({ success: true, message: 'Email allaqachon tasdiqlangan' });
    }

    // Rate limiting — 60 sekundda 1 marta
    const rateLimitKey = `email_verify_rate:${userId}`;
    const lastSent = await getValue(rateLimitKey);
    if (lastSent) {
      throw new AppError('Iltimos, 60 soniya kutib qayta urinib ko\'ring', 429);
    }

    // 6 xonali kod yaratish
    const emailCode = String(Math.floor(100000 + Math.random() * 900000));
    const EMAIL_CODE_TTL = 15 * 60; // 15 daqiqa

    await setWithExpiry(`email_verify:${userId}`, emailCode, EMAIL_CODE_TTL);
    await setWithExpiry(rateLimitKey, '1', 60);

    // Email yuborish (TODO: email service integratsiyasi)
    request.log.info({ userId, email: body.email, code: emailCode }, 'Email verification code created');

    // Dev rejimda kodni logga yozamiz
    if (env.NODE_ENV !== 'production') {
      console.log(`[DEV] Email verification code for ${body.email}: ${emailCode}`);
    }

    // Email ni profile ga saqlash (agar hali saqlanmagan bo'lsa)
    if (!profile.email || profile.email !== body.email) {
      await prisma.profile.update({
        where: { id: userId },
        data: { email: body.email },
      });
    }

    return reply.send({
      success: true,
      message: 'Tasdiqlash kodi emailga yuborildi',
    });
  });

  /**
   * POST /auth/verify-email-code
   * Email tasdiqlash kodini tekshirish
   */
  app.post('/auth/verify-email-code', { preHandler: authMiddleware }, async (request, reply) => {
    const body = verifyEmailCodeSchema.parse(request.body);
    const userId = request.user!.userId;

    // Brute-force himoyasi
    const verifyRateKey = `email_verify:attempt:${userId}`;
    const verifyRate = await checkRateLimit(verifyRateKey, 5, 900);
    if (!verifyRate.allowed) {
      throw new AppError('Juda ko\'p noto\'g\'ri urinish. 15 daqiqadan keyin qayta urinib ko\'ring.', 429);
    }

    const savedCode = await getValue(`email_verify:${userId}`);
    if (!savedCode || savedCode !== body.code) {
      throw new AppError('Noto\'g\'ri kod yoki muddati tugagan', 401);
    }

    await prisma.profile.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    await deleteKey(`email_verify:${userId}`);

    return reply.send({
      success: true,
      message: 'Email muvaffaqiyatli tasdiqlandi',
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
    // Firebase UID (Firebase Admin SDK orqali tasdiqlangan)
    let firebaseUidValue: string = '';
    // Google sub ID (Google API orqali tasdiqlangan) — alohida maydon
    let googleSubId: string = '';

    // 1. Token tekshirish - Firebase yoki Google direct
    if (body.firebaseToken) {
      // Firebase token orqali
      try {
        const firebaseUser = await verifyFirebaseToken(body.firebaseToken);
        email = firebaseUser.email;
        name = firebaseUser.name || firebaseUser.displayName || '';
        picture = firebaseUser.picture || '';
        phone = firebaseUser.phone_number || '';
        firebaseUidValue = firebaseUser.uid;
      } catch (error) {
        console.warn('Firebase token verification failed, trying Google direct...');
        // Firebase ishlamasa, googleAccessToken bormi tekshiramiz
        if (!body.googleAccessToken) {
          throw new AppError('Firebase token yaroqsiz va Google token yuborilmagan', 401);
        }
      }
    }

    if (!firebaseUidValue && body.googleAccessToken) {
      // Google Access Token orqali to'g'ridan-to'g'ri
      // google_id (Google sub) ni firebase_uid ga emas, alohida maydoniga saqlaymiz
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
        googleSubId = googleUser.sub; // Google sub → googleId maydoniga saqlanadi
      } catch (error) {
        console.error('Google token verification error:', error);
        throw new AppError('Google token yaroqsiz', 401);
      }
    }

    if (!firebaseUidValue && !googleSubId) {
      throw new AppError('Autentifikatsiya amalga oshmadi', 401);
    }

    // 2. Profilni topish - to'g'ri maydonlar bo'yicha qidirish
    // Firebase UID → firebaseUid maydoni, Google sub → googleId maydoni
    let isNew = false;
    let profile: Awaited<ReturnType<typeof prisma.profile.findFirst>>;

    if (firebaseUidValue) {
      profile = await prisma.profile.findUnique({ where: { firebaseUid: firebaseUidValue } });
    } else {
      profile = await prisma.profile.findUnique({ where: { googleId: googleSubId } });
    }
    // Email bo'yicha fallback
    if (!profile && email) {
      profile = await prisma.profile.findFirst({ where: { email } });
    }

    if (!profile) {
      // phone maydoni majburiy va unique, Google foydalanuvchilarda telefon yo'q bo'lishi mumkin
      // Shuning uchun vaqtincha unique placeholder yaratamiz
      const uidForPhone = firebaseUidValue || googleSubId;
      const tempPhone = phone || `google_${uidForPhone}`;

      // Generate unique referral code
      let referralCode3: string;
      let isUnique3 = false;
      do {
        referralCode3 = 'TOPLA-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        const existing = await prisma.profile.findUnique({ where: { referralCode: referralCode3 } });
        isUnique3 = !existing;
      } while (!isUnique3);

      // Yangi foydalanuvchi yaratish
      isNew = true;
      profile = await prisma.profile.create({
        data: {
          ...(firebaseUidValue ? { firebaseUid: firebaseUidValue } : {}),
          ...(googleSubId ? { googleId: googleSubId } : {}),
          email: email || null,
          fullName: name || null,
          avatarUrl: picture || null,
          phone: tempPhone,
          fcmToken: body.fcmToken || null,
          referralCode: referralCode3,
        },
      });
    } else {
      // Mavjud foydalanuvchini yangilash — faqat bo'sh maydonlarni to'ldirish
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          // Faqat bo'sh bo'lsa yangilaymiz — unique constraint konfliktidan saqlanish uchun
          ...(firebaseUidValue && !profile.firebaseUid ? { firebaseUid: firebaseUidValue } : {}),
          ...(googleSubId && !profile.googleId ? { googleId: googleSubId } : {}),
          ...(email && !profile.email ? { email } : {}),
          ...(name && !profile.fullName ? { fullName: name } : {}),
          ...(picture && !profile.avatarUrl ? { avatarUrl: picture } : {}),
          fcmToken: body.fcmToken || profile.fcmToken,
        },
      });
    }

    // 3. FCM token saqlash
    const googleDeviceInfo = await extractDeviceInfo(request);
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

    setAuthCookies(reply, accessToken, refreshToken);
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
        isNewUser: isNew,
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
        location: true,
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
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

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

  // ============================================
  // SECURE-001: Session Management
  // ============================================

  /**
   * GET /auth/sessions
   * Faol qurilmalar/sessiyalar ro'yxati
   */
  app.get('/auth/sessions', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    const devices = await prisma.userDevice.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        platform: true,
        browser: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    // Joriy qurilmani identified qilish (IP va user-agent bo'yicha)
    const currentIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || request.headers['x-real-ip'] as string
      || request.ip
      || '';
    const currentUa = request.headers['user-agent'] || '';

    const sessions = devices.map((d) => ({
      ...d,
      isCurrent: d.ipAddress === currentIp,
    }));

    return reply.send({
      success: true,
      data: { sessions },
    });
  });

  /**
   * POST /auth/sessions/revoke-all
   * Boshqa barcha qurilmalardan chiqish
   */
  app.post('/auth/sessions/revoke-all', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const currentIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || request.headers['x-real-ip'] as string
      || request.ip
      || '';

    // Boshqa barcha qurilmalarni deaktivatsiya qilish
    await prisma.userDevice.updateMany({
      where: {
        userId,
        isActive: true,
        NOT: { ipAddress: currentIp },
      },
      data: { isActive: false },
    });

    return reply.send({
      success: true,
      message: 'Boshqa barcha qurilmalardan chiqdingiz',
    });
  });

  /**
   * DELETE /auth/sessions/:deviceId
   * Bitta qurilmani o'chirish (remote logout)
   */
  app.delete('/auth/sessions/:deviceId', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { deviceId } = request.params as { deviceId: string };

    await prisma.userDevice.updateMany({
      where: { id: deviceId, userId },
      data: { isActive: false },
    });

    return reply.send({
      success: true,
      message: 'Qurilma o\'chirildi',
    });
  });

  // ============================================
  // SECURE-001: Password Strength Validator
  // ============================================

  /**
   * POST /auth/validate-password
   * Parol kuchliligini tekshirish
   */
  app.post('/auth/validate-password', async (request, reply) => {
    const { password } = z.object({ password: z.string() }).parse(request.body);

    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'very_strong';

    return reply.send({
      success: true,
      data: { checks, score, strength },
    });
  });

  /**
   * POST /auth/change-password
   * Parolni o'zgartirish
   */
  app.post('/auth/change-password', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const body = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak'),
    }).parse(request.body);

    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile || !profile.passwordHash) {
      throw new AppError('Foydalanuvchi topilmadi', 404);
    }

    const isMatch = await bcrypt.compare(body.currentPassword, profile.passwordHash);
    if (!isMatch) {
      throw new AppError('Joriy parol noto\'g\'ri', 400);
    }

    // Password strength check
    if (body.newPassword.length < 8) {
      throw new AppError('Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak', 400);
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 12);
    await prisma.profile.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Boshqa barcha sessiyalarni bekor qilish
    await prisma.userDevice.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    return reply.send({
      success: true,
      message: 'Parol muvaffaqiyatli o\'zgartirildi. Barcha qurilmalardan chiqildi.',
    });
  });

  // ============================================
  // PASSKEY (WebAuthn/FIDO2) — Barmoq izi / Yuz izi
  // ============================================

  // --- REGISTRATION: 1-qadam — Options olish ---
  app.post('/auth/passkey/register/begin', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const userId = (request as any).user.userId;
    const options = await generatePasskeyRegistrationOptions(userId);
    return reply.send({ success: true, data: options });
  });

  // --- REGISTRATION: 2-qadam — Javobni tekshirish ---
  app.post('/auth/passkey/register/verify', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const userId = (request as any).user.userId;
    const body = request.body as { response: any; deviceName?: string };

    if (!body.response) {
      throw new AppError('Response majburiy', 400);
    }

    await verifyPasskeyRegistration(userId, body.response, body.deviceName);

    return reply.send({
      success: true,
      message: 'Passkey muvaffaqiyatli ro\'yxatdan o\'tkazildi',
    });
  });

  // --- LOGIN: 1-qadam — Authentication options ---
  app.post('/auth/passkey/login/begin', async (request, reply) => {
    const body = request.body as { phone?: string } | undefined;
    const { options, sessionId } = await generatePasskeyAuthenticationOptions(body?.phone);

    return reply.send({
      success: true,
      data: { options, sessionId },
    });
  });

  // --- LOGIN: 2-qadam — Authentication verify + JWT ---
  app.post('/auth/passkey/login/verify', async (request, reply) => {
    const body = request.body as {
      sessionId: string;
      response?: any;
      credential?: any;
      platform?: string;
      fcmToken?: string;
    };

    const passkeyResponse = body.credential || body.response;
    if (!body.sessionId || !passkeyResponse) {
      throw new AppError('sessionId va credential/response majburiy', 400);
    }

    const { userId } = await verifyPasskeyAuthentication(body.sessionId, passkeyResponse);

    // Foydalanuvchi ma'lumotlarini olish
    const user = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        role: true,
        fullName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        email: true,
        status: true,
        language: true,
        gender: true,
        birthDate: true,
        region: true,
        referralCode: true,
      },
    });

    if (!user) throw new AppError('Foydalanuvchi topilmadi', 404);

    // JWT tokenlar yaratish
    const tokenPayload = { userId: user.id, role: user.role, phone: user.phone };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Cookie o'rnatish (web uchun)
    setAuthCookies(reply, accessToken, refreshToken);

    // Device saqlash
    if (body.fcmToken) {
      const deviceInfo = await extractDeviceInfo(request);
      await prisma.userDevice.upsert({
        where: {
          userId_fcmToken: { userId: user.id, fcmToken: body.fcmToken },
        },
        update: {
          lastActiveAt: new Date(),
          isActive: true,
          platform: (body.platform as any) || 'web',
          ...deviceInfo,
        },
        create: {
          userId: user.id,
          fcmToken: body.fcmToken,
          platform: (body.platform as any) || 'web',
          ...deviceInfo,
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        user,
        isNewUser: false,
        accessToken,
        refreshToken,
      },
    });
  });

  // --- Passkey ro'yxati (profil sozlamalari uchun) ---
  app.get('/auth/passkeys', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const userId = (request as any).user.userId;
    const passkeys = await listUserPasskeys(userId);
    return reply.send({ success: true, data: passkeys });
  });

  // --- Passkey o'chirish ---
  app.delete('/auth/passkeys/:id', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const userId = (request as any).user.userId;
    const { id } = request.params as { id: string };

    await deletePasskey(userId, id);

    return reply.send({
      success: true,
      message: 'Passkey o\'chirildi',
    });
  });
}

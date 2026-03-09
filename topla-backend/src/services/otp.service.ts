/**
 * OTP Service — Eskiz SMS
 *
 * Redis-backed store (in-memory fallback agar Redis yo'q bo'lsa)
 * - 4 xonali tasodifiy kod
 * - 2 daqiqa (120 soniya) TTL
 * - Maksimum 3 ta urinish
 * - Rate limiting: 1 daqiqada 1 ta
 */

import { env } from '../config/env.js';
import { randomInt } from 'crypto';
import { sendSmsViaEskiz } from '../config/eskiz.js';
import { setWithExpiry, getValue, deleteKey } from '../config/redis.js';

export type OtpChannel = 'sms';

interface OtpEntry {
  code: string;
  phone: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  verified?: boolean;
}

// In-memory fallback (agar Redis ishlamasa)
const otpStoreFallback = new Map<string, OtpEntry>();
const rateLimitFallback = new Map<string, number>();

// Tozalash interval — fallback uchun
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStoreFallback.entries()) {
    if (now > entry.expiresAt) otpStoreFallback.delete(key);
  }
  for (const [key, timestamp] of rateLimitFallback.entries()) {
    if (now - timestamp > 120_000) rateLimitFallback.delete(key);
  }
}, 5 * 60 * 1000);

// ============================================
// Redis OTP helpers
// ============================================

const OTP_PREFIX = 'otp:';
const RATE_PREFIX = 'otp_rate:';

async function saveOtpToRedis(phone: string, entry: OtpEntry): Promise<boolean> {
  try {
    const ttl = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (ttl <= 0) return false;
    await setWithExpiry(`${OTP_PREFIX}${phone}`, JSON.stringify(entry), ttl);
    return true;
  } catch {
    return false;
  }
}

async function getOtpFromRedis(phone: string): Promise<OtpEntry | null> {
  try {
    const data = await getValue(`${OTP_PREFIX}${phone}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function deleteOtpFromRedis(phone: string): Promise<void> {
  try {
    await deleteKey(`${OTP_PREFIX}${phone}`);
  } catch {
    // ignore
  }
}

async function setRateLimit(phone: string): Promise<boolean> {
  try {
    await setWithExpiry(`${RATE_PREFIX}${phone}`, Date.now().toString(), 60);
    return true;
  } catch {
    return false;
  }
}

async function getRateLimit(phone: string): Promise<number | null> {
  try {
    const val = await getValue(`${RATE_PREFIX}${phone}`);
    return val ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}

// ============================================
// Combined store operations (Redis + fallback)
// ============================================

async function storeOtp(phone: string, entry: OtpEntry): Promise<void> {
  const saved = await saveOtpToRedis(phone, entry);
  if (!saved) {
    otpStoreFallback.set(phone, entry);
  }
}

async function loadOtp(phone: string): Promise<OtpEntry | null> {
  const entry = await getOtpFromRedis(phone);
  if (entry) return entry;
  return otpStoreFallback.get(phone) ?? null;
}

async function removeOtp(phone: string): Promise<void> {
  await deleteOtpFromRedis(phone);
  otpStoreFallback.delete(phone);
}

async function storeRate(phone: string, now: number): Promise<void> {
  const saved = await setRateLimit(phone);
  if (!saved) {
    rateLimitFallback.set(phone, now);
  }
}

async function loadRate(phone: string): Promise<number | null> {
  const val = await getRateLimit(phone);
  if (val) return val;
  return rateLimitFallback.get(phone) ?? null;
}

/**
 * Tasodifiy OTP kod generatsiya qilish
 */
function generateOtpCode(length: number = 4): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

/**
 * OTP yuborish — Eskiz SMS orqali
 */
export async function sendOtp(
  phone: string,
  channel: OtpChannel = 'sms',
): Promise<{ success: boolean; error?: string; channel: OtpChannel }> {
  // 1. Rate limiting tekshirish — 60 sekundda 1 marta
  const lastSent = await loadRate(phone);
  if (lastSent) {
    const elapsed = Date.now() - lastSent;
    const waitSeconds = Math.ceil((60_000 - elapsed) / 1000);
    if (elapsed < 60_000) {
      return {
        success: false,
        error: `${waitSeconds} soniyadan keyin qayta yuboring`,
        channel,
      };
    }
  }

  // 2. OTP generatsiya
  const code = generateOtpCode(env.OTP_LENGTH);
  const now = Date.now();
  const ttlMs = env.OTP_TTL_SECONDS * 1000;

  // 3. Saqlash (Redis yoki fallback)
  const entry: OtpEntry = {
    code,
    phone,
    attempts: 0,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
  await storeOtp(phone, entry);

  // 4. Dev/Test rejimda SMS yubormasdan faqat logga yozish
  if (env.NODE_ENV !== 'production') {
    console.log(`\n📱 [DEV MODE] OTP for ${phone}: ${code}\n`);
    await storeRate(phone, now);
    return { success: true, channel: 'sms' };
  }

  // 5. Eskiz SMS orqali yuborish
  const result = await sendSmsViaEskiz(
    phone,
    `TOPLA tasdiqlash kodi: ${code}. Kod 2 daqiqa amal qiladi.`,
  );

  if (result.success) {
    await storeRate(phone, now);
  } else {
    await removeOtp(phone);
  }

  return { ...result, channel: 'sms' };
}

/**
 * OTP tekshirish
 */
export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  const entry = await loadOtp(phone);

  if (!entry) {
    return { valid: false, error: 'Kod topilmadi. Qayta yuboring' };
  }

  // Muddati tugaganmi?
  if (Date.now() > entry.expiresAt) {
    await removeOtp(phone);
    return { valid: false, error: 'Kod muddati tugagan. Qayta yuboring' };
  }

  // Urinishlar soni
  if (entry.attempts >= 3) {
    await removeOtp(phone);
    return { valid: false, error: 'Juda ko\'p urinish. Qayta yuboring' };
  }

  // Kodlar mos kelmaydimi?
  if (entry.code !== code) {
    entry.attempts++;
    await storeOtp(phone, entry);
    return {
      valid: false,
      error: `Noto'g'ri kod. ${3 - entry.attempts} ta urinish qoldi`,
    };
  }

  // ✅ Kod to'g'ri — belgilaymiz (duplicate so'rovlar uchun)
  if (!entry.verified) {
    entry.verified = true;
    // 10 sekunddan keyin o'chirish uchun qisqa TTL bilan saqlash
    entry.expiresAt = Date.now() + 10_000;
    await storeOtp(phone, entry);
  }
  return { valid: true };
}

/**
 * Dev/test uchun — OTP'ni olish (production'da o'chiriladi)
 */
export async function getOtpForTesting(phone: string): Promise<string | null> {
  if (env.NODE_ENV === 'production') return null;
  const entry = await loadOtp(phone);
  return entry?.code ?? null;
}

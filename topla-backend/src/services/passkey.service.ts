/**
 * Passkey (WebAuthn/FIDO2) Service
 * Barmoq izi / yuz izi orqali kirish
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { prisma } from '../config/database.js';
import { setWithExpiry, getValue, deleteKey } from '../config/redis.js';
import { env } from '../config/env.js';

// RP (Relying Party) konfiguratsiyasi
const rpName = 'Topla.uz';
const rpID = env.NODE_ENV === 'production' ? 'topla.uz' : 'localhost';
const origin = env.NODE_ENV === 'production'
  ? ['https://topla.uz', 'https://www.topla.uz', 'android:apk-key-hash:topla']
  : ['http://localhost:3000', 'http://localhost:3001', 'android:apk-key-hash:topla'];

// Challenge TTL — 5 daqiqa
const CHALLENGE_TTL = 300;

/**
 * Foydalanuvchining mavjud passkey credentiallarini olish
 */
async function getUserPasskeys(userId: string) {
  return prisma.passkey.findMany({
    where: { userId },
    select: {
      credentialId: true,
      publicKey: true,
      counter: true,
      transports: true,
      deviceType: true,
      backedUp: true,
      deviceName: true,
      lastUsedAt: true,
      createdAt: true,
      id: true,
    },
  });
}

// ============================================
// REGISTRATION (Ro'yxatdan o'tish)
// ============================================

/**
 * 1-qadam: Registration options yaratish
 * Foydalanuvchi allaqachon tizimga kirgan bo'lishi kerak (telefon yoki Google orqali)
 */
export async function generatePasskeyRegistrationOptions(userId: string) {
  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, fullName: true, firstName: true, lastName: true },
  });

  if (!user) throw new Error('Foydalanuvchi topilmadi');

  const existingPasskeys = await getUserPasskeys(userId);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.phone,
    userDisplayName: user.fullName || user.firstName || user.phone,
    // Mavjud credentiallarni exclude qilish (dublikat oldini olish)
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      // Platform authenticator (barmoq izi, yuz izi)
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'required',
    },
    attestationType: 'none',
  });

  // Challenge ni Redis da saqlash
  await setWithExpiry(
    `passkey:challenge:${userId}`,
    options.challenge,
    CHALLENGE_TTL,
  );

  return options;
}

/**
 * 2-qadam: Registration javobini tekshirish
 */
export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  deviceName?: string,
): Promise<VerifiedRegistrationResponse> {
  // Redis dan challenge olish
  const expectedChallenge = await getValue(`passkey:challenge:${userId}`);
  if (!expectedChallenge) {
    throw new Error('Challenge muddati tugagan. Qaytadan urinib ko\'ring.');
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Passkey tekshiruvi muvaffaqiyatsiz');
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  // DB ga saqlash
  await prisma.passkey.create({
    data: {
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: (credential.transports || []) as string[],
      deviceName: deviceName || null,
    },
  });

  // Challenge ni tozalash
  await deleteKey(`passkey:challenge:${userId}`);

  return verification;
}

// ============================================
// AUTHENTICATION (Kirish)
// ============================================

/**
 * 1-qadam: Authentication options yaratish
 * Telefon raqam berish shart emas — discoverable credentials bilan ishlaydi
 */
export async function generatePasskeyAuthenticationOptions(phone?: string) {
  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;

  if (phone) {
    // Aniq foydalanuvchi uchun
    const user = await prisma.profile.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (user) {
      const passkeys = await getUserPasskeys(user.id);
      if (passkeys.length > 0) {
        allowCredentials = passkeys.map((pk) => ({
          id: pk.credentialId,
          transports: pk.transports as AuthenticatorTransportFuture[],
        }));
      }
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'required',
  });

  // Challenge ni session ID bilan saqlash
  const sessionId = crypto.randomUUID();
  await setWithExpiry(
    `passkey:auth:${sessionId}`,
    options.challenge,
    CHALLENGE_TTL,
  );

  return { options, sessionId };
}

/**
 * 2-qadam: Authentication javobini tekshirish
 */
export async function verifyPasskeyAuthentication(
  sessionId: string,
  response: AuthenticationResponseJSON,
): Promise<{ userId: string; verification: VerifiedAuthenticationResponse }> {
  // Challenge ni olish
  const expectedChallenge = await getValue(`passkey:auth:${sessionId}`);
  if (!expectedChallenge) {
    throw new Error('Challenge muddati tugagan. Qaytadan urinib ko\'ring.');
  }

  // Credential ni DB dan topish
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id },
    include: { user: { select: { id: true, role: true, phone: true, status: true } } },
  });

  if (!passkey) {
    throw new Error('Passkey topilmadi. Avval ro\'yxatdan o\'ting.');
  }

  if (passkey.user.status !== 'active') {
    throw new Error('Akkaunt bloklangan');
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, 'base64url'),
      counter: Number(passkey.counter),
      transports: passkey.transports as AuthenticatorTransportFuture[],
    },
  });

  if (!verification.verified) {
    throw new Error('Passkey tekshiruvi muvaffaqiyatsiz');
  }

  // Counter ni yangilash (cloned key detection)
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  // Challenge ni tozalash
  await deleteKey(`passkey:auth:${sessionId}`);

  return { userId: passkey.userId, verification };
}

/**
 * Foydalanuvchining passkey larini ro'yxatlash
 */
export async function listUserPasskeys(userId: string) {
  return prisma.passkey.findMany({
    where: { userId },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      backedUp: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Passkey ni o'chirish
 */
export async function deletePasskey(userId: string, passkeyId: string) {
  const passkey = await prisma.passkey.findFirst({
    where: { id: passkeyId, userId },
  });

  if (!passkey) {
    throw new Error('Passkey topilmadi');
  }

  await prisma.passkey.delete({ where: { id: passkeyId } });
}

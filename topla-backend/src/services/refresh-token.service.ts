/**
 * Refresh Token Service (B2)
 *
 * Implements OWASP-recommended refresh token rotation with reuse detection:
 *
 *  - Every successful login creates a new **family** (UUID). All rotated
 *    refresh tokens issued from that login belong to the same family.
 *  - Each refresh token has a unique `jti`. The SHA-256 hash of the token
 *    is stored in `refresh_tokens.token_hash` — the plaintext token never
 *    touches the database.
 *  - On `/auth/refresh`:
 *      * Signature + expiry verified.
 *      * `profile.tokenVersion` checked against the token's `tokenVersion`
 *        claim (backed by Redis cache).
 *      * DB row looked up by `jti`.
 *          - Row missing            → 401 (forged or already-pruned token)
 *          - Row already revoked    → **REUSE DETECTED** — the entire family
 *                                      is revoked and the user's tokenVersion
 *                                      is incremented (logging out all devices).
 *          - Row valid & active     → rotate: mark old row as
 *                                      `{ isRevoked: true, revokedReason: 'rotated',
 *                                         replacedById: newJti }` and create a
 *                                      new row with a fresh jti (same familyId).
 *  - `/auth/logout`      revokes only the current session.
 *  - `/auth/logout-all`  increments tokenVersion (kills every access token
 *                        immediately) and revokes every active refresh row.
 */
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { cacheGet, cacheSet, cacheDelete, setWithExpiry } from '../config/redis.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  blacklistToken,
  JwtPayload,
} from '../utils/jwt.js';
import { env } from '../config/env.js';

const TOKEN_VERSION_CACHE_TTL = 60; // seconds
const REFRESH_EXPIRY_MS = parseExpiresMs(env.JWT_REFRESH_EXPIRES_IN);

function parseExpiresMs(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 3600 * 1000;
  const n = parseInt(match[1]!, 10);
  const unit = match[2];
  switch (unit) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 3600 * 1000;
    case 'd': return n * 86400 * 1000;
    default:  return 30 * 24 * 3600 * 1000;
  }
}

function versionCacheKey(userId: string): string {
  return `tokenver:${userId}`;
}

// ============================================
// Token version (session invalidator)
// ============================================

/**
 * Current tokenVersion for a profile. Redis-cached for 60s.
 * Cache miss → DB fetch → set cache.
 */
export async function getTokenVersion(userId: string): Promise<number> {
  const cached = await cacheGet<number>(versionCacheKey(userId));
  if (typeof cached === 'number') return cached;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  const version = profile?.tokenVersion ?? 0;
  await cacheSet(versionCacheKey(userId), version, TOKEN_VERSION_CACHE_TTL);
  return version;
}

async function invalidateTokenVersionCache(userId: string): Promise<void> {
  await cacheDelete(versionCacheKey(userId));
}

// ============================================
// Issue (login)
// ============================================

export interface IssueTokenParams {
  userId: string;
  role: string;
  phone?: string | null;
  pickupPointId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** When continuing a rotation chain, pass the existing familyId.
   *  Omit for fresh logins — a new family is created. */
  familyId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  jti: string;
  familyId: string;
  tokenVersion: number;
}

/**
 * Sign a new access+refresh pair and persist the refresh token row.
 * Used by all login flows (OTP, Google, email-password, admin, pickup).
 */
export async function issueTokenPair(params: IssueTokenParams): Promise<TokenPair> {
  const tokenVersion = await getTokenVersion(params.userId);
  const familyId = params.familyId ?? crypto.randomUUID();
  const jti = crypto.randomUUID();

  const payload: JwtPayload = {
    userId: params.userId,
    role: params.role,
    tokenVersion,
  };
  if (params.phone) payload.phone = params.phone;
  if (params.pickupPointId) payload.pickupPointId = params.pickupPointId;

  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken({ ...payload, jti, familyId });

  await prisma.refreshToken.create({
    data: {
      userId: params.userId,
      jti,
      tokenHash: hashRefreshToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent?.slice(0, 500) ?? null,
    },
  });

  return { accessToken, refreshToken, jti, familyId, tokenVersion };
}

// ============================================
// Rotate (refresh)
// ============================================

export class RefreshTokenError extends Error {
  constructor(public readonly reason: RefreshTokenErrorReason, message: string) {
    super(message);
    this.name = 'RefreshTokenError';
  }
}

export type RefreshTokenErrorReason =
  | 'invalid_signature'
  | 'expired'
  | 'missing_jti'
  | 'not_found'
  | 'reuse_detected'
  | 'session_invalidated'
  | 'user_blocked'
  | 'user_not_found';

export interface RotateParams {
  rawRefreshToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Optional role filter — if set, the decoded token must match.
   *  Used by the admin refresh endpoint to reject non-admin tokens. */
  requireRole?: string;
}

/**
 * Rotate a refresh token. Returns a fresh TokenPair.
 * Throws RefreshTokenError on any failure (caller should translate to 401).
 */
export async function rotateRefreshToken(params: RotateParams): Promise<TokenPair> {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(params.rawRefreshToken);
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      throw new RefreshTokenError('expired', 'Refresh token muddati tugagan');
    }
    throw new RefreshTokenError('invalid_signature', 'Refresh token yaroqsiz');
  }

  if (params.requireRole && payload.role !== params.requireRole) {
    throw new RefreshTokenError('invalid_signature', 'Role mos emas');
  }

  // Old tokens issued before the rotation system was deployed lack a jti.
  // We hard-cutover: force those users to re-login.
  if (!payload.jti || !payload.familyId) {
    throw new RefreshTokenError('missing_jti', 'Eski format token — qayta kiring');
  }

  const row = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });

  if (!row) {
    throw new RefreshTokenError('not_found', 'Refresh token topilmadi');
  }

  // --- REUSE DETECTION ---
  if (row.isRevoked) {
    await revokeFamily(row.familyId, 'reuse_detected');
    await bumpTokenVersion(row.userId);
    throw new RefreshTokenError(
      'reuse_detected',
      'Refresh token qayta ishlatildi — barcha sessiyalar bekor qilindi',
    );
  }

  // Hash sanity-check — defence-in-depth against jti collision / tampering.
  if (row.tokenHash !== hashRefreshToken(params.rawRefreshToken)) {
    // jti matches but payload bytes differ: treat as reuse.
    await revokeFamily(row.familyId, 'reuse_detected');
    await bumpTokenVersion(row.userId);
    throw new RefreshTokenError('reuse_detected', 'Token integritet xatosi');
  }

  // User still valid?
  const profile = await prisma.profile.findUnique({
    where: { id: row.userId },
    select: { id: true, role: true, phone: true, status: true, tokenVersion: true },
  });
  if (!profile) {
    throw new RefreshTokenError('user_not_found', 'Foydalanuvchi topilmadi');
  }
  if (profile.status === 'blocked') {
    throw new RefreshTokenError('user_blocked', 'Foydalanuvchi bloklangan');
  }
  if ((payload.tokenVersion ?? 0) !== profile.tokenVersion) {
    throw new RefreshTokenError(
      'session_invalidated',
      'Sessiya bekor qilingan — qayta kiring',
    );
  }

  // --- ATOMIC ROTATION ---
  //
  // Two concurrent requests could race here. We rely on the unique index
  // on jti and the row's isRevoked flag: the second call will either
  //   a) find row.isRevoked=true and fire the reuse-detection branch above, or
  //   b) find replacedById already set and the update below will update 0 rows
  //      (our optimistic guard throws reuse_detected).
  const newJti = crypto.randomUUID();
  const newFamilyId = row.familyId; // keep chain
  const newPayload: JwtPayload = {
    userId: profile.id,
    role: profile.role,
    tokenVersion: profile.tokenVersion,
  };
  if (profile.phone) newPayload.phone = profile.phone;

  const newAccessToken = generateToken(newPayload);
  const newRefreshToken = generateRefreshToken({
    ...newPayload,
    jti: newJti,
    familyId: newFamilyId,
  });

  const result = await prisma.$transaction(async (tx) => {
    const update = await tx.refreshToken.updateMany({
      where: { jti: row.jti, isRevoked: false },
      data: {
        isRevoked: true,
        revokedReason: 'rotated',
      },
    });
    if (update.count === 0) {
      // Someone else already rotated this jti — treat as reuse.
      return { raced: true as const };
    }
    const created = await tx.refreshToken.create({
      data: {
        userId: profile.id,
        jti: newJti,
        tokenHash: hashRefreshToken(newRefreshToken),
        familyId: newFamilyId,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent?.slice(0, 500) ?? null,
      },
    });
    await tx.refreshToken.update({
      where: { id: row.id },
      data: { replacedById: created.id },
    });
    return { raced: false as const };
  });

  if (result.raced) {
    await revokeFamily(row.familyId, 'reuse_detected');
    await bumpTokenVersion(row.userId);
    throw new RefreshTokenError('reuse_detected', 'Parallel rotation aniqlangan');
  }

  // Extra defense: blacklist the raw old token for its remaining TTL so
  // any straggler also gets rejected before DB lookup.
  await blacklistToken(params.rawRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    jti: newJti,
    familyId: newFamilyId,
    tokenVersion: profile.tokenVersion,
  };
}

// ============================================
// Revoke
// ============================================

/** Revoke every active refresh token in a family. */
export async function revokeFamily(familyId: string, reason: string): Promise<number> {
  const { count } = await prisma.refreshToken.updateMany({
    where: { familyId, isRevoked: false },
    data: { isRevoked: true, revokedReason: reason },
  });
  return count;
}

/** Revoke a single refresh token by jti (used by `/auth/logout`). */
export async function revokeByJti(jti: string, reason: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { jti, isRevoked: false },
    data: { isRevoked: true, revokedReason: reason },
  });
}

/** Increment tokenVersion for a user and bust the cache. */
export async function bumpTokenVersion(userId: string): Promise<number> {
  const updated = await prisma.profile.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
  await invalidateTokenVersionCache(userId);
  // RBAC v2 — authz kontekst cache'ini ham tozalaymiz
  try {
    const { invalidateAuthzContext } = await import('../lib/authz/policy.js');
    await invalidateAuthzContext(userId);
  } catch {
    // authz moduli mavjud bo'lmasa jimgina o'tamiz
  }
  return updated.tokenVersion;
}

/**
 * Logout from every device:
 *  1. Increment tokenVersion  → every outstanding access token dies on next use.
 *  2. Revoke every active refresh row  → no rotation possible.
 */
export async function revokeAllUserSessions(
  userId: string,
  reason = 'logout_all',
): Promise<{ refreshTokensRevoked: number; newVersion: number }> {
  const [revoked, newVersion] = await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedReason: reason },
    }),
    prisma.profile.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    }),
  ]);
  await invalidateTokenVersionCache(userId);
  return {
    refreshTokensRevoked: revoked.count,
    newVersion: newVersion.tokenVersion,
  };
}

/**
 * Attempt to locate + revoke the refresh token sent with the current
 * logout request. Failures (missing/invalid token) are silently ignored —
 * /auth/logout should always succeed from the client's perspective.
 */
export async function revokeCurrentRefreshToken(
  rawRefreshToken: string | null | undefined,
  reason = 'logout',
): Promise<void> {
  if (!rawRefreshToken) return;
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    if (payload.jti) {
      await revokeByJti(payload.jti, reason);
    }
    await blacklistToken(rawRefreshToken);
  } catch {
    // Token undecodable — just blacklist the raw string, cheap insurance.
    await blacklistToken(rawRefreshToken);
  }
}

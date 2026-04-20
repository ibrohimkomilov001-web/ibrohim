/**
 * B2 — Refresh token rotation + reuse detection
 * Unit tests for refresh-token.service.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// ============ Mocks ============
type RefreshRow = {
  id: string;
  userId: string;
  jti: string;
  tokenHash: string;
  familyId: string;
  replacedById: string | null;
  isRevoked: boolean;
  revokedReason: string | null;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

type ProfileRow = {
  id: string;
  role: string;
  phone: string | null;
  status: string;
  tokenVersion: number;
};

const db: {
  refreshTokens: RefreshRow[];
  profiles: ProfileRow[];
} = { refreshTokens: [], profiles: [] };

const cache = new Map<string, any>();

vi.mock('../config/database', () => {
  const refreshToken = {
    create: vi.fn(async ({ data }: any) => {
      const row: RefreshRow = {
        id: crypto.randomUUID(),
        userId: data.userId,
        jti: data.jti,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        replacedById: data.replacedById ?? null,
        isRevoked: data.isRevoked ?? false,
        revokedReason: data.revokedReason ?? null,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        createdAt: new Date(),
      };
      db.refreshTokens.push(row);
      return row;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      return db.refreshTokens.find((r) => r.jti === where.jti || r.id === where.id) ?? null;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const row = db.refreshTokens.find((r) => r.id === where.id);
      if (!row) throw new Error('not found');
      Object.assign(row, data);
      return row;
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      for (const r of db.refreshTokens) {
        const matches =
          (where.jti === undefined || r.jti === where.jti) &&
          (where.familyId === undefined || r.familyId === where.familyId) &&
          (where.userId === undefined || r.userId === where.userId) &&
          (where.isRevoked === undefined || r.isRevoked === where.isRevoked);
        if (matches) {
          Object.assign(r, data);
          count++;
        }
      }
      return { count };
    }),
  };
  const profile = {
    findUnique: vi.fn(async ({ where, select }: any) => {
      const p = db.profiles.find((x) => x.id === where.id);
      if (!p) return null;
      if (!select) return p;
      const out: any = {};
      for (const k of Object.keys(select)) if (select[k]) out[k] = (p as any)[k];
      return out;
    }),
    update: vi.fn(async ({ where, data, select }: any) => {
      const p = db.profiles.find((x) => x.id === where.id);
      if (!p) throw new Error('not found');
      if (data.tokenVersion?.increment) {
        p.tokenVersion += data.tokenVersion.increment;
      } else if (typeof data.tokenVersion === 'number') {
        p.tokenVersion = data.tokenVersion;
      }
      if (!select) return p;
      const out: any = {};
      for (const k of Object.keys(select)) if (select[k]) out[k] = (p as any)[k];
      return out;
    }),
  };
  // Simple transaction: accept an array of thunks OR a callback
  const $transaction = vi.fn(async (arg: any) => {
    if (typeof arg === 'function') return arg({ refreshToken, profile });
    return Promise.all(arg);
  });
  return {
    prisma: { refreshToken, profile, $transaction },
    connectDatabase: vi.fn(),
    disconnectDatabase: vi.fn(),
  };
});

vi.mock('../config/redis', () => ({
  setWithExpiry: vi.fn(async (k: string, v: string) => { cache.set(k, v); }),
  getValue: vi.fn(async (k: string) => cache.get(k) ?? null),
  deleteKey: vi.fn(async (k: string) => { cache.delete(k); }),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
  cacheGet: vi.fn(async (k: string) => (cache.has(k) ? cache.get(k) : null)),
  cacheSet: vi.fn(async (k: string, v: any) => { cache.set(k, v); }),
  cacheDelete: vi.fn(async (k: string) => { cache.delete(k); }),
  initRedis: vi.fn(),
  getRedis: vi.fn().mockReturnValue(null),
}));

// JWT secrets are set by src/__tests__/setup.ts

// ============ System under test ============
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeAllUserSessions,
  RefreshTokenError,
  getTokenVersion,
} from '../services/refresh-token.service';

function seedProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  const p: ProfileRow = {
    id: crypto.randomUUID(),
    role: 'user',
    phone: '+998901112233',
    status: 'active',
    tokenVersion: 0,
    ...overrides,
  };
  db.profiles.push(p);
  return p;
}

beforeEach(() => {
  db.refreshTokens.length = 0;
  db.profiles.length = 0;
  cache.clear();
});

describe('B2 — refresh token rotation', () => {
  it('issueTokenPair creates a new family + persists DB row', async () => {
    const p = seedProfile();
    const pair = await issueTokenPair({ userId: p.id, role: p.role, phone: p.phone });
    expect(pair.accessToken).toBeTruthy();
    expect(pair.refreshToken).toBeTruthy();
    expect(pair.familyId).toBeTruthy();
    expect(pair.jti).toBeTruthy();
    expect(db.refreshTokens).toHaveLength(1);
    expect(db.refreshTokens[0]!.jti).toBe(pair.jti);
    expect(db.refreshTokens[0]!.isRevoked).toBe(false);
  });

  it('rotateRefreshToken happy path — old revoked (rotated), new created, same family', async () => {
    const p = seedProfile();
    const first = await issueTokenPair({ userId: p.id, role: p.role, phone: p.phone });

    const second = await rotateRefreshToken({ rawRefreshToken: first.refreshToken });

    expect(second.familyId).toBe(first.familyId);
    expect(second.jti).not.toBe(first.jti);

    const oldRow = db.refreshTokens.find((r) => r.jti === first.jti)!;
    const newRow = db.refreshTokens.find((r) => r.jti === second.jti)!;
    expect(oldRow.isRevoked).toBe(true);
    expect(oldRow.revokedReason).toBe('rotated');
    expect(oldRow.replacedById).toBe(newRow.id);
    expect(newRow.isRevoked).toBe(false);
  });

  it('REUSE DETECTION — reusing a rotated token revokes the whole family + bumps tokenVersion', async () => {
    const p = seedProfile();
    const first = await issueTokenPair({ userId: p.id, role: p.role, phone: p.phone });
    const second = await rotateRefreshToken({ rawRefreshToken: first.refreshToken });
    // Even the newly issued `second` is a valid member of the family.
    expect(db.refreshTokens.find((r) => r.jti === second.jti)!.isRevoked).toBe(false);

    // Now attacker replays the old (rotated) token
    await expect(
      rotateRefreshToken({ rawRefreshToken: first.refreshToken }),
    ).rejects.toMatchObject({ reason: 'reuse_detected' });

    // Entire family must be revoked now
    const familyRows = db.refreshTokens.filter((r) => r.familyId === first.familyId);
    expect(familyRows.every((r) => r.isRevoked)).toBe(true);
    // tokenVersion bumped
    expect(db.profiles[0]!.tokenVersion).toBe(1);
  });

  it('rotateRefreshToken rejects tokens issued before rotation system (no jti)', async () => {
    // Manually craft an old-format refresh token (no jti/familyId claims)
    const jwt = (await import('jsonwebtoken')).default;
    const oldToken = jwt.sign(
      { userId: crypto.randomUUID(), role: 'user' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '30d' },
    );
    await expect(
      rotateRefreshToken({ rawRefreshToken: oldToken }),
    ).rejects.toMatchObject({ reason: 'missing_jti' });
  });

  it('rotateRefreshToken fails if tokenVersion mismatches profile', async () => {
    const p = seedProfile();
    const first = await issueTokenPair({ userId: p.id, role: p.role, phone: p.phone });
    // Simulate admin bumping tokenVersion (e.g. via logout-all)
    p.tokenVersion = 5;
    cache.clear(); // invalidate version cache
    await expect(
      rotateRefreshToken({ rawRefreshToken: first.refreshToken }),
    ).rejects.toMatchObject({ reason: 'session_invalidated' });
  });

  it('rotateRefreshToken with requireRole filters mismatched role', async () => {
    const p = seedProfile({ role: 'user' });
    const first = await issueTokenPair({ userId: p.id, role: p.role, phone: p.phone });
    await expect(
      rotateRefreshToken({ rawRefreshToken: first.refreshToken, requireRole: 'admin' }),
    ).rejects.toBeInstanceOf(RefreshTokenError);
  });

  it('revokeAllUserSessions increments tokenVersion and revokes every active row', async () => {
    const p = seedProfile();
    await issueTokenPair({ userId: p.id, role: p.role, phone: p.phone });
    await issueTokenPair({ userId: p.id, role: p.role, phone: p.phone });
    expect(db.refreshTokens.filter((r) => !r.isRevoked)).toHaveLength(2);

    const result = await revokeAllUserSessions(p.id);
    expect(result.refreshTokensRevoked).toBe(2);
    expect(result.newVersion).toBe(1);
    expect(db.refreshTokens.every((r) => r.isRevoked)).toBe(true);
    expect(db.profiles[0]!.tokenVersion).toBe(1);
  });

  it('getTokenVersion reads through Redis cache', async () => {
    const p = seedProfile({ tokenVersion: 7 });
    const v1 = await getTokenVersion(p.id);
    expect(v1).toBe(7);
    // Mutate DB directly — cache should still return old value
    p.tokenVersion = 99;
    const v2 = await getTokenVersion(p.id);
    expect(v2).toBe(7); // cache hit
  });
});

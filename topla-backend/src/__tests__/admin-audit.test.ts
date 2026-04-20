/**
 * B3 — Admin Audit Log
 * Unit tests for the sanitizer (body/params redaction + depth/size limits).
 */
import { describe, it, expect } from 'vitest';
import { sanitizeForAudit } from '../lib/admin-audit';

describe('B3 — sanitizeForAudit', () => {
  it('redacts top-level sensitive keys', () => {
    const input = {
      email: 'admin@topla.uz',
      password: 'super-secret',
      token: 'jwt.abc.xyz',
      otp: '123456',
    };
    const out = sanitizeForAudit(input) as Record<string, unknown>;
    expect(out.email).toBe('admin@topla.uz');
    expect(out.password).toBe('[REDACTED]');
    expect(out.token).toBe('[REDACTED]');
    expect(out.otp).toBe('[REDACTED]');
  });

  it('redacts nested sensitive keys', () => {
    const input = {
      user: {
        id: 'u1',
        credentials: { password: 'x', refreshToken: 'rt', safe: 'yes' },
      },
    };
    const out = sanitizeForAudit(input) as any;
    expect(out.user.id).toBe('u1');
    expect(out.user.credentials.password).toBe('[REDACTED]');
    expect(out.user.credentials.refreshToken).toBe('[REDACTED]');
    expect(out.user.credentials.safe).toBe('yes');
  });

  it('redacts inside arrays', () => {
    const input = {
      items: [
        { name: 'a', password: 'p1' },
        { name: 'b', totpSecret: 's' },
      ],
    };
    const out = sanitizeForAudit(input) as any;
    expect(out.items[0].password).toBe('[REDACTED]');
    expect(out.items[1].totpSecret).toBe('[REDACTED]');
    expect(out.items[0].name).toBe('a');
  });

  it('truncates very long string values', () => {
    const long = 'x'.repeat(2000);
    const out = sanitizeForAudit({ note: long }) as any;
    expect(out.note.length).toBeLessThanOrEqual(501); // 500 + ellipsis
    expect(out.note.endsWith('…')).toBe(true);
  });

  it('handles null / undefined / primitives', () => {
    expect(sanitizeForAudit(null)).toBeNull();
    expect(sanitizeForAudit(undefined)).toBeUndefined();
    expect(sanitizeForAudit(42)).toBe(42);
    expect(sanitizeForAudit(true)).toBe(true);
  });

  it('breaks at depth 8', () => {
    let obj: any = { value: 'bottom' };
    for (let i = 0; i < 12; i++) obj = { child: obj };
    const out = sanitizeForAudit(obj);
    // Should not throw and should cap with the sentinel somewhere.
    const s = JSON.stringify(out);
    expect(s).toContain('TOO_DEEP');
  });

  it('caps array length at 50', () => {
    const huge = Array.from({ length: 200 }, (_, i) => i);
    const out = sanitizeForAudit(huge) as number[];
    expect(out).toHaveLength(50);
  });

  it('caps/redacts password inside deeply nested admin request body', () => {
    const body = {
      settings: {
        adminUser: {
          email: 'a@b.uz',
          auth: { newPassword: 'xyz', confirmPassword: 'xyz' },
        },
      },
    };
    const out = sanitizeForAudit(body) as any;
    expect(out.settings.adminUser.auth.newPassword).toBe('[REDACTED]');
    expect(out.settings.adminUser.auth.confirmPassword).toBe('[REDACTED]');
    expect(out.settings.adminUser.email).toBe('a@b.uz');
  });
});

/**
 * Admin Audit Log (B3)
 *
 * Fire-and-forget onResponse hook that persists every mutating (POST/PUT/PATCH/DELETE)
 * request made by an admin-role user. Sensitive fields (password, token, secret,
 * pinCode, otp, 2fa code, etc.) are redacted before storage.
 *
 * Read-only GET requests are NOT logged — they are too frequent and rarely
 * of security interest. Authenticated logins/logouts ARE logged (they flow
 * through POST endpoints).
 *
 * The hook never throws — DB failures are swallowed + logged so that
 * an audit-log outage cannot take down the admin panel.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ADMIN_PATH_PREFIXES = ['/api/v1/admin', '/api/v1/auth/admin'];

/** Field names considered sensitive — never stored in body_summary. */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'currentPassword',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'access_token',
  'refresh_token',
  'idToken',
  'firebaseToken',
  'code',
  'otp',
  'otpCode',
  'pin',
  'pinCode',
  'secret',
  'totpSecret',
  'backupCode',
  'backupCodes',
  'captchaToken',
  'apiKey',
  'cardNumber',
  'cvv',
  'cvv2',
  'cvc',
]);

const REDACTED = '[REDACTED]';
const MAX_BODY_BYTES = 8 * 1024;   // 8 KB — truncate oversize bodies
const MAX_STRING_LEN = 500;         // truncate long strings inside values

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function truncateStr(s: string): string {
  return s.length > MAX_STRING_LEN ? s.slice(0, MAX_STRING_LEN) + '…' : s;
}

/**
 * Deep-clone with sensitive-field redaction + string truncation.
 * Breaks cycles by depth limit rather than seen-set (simpler, good enough
 * for request bodies which should not have cycles).
 */
export function sanitizeForAudit(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[TOO_DEEP]';
  if (value == null) return value;
  if (typeof value === 'string') return truncateStr(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => sanitizeForAudit(v, depth + 1));
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(k)) {
        out[k] = REDACTED;
      } else {
        out[k] = sanitizeForAudit(v, depth + 1);
      }
    }
    return out;
  }
  // Buffers, classes, functions → coerce to string or drop
  try {
    return truncateStr(String(value));
  } catch {
    return '[UNSERIALIZABLE]';
  }
}

function stripQuery(url: string): { path: string; query: unknown | null } {
  const qIdx = url.indexOf('?');
  if (qIdx === -1) return { path: url, query: null };
  const path = url.slice(0, qIdx);
  const qs = url.slice(qIdx + 1);
  const q: Record<string, string> = {};
  for (const pair of qs.split('&')) {
    if (!pair) continue;
    const [k, v = ''] = pair.split('=');
    try {
      q[decodeURIComponent(k!)] = truncateStr(decodeURIComponent(v));
    } catch {
      q[k!] = truncateStr(v);
    }
  }
  return { path, query: Object.keys(q).length ? q : null };
}

function shouldAudit(request: FastifyRequest): boolean {
  if (!MUTATING_METHODS.has(request.method)) return false;
  const url = request.url || '';
  if (!ADMIN_PATH_PREFIXES.some((p) => url.startsWith(p))) return false;
  // Login attempts lack request.user yet but still hit /auth/admin/*.
  // We still audit those — they are the most security-relevant events.
  return true;
}

interface AuditPayload {
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  method: string;
  path: string;
  query: unknown | null;
  bodySummary: unknown | null;
  paramsSummary: unknown | null;
  statusCode: number;
  durationMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
}

async function persistAudit(payload: AuditPayload, log: FastifyInstance['log']): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: payload.actorId,
        actorEmail: payload.actorEmail,
        actorRole: payload.actorRole,
        method: payload.method,
        path: payload.path,
        query: payload.query as any,
        bodySummary: payload.bodySummary as any,
        paramsSummary: payload.paramsSummary as any,
        statusCode: payload.statusCode,
        durationMs: payload.durationMs,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        requestId: payload.requestId,
      },
    });
  } catch (err) {
    // Never break the request path because of an audit write failure.
    log.warn({ err, path: payload.path }, 'admin audit log write failed');
  }
}

export function registerAdminAuditLog(app: FastifyInstance): void {
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!shouldAudit(request)) return;

    const { path, query } = stripQuery(request.url || '');
    const user = (request as any).user as
      | { userId?: string; role?: string; email?: string }
      | undefined;

    // Body is usually a plain object by the time onResponse runs (Fastify
    // parses JSON bodies automatically). We only keep a summary and never
    // the raw Buffer.
    let rawBody = (request as any).body;
    let bodySummary: unknown | null = null;
    if (rawBody != null) {
      // Rough size guard — avoid pathological bodies.
      try {
        const asJson = JSON.stringify(rawBody);
        if (asJson.length <= MAX_BODY_BYTES) {
          bodySummary = sanitizeForAudit(rawBody);
        } else {
          bodySummary = { _truncated: true, size: asJson.length };
        }
      } catch {
        bodySummary = { _unserializable: true };
      }
    }

    const params = (request as any).params;
    const paramsSummary =
      params && typeof params === 'object' && Object.keys(params).length
        ? sanitizeForAudit(params)
        : null;

    const ipAddress =
      ((request.headers['x-forwarded-for'] as string | undefined) || '')
        .split(',')[0]
        ?.trim() ||
      request.ip ||
      null;

    const payload: AuditPayload = {
      actorId: user?.userId ?? null,
      actorEmail: user?.email ?? null,
      actorRole: user?.role ?? null,
      method: request.method,
      path,
      query,
      bodySummary,
      paramsSummary,
      statusCode: reply.statusCode,
      durationMs: Math.round(reply.elapsedTime ?? 0),
      ipAddress,
      userAgent: (request.headers['user-agent'] as string | undefined)?.slice(0, 500) ?? null,
      requestId: (request.id as string) ?? null,
    };

    // Fire-and-forget — never await in the hot path; we don't want slow
    // DB writes to delay the response to the client.
    void persistAudit(payload, app.log);
  });
}

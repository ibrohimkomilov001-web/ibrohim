/**
 * Admin security helpers: brute-force lockout, IP allowlist.
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getRedis } from '../config/redis.js';

const LOCK_EMAIL_MAX_FAILS = 5;
const LOCK_EMAIL_WINDOW = 60 * 15; // 15 min
const LOCK_IP_MAX_FAILS = 20;
const LOCK_IP_WINDOW = 60 * 60; // 1 hour

function lockEmailKey(email: string) { return `admin:lockout:email:${email.toLowerCase()}`; }
function lockIpKey(ip: string) { return `admin:lockout:ip:${ip}`; }

export interface LockStatus {
  locked: boolean;
  retryAfterSec?: number;
  fails: number;
}

/** Checks lockout status without incrementing. */
export async function getLockStatus(email: string, ip: string): Promise<LockStatus> {
  const redis = getRedis();
  if (!redis) return { locked: false, fails: 0 };
  const [emailFails, emailTtl, ipFails, ipTtl] = await Promise.all([
    redis.get(lockEmailKey(email)),
    redis.ttl(lockEmailKey(email)),
    redis.get(lockIpKey(ip)),
    redis.ttl(lockIpKey(ip)),
  ]);

  const ef = parseInt(emailFails || '0', 10);
  const ipf = parseInt(ipFails || '0', 10);

  if (ef >= LOCK_EMAIL_MAX_FAILS) {
    return { locked: true, retryAfterSec: emailTtl > 0 ? emailTtl : LOCK_EMAIL_WINDOW, fails: ef };
  }
  if (ipf >= LOCK_IP_MAX_FAILS) {
    return { locked: true, retryAfterSec: ipTtl > 0 ? ipTtl : LOCK_IP_WINDOW, fails: ipf };
  }
  return { locked: false, fails: Math.max(ef, ipf) };
}

/** Increment fail counters. Call on each failed login. */
export async function recordLoginFailure(email: string, ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const ek = lockEmailKey(email);
  const ik = lockIpKey(ip);
  const tx = redis.multi();
  tx.incr(ek);
  tx.expire(ek, LOCK_EMAIL_WINDOW);
  tx.incr(ik);
  tx.expire(ik, LOCK_IP_WINDOW);
  await tx.exec();
}

/** Reset counters on successful login. */
export async function clearLoginFailures(email: string, ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await Promise.all([
    redis.del(lockEmailKey(email)),
    redis.del(lockIpKey(ip)),
  ]);
}

/**
 * Check if an IP is in the allowlist defined by ADMIN_IP_ALLOWLIST env.
 * Empty/missing env = no restriction.
 * Supports comma-separated IPv4/IPv6 addresses (CIDR not yet supported — exact match only).
 */
export function isIpAllowed(ip: string): boolean {
  const list = (process.env.ADMIN_IP_ALLOWLIST || '').trim();
  if (!list) return true;
  const allowed = list.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(ip);
}

/** Fastify preHandler to enforce IP allowlist on admin endpoints. */
export async function adminIpAllowlistGuard(request: FastifyRequest, reply: FastifyReply) {
  if (!isIpAllowed(request.ip)) {
    return reply.code(403).send({
      success: false,
      error: 'IP_NOT_ALLOWED',
      message: 'Sizning IP manzilingizdan kirish ruxsat etilmagan',
    });
  }
}

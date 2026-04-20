/**
 * Cloudflare Turnstile verification (invisible/managed, token-based).
 * https://developers.cloudflare.com/turnstile/
 */
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface CaptchaResult {
  success: boolean;
  errors?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verify a Cloudflare Turnstile token.
 * If TURNSTILE_SECRET_KEY env is missing, verification is SKIPPED (returns success=true).
 */
export async function verifyCaptcha(
  token: string | undefined,
  ip?: string,
  expectedAction?: string,
): Promise<CaptchaResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: true };
  }

  if (!token) return { success: false, errors: ['missing-token'] };

  const form = new URLSearchParams();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (!res.ok) return { success: false, errors: ['http-' + res.status] };
    const data = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
      action?: string;
      cdata?: string;
    };

    if (!data.success) {
      return { success: false, errors: data['error-codes'] };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      return { success: false, errors: ['action-mismatch'] };
    }

    return { success: true, action: data.action, cdata: data.cdata };
  } catch {
    return { success: false, errors: ['fetch-error'] };
  }
}

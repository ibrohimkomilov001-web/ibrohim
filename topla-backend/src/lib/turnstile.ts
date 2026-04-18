/**
 * Cloudflare Turnstile CAPTCHA verification
 * Free, GDPR-friendly alternative to reCAPTCHA.
 * https://developers.cloudflare.com/turnstile/
 */
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  success: boolean;
  errors?: string[];
}

/**
 * Verify a Turnstile token. Returns success=true on valid, false otherwise.
 * If TURNSTILE_SECRET_KEY env is missing, verification is SKIPPED (returns success=true).
 * This allows local development without breaking the flow.
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Not configured — skip verification (dev environments)
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
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return { success: !!data.success, errors: data['error-codes'] };
  } catch (err: any) {
    return { success: false, errors: ['fetch-error'] };
  }
}

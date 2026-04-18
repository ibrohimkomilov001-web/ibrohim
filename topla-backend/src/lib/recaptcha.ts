/**
 * Google reCAPTCHA v3 verification (invisible, score-based).
 * https://developers.google.com/recaptcha/docs/v3
 */
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_MIN_SCORE = 0.5;

export interface RecaptchaResult {
  success: boolean;
  score?: number;
  action?: string;
  errors?: string[];
}

/**
 * Verify a reCAPTCHA v3 token.
 * If RECAPTCHA_SECRET_KEY env is missing, verification is SKIPPED (returns success=true).
 * Fails if score < RECAPTCHA_MIN_SCORE (default 0.5) or action mismatch.
 */
export async function verifyRecaptcha(
  token: string | undefined,
  ip?: string,
  expectedAction?: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
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
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (!res.ok) return { success: false, errors: ['http-' + res.status] };
    const data = (await res.json()) as {
      success: boolean;
      score?: number;
      action?: string;
      'error-codes'?: string[];
    };

    if (!data.success) {
      return { success: false, errors: data['error-codes'] };
    }

    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || DEFAULT_MIN_SCORE);
    if (typeof data.score === 'number' && data.score < minScore) {
      return { success: false, score: data.score, errors: ['low-score'] };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      return { success: false, score: data.score, errors: ['action-mismatch'] };
    }

    return { success: true, score: data.score, action: data.action };
  } catch (err: any) {
    return { success: false, errors: ['fetch-error'] };
  }
}

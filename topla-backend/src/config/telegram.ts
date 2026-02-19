/**
 * Telegram Gateway API — Rasmiy Telegram verification xizmati
 *
 * https://core.telegram.org/gateway
 *
 * Bot ochish KERAK EMAS! Foydalanuvchi hech narsa qilishi shart emas.
 * Telegram to'g'ridan-to'g'ri foydalanuvchiga verification xabar yuboradi.
 *
 * Token: https://gateway.telegram.org dan olinadi
 */

import { env } from './env.js';

const GATEWAY_API = 'https://gatewayapi.telegram.org';

/**
 * Telegram Gateway orqali OTP yuborish
 *
 * Foydalanuvchi Telegramda "Telegram" dan xabar oladi — bot emas.
 * Telefon raqam orqali yuboriladi, chatId kerak emas.
 */
export async function sendOtpViaTelegram(
  phone: string,
  code: string,
  ttl: number = 120,
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const token = env.TELEGRAM_GATEWAY_TOKEN;
  if (!token) {
    console.error('[Telegram] Token missing!');
    return { success: false, error: 'TELEGRAM_GATEWAY_TOKEN belgilanmagan' };
  }

  try {
    // +998... formatda bo'lishi kerak
    const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`;
    console.log(`[Telegram] Sending request to Gateway for ${cleanPhone}...`);

    const response = await fetch(`${GATEWAY_API}/sendVerificationMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: cleanPhone,
        code,
        code_length: code.length,
        ttl,
      }),
    });

    const data = (await response.json()) as {
      ok: boolean;
      result?: { request_id: string; phone_code_hash?: string };
      error?: string;
      description?: string;
    };

    if (!data.ok) {
      const errMsg = data.description || data.error || `HTTP ${response.status}`;
      console.error(`❌ Telegram Gateway xatolik: ${errMsg}`);

      // Foydalanuvchi Telegramda yo'q bo'lsa
      if (errMsg.includes('PHONE_NUMBER_NOT_FOUND') ||
          errMsg.includes('not found') ||
          response.status === 404) {
        return {
          success: false,
          error: 'Bu raqam Telegramda ro\'yxatdan o\'tmagan',
        };
      }

      return { success: false, error: `Telegram: ${errMsg}` };
    }

    console.log(`📨 Telegram Gateway OTP yuborildi: ${cleanPhone.slice(0, 7)}***`);

    return {
      success: true,
      requestId: data.result?.request_id,
    };
  } catch (error) {
    console.error('❌ Telegram Gateway xatolik:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Telegram xatolik',
    };
  }
}

/**
 * Telegram Gateway sozlanganmi
 */
export function isTelegramGatewayConfigured(): boolean {
  return !!env.TELEGRAM_GATEWAY_TOKEN;
}

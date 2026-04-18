/**
 * Telegram bot notification utility for admin events.
 * Falls back to no-op when env not configured.
 */
const TG_API = 'https://api.telegram.org';

export async function sendTelegramAlert(message: string): Promise<boolean> {
  const token = process.env.ADMIN_TG_BOT_TOKEN;
  const chatId = process.env.ADMIN_TG_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    return res.ok;
  } catch {
    return false;
  }
}

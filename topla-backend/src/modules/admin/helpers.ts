/**
 * Admin route'lar uchun umumiy yordamchi funksiyalar
 */

/**
 * Analitika uchun sana oralig'ini hisoblash
 */
export function getAnalyticsDates(period: string) {
  const now = new Date();
  const startDate = new Date();
  let days = 30;

  if (period === '1d') { days = 1; startDate.setDate(now.getDate() - 1); }
  else if (period === '7d') { days = 7; startDate.setDate(now.getDate() - 7); }
  else if (period === '30d') { days = 30; startDate.setDate(now.getDate() - 30); }
  else if (period === '90d') { days = 90; startDate.setDate(now.getDate() - 90); }
  else if (period === '1y') { days = 365; startDate.setFullYear(now.getFullYear() - 1); }
  else { startDate.setDate(now.getDate() - 30); }

  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  // Group format: hourly for 1d, daily for 7d/30d, weekly for 90d, monthly for 1y
  let groupFormat = 'YYYY-MM-DD';
  if (period === '1d') groupFormat = 'YYYY-MM-DD HH24:00';
  else if (period === '1y') groupFormat = 'YYYY-MM';
  else if (period === '90d') groupFormat = 'IYYY-IW'; // ISO week

  return { startDate, prevStartDate, prevEndDate, groupFormat, days };
}

/**
 * SQL injection'dan himoya uchun format validatsiyasi
 */
export const ALLOWED_DATE_FORMATS: Record<string, string> = {
  'YYYY-MM-DD': 'YYYY-MM-DD',
  'YYYY-MM-DD HH24:00': 'YYYY-MM-DD HH24:00',
  'YYYY-MM': 'YYYY-MM',
  'IYYY-IW': 'IYYY-IW',
};

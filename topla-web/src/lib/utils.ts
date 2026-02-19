import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Hydration-safe format helpers (no locale-dependent APIs) ── */

const MONTHS_SHORT = [
  "yan", "fev", "mar", "apr", "may", "iyn",
  "iyl", "avg", "sen", "okt", "noy", "dek",
];

const MONTHS_LONG = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/** Format number with space separator: 1234567 → "1 234 567" */
export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Format price: 150000 → "150 000 so'm" */
export function formatPrice(price: number): string {
  return formatNumber(Math.round(price)) + " so'm";
}

/** Format date: "2026-02-12T..." → "12 fev, 2026" */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`;
}

/** Format date long: "2026-02-12T..." → "12 fevral 2026" */
export function formatDateLong(date: Date | string): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format date + time: "2026-02-12T15:30" → "12 fev, 2026 15:30" */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()} ${h}:${m}`;
}

/** Format time only: "2026-02-12T15:30" → "15:30" */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
}

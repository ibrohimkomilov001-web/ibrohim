const STORAGE_KEY = 'topla:search-history';
const MAX_ITEMS = 10;

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string) {
  if (typeof window === 'undefined') return;
  const q = query.trim();
  if (!q) return;
  const current = getSearchHistory();
  const next = [q, ...current.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function removeSearchHistoryItem(query: string) {
  if (typeof window === 'undefined') return;
  const next = getSearchHistory().filter((item) => item !== query);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearSearchHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

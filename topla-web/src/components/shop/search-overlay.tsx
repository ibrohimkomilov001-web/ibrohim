'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, X, Clock, Camera } from 'lucide-react';
import { shopApi } from '@/lib/api/shop';
import { useLocaleStore } from '@/store/locale-store';
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistoryItem,
  clearSearchHistory,
} from '@/lib/search-history';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: Props) {
  const router = useRouter();
  const { locale } = useLocaleStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const labels = useMemo(
    () =>
      locale === 'ru'
        ? {
            placeholder: 'Поиск товаров',
            historyTitle: 'История поиска',
            clearAll: 'Очистить всё',
            startPrompt: 'Что ищете?',
            startHint: 'Введите название товара, бренда или категории',
          }
        : {
            placeholder: 'Mahsulot qidirish',
            historyTitle: 'Qidiruv tarixi',
            clearAll: 'Hammasini tozalash',
            startPrompt: 'Nimani qidiryapsiz?',
            startHint: 'Mahsulot, brend yoki kategoriya nomini kiriting',
          },
    [locale]
  );

  // Load history on open.
  useEffect(() => {
    if (open) {
      setHistory(getSearchHistory());
      setQuery('');
      setDebouncedQuery('');
      // Focus input on next tick so animation doesn't jank.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounce query.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Suggestions when typing.
  const { data: suggestions } = useQuery({
    queryKey: ['search-overlay-suggest', debouncedQuery],
    queryFn: () => shopApi.searchSuggest(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const suggestItems: string[] = useMemo(() => {
    if (!Array.isArray(suggestions)) return [];
    return suggestions
      .map((s: any) => s?.nameUz || s?.name || s?.query || (typeof s === 'string' ? s : ''))
      .filter(Boolean)
      .slice(0, 10);
  }, [suggestions]);

  const submit = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    addSearchHistory(clean);
    setHistory(getSearchHistory());
    onClose();
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  const handleRemoveHistory = (item: string) => {
    removeSearchHistoryItem(item);
    setHistory(getSearchHistory());
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  if (!open) return null;

  const showSuggestions = debouncedQuery.length >= 2;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-3 border-b border-border"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)', paddingBottom: 8 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" strokeWidth={2.2} />
        </button>
        <form onSubmit={handleSubmit} className="flex-1 min-w-0">
          <div className="flex items-center h-10 px-3 rounded-xl bg-muted border border-border focus-within:bg-background focus-within:border-primary/30">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.placeholder}
              className="flex-1 bg-transparent border-none outline-none ml-2 text-[16px] text-foreground placeholder:text-muted-foreground min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5"
                aria-label="Clear"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </form>
        {!query && (
          <button
            type="button"
            aria-label="Camera search"
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            <Camera className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {showSuggestions ? (
          <div className="py-1">
            {suggestItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {locale === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}
              </div>
            ) : (
              suggestItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => submit(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
                >
                  <Search className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{item}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="py-2">
            {/* History */}
            {history.length > 0 && (
              <div className="py-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <h3 className="text-sm font-semibold text-foreground">{labels.historyTitle}</h3>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {labels.clearAll}
                  </button>
                </div>
                <div>
                  {history.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors group"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                      <button
                        type="button"
                        onClick={() => submit(item)}
                        className="flex-1 text-left text-sm text-foreground truncate"
                      >
                        {item}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHistory(item)}
                        aria-label="Remove"
                        className="p-1 text-muted-foreground/60 hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular section removed per design */}

            {history.length === 0 && (
              <div className="px-6 py-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-9 h-9 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-foreground">{labels.startPrompt}</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">{labels.startHint}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

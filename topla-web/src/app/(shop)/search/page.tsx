'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopApi } from '@/lib/api/shop';
import { ProductCard, ProductGrid } from '@/components/shop/product-card';
import { useTranslation } from '@/store/locale-store';

const trendingSearches = ['telefon', 'krossovka', 'sumka', 'soat', 'naushnik', 'kiyim'];

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="site-container py-20 flex items-center justify-center">
        <div className="shimmer w-8 h-8 rounded-full" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['search-products', debouncedQuery],
    queryFn: () => shopApi.searchProducts(debouncedQuery, 40),
    enabled: debouncedQuery.length >= 2,
  });

  const products = data?.products ?? [];

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleSearch = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    if (term.length >= 2) saveSearch(term);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const showEmpty = debouncedQuery.length >= 2 && !isLoading && products.length === 0;
  const showDefault = debouncedQuery.length < 2;

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{t('search')}</span>
      </nav>

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="search-glass flex items-center gap-3 px-5 py-3.5 rounded-2xl">
          <SearchIcon className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.length >= 2) saveSearch(query);
            }}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-base outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Default state - recent & trending */}
      {showDefault && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {locale === 'ru' ? 'Недавние поиски' : 'So\'nggi qidiruvlar'}
                </h3>
                <button onClick={clearRecent} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {locale === 'ru' ? 'Очистить' : 'Tozalash'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="category-pill text-sm"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              {locale === 'ru' ? 'Популярные запросы' : 'Trend qidiruvlar'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((term, i) => (
                <motion.button
                  key={term}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSearch(term)}
                  className="category-pill text-sm"
                >
                  {term}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && debouncedQuery.length >= 2 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-5 skeleton rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {showEmpty && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-2">
            &quot;{debouncedQuery}&quot; — {t('noResults').toLowerCase()}
          </p>
          <p className="text-sm text-muted-foreground">{t('tryOther')}</p>
        </motion.div>
      )}

      {/* Results */}
      {!showDefault && products.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground mb-4">
            {data?.pagination?.total ?? 0} {t('results')}
          </p>
          <ProductGrid products={products} columns={5} />
        </motion.div>
      )}
    </div>
  );
}

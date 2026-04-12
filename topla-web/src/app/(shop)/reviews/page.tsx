'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/store/locale-store';
import { userAuthApi, isUserAuthenticated } from '@/lib/api/user-auth';
import { resolveImageUrl } from '@/lib/api/upload';

type ReviewTab = 'reviews' | 'questions';

export default function ReviewsPage() {
  const { t, locale } = useTranslation();
  const isAuth = isUserAuthenticated();
  const [activeTab, setActiveTab] = useState<ReviewTab>('reviews');

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => userAuthApi.getMyReviews(),
    enabled: isAuth,
  });

  const reviews = data?.data ?? data ?? [];

  const tabs: { key: ReviewTab; label: string; icon: any }[] = [
    { key: 'reviews', label: locale === 'ru' ? 'Мои отзывы' : 'Mening sharhlarim', icon: Star },
    { key: 'questions', label: locale === 'ru' ? 'Мои вопросы' : 'Mening savollarim', icon: MessageCircle },
  ];

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{t('reviewsAndQuestions')}</h1>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'reviews' ? (
          <>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : Array.isArray(reviews) && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-xl p-4"
                  >
                    {review.product && (
                      <Link href={`/products/${review.product.id}`} className="flex items-center gap-3 mb-3 group">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {review.product.images?.[0] ? (
                            <img src={resolveImageUrl(review.product.images[0])} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          )}
                        </div>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {locale === 'ru' && review.product.nameRu ? review.product.nameRu : review.product.nameUz}
                        </span>
                      </Link>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-sm text-foreground/80">{review.comment}</p>}
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.map((img: string, i: number) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                            <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
                  <Star className="w-9 h-9 text-yellow-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-700 mb-1">
                  {locale === 'ru' ? 'Нет отзывов' : 'Sharhlar yo\'q'}
                </h2>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  {locale === 'ru'
                    ? 'Здесь будут ваши отзывы о товарах'
                    : 'Bu yerda mahsulotlar haqidagi sharhlaringiz ko\'rinadi'}
                </p>
                <Link
                  href="/"
                  className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  {locale === 'ru' ? 'Смотреть товары' : 'Mahsulotlarni ko\'rish'}
                </Link>
              </motion.div>
            )}
          </>
        ) : (
          /* Questions tab */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-9 h-9 text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-700 mb-1">
              {locale === 'ru' ? 'Нет вопросов' : 'Savollar yo\'q'}
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              {locale === 'ru'
                ? 'Здесь будут ваши вопросы о товарах'
                : 'Bu yerda mahsulotlar haqidagi savollaringiz ko\'rinadi'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

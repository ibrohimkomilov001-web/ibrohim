'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/store/locale-store';
import { userAuthApi, isUserAuthenticated } from '@/lib/api/user-auth';
import { resolveImageUrl } from '@/lib/api/upload';
import { EmptyState } from '@/components/shop/empty-state';

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
        <div className="flex gap-6 mb-5 border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center gap-2 pb-2.5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
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
              <EmptyState
                icon={Star}
                title={locale === 'ru' ? 'Нет отзывов' : "Sharhlar yo'q"}
                description={
                  locale === 'ru'
                    ? 'Оставляйте отзывы после получения заказа — они помогают другим покупателям'
                    : "Buyurtmangizni olgandan keyin sharh qoldiring — bu boshqa xaridorlarga yordam beradi"
                }
                actionLabel={locale === 'ru' ? 'Мои заказы' : 'Buyurtmalarim'}
                actionHref="/orders"
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title={locale === 'ru' ? 'Нет вопросов' : "Savollar yo'q"}
            description={
              locale === 'ru'
                ? 'Здесь будут ваши вопросы о товарах'
                : "Bu yerda mahsulotlar haqidagi savollaringiz ko'rinadi"
            }
          />
        )}
      </div>
    </div>
  );
}

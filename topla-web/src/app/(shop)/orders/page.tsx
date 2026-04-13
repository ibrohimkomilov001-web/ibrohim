'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Loader2, Package, ChevronRight, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/store/locale-store';
import { isUserAuthenticated, userAuthApi } from '@/lib/api/user-auth';
import { resolveImageUrl } from '@/lib/api/upload';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  ready_for_pickup: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  courier_assigned: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  courier_picked_up: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  shipping: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  delivered: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  at_pickup_point: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
};

function getStatusLabel(status: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    pending: { uz: 'Kutilmoqda', ru: 'Ожидает' },
    confirmed: { uz: 'Tasdiqlangan', ru: 'Подтверждён' },
    processing: { uz: 'Tayyorlanmoqda', ru: 'Готовится' },
    ready_for_pickup: { uz: 'Tayyor', ru: 'Готов' },
    courier_assigned: { uz: 'Kuryer topildi', ru: 'Курьер назначен' },
    courier_picked_up: { uz: 'Kuryer oldi', ru: 'Курьер забрал' },
    shipping: { uz: 'Yetkazilmoqda', ru: 'Доставляется' },
    delivered: { uz: 'Yetkazildi', ru: 'Доставлен' },
    cancelled: { uz: 'Bekor qilindi', ru: 'Отменён' },
    at_pickup_point: { uz: 'Punktda', ru: 'В пункте' },
  };
  return labels[status]?.[locale] ?? status;
}

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

export default function OrdersPage() {
  const { t, locale } = useTranslation();
  const isAuth = isUserAuthenticated();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const statusParam = activeTab === 'active' ? 'pending,confirmed,processing,ready_for_pickup,courier_assigned,courier_picked_up,shipping,at_pickup_point'
    : activeTab === 'delivered' ? 'delivered'
    : activeTab === 'cancelled' ? 'cancelled'
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', activeTab],
    queryFn: () => userAuthApi.getMyOrders({ status: statusParam, limit: 50 }),
    enabled: isAuth,
  });

  const orders = data?.data?.orders ?? data?.orders ?? [];

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: locale === 'ru' ? 'Все' : 'Barchasi' },
    { key: 'active', label: locale === 'ru' ? 'В процессе' : 'Jarayonda' },
    { key: 'delivered', label: locale === 'ru' ? 'Доставлено' : 'Yetkazildi' },
    { key: 'cancelled', label: locale === 'ru' ? 'Отменено' : 'Bekor qilingan' },
  ];

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">{t('myOrders')}</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-6 mb-5 overflow-x-auto no-scrollbar border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!isAuth ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {locale === 'ru' ? 'Войдите чтобы увидеть заказы' : 'Buyurtmalarni ko\'rish uchun kiring'}
            </p>
            <Link href="/profile" className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">
              {locale === 'ru' ? 'Войти' : 'Kirish'}
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-9 h-9 text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              {locale === 'ru' ? 'Пока нет заказов' : 'Buyurtmalar hali yo\'q'}
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {locale === 'ru'
                ? 'Ваши заказы появятся здесь после покупки'
                : 'Xarid qilganingizdan keyin buyurtmalaringiz shu yerda ko\'rinadi'}
            </p>
            <Link
              href="/"
              className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              {locale === 'ru' ? 'Начать покупки' : 'Xarid qilish'}
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">#{order.orderNumber}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground'}`}>
                    {getStatusLabel(order.status, locale)}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {order.items?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.imageUrl ? (
                          <img src={resolveImageUrl(item.imageUrl)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {formatPrice(Number(item.price))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-15">
                      +{order.items.length - 3} {locale === 'ru' ? 'ещё' : 'yana'}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <span className="text-sm font-semibold">{formatPrice(Number(order.total))}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(order.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

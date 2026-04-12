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
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  ready_for_pickup: 'bg-indigo-100 text-indigo-700',
  courier_assigned: 'bg-indigo-100 text-indigo-700',
  courier_picked_up: 'bg-indigo-100 text-indigo-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  at_pickup_point: 'bg-teal-100 text-teal-700',
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
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{t('myOrders')}</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!isAuth ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 mb-4">
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
            <h2 className="text-base font-semibold text-gray-700 mb-1">
              {locale === 'ru' ? 'Пока нет заказов' : 'Buyurtmalar hali yo\'q'}
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-xs">
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
                  <span className="text-xs font-mono text-gray-400">#{order.orderNumber}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
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
                        <p className="text-xs text-gray-400">
                          {item.quantity} x {formatPrice(Number(item.price))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-xs text-gray-400 pl-15">
                      +{order.items.length - 3} {locale === 'ru' ? 'ещё' : 'yana'}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-sm font-semibold">{formatPrice(Number(order.total))}</span>
                    <span className="text-xs text-gray-400 ml-2">
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

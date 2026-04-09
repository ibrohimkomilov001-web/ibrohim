'use client';

import Link from 'next/link';
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from '@/store/locale-store';
import { useSupportPhone } from '@/hooks/useSettings';

const faqItems = {
  uz: [
    {
      q: 'Buyurtmani qanday berish mumkin?',
      a: 'Mahsulotni tanlang, savatga qo\'shing va buyurtma berish tugmasini bosing. Keyin manzilni kiriting va to\'lov usulini tanlang.',
    },
    {
      q: 'Yetkazib berish qancha vaqt oladi?',
      a: 'Toshkent shahri bo\'ylab 1-2 kun ichida, viloyatlarga 2-5 kun ichida yetkazib beramiz.',
    },
    {
      q: 'Mahsulotni qaytarish mumkinmi?',
      a: 'Ha, mahsulot yetkazilgan kundan boshlab 14 kun ichida qaytarishingiz mumkin. Mahsulot ishlatilmagan va o\'ramasi buzilmagan bo\'lishi kerak.',
    },
    {
      q: 'To\'lov qanday amalga oshiriladi?',
      a: 'Naqd pul, bank kartasi yoki onlayn to\'lov orqali to\'lashingiz mumkin.',
    },
    {
      q: 'Sotuvchi bo\'lish uchun nima qilish kerak?',
      a: 'Profil sahifasida "Sotuvchi bo\'lish" tugmasini bosing va ariza to\'ldiring. Arizangiz 1-2 ish kunida ko\'rib chiqiladi.',
    },
  ],
  ru: [
    {
      q: 'Как сделать заказ?',
      a: 'Выберите товар, добавьте в корзину и нажмите кнопку оформления. Затем введите адрес и выберите способ оплаты.',
    },
    {
      q: 'Сколько времени занимает доставка?',
      a: 'По Ташкенту — 1-2 дня, в регионы — 2-5 дней.',
    },
    {
      q: 'Можно ли вернуть товар?',
      a: 'Да, вы можете вернуть товар в течение 14 дней с момента получения. Товар должен быть неиспользованным и в оригинальной упаковке.',
    },
    {
      q: 'Как происходит оплата?',
      a: 'Вы можете оплатить наличными, банковской картой или онлайн.',
    },
    {
      q: 'Как стать продавцом?',
      a: 'Нажмите "Стать продавцом" в профиле и заполните заявку. Рассмотрение занимает 1-2 рабочих дня.',
    },
  ],
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-100 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 pr-3">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 pb-3.5"
        >
          <p className="text-sm text-gray-500 leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function HelpPage() {
  const { t, locale } = useTranslation();
  const supportPhone = useSupportPhone();
  const items = locale === 'ru' ? faqItems.ru : faqItems.uz;

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{t('helpCenter')}</h1>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {locale === 'ru' ? 'Частые вопросы' : 'Ko\'p so\'raladigan savollar'}
          </h2>
          <div className="space-y-2">
            {items.map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {locale === 'ru' ? 'Связаться с нами' : 'Biz bilan bog\'lanish'}
          </h2>
          <div className="space-y-2">
            <a
              href={`tel:+${supportPhone.replace(/\D/g, '')}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {locale === 'ru' ? 'Позвонить' : 'Qo\'ng\'iroq qilish'}
                </p>
                <p className="text-xs text-gray-400">{supportPhone}</p>
              </div>
            </a>
            <a
              href="https://t.me/topla_market"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Telegram</p>
                <p className="text-xs text-gray-400">@topla_market</p>
              </div>
            </a>
            <a
              href="mailto:support@topla.uz"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-xs text-gray-400">support@topla.uz</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import {
  ShoppingBag, Users, Truck, Store, Shield, Smartphone,
  Mail, Phone, MapPin, MessageCircle, Star, Zap, Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/store/locale-store';
import { useSupportPhone, useSupportEmail } from '@/hooks/useSettings';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function AboutPage() {
  const { t, locale } = useTranslation();
  const supportPhone = useSupportPhone();
  const email = useSupportEmail();

  const stats = [
    { value: '10K+', label: locale === 'ru' ? 'Товаров' : 'Mahsulotlar', icon: ShoppingBag },
    { value: '500+', label: locale === 'ru' ? 'Продавцов' : 'Sotuvchilar', icon: Store },
    { value: '50K+', label: locale === 'ru' ? 'Покупателей' : 'Xaridorlar', icon: Users },
    { value: '24/7', label: locale === 'ru' ? 'Поддержка' : 'Qo\'llab-quvvatlash', icon: MessageCircle },
  ];

  const advantages = [
    {
      icon: Shield,
      title: locale === 'ru' ? 'Безопасные покупки' : 'Xavfsiz xaridlar',
      desc: locale === 'ru'
        ? 'Защита покупателей и проверенные продавцы'
        : 'Xaridorlar himoyasi va tekshirilgan sotuvchilar',
    },
    {
      icon: Truck,
      title: locale === 'ru' ? 'Быстрая доставка' : 'Tez yetkazish',
      desc: locale === 'ru'
        ? 'Доставка по всему Узбекистану от 1 дня'
        : 'O\'zbekiston bo\'ylab 1 kundan yetkazish',
    },
    {
      icon: Star,
      title: locale === 'ru' ? 'Лучшие цены' : 'Eng yaxshi narxlar',
      desc: locale === 'ru'
        ? 'Конкурентные цены и регулярные акции'
        : 'Raqobatbardosh narxlar va doimiy aksiyalar',
    },
    {
      icon: Zap,
      title: locale === 'ru' ? 'Удобный интерфейс' : 'Qulay interfeys',
      desc: locale === 'ru'
        ? 'Простой поиск и быстрое оформление заказа'
        : 'Oson qidirish va tez buyurtma berish',
    },
    {
      icon: Heart,
      title: locale === 'ru' ? 'Поддержка локального бизнеса' : 'Mahalliy biznesni qo\'llab-quvvatlash',
      desc: locale === 'ru'
        ? 'Помогаем местным предпринимателям расти'
        : 'Mahalliy tadbirkorlarga o\'sishga yordam beramiz',
    },
    {
      icon: Smartphone,
      title: locale === 'ru' ? 'Мобильное приложение' : 'Mobil ilova',
      desc: locale === 'ru'
        ? 'Покупайте удобно через наше приложение для Android'
        : 'Android ilovamiz orqali qulay xarid qiling',
    },
  ];

  const faqs = [
    {
      q: locale === 'ru' ? 'Как оформить заказ?' : 'Qanday buyurtma beraman?',
      a: locale === 'ru'
        ? 'Добавьте товары в корзину, перейдите к оформлению, укажите адрес и способ оплаты.'
        : 'Mahsulotlarni savatga qo\'shing, buyurtma berish sahifasiga o\'ting, manzil va to\'lov usulini tanlang.',
    },
    {
      q: locale === 'ru' ? 'Какие способы оплаты доступны?' : 'Qanday to\'lov usullari bor?',
      a: locale === 'ru'
        ? 'Мы принимаем наличные при получении и Octobank.'
        : 'Naqd pul va Octobank orqali to\'lash mumkin.',
    },
    {
      q: locale === 'ru' ? 'Как стать продавцом?' : 'Qanday sotuvchi bo\'laman?',
      a: locale === 'ru'
        ? 'Зарегистрируйтесь как продавец через приложение или свяжитесь с нами.'
        : 'Ilovamiz orqali sotuvchi sifatida ro\'yxatdan o\'ting yoki biz bilan bog\'laning.',
    },
    {
      q: locale === 'ru' ? 'Есть ли возврат товара?' : 'Mahsulotni qaytarish mumkinmi?',
      a: locale === 'ru'
        ? 'Да, вы можете вернуть товар в течение 14 дней после получения.'
        : 'Ha, mahsulotni qabul qilganingizdan so\'ng 14 kun ichida qaytarishingiz mumkin.',
    },
  ];

  return (
    <div className="site-container py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{locale === 'ru' ? 'О нас' : 'Biz haqimizda'}</span>
      </nav>

      {/* Hero */}
      <motion.div {...fadeUp} className="text-center py-10 sm:py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <ShoppingBag className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          {locale === 'ru' ? 'Маркетплейс' : 'Marketpleys'} <span className="text-primary">TOPLA</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {locale === 'ru'
            ? 'Первый маркетплейс Узбекистана, соединяющий покупателей и продавцов на одной удобной платформе. Мы делаем онлайн-покупки простыми и доступными.'
            : 'O\'zbekistonning birinchi marketpleysi — xaridorlar va sotuvchilarni bitta qulay platformada birlashtiradi. Biz onlayn xaridlarni oson va qulay qilamiz.'}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5 text-center">
            <stat.icon className="w-7 h-7 text-primary mx-auto mb-3" />
            <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Advantages */}
      <motion.div {...fadeUp}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          {locale === 'ru' ? 'Почему TOPLA?' : 'Nima uchun TOPLA?'}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {advantages.map((adv, i) => (
            <motion.div
              key={adv.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 group hover:shadow-lg transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <adv.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-1">{adv.title}</h3>
              <p className="text-sm text-muted-foreground">{adv.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div {...fadeUp} className="max-w-2xl mx-auto mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          {locale === 'ru' ? 'Частые вопросы' : 'Ko\'p so\'raladigan savollar'}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="glass rounded-xl group">
              <summary className="p-4 cursor-pointer font-medium flex items-center justify-between list-none">
                {faq.q}
                <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground -mt-1">{faq.a}</p>
            </details>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div {...fadeUp} className="glass rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-5 text-center">
          {locale === 'ru' ? 'Связаться с нами' : 'Biz bilan bog\'laning'}
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <a href={`tel:+${supportPhone.replace(/\D/g, '')}`} className="flex items-center gap-3 hover:text-primary transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{locale === 'ru' ? 'Телефон' : 'Telefon'}</p>
              <p className="text-sm font-medium">{supportPhone}</p>
            </div>
          </a>
          <a href={`mailto:${email}`} className="flex items-center gap-3 hover:text-primary transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{email}</p>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{locale === 'ru' ? 'Адрес' : 'Manzil'}</p>
              <p className="text-sm font-medium">{locale === 'ru' ? 'г. Ташкент' : 'Toshkent sh.'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

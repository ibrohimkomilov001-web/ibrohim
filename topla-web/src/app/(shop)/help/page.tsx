'use client';

import Link from 'next/link';
import { MessageCircle, Phone, Mail, FileText, Shield, HelpCircle, ChevronRight, Headphones } from 'lucide-react';
import { useLocaleStore } from '@/store/locale-store';
import { useSupportPhone, useSupportEmail, useTelegramLink, useTelegramHandle } from '@/hooks/useSettings';

export default function HelpPage() {
  const locale = useLocaleStore((s) => s.locale);
  const isRu = locale === 'ru';
  const supportPhone = useSupportPhone();
  const telegramLink = useTelegramLink();
  const telegramHandle = useTelegramHandle();
  const email = useSupportEmail();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 leading-tight">
                {isRu ? 'Центр помощи' : 'Yordam markazi'}
              </h1>
              <p className="mt-1 text-[15px] text-gray-500">
                {isRu ? 'Ответы на вопросы и поддержка' : "Savollarga javoblar va qo'llab-quvvatlash"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <article className="space-y-10 text-[15px] leading-[1.75] text-gray-700">

          {/* Intro */}
          <div className="border-l-4 border-orange-400 pl-4 py-1 text-gray-600">
            <p>
              {isRu
                ? 'Добро пожаловать в центр помощи TOPLA! Здесь вы найдёте ответы на часто задаваемые вопросы и контакты нашей службы поддержки. Мы готовы помочь 24/7.'
                : "TOPLA yordam markaziga xush kelibsiz! Bu yerda ko'p so'raladigan savollarga javoblar va qo'llab-quvvatlash xizmati kontaktlarini topasiz. Biz 24/7 yordam berishga tayyormiz."}
            </p>
          </div>

          {/* Quick actions */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Быстрые ссылки' : 'Tezkor havolalar'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/faq"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                    {isRu ? 'Часто задаваемые вопросы' : "Ko'p so'raladigan savollar"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRu ? '40+ вопросов и ответов' : "40+ savol va javob"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/terms"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                    {isRu ? 'Пользовательское соглашение' : 'Foydalanish shartlari'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRu ? 'Условия использования платформы' : 'Platforma foydalanish shartlari'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/privacy"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                    {isRu ? 'Политика конфиденциальности' : 'Maxfiylik siyosati'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRu ? 'Защита ваших данных' : "Ma'lumotlaringiz himoyasi"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* How TOPLA works */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Как работает TOPLA' : 'TOPLA qanday ishlaydi'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">1</div>
                <div>
                  <p className="font-semibold text-gray-800">{isRu ? 'Найдите товар' : 'Mahsulotni toping'}</p>
                  <p className="text-gray-500 text-sm">{isRu ? 'Используйте поиск или каталог для нахождения нужного товара среди тысяч предложений.' : "Minglab takliflar orasidan kerakli mahsulotni qidirish yoki katalog orqali toping."}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">2</div>
                <div>
                  <p className="font-semibold text-gray-800">{isRu ? 'Закажите' : 'Buyurtma bering'}</p>
                  <p className="text-gray-500 text-sm">{isRu ? 'Добавьте товар в корзину, укажите адрес доставки и выберите способ оплаты.' : "Mahsulotni savatga qo'shing, yetkazish manzilini kiriting va to'lov usulini tanlang."}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">3</div>
                <div>
                  <p className="font-semibold text-gray-800">{isRu ? 'Получите' : 'Qabul qiling'}</p>
                  <p className="text-gray-500 text-sm">{isRu ? 'Курьер доставит заказ прямо к вашей двери. Оплатите при получении или онлайн.' : "Kuryer buyurtmani eshigingizgacha yetkazadi. Qabul qilishda yoki onlayn to'lang."}</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Delivery info */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Доставка' : 'Yetkazib berish'}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{isRu ? 'Ташкент — 1–3 рабочих дня' : 'Toshkent — 1–3 ish kuni'}</li>
              <li>{isRu ? 'Регионы Узбекистана — 2–5 рабочих дней' : "O'zbekiston viloyatlari — 2–5 ish kuni"}</li>
              <li>{isRu ? 'Стоимость доставки зависит от веса, размера и удалённости' : "Yetkazib berish narxi og'irlik, o'lcham va masofaga bog'liq"}</li>
              <li>{isRu ? 'Бесплатная доставка при заказе от определённой суммы (указано на странице товара)' : "Ma'lum summadan oshgan buyurtmalarda bepul yetkazish (mahsulot sahifasida ko'rsatilgan)"}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Payment */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Способы оплаты' : "To'lov usullari"}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{isRu ? 'Банковская карта' : 'Bank kartasi'}</strong> — {isRu ? 'Uzcard, Humo через Octobank (безопасный процессинг)' : 'Uzcard, Humo — Octobank orqali (xavfsiz processing)'}</li>
              <li><strong>{isRu ? 'Наличные' : 'Naqd pul'}</strong> — {isRu ? 'оплата курьеру при получении' : "qabul qilishda kuryerga to'lash"}</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              {isRu
                ? 'Все онлайн-платежи защищены SSL-шифрованием. Данные карты не хранятся на наших серверах.'
                : "Barcha onlayn to'lovlar SSL-shifrlash bilan himoyalangan. Karta ma'lumotlari bizning serverlarimizda saqlanmaydi."}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Returns */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Возврат товара' : 'Mahsulotni qaytarish'}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{isRu ? 'Возврат возможен в течение 7 дней с момента получения' : "Qabul qilingan kundan boshlab 7 kun ichida qaytarish mumkin"}</li>
              <li>{isRu ? 'Товар должен быть в оригинальной упаковке, без следов использования' : "Mahsulot asl qadoqda, ishlatilmagan holda bo'lishi kerak"}</li>
              <li>{isRu ? 'Возврат средств — 1–3 рабочих дня на карту или 1 день наличными' : "Pul qaytarish — 1–3 ish kuni kartaga yoki 1 kun naqd pulda"}</li>
              <li>{isRu ? 'Бракованный товар — возврат за наш счёт в течение 24 часов' : "Nosoz mahsulot — 24 soat ichida bizning hisobimizga qaytarish"}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Связаться с нами' : "Biz bilan bog'lanish"}
            </h2>
            <p className="mb-4 text-gray-600">
              {isRu
                ? 'Наша команда поддержки работает ежедневно с 9:00 до 21:00. Среднее время ответа — 5 минут.'
                : "Bizning qo'llab-quvvatlash jamoamiz har kuni soat 9:00 dan 21:00 gacha ishlaydi. O'rtacha javob vaqti — 5 daqiqa."}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-sky-200 hover:bg-sky-50/50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-sky-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Telegram</p>
                <p className="text-xs text-gray-400">{telegramHandle}</p>
              </a>

              <a
                href={`tel:+${supportPhone.replace(/\D/g, '')}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{isRu ? 'Позвонить' : "Qo'ng'iroq"}</p>
                <p className="text-xs text-gray-400">{supportPhone}</p>
              </a>

              <a
                href={`mailto:${email}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Email</p>
                <p className="text-xs text-gray-400">{email}</p>
              </a>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Working hours */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Время работы' : 'Ish vaqti'}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{isRu ? 'Поддержка' : "Qo'llab-quvvatlash"}</strong> — {isRu ? 'ежедневно, 9:00–21:00' : 'har kuni, 9:00–21:00'}</li>
              <li><strong>{isRu ? 'Доставка' : 'Yetkazish'}</strong> — {isRu ? 'ежедневно, 9:00–20:00' : 'har kuni, 9:00–20:00'}</li>
              <li><strong>Telegram</strong> — {isRu ? 'обработка заявок 24/7' : "arizalarni 24/7 qabul qilish"}</li>
            </ul>
          </section>

        </article>
      </div>
    </div>
  );
}

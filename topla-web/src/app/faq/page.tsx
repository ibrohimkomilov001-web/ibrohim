'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocaleStore } from '@/store/locale-store'
import { useTelegramLink, useTelegramHandle, useSupportPhone, useSupportEmail } from '@/hooks/useSettings'

type FaqItem = { q: string; a: string }
type FaqCategory = { emoji: string; title: string; items: FaqItem[] }

const faqUz: FaqCategory[] = [
  {
    emoji: '🛒',
    title: 'Buyurtma berish',
    items: [
      { q: "Qanday qilib buyurtma beraman?", a: "Kerakli mahsulotni tanlang, \"Savatga qo'shish\" tugmasini bosing. Savatga o'tib buyurtma tarkibini tekshiring. Keyin yetkazib berish manzilini kiriting va to'lov usulini tanlang. Buyurtma tasdiqlangandan so'ng sizga SMS orqali bildirishnoma yuboriladi." },
      { q: "Buyurtmani bekor qilsam bo'ladimi?", a: "\"Yangi\" holatida bepul bekor qilish mumkin. \"Tayyorlanmoqda\" holatida qo'llab-quvvatlash xizmatiga murojaat qiling. \"Yo'lda\" holatida bekor qilish imkoni yo'q. Bekor qilish uchun: Profilim → Buyurtmalarim → Buyurtmani tanlang → \"Bekor qilish\"." },
      { q: "Minimal buyurtma summasi bormi?", a: "Minimal buyurtma summasi yo'q. Siz istalgan miqdordagi mahsulotni buyurtma qilishingiz mumkin. Lekin yetkazib berish narxi buyurtma summasiga qarab hisoblanadi." },
      { q: "Buyurtma holatini qanday kuzataman?", a: "Ilovada: Profilim → Buyurtmalarim. Har bir holat o'zgarganda SMS yuboriladi. Shuningdek, push-bildirishnomalarni yoqib real vaqtda kuzatishingiz mumkin." },
      { q: "Turli do'konlardan bir buyurtma qilsam bo'ladimi?", a: "Ha, turli sotuvchilardan mahsulotlarni savatga qo'shishingiz mumkin. Har bir sotuvchidan alohida buyurtma yaratiladi va alohida yetkaziladi." },
    ],
  },
  {
    emoji: '🚚',
    title: 'Yetkazib berish',
    items: [
      { q: "Yetkazib berish qancha vaqt oladi?", a: "Toshkent shahri bo'ylab 1–3 ish kuni. O'zbekiston viloyatlariga 2–5 ish kuni. Masofadagi hududlarga 3–7 ish kuni. Yetkazish muddati sotuvchining joylashuviga ham bog'liq." },
      { q: "Yetkazib berish narxi qancha?", a: "Yetkazib berish narxi buyurtma summasi, mahsulot og'irligi va yetkazish masofasiga bog'liq. Aniq narx buyurtma rasmiylashtirishda ko'rsatiladi. Ba'zi sotuvchilar ma'lum summadan oshgan buyurtmalarda bepul yetkazish taklif qiladi." },
      { q: "Manzilimni buyurtmadan keyin o'zgartira olamanmi?", a: "Agar buyurtma hali jo'natilmagan bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qilib manzilni o'zgartirish mumkin. Buyurtma jo'natilgandan keyin manzil o'zgartirilmaydi." },
      { q: "O'zim borib olsam bo'ladimi?", a: "Hozircha Topla.uz orqali faqat yetkazib berish xizmati mavjud. Tez orada olib ketish punktlari (pickup point) ham ishga tushiriladi." },
      { q: "Yetkazish FBS va DBS nima?", a: "FBS (Fulfilled by Seller) — sotuvchi o'zi jo'natadi va yetkazadi. DBS (Delivery by Service) — sotuvchi tayyorlaydi, Topla kuryer xizmati yetkazadi. Yetkazish modeli mahsulot sahifasida ko'rsatiladi." },
    ],
  },
  {
    emoji: '💳',
    title: "To'lov",
    items: [
      { q: "Qanday to'lov usullari mavjud?", a: "Bank kartasi (Uzcard, Humo) — Octobank xavfsiz processing orqali. Naqd pul — yetkazib berishda kuryerga to'lash. Barcha onlayn to'lovlar SSL-shifrlash bilan himoyalangan." },
      { q: "Onlayn to'lov xavfsizmi?", a: "Ha, barcha to'lovlar Octobank process orqali amalga oshiriladi. Karta ma'lumotlaringiz bizning serverlarimizda saqlanmaydi. To'lov jarayoni SSL-shifrlash bilan himoyalangan." },
      { q: "Pul qaytarish qancha vaqt oladi?", a: "Onlayn to'lov uchun — 1–3 ish kuni kartangizga qaytariladi. Naqd to'lov uchun — 1 ish kuni ichida kuryerga qaytariladi yoki keyingi buyurtmadan chegiriladi." },
      { q: "Chek olamanmi?", a: "Ha, har bir buyurtma uchun elektron chek SMS va email orqali yuboriladi. Buyurtma sahifasida ham yuklab olish mumkin." },
    ],
  },
  {
    emoji: '🔄',
    title: 'Qaytarish va almashtirish',
    items: [
      { q: "Mahsulotni qaytarsam bo'ladimi?", a: "Ha, mahsulot qabul qilingan kundan boshlab 7 kun ichida qaytarish mumkin. Mahsulot ishlatilmagan va asl qadoqda bo'lishi kerak." },
      { q: "Qaysi mahsulotlarni qaytarib bo'lmaydi?", a: "Shaxsiy gigiena vositalari (ochilgan), ichki kiyim, kompyuter dasturlari (faollashtirilgan), maxsus buyurtma asosida tayyorlangan mahsulotlar qaytarilmaydi." },
      { q: "Nosoz mahsulot kelsa nima qilaman?", a: "Nosoz yoki buzilgan mahsulot kelsa 24 soat ichida qo'llab-quvvatlash xizmatiga murojaat qiling. Rasm yoki video yuboring. Biz 24 soat ichida javob beramiz va qaytarishni bizning hisobimizga amalga oshiramiz." },
      { q: "Almashtirib bersam bo'ladimi?", a: "Ha, mahsulotni boshqa rangga yoki o'lchamga almashtirish mumkin, agar sotuvchida mavjud bo'lsa. Qo'llab-quvvatlash xizmatiga murojaat qiling." },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Hisob va xavfsizlik',
    items: [
      { q: "Qanday ro'yxatdan o'taman?", a: "Telefon raqamingizni kiriting — SMS orqali tasdiqlash kodi yuboriladi. Kodni kiritgandan so'ng ismingizni yozing. Tayyor! Shuningdek Google orqali ham kirishingiz mumkin." },
      { q: "Google orqali kirsam bo'ladimi?", a: "Ha, kirish sahifasida \"Google orqali kirish\" tugmasini bosing. Google hisobingizni tanlang — avtomatik ravishda profil yaratiladi yoki mavjud profilga ulanadi." },
      { q: "Telefon raqamimni o'zgartirsam bo'ladimi?", a: "Hozircha telefon raqamni o'zgartirish imkoni yo'q. Yangi raqam bilan yangi hisob ochishingiz mumkin. Bu borada qo'llab-quvvatlash xizmatiga murojaat qiling." },
      { q: "Ma'lumotlarim xavfsizmi?", a: "Ha, barcha shaxsiy ma'lumotlar shifrlangan holda saqlanadi. Biz O'zbekiston Respublikasining \"Shaxsiy ma'lumotlar to'g'risida\" qonuniga amal qilamiz. Batafsil: Maxfiylik siyosati sahifamizda." },
    ],
  },
  {
    emoji: '⚙️',
    title: 'Texnik savollar',
    items: [
      { q: "Ilova qaysi qurilmalarda ishlaydi?", a: "Android 6.0 va undan yuqori, iOS 13.0 va undan yuqori versiyalarda ishlaydi. Veb-versiya barcha zamonaviy brauzerlarda ishlaydi (Chrome, Safari, Firefox, Edge)." },
      { q: "Bildirishnomalar kelmayapti, nima qilaman?", a: "Telefon sozlamalarida Topla ilovasiga bildirishnoma yuborish ruxsatini tekshiring. Batareya tejash rejimi bildirishnomalarni bloklashi mumkin — uni o'chiring." },
      { q: "Ilova sekin ishlayapti, nima qilaman?", a: "Ilovani oxirgi versiyaga yangilang. Telefon keshini tozalang. Internet aloqangizni tekshiring. Muammo davom etsa, ilovani o'chirib qayta o'rnating." },
      { q: "Tilni qanday o'zgartiraman?", a: "Yuqori qismdagi bayroq ikonkasini bosing va kerakli tilni tanlang. Til darhol o'zgaradi." },
    ],
  },
  {
    emoji: '🏪',
    title: "Sotuvchilar haqida",
    items: [
      { q: "Topla.uz da sotuvchi bo'lsam bo'ladimi?", a: "Ha! Har qanday YaTT yoki MCHJ sotuvchi bo'lishi mumkin. vendor.topla.uz sahifasiga o'ting, ro'yxatdan o'ting, hujjatlaringizni yuklang — 1-2 ish kunida tekshiriladi." },
      { q: "Sotuvchi komissiya to'laydimi?", a: "Ha, har bir sotilgan mahsulot uchun platforma komissiyasi olinadi. Komissiya miqdori kategoriyaga bog'liq va 5-15% orasida." },
      { q: "Sotuvchining reytingi qanday hisoblanadi?", a: "Xaridorlar baholari, yetkazish tezligi, qaytarish darajasi va mijozlarga javob berish tezligiga qarab hisoblanadi." },
    ],
  },
  {
    emoji: '📦',
    title: 'Boshqa savollar',
    items: [
      { q: "Aksiya va chegirmalar haqida qanday bilaman?", a: "Bosh sahifadagi bannerlar va \"Chegirmalar\" bo'limida barcha joriy aksiyalar ko'rsatiladi. Push-bildirishnomalarni yoqsangiz yangi aksiyalar haqida xabar olasiz." },
      { q: "Ilova yangilanishlarini qanday olaman?", a: "Google Play yoki App Store orqali avtomatik yangilanadi. Sozlamalarda avtomatik yangilashni yoqing." },
      { q: "Topla.uz ilovasida muammo topdim. Kimga yozaman?", a: "Telegram bot orqali yoki support@topla.uz ga yozing. Muammoning skrinshotini ham yuboring — bu tezroq hal qilishga yordam beradi." },
    ],
  },
]

const faqRu: FaqCategory[] = [
  {
    emoji: '🛒',
    title: 'Оформление заказа',
    items: [
      { q: "Как сделать заказ?", a: "Выберите товар и нажмите \"В корзину\". Перейдите в корзину и проверьте состав заказа. Укажите адрес доставки и выберите способ оплаты. После подтверждения вы получите SMS-уведомление." },
      { q: "Можно отменить заказ?", a: "В статусе \"Новый\" — бесплатная отмена. В статусе \"Готовится\" — обратитесь в поддержку. В статусе \"В пути\" — отмена невозможна. Для отмены: Профиль → Мои заказы → выберите заказ → \"Отменить\"." },
      { q: "Есть минимальная сумма заказа?", a: "Минимальной суммы нет. Вы можете заказать товар на любую сумму. Стоимость доставки рассчитывается отдельно." },
      { q: "Как отследить статус заказа?", a: "В приложении: Профиль → Мои заказы. SMS-уведомления приходят при каждом изменении статуса. Также можно включить push-уведомления." },
      { q: "Можно заказать у разных продавцов?", a: "Да, вы можете добавить товары от разных продавцов в корзину. Для каждого продавца создаётся отдельный заказ и доставка." },
    ],
  },
  {
    emoji: '🚚',
    title: 'Доставка',
    items: [
      { q: "Сколько времени занимает доставка?", a: "По Ташкенту — 1–3 рабочих дня. По регионам — 2–5 рабочих дней. В отдалённые районы — 3–7 рабочих дней. Срок зависит от расположения продавца." },
      { q: "Сколько стоит доставка?", a: "Стоимость зависит от суммы заказа, веса товара и расстояния. Точная цена отображается при оформлении. Некоторые продавцы предлагают бесплатную доставку при заказе от определённой суммы." },
      { q: "Можно изменить адрес после заказа?", a: "Если заказ ещё не отправлен — обратитесь в поддержку для изменения адреса. После отправки изменение невозможно." },
      { q: "Есть самовывоз?", a: "Пока доступна только доставка. Пункты самовывоза скоро появятся." },
      { q: "Что такое FBS и DBS?", a: "FBS (Fulfilled by Seller) — продавец сам отправляет и доставляет. DBS (Delivery by Service) — продавец готовит, курьер Topla доставляет. Модель указана на странице товара." },
    ],
  },
  {
    emoji: '💳',
    title: 'Оплата',
    items: [
      { q: "Какие способы оплаты доступны?", a: "Банковская карта (Uzcard, Humo) — через безопасный процессинг Octobank. Наличные — оплата курьеру при получении." },
      { q: "Безопасна ли онлайн-оплата?", a: "Да, все платежи проходят через Octobank. Данные карты не хранятся на наших серверах. Процесс защищён SSL-шифрованием." },
      { q: "Как быстро возвращаются деньги?", a: "При онлайн-оплате — 1–3 рабочих дня на карту. При оплате наличными — 1 рабочий день или зачёт в следующем заказе." },
      { q: "Выдаётся ли чек?", a: "Да, электронный чек отправляется по SMS и email. Его также можно скачать на странице заказа." },
    ],
  },
  {
    emoji: '🔄',
    title: 'Возврат и обмен',
    items: [
      { q: "Можно вернуть товар?", a: "Да, в течение 7 дней с момента получения. Товар должен быть неиспользованным и в оригинальной упаковке." },
      { q: "Какие товары нельзя вернуть?", a: "Средства личной гигиены (вскрытые), нижнее бельё, компьютерные программы (активированные), товары по индивидуальному заказу." },
      { q: "Пришёл бракованный товар, что делать?", a: "Обратитесь в поддержку в течение 24 часов. Отправьте фото или видео. Мы ответим в течение 24 часов и организуем возврат за наш счёт." },
      { q: "Можно обменять товар?", a: "Да, обмен на другой цвет или размер возможен, если товар есть у продавца. Обратитесь в поддержку." },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Аккаунт и безопасность',
    items: [
      { q: "Как зарегистрироваться?", a: "Введите номер телефона — придёт SMS с кодом. После подтверждения введите имя. Также можно войти через Google." },
      { q: "Можно войти через Google?", a: "Да, нажмите \"Войти через Google\" на странице входа. Выберите аккаунт — профиль создастся автоматически или привяжется к существующему." },
      { q: "Можно сменить номер телефона?", a: "Пока смена номера недоступна. Можно создать новый аккаунт или обратиться в поддержку." },
      { q: "Мои данные в безопасности?", a: "Да, все данные хранятся в зашифрованном виде. Мы соблюдаем Закон РУз «О персональных данных». Подробнее — в нашей Политике конфиденциальности." },
    ],
  },
  {
    emoji: '⚙️',
    title: 'Технические вопросы',
    items: [
      { q: "На каких устройствах работает?", a: "Android 6.0+, iOS 13.0+. Веб-версия работает во всех современных браузерах (Chrome, Safari, Firefox, Edge)." },
      { q: "Не приходят уведомления", a: "Проверьте разрешения уведомлений для Topla в настройках телефона. Режим энергосбережения может блокировать уведомления — отключите его." },
      { q: "Приложение тормозит", a: "Обновите до последней версии. Очистите кэш телефона. Проверьте интернет-соединение. Если проблема сохраняется — переустановите приложение." },
      { q: "Как сменить язык?", a: "Нажмите на значок флага вверху страницы и выберите нужный язык. Смена происходит мгновенно." },
    ],
  },
  {
    emoji: '🏪',
    title: 'О продавцах',
    items: [
      { q: "Можно стать продавцом?", a: "Да! Любое ИП или ООО может стать продавцом. Перейдите на vendor.topla.uz, зарегистрируйтесь, загрузите документы — проверка занимает 1-2 рабочих дня." },
      { q: "Какая комиссия у продавцов?", a: "За каждый проданный товар взимается комиссия платформы. Размер зависит от категории — от 5% до 15%." },
      { q: "Как формируется рейтинг?", a: "На основе оценок покупателей, скорости доставки, уровня возвратов и скорости ответа клиентам." },
    ],
  },
  {
    emoji: '📦',
    title: 'Прочие вопросы',
    items: [
      { q: "Как узнать об акциях?", a: "Баннеры на главной и раздел \"Скидки\". Включите push-уведомления, чтобы получать информацию о новых акциях." },
      { q: "Как обновить приложение?", a: "Через Google Play или App Store. Включите автоматическое обновление в настройках." },
      { q: "Нашёл ошибку в приложении", a: "Напишите в Telegram-бот или на support@topla.uz. Приложите скриншот — это поможет быстрее решить проблему." },
    ],
  },
]

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-3 py-4 text-left group"
      >
        <span className="text-[15px] font-medium text-gray-800 group-hover:text-primary transition-colors">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-gray-500 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqPage() {
  const locale = useLocaleStore((s) => s.locale)
  const isRu = locale === 'ru'
  const categories = isRu ? faqRu : faqUz
  const telegramLink = useTelegramLink()
  const telegramHandle = useTelegramHandle()
  const supportPhone = useSupportPhone()
  const email = useSupportEmail()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 leading-tight">
                {isRu ? 'Часто задаваемые вопросы' : "Ko'p so'raladigan savollar"}
              </h1>
              <p className="mt-1 text-[15px] text-gray-500">
                {isRu ? 'Последнее обновление: 11 апреля 2026 г.' : "So'nggi yangilanish: 2026-yil, 11-aprel"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <article className="space-y-10 text-[15px] leading-[1.75] text-gray-700">

          {/* Intro callout */}
          <div className="border-l-4 border-orange-400 pl-4 py-1 text-gray-600">
            <p>
              {isRu
                ? 'Здесь собраны ответы на самые популярные вопросы о платформе TOPLA — оформление заказов, доставка, оплата, возврат и многое другое. Если вы не нашли ответ, свяжитесь с нами через Telegram или по телефону.'
                : "Bu yerda TOPLA platformasi haqida eng ko'p so'raladigan savollarga javoblar to'plangan — buyurtma berish, yetkazish, to'lov, qaytarish va boshqalar. Javob topolmasangiz, Telegram yoki telefon orqali biz bilan bog'laning."}
            </p>
          </div>

          {/* FAQ sections */}
          {categories.map((cat, ci) => (
            <section key={ci}>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span>{cat.emoji}</span> {cat.title}
              </h2>
              <div className="mt-2 rounded-xl border border-gray-100 divide-y divide-gray-100 px-4">
                {cat.items.map((item, i) => (
                  <FaqAccordion key={i} item={item} />
                ))}
              </div>
              {ci < categories.length - 1 && <hr className="border-gray-200 mt-8" />}
            </section>
          ))}

          <hr className="border-gray-200" />

          {/* Contact section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Не нашли ответ?' : 'Javob topolmadingizmi?'}
            </h2>
            <p className="mb-4 text-gray-600">
              {isRu
                ? 'Свяжитесь с нашей командой поддержки — мы ответим в течение 5 минут.'
                : "Qo'llab-quvvatlash jamoamizga murojaat qiling — 5 daqiqa ichida javob beramiz."}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium hover:bg-sky-100 transition-colors"
              >
                Telegram {telegramHandle}
              </a>
              <a
                href={`tel:+${supportPhone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                {supportPhone}
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-50 text-orange-600 text-sm font-medium hover:bg-orange-100 transition-colors"
              >
                {email}
              </a>
            </div>
          </section>

          {/* Useful links */}
          <section className="pb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? 'Полезные ссылки' : 'Foydali havolalar'}
            </h2>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-primary hover:underline">
                  {isRu ? '→ Центр помощи' : '→ Yordam markazi'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-primary hover:underline">
                  {isRu ? '→ Пользовательское соглашение' : '→ Foydalanish shartlari'}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-primary hover:underline">
                  {isRu ? '→ Политика конфиденциальности' : '→ Maxfiylik siyosati'}
                </Link>
              </li>
            </ul>
          </section>

        </article>
      </div>
    </div>
  )
}

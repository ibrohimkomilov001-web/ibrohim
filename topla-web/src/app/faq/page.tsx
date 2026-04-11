'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, Search } from 'lucide-react'
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

function FaqQuestion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2.5 text-left group"
      >
        <ChevronDown className={`w-4 h-4 text-blue-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`} />
        <span className="text-[15px] text-blue-600 group-hover:text-blue-700 transition-colors">{item.q}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-6 pb-3 text-[14px] text-gray-600 leading-relaxed">{item.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqPage() {
  const locale = useLocaleStore((s) => s.locale)
  const isRu = locale === 'ru'
  const allCategories = isRu ? faqRu : faqUz
  const telegramLink = useTelegramLink()
  const telegramHandle = useTelegramHandle()
  const supportPhone = useSupportPhone()
  const email = useSupportEmail()

  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<number | null>(null)

  const categories = useMemo(() => {
    if (!search.trim()) return allCategories
    const q = search.toLowerCase()
    return allCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [search, allCategories])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto px-4 py-10 md:py-14">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {isRu ? 'Часто задаваемые вопросы' : "Ko'p so'raladigan savollar"}
          </h1>
          <p className="mt-2 text-blue-100 text-[15px]">
            {isRu
              ? 'Ответы на популярные вопросы о TOPLA.UZ'
              : "TOPLA.UZ platformasi haqida savollar va javoblar"}
          </p>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRu ? 'Поиск по вопросам...' : 'Savollarni qidirish...'}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/15 backdrop-blur text-white placeholder:text-blue-200 border border-white/20 outline-none focus:bg-white/25 transition-colors text-[15px]"
            />
          </div>
        </div>
      </div>

      {/* Quick nav */}
      {!search && (
        <div className="border-b border-gray-100 bg-gray-50/50">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-1 py-3 overflow-x-auto no-scrollbar">
              {allCategories.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSection(i)
                    document.getElementById(`faq-section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    activeSection === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat.emoji} {cat.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ sections */}
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-[15px]">
              {isRu ? 'Ничего не найдено' : 'Hech narsa topilmadi'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat, ci) => (
              <section key={ci} id={`faq-section-${ci}`} className="scroll-mt-20">
                <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <span>{cat.emoji}</span> {cat.title}
                </h2>
                <div className="border-l-2 border-gray-100 pl-2">
                  {cat.items.map((item, i) => (
                    <FaqQuestion key={i} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Contact */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900 mb-2">
            {isRu ? 'Не нашли ответ?' : 'Javob topolmadingizmi?'}
          </h2>
          <p className="text-[14px] text-gray-500 mb-4">
            {isRu
              ? 'Свяжитесь с поддержкой — ответим за 5 минут.'
              : "Qo'llab-quvvatlash bilan bog'laning — 5 daqiqada javob beramiz."}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              {telegramHandle}
            </a>
            <a
              href={`tel:+${supportPhone.replace(/\D/g, '')}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              📞 {supportPhone}
            </a>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              ✉️ {email}
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 pb-8 flex flex-wrap gap-4 text-sm">
          <Link href="/help" className="text-blue-600 hover:underline">
            {isRu ? 'Центр помощи →' : 'Yordam markazi →'}
          </Link>
          <Link href="/terms" className="text-blue-600 hover:underline">
            {isRu ? 'Соглашение →' : 'Foydalanish shartlari →'}
          </Link>
          <Link href="/privacy" className="text-blue-600 hover:underline">
            {isRu ? 'Конфиденциальность →' : 'Maxfiylik siyosati →'}
          </Link>
        </div>
      </div>
    </div>
  )
}

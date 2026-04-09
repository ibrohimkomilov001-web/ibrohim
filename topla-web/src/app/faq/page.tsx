import type { Metadata } from 'next'
import { SupportPhoneLink } from '@/hooks/useSettings'

export const metadata: Metadata = {
  title: "Ko'p so'raladigan savollar - TOPLA",
  description: "TOPLA ilovasi haqida ko'p so'raladigan savollar va javoblar. Buyurtma, yetkazib berish, to'lov, qaytarish va boshqa savollar.",
}

const faqCategories = [
  {
    emoji: '🛒',
    title: 'Buyurtma berish',
    color: 'orange',
    questions: [
      {
        q: 'Qanday qilib buyurtma beraman?',
        a: [
          'Kerakli mahsulotni tanlang va "Savatga qo\'shish" tugmasini bosing.',
          'Savatga o\'ting va buyurtma tarkibini tekshiring.',
          '"Buyurtma berish" tugmasini bosing.',
          'Yetkazib berish manzilini kiriting.',
          'To\'lov usulini tanlang va buyurtmani tasdiqlang.',
        ],
        note: 'Buyurtma tasdiqlangandan so\'ng sizga SMS orqali bildirishnoma yuboriladi.',
      },
      {
        q: 'Buyurtmani bekor qilsam bo\'ladimi?',
        a: [
          '"Yangi" holatda — bepul bekor qilish mumkin.',
          '"Tayyorlanmoqda" holatda — qo\'llab-quvvatlash xizmatiga murojaat qiling.',
          '"Yo\'lda" holatda — bekor qilish imkoni yo\'q.',
        ],
        note: 'Bekor qilish uchun: Profilim → Buyurtmalarim → Buyurtmani tanlang → "Bekor qilish".',
      },
      {
        q: 'Minimal buyurtma summasi bormi?',
        a: [
          'Minimal buyurtma summasi yo\'q.',
          'Siz istalgan miqdordagi mahsulotni buyurtma qilishingiz mumkin.',
          'Lekin yetkazib berish narxi buyurtma summasiga qarab hisoblanadi.',
        ],
      },
      {
        q: 'Buyurtma holatini qanday kuzataman?',
        a: [
          'Ilovada: Profilim → Buyurtmalarim',
          'SMS orqali: Har bir holat o\'zgarganda SMS yuboriladi',
          'Push-bildirishnoma orqali: Ilovada bildirishnomalarni yoqing',
        ],
      },
    ],
  },
  {
    emoji: '🚚',
    title: 'Yetkazib berish',
    color: 'blue',
    questions: [
      {
        q: 'Yetkazib berish qancha vaqt oladi?',
        a: [
          'Toshkent shahri: 1-3 ish kuni',
          'Viloyat markazlari: 2-5 ish kuni',
          'Tuman va qishloqlar: 3-7 ish kuni',
        ],
        note: 'Aniq muddat mahsulot turi va do\'kon joylashuviga bog\'liq. Buyurtma sahifasida taxminiy yetkazib berish sanasi ko\'rsatiladi.',
      },
      {
        q: 'Yetkazib berish narxi qancha?',
        a: [
          'Yetkazib berish narxi buyurtma summasiga qarab belgilanadi.',
          'Aniq narx buyurtma rasmiylashtirilayotganda ko\'rsatiladi.',
          'Ba\'zi aksiya va maxsus kunlarda yetkazib berish bepul bo\'lishi mumkin.',
        ],
      },
      {
        q: 'Yetkazib berish manzilini o\'zgartira olamanmi?',
        a: [
          'Buyurtma "Yangi" holatida bo\'lsa, manzilni o\'zgartirishingiz mumkin.',
          'Buning uchun qo\'llab-quvvatlash xizmatiga yozing.',
          'Yoki buyurtmani bekor qilib, yangi manzilga qayta buyurtma bering.',
        ],
      },
    ],
  },
  {
    emoji: '💳',
    title: 'To\'lov',
    color: 'green',
    questions: [
      {
        q: 'Qanday to\'lov usullari mavjud?',
        a: [
          '💳 UzCard / Humo kartasi',
          '💰 Naqd pul (yetkazib berishda)',
        ],
        note: 'To\'lov xavfsizligi kafolatlanadi.',
      },
      {
        q: 'To\'lov xavfsizmi?',
        a: [
          'Barcha to\'lovlar shifrlangan aloqa kanali orqali amalga oshiriladi.',
          'Sizning karta ma\'lumotlaringiz serverlarimizda saqlanmaydi.',
          'To\'lov tizimlari xavfsizlik sertifikatlariga ega.',
        ],
      },
      {
        q: 'Pul qaytarilishi qancha vaqt oladi?',
        a: [
          'Karta orqali to\'langan bo\'lsa: 1-3 ish kuni ichida kartaga qaytariladi.',
          'Naqd to\'langan bo\'lsa: yetkazib beruvchi orqali qaytariladi.',
        ],
        note: 'Agar pul belgilangan muddatda qaytmasa, qo\'llab-quvvatlash xizmatiga murojaat qiling.',
      },
    ],
  },
  {
    emoji: '🔄',
    title: 'Qaytarish va almashtirish',
    color: 'purple',
    questions: [
      {
        q: 'Mahsulotni qaytarish mumkinmi?',
        a: [
          'Ha, mahsulotni qabul qilgan kundan boshlab 7 kun ichida qaytarishingiz mumkin.',
        ],
        note: 'Shartlari: Mahsulot ishlatilmagan, original qadoqda, etiketka va yorliqlar saqlanishi kerak. Qaytarish uchun: Profilim → Buyurtmalarim → Buyurtmani tanlang → "Qaytarish".',
      },
      {
        q: 'Qaysi mahsulotlarni qaytarib bo\'lmaydi?',
        a: [
          'Shaxsiy gigiena mahsulotlari',
          'Ichki kiyimlar',
          'Atir-upa mahsulotlari (ochilgan)',
          'Oziq-ovqat mahsulotlari',
          'Maxsus buyurtma asosida tayyorlangan mahsulotlar',
        ],
      },
      {
        q: 'Nuqsonli mahsulot kelsa nima qilaman?',
        a: [
          'Mahsulotni suratga oling.',
          'Yordam chatiga yozing va suratni yuboring.',
          'Biz 24 soat ichida javob beramiz.',
        ],
        note: 'Nuqsonli mahsulot uchun to\'liq qaytarish yoki almashtirish kafolatlanadi.',
      },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Hisob va xavfsizlik',
    color: 'teal',
    questions: [
      {
        q: 'Ro\'yxatdan qanday o\'taman?',
        a: [
          'Ilovani oching.',
          'Telefon raqamingizni kiriting.',
          'SMS orqali kelgan kodni tasdiqlang.',
          'Ism va familiyangizni kiriting.',
        ],
        note: 'Tayyor! Endi xarid qilishingiz mumkin.',
      },
      {
        q: 'Telefon raqamimni o\'zgartira olamanmi?',
        a: [
          'Hozircha telefon raqamni ilova orqali o\'zgartirib bo\'lmaydi.',
          'Raqamni o\'zgartirish uchun qo\'llab-quvvatlash xizmatiga murojaat qiling.',
        ],
      },
      {
        q: 'Shaxsiy ma\'lumotlarim xavfsizmi?',
        a: [
          'Barcha ma\'lumotlar shifrlangan holda saqlanadi.',
          'Uchinchi tomonlarga ma\'lumot berilmaydi.',
          'Maxfiylik siyosatimiz O\'zbekiston qonunchiligiga mos.',
        ],
        note: 'Batafsil ma\'lumot uchun Maxfiylik siyosati sahifasini o\'qing.',
      },
    ],
  },
  {
    emoji: '⚙️',
    title: 'Texnik savollar',
    color: 'gray',
    questions: [
      {
        q: 'Ilova ishlamayapti, nima qilaman?',
        a: [
          'Internetga ulanishni tekshiring.',
          'Ilovani yopib, qayta oching.',
          'Ilovani eng so\'nggi versiyaga yangilang.',
          'Telefonni qayta ishga tushiring.',
        ],
        note: 'Muammo davom etsa, yordam chatiga yozing.',
      },
      {
        q: 'Bildirishnomalarni qanday yoqaman?',
        a: [
          'Telefon Sozlamalari → Ilovalar → TOPLA',
          'Bildirishnomalar → Ruxsat berish',
        ],
        note: 'Shundan so\'ng buyurtma holati, aksiyalar va yangiliklar haqida bildirishnomalar olasiz.',
      },
      {
        q: 'Ilova qaysi qurilmalarda ishlaydi?',
        a: [
          'Android: 6.0 (Marshmallow) va undan yuqori',
          'iOS: 13.0 va undan yuqori',
        ],
        note: 'Ilovaning eng so\'nggi versiyasini Google Play yoki App Store\'dan yuklab olishingiz mumkin.',
      },
    ],
  },
]

const colorMap: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'text-orange-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', text: 'text-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-500', text: 'text-purple-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-500', text: 'text-teal-700' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-500', text: 'text-gray-700' },
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            Ko&apos;p So&apos;raladigan Savollar
          </h1>
          <p className="text-center mt-2 text-orange-100">
            TOPLA ilovasi haqida eng ko&apos;p beriladigan savollar va javoblar
          </p>
        </div>
      </header>

      {/* Quick nav */}
      <div className="container mx-auto px-4 -mt-6 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {faqCategories.map((cat, i) => (
              <a
                key={i}
                href={`#cat-${i}`}
                className={`flex items-center gap-3 p-3 rounded-xl ${colorMap[cat.color].bg} border ${colorMap[cat.color].border} hover:shadow-md transition-all`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className={`text-sm font-semibold ${colorMap[cat.color].text}`}>{cat.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {faqCategories.map((cat, catIdx) => {
          const colors = colorMap[cat.color]
          return (
            <section key={catIdx} id={`cat-${catIdx}`} className="scroll-mt-8">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Category header */}
                <div className={`px-6 py-5 ${colors.bg} border-b ${colors.border}`}>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    {cat.title}
                    <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge} text-white`}>
                      {cat.questions.length} savol
                    </span>
                  </h2>
                </div>

                {/* Questions */}
                <div className="divide-y divide-gray-100">
                  {cat.questions.map((faq, qIdx) => (
                    <details key={qIdx} className="group">
                      <summary className="flex items-start gap-4 px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-lg ${colors.badge} text-white flex items-center justify-center text-sm font-bold mt-0.5`}>
                          {qIdx + 1}
                        </span>
                        <span className="flex-1 font-semibold text-gray-800 text-[15px] leading-relaxed">
                          {faq.q}
                        </span>
                        <svg
                          className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0 transition-transform group-open:rotate-180"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-6 pb-5 pl-[4.25rem]">
                        <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                          <ul className="space-y-2">
                            {faq.a.map((item, aIdx) => (
                              <li key={aIdx} className="flex items-start gap-2 text-gray-700 text-sm leading-relaxed">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.badge} flex-shrink-0`}></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                          {faq.note && (
                            <p className={`mt-3 pt-3 border-t ${colors.border} text-sm ${colors.text} font-medium`}>
                              💡 {faq.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          )
        })}

        {/* Contact section */}
        <section className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Savolingizga javob topmadingizmi?
            </h2>
            <p className="text-gray-500 mb-6">
              Qo&apos;llab-quvvatlash xizmatimiz sizga yordam berishga tayyor
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://t.me/topla_uz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                Telegram orqali yozing
              </a>
              <SupportPhoneLink
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </SupportPhoneLink>
            </div>
          </div>
        </section>
      </main>

      {/* Back to app */}
      <div className="text-center pb-12">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Bosh sahifaga qaytish
        </a>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari - TOPLA',
  description: 'TOPLA ilovasining foydalanish shartlari va qoidalari',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            Foydalanish Shartlari
          </h1>
          <p className="text-center mt-2 text-orange-100">
            So&apos;nggi yangilanish: 2026-yil, 5-fevral
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 space-y-8">
          
          {/* 1. Umumiy qoidalar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Umumiy qoidalar
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                1.1. Ushbu Foydalanish shartlari (&quot;Shartnoma&quot;) TOPLA mobil ilovasidan (&quot;Ilova&quot;) 
                foydalanish qoidalarini belgilaydi.
              </p>
              <p>
                1.2. Ilovani yuklab olish, o&apos;rnatish yoki foydalanish orqali siz ushbu Shartnoma 
                shartlariga rozilik bildirasiz.
              </p>
              <p>
                1.3. Agar siz ushbu shartlarga rozi bo&apos;lmasangiz, ilovadan foydalanmang.
              </p>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-sm text-gray-700">
                  <strong>Ilova operatori:</strong> TOPLA MCHJ<br />
                  <strong>STIR:</strong> 123456789<br />
                  <strong>Manzil:</strong> Toshkent shahri, O&apos;zbekiston
                </p>
              </div>
            </div>
          </section>

          {/* 2. Xizmatlar tavsifi */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Xizmatlar tavsifi
            </h2>
            <p className="text-gray-600 mb-4">TOPLA ilovasi quyidagi xizmatlarni taqdim etadi:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: '🛒', title: 'Onlayn xarid', desc: 'Turli kategoriyalardagi mahsulotlarni sotib olish' },
                { icon: '🚚', title: 'Yetkazib berish', desc: 'Buyurtmalarni manzilingizga yetkazish' },
                { icon: '💳', title: 'Onlayn to\'lov', desc: 'Click, Payme va boshqa usullar orqali to\'lash' },
                { icon: '⭐', title: 'Bonuslar', desc: 'Cashback va aksiyalardan foydalanish' },
              ].map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Ro'yxatdan o'tish */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Ro&apos;yxatdan o&apos;tish va hisob
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>3.1. Ilovadan to&apos;liq foydalanish uchun ro&apos;yxatdan o&apos;tish talab qilinadi.</p>
              <p>3.2. Ro&apos;yxatdan o&apos;tish 18 yoshdan katta shaxslar uchun.</p>
              <p>3.3. Siz telefon raqami yoki Google hisobi orqali ro&apos;yxatdan o&apos;tishingiz mumkin.</p>
              <p>3.4. Hisob ma&apos;lumotlarining to&apos;g&apos;riligiga siz javobgarsiz.</p>
              <p>3.5. Bir shaxs faqat bitta hisob ochishi mumkin.</p>
              
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>⚠️ Ogohlantirish:</strong> Hisob ma&apos;lumotlaringizni boshqalar bilan 
                  ulashmang. Hisobingiz xavfsizligi uchun siz javobgarsiz.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Buyurtma va to'lov */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
              Buyurtma va to&apos;lov
            </h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">4.1. Buyurtma berish</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Mahsulotni tanlang va savatga qo&apos;shing</li>
                  <li>Yetkazib berish manzilini kiriting</li>
                  <li>To&apos;lov usulini tanlang</li>
                  <li>Buyurtmani tasdiqlang</li>
                </ul>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">4.2. To&apos;lov usullari</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Naqd pul (yetkazib berishda)</li>
                  <li>Click orqali</li>
                  <li>Payme orqali</li>
                  <li>Bank kartasi</li>
                </ul>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">4.3. Narxlar</h3>
                <p className="text-gray-600 text-sm">
                  Barcha narxlar O&apos;zbekiston so&apos;mida ko&apos;rsatilgan va QQS ni o&apos;z ichiga oladi.
                  Narxlar ogohlantirishsiz o&apos;zgarishi mumkin, ammo buyurtma berilgandan keyin 
                  narx o&apos;zgarmaydi.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Yetkazib berish */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">5</span>
              Yetkazib berish
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>5.1. Yetkazib berish muddati 1-3 ish kunini tashkil etadi (shahar ichida).</p>
              <p>5.2. Yetkazib berish narxi buyurtma summasiga qarab hisoblanadi.</p>
              <p>5.3. Minimal buyurtma summasi ustidan bepul yetkazib berish mavjud.</p>
              <p>5.4. Buyurtmachi ko&apos;rsatilgan vaqtda manzilda bo&apos;lishi kerak.</p>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-orange-50">
                      <th className="border border-gray-200 p-3 text-left">Buyurtma summasi</th>
                      <th className="border border-gray-200 p-3 text-left">Yetkazib berish narxi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 p-3">200,000 so&apos;m dan kam</td>
                      <td className="border border-gray-200 p-3">15,000 so&apos;m</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 p-3">200,000 - 500,000 so&apos;m</td>
                      <td className="border border-gray-200 p-3">10,000 so&apos;m</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 p-3">500,000 so&apos;m dan ko&apos;p</td>
                      <td className="border border-gray-200 p-3 text-green-600 font-semibold">Bepul</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 6. Qaytarish va almashtirish */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">6</span>
              Qaytarish va almashtirish
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Qaytarish mumkin:</h3>
                <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                  <li>Mahsulotda nuqson bo&apos;lsa - 14 kun ichida</li>
                  <li>Noto&apos;g&apos;ri mahsulot yuborilgan bo&apos;lsa - darhol</li>
                  <li>Mahsulot tavsifga mos kelmasa - 7 kun ichida</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">❌ Qaytarish mumkin emas:</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                  <li>Shaxsiy gigiena mahsulotlari</li>
                  <li>Ochilgan kosmetika</li>
                  <li>Maxsus buyurtma qilingan mahsulotlar</li>
                  <li>Promo kodlar va sovg&apos;a kartlari</li>
                </ul>
              </div>

              <p className="text-gray-600 text-sm">
                Qaytarish uchun qadoq va hujjatlar saqlanishi kerak. Pul mablag&apos;lari 3-5 ish kunida 
                qaytariladi.
              </p>
            </div>
          </section>

          {/* 7. Foydalanuvchi majburiyatlari */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">7</span>
              Foydalanuvchi majburiyatlari
            </h2>
            <p className="text-gray-600 mb-4">Siz ilovadan foydalanishda quyidagilarga rioya qilishingiz kerak:</p>
            <ul className="space-y-2">
              {[
                'O\'zbekiston Respublikasi qonunlariga rioya qilish',
                'To\'g\'ri va aniq ma\'lumotlar kiritish',
                'Boshqalar huquqlarini hurmat qilish',
                'Ilovadan noqonuniy maqsadlarda foydalanmaslik',
                'Firibgarlik va aldovdan saqlaning',
                'Hisob ma\'lumotlarini xavfsiz saqlash',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 8. Taqiqlangan harakatlar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">8</span>
              Taqiqlangan harakatlar
            </h2>
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <ul className="space-y-2 text-red-700">
                {[
                  'Soxta buyurtmalar berish',
                  'Ilovani buzish yoki hack qilishga urinish',
                  'Boshqalar hisobidan foydalanish',
                  'Spam va reklama tarqatish',
                  'Noqonuniy mahsulotlarni sotish yoki sotib olish',
                  'Ilovani reverse-engineering qilish',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              Bu qoidalarni buzish hisobni bloklash va huquqiy choralarga olib kelishi mumkin.
            </p>
          </section>

          {/* 9. Javobgarlik chegarasi */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">9</span>
              Javobgarlik chegarasi
            </h2>
            <div className="space-y-3 text-gray-600 text-sm">
              <p>
                9.1. Ilova &quot;boricha&quot; (as is) taqdim etiladi. Biz ilovaning uzluksiz va 
                xatosiz ishlashiga kafolat bermaymiz.
              </p>
              <p>
                9.2. Biz uchinchi tomon xizmatlari (to&apos;lov tizimlari, yetkazib berish) uchun 
                javobgar emasmiz.
              </p>
              <p>
                9.3. Force majeure holatlarida (tabiiy ofatlar, urush, karantin) yetkazib berish 
                kechikishi mumkin.
              </p>
              <p>
                9.4. Bizning javobgarligimiz buyurtma summasidan oshmasligi kerak.
              </p>
            </div>
          </section>

          {/* 10. Shartnomaga o'zgartirish */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">10</span>
              Shartnomaga o&apos;zgartirish
            </h2>
            <p className="text-gray-600">
              Biz ushbu shartlarni istalgan vaqtda o&apos;zgartirish huquqini saqlab qolamiz. 
              O&apos;zgarishlar ilovada e&apos;lon qilinadi. O&apos;zgarishlardan keyin ilovadan 
              foydalanishni davom ettirsangiz, yangi shartlarga rozilik bildirgan hisoblanasiz.
            </p>
          </section>

          {/* 11. Nizolarni hal qilish */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">11</span>
              Nizolarni hal qilish
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>11.1. Nizolar birinchi navbatda muzokaralar orqali hal qilinadi.</p>
              <p>11.2. Muzokaralar natija bermasa, nizolar O&apos;zbekiston Respublikasi qonunchiligi asosida sudda ko&apos;riladi.</p>
              <p>11.3. Ushbu shartnomaga O&apos;zbekiston Respublikasi qonunlari tatbiq etiladi.</p>
            </div>
          </section>

          {/* 12. Aloqa */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">12</span>
              Biz bilan bog&apos;lanish
            </h2>
            <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
              <p className="text-gray-700 mb-4">
                Savollar yoki shikoyatlar uchun:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:support@topla.uz" className="text-orange-600 hover:underline font-medium">
                    support@topla.uz
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+998901234567" className="text-orange-600 hover:underline font-medium">
                    +998 90 123 45 67
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <a href="https://t.me/topla_support" className="text-orange-600 hover:underline font-medium">
                    @topla_support (Telegram)
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer note */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Ushbu foydalanish shartlari 2026-yil 5-fevraldan kuchga kiradi.
              Ilovadan foydalanish orqali siz ushbu shartlarga roziligingizni tasdiqlaysiz.
            </p>
          </div>
        </div>
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

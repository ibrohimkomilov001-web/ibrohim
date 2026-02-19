import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati - TOPLA',
  description: 'TOPLA ilovasining maxfiylik siyosati va shaxsiy ma\'lumotlar himoyasi',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            Maxfiylik Siyosati
          </h1>
          <p className="text-center mt-2 text-orange-100">
            So'nggi yangilanish: 2026-yil, 5-fevral
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 space-y-8">
          
          {/* 1. Kirish */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Kirish
            </h2>
            <p className="text-gray-600 leading-relaxed">
              TOPLA mobil ilovasi (&quot;Ilova&quot;) foydalanuvchilarning shaxsiy ma&apos;lumotlarini himoya qilishga alohida e&apos;tibor qaratadi. 
              Ushbu Maxfiylik siyosati biz qanday ma&apos;lumotlarni to&apos;plashimiz, ulardan qanday foydalanishimiz va 
              qanday himoya qilishimiz haqida batafsil ma&apos;lumot beradi.
            </p>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm text-gray-700">
                <strong>Ilova operatori:</strong> TOPLA MCHJ<br />
                <strong>STIR:</strong> 123456789<br />
                <strong>Manzil:</strong> Toshkent shahri, O&apos;zbekiston
              </p>
            </div>
          </section>

          {/* 2. To'planadigan ma'lumotlar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
              To&apos;planadigan ma&apos;lumotlar
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">2.1. Shaxsiy ma&apos;lumotlar</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Ism va familiya</li>
                  <li>Telefon raqami</li>
                  <li>Elektron pochta manzili</li>
                  <li>Yetkazib berish manzillari</li>
                  <li>Profil rasmi (ixtiyoriy)</li>
                </ul>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">2.2. Texnik ma&apos;lumotlar</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Qurilma turi va modeli</li>
                  <li>Operatsion tizim versiyasi</li>
                  <li>IP manzil</li>
                  <li>Ilova versiyasi</li>
                  <li>Joylashuv ma&apos;lumotlari (faqat yetkazib berish uchun)</li>
                </ul>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">2.3. Tranzaksiya ma&apos;lumotlari</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Buyurtma tarixi</li>
                  <li>To&apos;lov usuli (karta raqami saqlanmaydi)</li>
                  <li>Sevimli mahsulotlar</li>
                  <li>Savat tarixi</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Ma'lumotlardan foydalanish */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Ma&apos;lumotlardan foydalanish
            </h2>
            <p className="text-gray-600 mb-4">Sizning ma&apos;lumotlaringiz quyidagi maqsadlarda ishlatiladi:</p>
            <ul className="space-y-2">
              {[
                'Buyurtmalarni qayta ishlash va yetkazib berish',
                'Hisob qaydnomasini yaratish va boshqarish',
                'Mijozlarga xizmat ko\'rsatish',
                'Ilova xavfsizligini ta\'minlash',
                'Ilovani takomillashtirish va personalizatsiya',
                'Yangiliklar va aksiyalar haqida xabar berish (rozilik bilan)',
                'Qonuniy talablarni bajarish'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Ma'lumotlar xavfsizligi */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
              Ma&apos;lumotlar xavfsizligi
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-semibold text-green-800">SSL/TLS shifrlash</span>
                </div>
                <p className="text-sm text-green-700">Barcha ma&apos;lumotlar shifrlangan holda uzatiladi</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-semibold text-blue-800">Xavfsiz saqlash</span>
                </div>
                <p className="text-sm text-blue-700">Ma&apos;lumotlar himoyalangan serverlarda saqlanadi</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span className="font-semibold text-purple-800">Biometrik autentifikatsiya</span>
                </div>
                <p className="text-sm text-purple-700">Face ID va Touch ID bilan qo&apos;shimcha himoya</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-semibold text-orange-800">Muntazam audit</span>
                </div>
                <p className="text-sm text-orange-700">Xavfsizlik muntazam tekshiriladi</p>
              </div>
            </div>
          </section>

          {/* 5. Uchinchi tomonlar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">5</span>
              Uchinchi tomonlar bilan almashish
            </h2>
            <p className="text-gray-600 mb-4">
              Sizning ma&apos;lumotlaringiz quyidagi hollarda uchinchi tomonlar bilan almashilishi mumkin:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 bg-orange-500 text-white rounded text-xs flex items-center justify-center font-bold">1</span>
                <div>
                  <strong className="text-gray-800">Yetkazib berish xizmati:</strong>
                  <p className="text-gray-600 text-sm">Buyurtmangizni yetkazib berish uchun manzil va aloqa ma&apos;lumotlari</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 bg-orange-500 text-white rounded text-xs flex items-center justify-center font-bold">2</span>
                <div>
                  <strong className="text-gray-800">To&apos;lov provayderlari:</strong>
                  <p className="text-gray-600 text-sm">Click, Payme orqali xavfsiz to&apos;lovlar (karta ma&apos;lumotlari saqlanmaydi)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 bg-orange-500 text-white rounded text-xs flex items-center justify-center font-bold">3</span>
                <div>
                  <strong className="text-gray-800">Qonuniy talablar:</strong>
                  <p className="text-gray-600 text-sm">Davlat organlari so&apos;rovi bo&apos;yicha (qonun talab qilganda)</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Biz sizning ma&apos;lumotlaringizni hech qachon reklama maqsadlarida uchinchi tomonlarga sotmaymiz!
              </p>
            </div>
          </section>

          {/* 6. Sizning huquqlaringiz */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">6</span>
              Sizning huquqlaringiz
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Ko\'rish', desc: 'O\'z ma\'lumotlaringizni ko\'rish' },
                { title: 'Tahrirlash', desc: 'Ma\'lumotlarni yangilash va o\'zgartirish' },
                { title: 'O\'chirish', desc: 'Hisobni to\'liq o\'chirish' },
                { title: 'Rozi bo\'lmaslik', desc: 'Marketing xabarlaridan voz kechish' },
              ].map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Saqlash muddati */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">7</span>
              Ma&apos;lumotlarni saqlash muddati
            </h2>
            <p className="text-gray-600 mb-4">
              Ma&apos;lumotlaringiz quyidagi muddatlarda saqlanadi:
            </p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left">Ma&apos;lumot turi</th>
                  <th className="border border-gray-200 p-3 text-left">Saqlash muddati</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3">Hisob ma&apos;lumotlari</td>
                  <td className="border border-gray-200 p-3">Hisob faol bo&apos;lguncha</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-3">Buyurtma tarixi</td>
                  <td className="border border-gray-200 p-3">3 yil</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">Texnik loglar</td>
                  <td className="border border-gray-200 p-3">90 kun</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 8. Aloqa */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">8</span>
              Biz bilan bog&apos;lanish
            </h2>
            <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
              <p className="text-gray-700 mb-4">
                Maxfiylik siyosati bo&apos;yicha savollar yoki shikoyatlar uchun:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:privacy@topla.uz" className="text-orange-600 hover:underline font-medium">
                    privacy@topla.uz
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
              Ushbu maxfiylik siyosati 2026-yil 5-fevraldan kuchga kiradi va oldingi barcha versiyalarni bekor qiladi.
              Siyosatga o&apos;zgartirishlar kiritilganda, ilovada xabar beramiz.
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

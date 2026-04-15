import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Akkauntni o\'chirish | Topla.uz',
  description: 'Topla.uz ilovasidagi akkauntingizni va shaxsiy ma\'lumotlaringizni o\'chirish bo\'yicha ko\'rsatmalar.',
}

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-orange-500 hover:text-orange-600 text-sm font-medium mb-4 inline-block">
            ← Topla.uz
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Akkauntni o&apos;chirish
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Account deletion / Удаление аккаунта
          </p>
        </div>

        {/* In-app instructions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📱</span>
            Ilova orqali o&apos;chirish (tavsiya etiladi)
          </h2>
          <ol className="space-y-3 text-gray-700 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">1</span>
              <span>Topla ilovasini oching va tizimga kiring</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">2</span>
              <span><strong>Profilim</strong> bo&apos;limiga o&apos;ting (pastki menyu)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">3</span>
              <span><strong>Profil tahrirlash</strong> tugmasini bosing</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">4</span>
              <span>Pastga suring va <strong className="text-red-600">Akkauntni o&apos;chirish</strong> tugmasini bosing</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">5</span>
              <span>Tasdiqlash so&apos;rovini qabul qiling — akkauntingiz darhol o&apos;chiriladi</span>
            </li>
          </ol>
        </div>

        {/* What gets deleted */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🗑️</span>
            Qanday ma&apos;lumotlar o&apos;chiriladi?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-red-500 mt-0.5">✗</span>
              <span>Profil ma&apos;lumotlari (ism, rasm, telefon)</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-red-500 mt-0.5">✗</span>
              <span>Manzillar va yetkazish ma&apos;lumotlari</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-red-500 mt-0.5">✗</span>
              <span>Saqlangan kartalar</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-red-500 mt-0.5">✗</span>
              <span>Sevimlilar ro&apos;yxati</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-red-500 mt-0.5">✗</span>
              <span>Promo kodlar</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-orange-500 mt-0.5">!</span>
              <span>Buyurtma tarixi — qonuniy talab asosida 3 yil saqlanadi</span>
            </div>
          </div>
        </div>

        {/* Contact support */}
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Muammo bormi? Bizga murojaat qiling
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Ilovaga kira olmasangiz yoki boshqa muammolar bo&apos;lsa, qo&apos;llab-quvvatlash xizmatimizga murojaat qiling.
          </p>
          <div className="space-y-2 text-sm">
            <a
              href="mailto:support@topla.uz"
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <span>✉️</span> support@topla.uz
            </a>
            <a
              href="https://t.me/toplasupport"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <span>📨</span> Telegram: @toplasupport
            </a>
          </div>
        </div>

        {/* English / Russian note */}
        <div className="bg-gray-100 rounded-2xl p-6 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-2">English / Русский</p>
          <p className="mb-2">
            <strong>To delete your Topla account:</strong> Open the app → Profile → Edit Profile → scroll down → tap &quot;Delete Account&quot; → confirm.
          </p>
          <p>
            <strong>Для удаления аккаунта:</strong> Откройте приложение → Профиль → Редактировать профиль → прокрутите вниз → нажмите «Удалить аккаунт» → подтвердите.
          </p>
        </div>
      </div>
    </main>
  )
}

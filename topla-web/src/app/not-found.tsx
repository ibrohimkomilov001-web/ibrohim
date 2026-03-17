import Link from 'next/link';

/**
 * not-found.tsx — 404 sahifa.
 * Mavjud bo'lmagan sahifaga kirganda ko'rsatiladi.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-violet-600 dark:text-violet-400 mb-4">
          404
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Sahifa topilmadi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Siz izlayotgan sahifa mavjud emas yoki ko&apos;chirilgan. Manzilni tekshiring yoki bosh sahifaga qayting.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
          >
            Bosh sahifa
          </Link>
          <Link
            href="/categories"
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Kategoriyalar
          </Link>
        </div>
      </div>
    </div>
  );
}

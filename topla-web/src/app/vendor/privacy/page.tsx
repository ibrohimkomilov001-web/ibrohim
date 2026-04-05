import Link from "next/link";

export default function VendorPrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold text-gray-900">Maxfiylik siyosati</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          Maxfiylik siyosati matni tez orada shu sahifaga joylanadi.
        </p>

        <div className="mt-8">
          <Link href="/vendor/register" className="text-blue-600 hover:underline">
            Ro'yxatdan o'tish sahifasiga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}

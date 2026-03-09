'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📶</div>
        <h1 className="text-2xl font-bold mb-2">Internet aloqasi yo&apos;q</h1>
        <p className="text-muted-foreground mb-6">
          Sahifani yuklash uchun internet aloqangizni tekshiring va qaytadan urinib ko&apos;ring.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
        >
          Qayta yuklash
        </button>
      </div>
    </div>
  );
}

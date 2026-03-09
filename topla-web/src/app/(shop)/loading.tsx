export default function ShopLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Yuklanmoqda...</span>
      </div>
    </div>
  );
}

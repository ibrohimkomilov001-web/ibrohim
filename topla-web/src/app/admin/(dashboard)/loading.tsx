export default function AdminLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Yuklanmoqda...</span>
      </div>
    </div>
  );
}

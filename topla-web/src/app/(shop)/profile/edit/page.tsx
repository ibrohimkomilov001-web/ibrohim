'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, MapPin, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useLocaleStore } from '@/store/locale-store';
import { userAuthApi } from '@/lib/api/user-auth';

const UZ_REGIONS = [
  "Toshkent shahri", "Toshkent viloyati", "Andijon", "Farg'ona",
  "Namangan", "Samarqand", "Buxoro", "Navoiy",
  "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo",
  "Xorazm", "Qoraqalpog'iston",
];

export default function EditProfilePage() {
  const router = useRouter();
  const { locale } = useLocaleStore();
  const { user, isAuthenticated, setUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/profile');
      return;
    }
    if (user) {
      setFullName(user.fullName || '');
      setGender(((user as any).gender as 'male' | 'female') || '');
      const bd = (user as any).birthDate;
      setBirthDate(bd ? new Date(bd).toISOString().split('T')[0] : '');
      setRegion((user as any).region || '');
    }
  }, [user, isAuthenticated, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError(locale === 'ru' ? 'Введите имя' : "Ismni kiriting");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, any> = { fullName: fullName.trim() };
      if (gender) payload.gender = gender;
      if (birthDate) payload.birthDate = new Date(birthDate).toISOString();
      if (region) payload.region = region;
      const updated = await userAuthApi.updateProfile(payload);
      setUser(updated);
      setSaved(true);
      setTimeout(() => router.back(), 600);
    } catch (err: any) {
      setError(err?.message || (locale === 'ru' ? 'Ошибка сохранения' : 'Saqlashda xatolik'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">
            {locale === 'ru' ? 'Редактировать профиль' : 'Profilni tahrirlash'}
          </h1>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/10 flex items-center justify-center">
              <User className="w-9 h-9 text-primary" />
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {locale === 'ru' ? 'Полное имя' : "To'liq ism"}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
                placeholder={locale === 'ru' ? 'Иван Иванов' : 'Ism Familiya'}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border border-border text-[16px] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone (readonly) */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {locale === 'ru' ? 'Телефон' : 'Telefon'}
            </label>
            <div className="w-full h-12 px-4 rounded-xl bg-muted/60 border border-border flex items-center text-[16px] text-muted-foreground">
              {user?.phone || '—'}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {locale === 'ru' ? 'Пол' : 'Jins'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? '' : g)}
                  className={`h-12 rounded-xl text-[15px] font-medium border transition-all ${
                    gender === g
                      ? 'bg-primary text-white border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  {g === 'male'
                    ? (locale === 'ru' ? 'Мужской' : 'Erkak')
                    : (locale === 'ru' ? 'Женский' : 'Ayol')}
                </button>
              ))}
            </div>
          </div>

          {/* Birth date */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {locale === 'ru' ? 'Дата рождения' : "Tug'ilgan sana"}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border border-border text-[16px] text-foreground focus:border-primary/40 focus:bg-background outline-none transition-all"
              />
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {locale === 'ru' ? 'Регион' : 'Viloyat'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border border-border text-[16px] text-foreground focus:border-primary/40 focus:bg-background outline-none transition-all appearance-none"
              >
                <option value="">{locale === 'ru' ? 'Выберите регион' : 'Viloyatni tanlang'}</option>
                {UZ_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={loading || saved || !fullName.trim()}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px] disabled:opacity-50 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {locale === 'ru' ? 'Сохранение...' : 'Saqlanmoqda...'}
              </>
            ) : saved ? (
              <>
                <Check className="w-5 h-5" />
                {locale === 'ru' ? 'Сохранено' : 'Saqlandi'}
              </>
            ) : (
              locale === 'ru' ? 'Сохранить' : 'Saqlash'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

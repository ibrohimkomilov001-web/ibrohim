'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useLocaleStore } from '@/store/locale-store';
import { userAuthApi } from '@/lib/api/user-auth';

export default function EditProfilePage() {
  const router = useRouter();
  const { locale } = useLocaleStore();
  const { user, isAuthenticated, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [genderOpen, setGenderOpen] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/profile');
      return;
    }
    if (user) {
      const u = user as any;
      if (u.firstName || u.lastName) {
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
      } else if (u.fullName) {
        const parts = String(u.fullName).trim().split(/\s+/);
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' '));
      }
      setGender((u.gender as 'male' | 'female') || '');
      const bd = u.birthDate;
      setBirthDate(bd ? new Date(bd).toISOString().split('T')[0] : '');
    }
  }, [user, isAuthenticated, router]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName.trim()) {
      setError(locale === 'ru' ? 'Введите имя' : "Ismni kiriting");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fn = firstName.trim();
      const ln = lastName.trim();
      const payload: Record<string, any> = {
        firstName: fn,
        lastName: ln,
        fullName: [fn, ln].filter(Boolean).join(' '),
      };
      if (gender) payload.gender = gender;
      if (birthDate) payload.birthDate = new Date(birthDate).toISOString();
      const updated = await userAuthApi.updateProfile(payload);
      setUser(updated);
      setSaved(true);
      setTimeout(() => router.back(), 500);
    } catch (err: any) {
      setError(err?.message || (locale === 'ru' ? 'Ошибка сохранения' : 'Saqlashda xatolik'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  const genderLabel = (g: 'male' | 'female' | '') =>
    g === 'male'
      ? (locale === 'ru' ? 'Мужской' : 'Erkak')
      : g === 'female'
      ? (locale === 'ru' ? 'Женский' : 'Ayol')
      : '';

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header: arrow only + checkmark save on right */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={locale === 'ru' ? 'Назад' : 'Orqaga'}
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={loading || saved || !firstName.trim()}
            className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label={locale === 'ru' ? 'Сохранить' : 'Saqlash'}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" strokeWidth={2.5} />}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          {/* First name */}
          <input
            type="text"
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); setError(''); }}
            placeholder={locale === 'ru' ? 'Имя' : 'Ism'}
            className="w-full h-14 px-5 rounded-full bg-gray-100 dark:bg-gray-900 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {/* Last name */}
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={locale === 'ru' ? 'Фамилия' : 'Familiya'}
            className="w-full h-14 px-5 rounded-full bg-gray-100 dark:bg-gray-900 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {/* Phone (readonly, pill) */}
          <div className="w-full h-14 px-5 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center text-[16px] text-muted-foreground">
            {user?.phone || '—'}
          </div>

          {/* Birth date (pill) */}
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
            placeholder={locale === 'ru' ? 'Дата рождения' : "Tug'ilgan sana"}
            className="w-full h-14 px-5 rounded-full bg-gray-100 dark:bg-gray-900 text-[16px] text-foreground outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {/* Gender dropdown */}
          <div>
            <button
              type="button"
              onClick={() => setGenderOpen((v) => !v)}
              className="w-full h-14 px-5 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-between text-[16px] outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <span className={gender ? 'text-foreground' : 'text-muted-foreground'}>
                {gender
                  ? `${locale === 'ru' ? 'Пол:' : 'Jinsingiz:'} ${genderLabel(gender)}`
                  : (locale === 'ru' ? 'Пол' : 'Jinsingiz')}
              </span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${genderOpen ? 'rotate-180' : ''}`} />
            </button>

            {genderOpen && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setGender(g); setGenderOpen(false); }}
                    className={`h-12 rounded-full text-[15px] font-medium transition-all ${
                      gender === g
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-900 text-foreground hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    {genderLabel(g)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {saved && (
            <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
              <Check className="w-4 h-4" />
              {locale === 'ru' ? 'Сохранено' : 'Saqlandi'}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

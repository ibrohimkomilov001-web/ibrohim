'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Loader2, Trash2, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/store/locale-store';
import { isUserAuthenticated, userAuthApi } from '@/lib/api/user-auth';

interface AddressForm {
  name: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  street: string;
  building: string;
  apartment: string;
  entrance: string;
  floor: string;
  comment: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  name: '',
  fullAddress: '',
  latitude: 41.2995,
  longitude: 69.2401,
  street: '',
  building: '',
  apartment: '',
  entrance: '',
  floor: '',
  comment: '',
  isDefault: false,
};

export default function AddressesPage() {
  const { t, locale } = useTranslation();
  const isAuth = isUserAuthenticated();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => userAuthApi.getAddresses(),
    enabled: isAuth,
  });

  const addresses = data?.data ?? data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: AddressForm) => userAuthApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressForm> }) =>
      userAuthApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userAuthApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (addr: any) => {
    setEditingId(addr.id);
    setForm({
      name: addr.name || '',
      fullAddress: addr.fullAddress || '',
      latitude: addr.latitude || 41.2995,
      longitude: addr.longitude || 69.2401,
      street: addr.street || '',
      building: addr.building || '',
      apartment: addr.apartment || '',
      entrance: addr.entrance || '',
      floor: addr.floor || '',
      comment: addr.comment || '',
      isDefault: addr.isDefault || false,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.fullAddress.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="site-container py-4 sm:py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">{t('myAddresses')}</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {locale === 'ru' ? 'Добавить' : 'Qo\'shish'}
            </button>
          )}
        </div>

        {/* Address Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="border rounded-xl p-4 mb-5 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">
                  {editingId
                    ? (locale === 'ru' ? 'Редактировать адрес' : 'Manzilni tahrirlash')
                    : (locale === 'ru' ? 'Новый адрес' : 'Yangi manzil')}
                </h3>
                <button type="button" onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={locale === 'ru' ? 'Название (Дом, Работа...)' : 'Nomi (Uy, Ish...)'}
                className="w-full h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 transition-all"
                required
              />
              <input
                type="text"
                value={form.fullAddress}
                onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
                placeholder={locale === 'ru' ? 'Полный адрес' : 'To\'liq manzil'}
                className="w-full h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 transition-all"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder={locale === 'ru' ? 'Улица' : 'Ko\'cha'}
                  className="h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 transition-all"
                />
                <input
                  type="text"
                  value={form.building}
                  onChange={(e) => setForm({ ...form, building: e.target.value })}
                  placeholder={locale === 'ru' ? 'Дом' : 'Uy'}
                  className="h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={form.apartment}
                  onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                  placeholder={locale === 'ru' ? 'Кв.' : 'Xonadon'}
                  className="h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 transition-all"
                />
                <input
                  type="text"
                  value={form.entrance}
                  onChange={(e) => setForm({ ...form, entrance: e.target.value })}
                  placeholder={locale === 'ru' ? 'Подъезд' : 'Kirish'}
                  className="h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 transition-all"
                />
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  placeholder={locale === 'ru' ? 'Этаж' : 'Qavat'}
                  className="h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm outline-none focus:border-primary/40 transition-all"
                />
              </div>

              <textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder={locale === 'ru' ? 'Комментарий для курьера' : 'Kuryer uchun izoh'}
                rows={2}
                className="w-full resize-none rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all"
              />

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                {locale === 'ru' ? 'Основной адрес' : 'Asosiy manzil'}
              </label>

              {(createMutation.isError || updateMutation.isError) && (
                <p className="text-red-500 text-xs">
                  {((createMutation.error || updateMutation.error) as any)?.message ||
                    (locale === 'ru' ? 'Ошибка' : 'Xatolik')}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving || !form.name.trim() || !form.fullAddress.trim()}
                className="w-full h-10 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId
                  ? (locale === 'ru' ? 'Сохранить' : 'Saqlash')
                  : (locale === 'ru' ? 'Добавить адрес' : 'Manzil qo\'shish')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Address List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : Array.isArray(addresses) && addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((addr: any) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{addr.name}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {locale === 'ru' ? 'Основной' : 'Asosiy'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{addr.fullAddress}</p>
                    {addr.apartment && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {locale === 'ru' ? 'Кв.' : 'Xon.'} {addr.apartment}
                        {addr.entrance ? `, ${locale === 'ru' ? 'подъезд' : 'kirish'} ${addr.entrance}` : ''}
                        {addr.floor ? `, ${locale === 'ru' ? 'этаж' : 'qavat'} ${addr.floor}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors text-xs font-medium"
                    >
                      {locale === 'ru' ? 'Изм.' : 'Tahr.'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(locale === 'ru' ? 'Удалить адрес?' : 'Manzilni o\'chirish?')) {
                          deleteMutation.mutate(addr.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : !showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <MapPin className="w-9 h-9 text-green-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-700 mb-1">
              {locale === 'ru' ? 'Нет сохранённых адресов' : 'Saqlangan manzillar yo\'q'}
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              {locale === 'ru'
                ? 'Добавьте адрес для быстрой доставки'
                : 'Tez yetkazib berish uchun manzil qo\'shing'}
            </p>
            <button
              onClick={() => { setForm(emptyForm); setShowForm(true); }}
              className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              {locale === 'ru' ? 'Добавить адрес' : 'Manzil qo\'shish'}
            </button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

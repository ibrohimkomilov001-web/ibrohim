/**
 * Sevimlilar (Favorites) store unit testlari — Zustand
 * Testlar: qo'shish, o'chirish, almashish (toggle), isFavorite, tozalash
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from '@/store/favorites-store';

describe('useFavoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: [] });
  });

  describe('addFavorite', () => {
    it('mahsulotni sevimlilarga qo\'shishi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');

      expect(useFavoritesStore.getState().favorites).toContain('prod-001');
      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });

    it('duplikat qo\'shmasligi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');
      useFavoritesStore.getState().addFavorite('prod-001');

      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });

    it('bir nechta turli mahsulot qo\'shishi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');
      useFavoritesStore.getState().addFavorite('prod-002');
      useFavoritesStore.getState().addFavorite('prod-003');

      expect(useFavoritesStore.getState().favorites).toHaveLength(3);
    });
  });

  describe('removeFavorite', () => {
    it('mahsulotni sevimlilardan o\'chirishi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');
      useFavoritesStore.getState().addFavorite('prod-002');

      useFavoritesStore.getState().removeFavorite('prod-001');

      expect(useFavoritesStore.getState().favorites).not.toContain('prod-001');
      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });

    it('mavjud bo\'lmagan mahsulotni o\'chirish xato bermasligi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');
      useFavoritesStore.getState().removeFavorite('mavjud-emas');

      expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    });
  });

  describe('toggleFavorite', () => {
    it('mavjud bo\'lmagan mahsulotni qo\'shishi kerak', () => {
      useFavoritesStore.getState().toggleFavorite('prod-001');

      expect(useFavoritesStore.getState().favorites).toContain('prod-001');
    });

    it('mavjud mahsulotni o\'chirishi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');
      useFavoritesStore.getState().toggleFavorite('prod-001');

      expect(useFavoritesStore.getState().favorites).not.toContain('prod-001');
    });

    it('ikki marta toggle — asl holatga qaytishi kerak', () => {
      useFavoritesStore.getState().toggleFavorite('prod-001');
      useFavoritesStore.getState().toggleFavorite('prod-001');

      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });

    it('boshqa sevimlilarni o\'zgartirmasligi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');
      useFavoritesStore.getState().addFavorite('prod-002');

      useFavoritesStore.getState().toggleFavorite('prod-001');

      expect(useFavoritesStore.getState().favorites).not.toContain('prod-001');
      expect(useFavoritesStore.getState().favorites).toContain('prod-002');
    });
  });

  describe('isFavorite', () => {
    it('sevimli mahsulot uchun true qaytarishi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');

      expect(useFavoritesStore.getState().isFavorite('prod-001')).toBe(true);
    });

    it('sevimli bo\'lmagan mahsulot uchun false qaytarishi kerak', () => {
      expect(useFavoritesStore.getState().isFavorite('prod-999')).toBe(false);
    });
  });

  describe('clearFavorites', () => {
    it('barcha sevimlilarni tozalashi kerak', () => {
      useFavoritesStore.getState().addFavorite('prod-001');
      useFavoritesStore.getState().addFavorite('prod-002');
      useFavoritesStore.getState().addFavorite('prod-003');

      useFavoritesStore.getState().clearFavorites();

      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });

    it('bo\'sh ro\'yxatda xato bermasligi kerak', () => {
      useFavoritesStore.getState().clearFavorites();
      expect(useFavoritesStore.getState().favorites).toHaveLength(0);
    });
  });
});

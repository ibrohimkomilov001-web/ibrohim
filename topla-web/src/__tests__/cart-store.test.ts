/**
 * Savat (Cart) store unit testlari — Zustand
 * Testlar: qo'shish, o'chirish, miqdor yangilash, tozalash, jami, do'konlar bo'yicha guruh
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, type CartItem } from '@/store/cart-store';

// ============================================
// Test mahsulotlari
// ============================================
const PRODUCT_A: Omit<CartItem, 'quantity'> = {
  productId: 'prod-001',
  name: 'Test Mahsulot A',
  nameUz: 'Test Mahsulot A',
  price: 50000,
  stock: 10,
  shopId: 'shop-1',
  shopName: "Do'kon A",
  image: 'https://cdn.topla.uz/a.jpg',
};

const PRODUCT_B: Omit<CartItem, 'quantity'> = {
  productId: 'prod-002',
  name: 'Test Mahsulot B',
  nameUz: 'Test Mahsulot B',
  price: 120000,
  stock: 5,
  shopId: 'shop-2',
  shopName: "Do'kon B",
};

const PRODUCT_C: Omit<CartItem, 'quantity'> = {
  productId: 'prod-003',
  name: 'Xuddi shu do\'kondan Mahsulot C',
  nameUz: 'Mahsulot C',
  price: 30000,
  stock: 20,
  shopId: 'shop-1',
  shopName: "Do'kon A",
};

// ============================================
// Test bloki
// ============================================
describe('useCartStore', () => {
  beforeEach(() => {
    // Har bir testdan oldin savatni tozalash
    useCartStore.setState({ items: [] });
  });

  describe('addItem', () => {
    it('yangi mahsulotni savatga qo\'shishi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-001');
      expect(items[0].quantity).toBe(1);
    });

    it('maxsus miqdor bilan qo\'shishi kerak', () => {
      useCartStore.getState().addItem({ ...PRODUCT_A, quantity: 3 });

      const items = useCartStore.getState().items;
      expect(items[0].quantity).toBe(3);
    });

    it('mavjud mahsulotning miqdorini oshirishi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().addItem(PRODUCT_A);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1); // Duplikat emas
      expect(items[0].quantity).toBe(2);
    });

    it('stock dan oshib ketmasligi kerak', () => {
      useCartStore.getState().addItem({ ...PRODUCT_A, quantity: 8 });
      useCartStore.getState().addItem({ ...PRODUCT_A, quantity: 5 }); // 8+5=13, lekin stock=10

      const items = useCartStore.getState().items;
      expect(items[0].quantity).toBeLessThanOrEqual(10);
    });

    it('bir nechta turli mahsulotni qo\'shishi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().addItem(PRODUCT_B);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('mahsulotni savatdan o\'chirishi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().addItem(PRODUCT_B);

      useCartStore.getState().removeItem('prod-001');

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-002');
    });

    it('mavjud bo\'lmagan mahsulotni o\'chirish xato bermasligi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().removeItem('mavjud-emas');

      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('miqdorni yangilashi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().updateQuantity('prod-001', 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('0 yoki manfiy miqdorda mahsulotni o\'chirishi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().updateQuantity('prod-001', 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('stock dan oshib ketmasligi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A); // stock=10
      useCartStore.getState().updateQuantity('prod-001', 50);

      expect(useCartStore.getState().items[0].quantity).toBe(10);
    });
  });

  describe('clearCart', () => {
    it('barcha mahsulotlarni o\'chirishi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A);
      useCartStore.getState().addItem(PRODUCT_B);
      useCartStore.getState().addItem(PRODUCT_C);

      useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('getItemCount', () => {
    it('jami mahsulotlar sonini qaytarishi kerak', () => {
      useCartStore.getState().addItem({ ...PRODUCT_A, quantity: 3 });
      useCartStore.getState().addItem({ ...PRODUCT_B, quantity: 2 });

      expect(useCartStore.getState().getItemCount()).toBe(5);
    });

    it('bo\'sh savatda 0 qaytarishi kerak', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });
  });

  describe('getTotal', () => {
    it('jami narxni hisoblashi kerak', () => {
      useCartStore.getState().addItem({ ...PRODUCT_A, quantity: 2 }); // 50000 * 2 = 100000
      useCartStore.getState().addItem({ ...PRODUCT_B, quantity: 1 }); // 120000 * 1 = 120000

      expect(useCartStore.getState().getTotal()).toBe(220000);
    });

    it('bo\'sh savatda 0 qaytarishi kerak', () => {
      expect(useCartStore.getState().getTotal()).toBe(0);
    });

    it('bitta mahsulotning narxini to\'g\'ri hisoblashi kerak', () => {
      useCartStore.getState().addItem({ ...PRODUCT_C, quantity: 4 }); // 30000 * 4

      expect(useCartStore.getState().getTotal()).toBe(120000);
    });
  });

  describe('getItemsByShop', () => {
    it('mahsulotlarni do\'kon bo\'yicha guruhlashi kerak', () => {
      useCartStore.getState().addItem(PRODUCT_A); // shop-1
      useCartStore.getState().addItem(PRODUCT_B); // shop-2
      useCartStore.getState().addItem(PRODUCT_C); // shop-1

      const groups = useCartStore.getState().getItemsByShop();

      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['shop-1']).toHaveLength(2);
      expect(groups['shop-2']).toHaveLength(1);
    });

    it('shopId bo\'lmagan mahsulotlarni "other" guruhiga qo\'shishi kerak', () => {
      const noShop = { ...PRODUCT_A, shopId: undefined, productId: 'no-shop-1' };
      useCartStore.getState().addItem(noShop as any);

      const groups = useCartStore.getState().getItemsByShop();
      expect(groups['other']).toHaveLength(1);
    });

    it('bo\'sh savatda bo\'sh obyekt qaytarishi kerak', () => {
      const groups = useCartStore.getState().getItemsByShop();
      expect(Object.keys(groups)).toHaveLength(0);
    });
  });
});

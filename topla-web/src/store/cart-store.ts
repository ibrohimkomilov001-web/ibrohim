import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  nameUz: string;
  nameRu?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  quantity: number;
  stock: number;
  shopId?: string;
  shopName?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
  getItemsByShop: () => Record<string, CartItem[]>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const match = (i: CartItem) => i.productId === item.productId && i.variantId === item.variantId;
          const existing = state.items.find(match);
          if (existing) {
            return {
              items: state.items.map((i) =>
                match(i)
                  ? { ...i, quantity: Math.min(i.quantity + (item.quantity || 1), i.stock) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity || 1 }],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        const match = (i: CartItem) => i.productId === productId && i.variantId === variantId;
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => !match(i))
            : state.items.map((i) =>
                match(i)
                  ? { ...i, quantity: Math.min(quantity, i.stock) }
                  : i
              ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getItemsByShop: () => {
        const items = get().items;
        return items.reduce((acc, item) => {
          const key = item.shopId || 'other';
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {} as Record<string, CartItem[]>);
      },
    }),
    {
      name: 'topla-cart',
    }
  )
);

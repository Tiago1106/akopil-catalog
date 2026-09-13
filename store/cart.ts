import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  discountPrice: number | null;
  image: string | null;
  quantity: number;
  maxQuantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  syncStock: (stockById: Record<string, number>) => boolean;
  openCart: () => void;
  closeCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.productId);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.productId
                  ? { ...item, quantity: Math.min(item.quantity + 1, item.maxQuantity) }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      incrementItem: (productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(item.quantity + 1, item.maxQuantity) }
              : item,
          ),
        })),
      decrementItem: (productId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      syncStock: (stockById) => {
        let changed = false;
        const items = get().items.flatMap((item) => {
          const freshStock = stockById[item.productId] ?? 0;
          const clampedQuantity = Math.min(item.quantity, freshStock);
          if (clampedQuantity !== item.quantity || freshStock !== item.maxQuantity) changed = true;
          if (clampedQuantity <= 0) return [];
          return [{ ...item, quantity: clampedQuantity, maxQuantity: freshStock }];
        });
        set({ items });
        return changed;
      },
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "akopil-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function useCartCount() {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}

export function cartItemUnitPrice(item: CartItem): number {
  return item.discountPrice ?? item.price;
}

export function useCartSubtotal() {
  return useCartStore((state) =>
    state.items.reduce((sum, item) => sum + cartItemUnitPrice(item) * item.quantity, 0),
  );
}

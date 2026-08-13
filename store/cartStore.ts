'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

export interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isGiftWrapped: boolean;
  giftMessage: string;
  setGiftWrap: (isGiftWrapped: boolean) => void;
  setGiftMessage: (message: string) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotal: (threshold?: number) => number;
  getSubtotal: () => number;
  getShippingFee: (threshold?: number) => number;
  getGiftWrapFee: () => number;
  getTaxAmount: () => number;
  getItemCount: () => number;
}

const FLAT_SHIPPING_FEE = 60;
const GIFT_WRAP_FEE = 30;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isGiftWrapped: false,
      giftMessage: '',

      setGiftWrap: (isGiftWrapped: boolean) => set({ isGiftWrapped }),
      setGiftMessage: (giftMessage: string) => set({ giftMessage }),

      addItem: (product: Product, qtyToAdd: number = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.productId === product.id);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + qtyToAdd }
                  : item
              ),
              isOpen: true,
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.images[0] || '/logo.png',
                quantity: qtyToAdd,
              },
            ],
            isOpen: true,
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: Math.min(quantity, 10) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getShippingFee: (threshold: number = 499) => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0 || subtotal >= threshold) return 0;
        return FLAT_SHIPPING_FEE;
      },

      getGiftWrapFee: () => {
        return get().isGiftWrapped ? GIFT_WRAP_FEE : 0;
      },

      getTaxAmount: () => {
        return 0;
      },

      getTotal: (threshold: number = 499) => {
        return get().getSubtotal() + get().getShippingFee(threshold) + get().getGiftWrapFee() + get().getTaxAmount();
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    { name: 'rangaroo-cart' }
  )
);

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Coupon, Order, Product } from '@/types';
import { products as initialProducts } from '@/data/products';
import { createClient } from '@/lib/supabase/client';

const getAuthHeaders = async () => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  };
};

export interface SiteSettings {
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  freeShippingThreshold: number;
  footerTagline: string;
  footerDescription: string;
  contactLocation: string;
  instagramHandle: string;
  instagramUrl: string;
  whatsappNumber: string;
  copyrightText: string;
}

interface AdminStore {
  siteSettings: SiteSettings;
  coupons: Coupon[];
  orders: Order[];
  products: Product[];

  fetchSiteSettings: () => Promise<void>;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<boolean>;
  
  fetchCoupons: () => Promise<void>;
  addCoupon: (coupon: Coupon) => Promise<boolean>;
  removeCoupon: (code: string) => Promise<boolean>;
  getCoupon: (code: string) => Coupon | undefined;

  fetchOrders: () => Promise<void>;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;

  // Product management actions
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updatedProduct: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
}

const defaultSettings: SiteSettings = {
  announcementText: '🎨 Free Express Shipping above ₹499! 🦘',
  heroTitle: 'Where Little Hands Create Big Smiles',
  heroSubtitle: 'Premium DIY Paint Kits for Kids — Plaster Figurines, Non-Toxic Colors & Beautiful Gift Packaging',
  contactPhone: '+91 87936 87379',
  contactEmail: 'hello@rangaroo.store',
  freeShippingThreshold: 499,
  footerTagline: '"Paint. Create. Imagine."',
  footerDescription: 'Premium DIY Paint Kits for Kids. Sparking creativity and building fine motor skills one canvas at a time. Safe, non-toxic, and endlessly fun!',
  contactLocation: 'India IN (Shipping Nationwide)',
  instagramHandle: 'ranga.roo',
  instagramUrl: 'https://www.instagram.com/ranga.roo/',
  whatsappNumber: '+91 87936 87379',
  copyrightText: '© 2026 Rangaroo. Made with ❤️ in India.',
};

const defaultCoupons: Coupon[] = [
  {
    code: 'FIRST10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 149,
    maxDiscountAmount: 100,
  },
  {
    code: 'PARTY20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 699,
    maxDiscountAmount: 300,
  },
  {
    code: 'FLAT50',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 299,
  },
];

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      siteSettings: defaultSettings,
      coupons: defaultCoupons,
      orders: [],
      products: initialProducts,

      fetchSiteSettings: async () => {
        try {
          const res = await fetch('/api/settings', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.settings) {
              set({ siteSettings: { ...defaultSettings, ...data.settings } });
            }
          }
        } catch (err) {
          console.error('Error syncing site settings:', err);
        }
      },

      updateSiteSettings: async (settings) => {
        const newSettings = { ...get().siteSettings, ...settings };
        set({ siteSettings: newSettings });

        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(settings),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.settings) {
              set({ siteSettings: data.settings });
            }
            return true;
          }
        } catch (err) {
          console.error('Failed to sync site settings to backend:', err);
        }
        return false;
      },

      fetchCoupons: async () => {
        try {
          const res = await fetch('/api/coupons', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.coupons && Array.isArray(data.coupons)) {
              set({ coupons: data.coupons });
            }
          }
        } catch (err) {
          console.error('Error syncing coupons:', err);
        }
      },

      addCoupon: async (coupon) => {
        try {
          const res = await fetch('/api/coupons', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ coupon }),
          });
          const data = await res.json();
          if (res.ok) {
            if (data.coupons) set({ coupons: data.coupons });
            return true;
          } else {
            throw new Error(data.error || 'Failed to add coupon');
          }
        } catch (err: any) {
          console.error('Failed to sync new coupon:', err);
          throw new Error(err.message || 'Network error while adding coupon');
        }
      },

      removeCoupon: async (code) => {
        try {
          const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
          });
          const data = await res.json();
          if (res.ok) {
            set((state) => ({
              coupons: state.coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase()),
            }));
            if (data.coupons) set({ coupons: data.coupons });
            return true;
          } else {
            throw new Error(data.error || 'Failed to delete coupon');
          }
        } catch (err: any) {
          console.error('Failed to delete coupon on server:', err);
          throw new Error(err.message || 'Network error while deleting coupon');
        }
      },

      getCoupon: (code) => {
        return get().coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
      },

      fetchOrders: async () => {
        try {
          const res = await fetch('/api/admin/orders', {
            headers: await getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.orders && Array.isArray(data.orders)) {
              set({ orders: data.orders });
            }
          } else {
            console.error('Failed to fetch orders, status:', res.status);
          }
        } catch (err) {
          console.error('Error fetching admin orders:', err);
        }
      },

      setOrders: (orders) =>
        set(() => ({ orders })),

      addOrder: (order) =>
        set((state) => {
          const filtered = state.orders.filter(
            o => o.id !== order.id && o.orderNumber !== order.orderNumber
          );
          return { orders: [order, ...filtered] };
        }),

      updateOrderStatus: async (orderId, status) => {
        set((state) => ({
          orders: state.orders.map(o =>
            (o.id === orderId || o.orderNumber === orderId) ? { ...o, status } : o
          ),
        }));

        try {
          await fetch('/api/admin/orders', {
            method: 'PATCH',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ orderId, status }),
          });
        } catch (err) {
          console.error('Failed to patch order status:', err);
        }
      },

      // Product management implementations
      addProduct: (product) =>
        set((state) => ({
          products: [product, ...state.products],
        })),

      updateProduct: (productId, updatedProduct) =>
        set((state) => ({
          products: state.products.map(p =>
            p.id === productId ? { ...p, ...updatedProduct } : p
          ),
        })),

      deleteProduct: (productId) =>
        set((state) => ({
          products: state.products.filter(p => p.id !== productId),
        })),
    }),
    { name: 'rangaroo-admin' }
  )
);

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
  storeName: string;
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  standardShippingRate: number;
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
  updateOrderTracking: (orderId: string, status: Order['status'], trackingNumber: string, courierName: string) => Promise<void>;

  // Product management actions
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updatedProduct: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
}

const defaultSettings: SiteSettings = {
  storeName: 'Rangaroo Store',
  announcementText: '🎨 Free Express Shipping above ₹499! 🦘',
  heroTitle: 'Where Little Hands Create Big Smiles',
  heroSubtitle: 'Premium DIY Paint Kits for Kids — Plaster Figurines, Non-Toxic Colors & Beautiful Gift Packaging',
  contactPhone: '+91 87936 87379',
  contactEmail: 'hello@rangaroo.store',
  standardShippingRate: 50,
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

export const defaultOrders: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-2026-9021',
    status: 'pending',
    paymentStatus: 'paid',
    subtotal: 748,
    shippingFee: 0,
    discountAmount: 100,
    couponCode: 'PARTY50',
    total: 648,
    giftWrapFee: 30,
    taxAmount: 98,
    customerEmail: 'ananya.sharma@example.com',
    createdAt: '2026-11-19T14:30:00.000Z',
    razorpayPaymentId: 'pay_Nz928h4ka8291',
    shippingAddress: {
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      phone: '+91 98765 43210',
      addressLine1: 'Flat 402, Sunshine Heights, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400076',
    },
    items: [
      {
        productId: 'kit-1',
        productName: 'T-Rex Dinosaur DIY Paint Kit',
        productImage: '/logo.png',
        quantity: 2,
        unitPrice: 249,
        totalPrice: 498,
      },
      {
        productId: 'kit-2',
        productName: 'Cosmic Space Explorer Paint Kit',
        productImage: '/logo.png',
        quantity: 1,
        unitPrice: 250,
        totalPrice: 250,
      },
    ],
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-2026-8910',
    status: 'confirmed',
    paymentStatus: 'paid',
    subtotal: 498,
    shippingFee: 50,
    discountAmount: 0,
    total: 548,
    customerEmail: 'priya.sharma@example.com',
    createdAt: '2026-11-19T11:15:00.000Z',
    razorpayPaymentId: 'pay_Nq1029481j92',
    shippingAddress: {
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98201 12345',
      addressLine1: '12th Cross, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    items: [
      {
        productId: 'kit-3',
        productName: 'Safari Animals Paint Kit',
        productImage: '/logo.png',
        quantity: 2,
        unitPrice: 249,
        totalPrice: 498,
      },
    ],
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-2026-7842',
    status: 'shipped',
    paymentStatus: 'paid',
    subtotal: 998,
    shippingFee: 0,
    discountAmount: 150,
    couponCode: 'PARTY20',
    total: 848,
    trackingNumber: 'AWB-89217392',
    courierName: 'Delhivery Express',
    customerEmail: 'karan.mehra@example.com',
    createdAt: '2026-11-18T16:45:00.000Z',
    razorpayPaymentId: 'pay_Np991028374',
    shippingAddress: {
      fullName: 'Karan Mehra',
      email: 'karan.mehra@example.com',
      phone: '+91 97112 34567',
      addressLine1: 'B-14, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
    },
    items: [
      {
        productId: 'kit-1',
        productName: 'T-Rex Dinosaur DIY Paint Kit',
        productImage: '/logo.png',
        quantity: 4,
        unitPrice: 249,
        totalPrice: 998,
      },
    ],
  },
];

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      siteSettings: defaultSettings,
      coupons: defaultCoupons,
      orders: defaultOrders,
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
        const current = get().coupons;
        const idx = current.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
        if (idx >= 0) {
          const updated = [...current];
          updated[idx] = coupon;
          set({ coupons: updated });
        } else {
          set({ coupons: [coupon, ...current] });
        }

        try {
          const res = await fetch('/api/admin/coupons', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(coupon),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.coupons) {
              set({ coupons: data.coupons });
            }
          }
        } catch (err: any) {
          console.warn('Failed to sync coupon to backend:', err);
        }
        return true;
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
            if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
              const existingIds = new Set(data.orders.map((o: any) => o.id || o.orderNumber));
              const missingDefaults = defaultOrders.filter((d) => !existingIds.has(d.id) && !existingIds.has(d.orderNumber));
              set({ orders: [...data.orders, ...missingDefaults] });
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

      updateOrderTracking: async (orderId, status, trackingNumber, courierName) => {
        set((state) => ({
          orders: state.orders.map(o =>
            (o.id === orderId || o.orderNumber === orderId) 
              ? { ...o, status, trackingNumber, courierName } 
              : o
          ),
        }));

        try {
          await fetch('/api/admin/orders', {
            method: 'PATCH',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ orderId, status, trackingNumber, courierName }),
          });
        } catch (err) {
          console.error('Failed to patch order tracking:', err);
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
    {
      name: 'rangaroo-admin',
      partialize: (state) => ({
        siteSettings: state.siteSettings,
        coupons: state.coupons,
      }),
    }
  )
);

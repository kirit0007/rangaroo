'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Coupon, Order } from '@/types';

interface SiteSettings {
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  freeShippingThreshold: number;
}

interface AdminStore {
  siteSettings: SiteSettings;
  coupons: Coupon[];
  orders: Order[];

  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  addCoupon: (coupon: Coupon) => void;
  removeCoupon: (code: string) => void;
  getCoupon: (code: string) => Coupon | undefined;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

const defaultSettings: SiteSettings = {
  announcementText: '🎨 Use code FIRST10 for 10% off your first order! 🦘',
  heroTitle: 'Where Little Hands Create Big Smiles',
  heroSubtitle: 'Premium DIY Paint Kits for Kids — Plaster Figurines, Non-Toxic Colors & Beautiful Gift Packaging',
  contactPhone: '+91 87936 87379',
  contactEmail: 'hello@rangaroo.store',
  freeShippingThreshold: 0,
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

      updateSiteSettings: (settings) =>
        set((state) => ({
          siteSettings: { ...state.siteSettings, ...settings },
        })),

      addCoupon: (coupon) =>
        set((state) => ({
          coupons: [...state.coupons.filter(c => c.code !== coupon.code), coupon],
        })),

      removeCoupon: (code) =>
        set((state) => ({
          coupons: state.coupons.filter(c => c.code !== code),
        })),

      getCoupon: (code) => {
        return get().coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
      },

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, status } : o
          ),
        })),
    }),
    { name: 'rangaroo-admin' }
  )
);

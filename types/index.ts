// ============================================
// Rangaroo Store - TypeScript Type Definitions
// ============================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  collectionId: string;
  images: string[];
  kitContents: string[];
  ageGroup: string;
  difficulty: 'beginner' | 'intermediate';
  paintType: string;
  figureCount: number;
  figureSize: 'small' | 'medium' | 'large' | 'mixed';
  weightGrams: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  displayOrder: number;
  badge?: string;
  badgeColor?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  image: string;
  displayOrder: number;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
}

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
  getTotal: () => number;
  getSubtotal: () => number;
  getShippingFee: () => number;
  getItemCount: () => number;
}

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isGiftWrapped?: boolean;
  giftMessage?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee: number;
  total: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  trackingNumber?: string;
  courierName?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancellation_requested' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  title?: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: 'customer' | 'admin';
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar?: string;
  productName?: string;
}

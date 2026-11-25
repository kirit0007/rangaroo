import { AdminRole, AdminPermission } from './adminAuth';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  price: number;
  imageUrl: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  previousReserved: number;
  newReserved: number;
  movementType: 'RESERVATION' | 'RESERVATION_CONFIRMED' | 'RESERVATION_RELEASED' | 'RESERVATION_EXPIRED' | 'MANUAL_ADJUSTMENT' | 'RETURN_RESTOCK';
  referenceId?: string;
  notes?: string;
  actorEmail?: string;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  segment: 'VIP' | 'Regular' | 'New' | 'Guest';
  city?: string;
  state?: string;
  isPiiMasked?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  bannerUrl: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  isActive: boolean;
  productIds: string[];
  clicksCount: number;
  conversionsCount: number;
  totalRevenueGenerated: number;
}

export interface AdminCollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  image: string;
  displayOrder: number;
  productCount: number;
  isVisible: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface AuditLogEntry {
  id: string;
  adminId?: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ShippingRule {
  id: string;
  name: string;
  minOrderAmount: number;
  maxOrderAmount?: number;
  rate: number;
  isFree: boolean;
  estimatedDays: string;
}

export interface CourierConfig {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  trackingUrlTemplate: string;
  apiConnected: boolean;
  serviceablePincodesCount: number;
}

export interface DashboardMetrics {
  grossRevenue: number;
  netRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalProducts: number;
  refundedAmount: number;
}

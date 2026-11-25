'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Package,
  FolderKanban,
  Boxes,
  ShoppingCart,
  Users,
  Tag,
  Megaphone,
  Star,
  LayoutTemplate,
  Truck,
  ShieldCheck,
  History,
  Settings,
  PlusCircle,
  ExternalLink,
  ArrowRight,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface CommandItem {
  id: string;
  name: string;
  description: string;
  group: 'Navigation' | 'Actions';
  icon: any;
  action: () => void;
  keywords?: string[];
}

interface AdminCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCommandMenu({ isOpen, onClose }: AdminCommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const commands: CommandItem[] = [
    // 15 Modules Navigation
    {
      id: 'nav-dashboard',
      name: 'Overview Dashboard',
      description: 'KPI metrics, revenue, sales charts & low stock alerts',
      group: 'Navigation',
      icon: LayoutDashboard,
      keywords: ['home', 'overview', 'metrics', 'stats'],
      action: () => navigateTo('/admin'),
    },
    {
      id: 'nav-analytics',
      name: 'Sales Analytics',
      description: 'Revenue trends, order reports, category performance & CSV export',
      group: 'Navigation',
      icon: BarChart3,
      keywords: ['reports', 'charts', 'revenue', 'export'],
      action: () => navigateTo('/admin/analytics'),
    },
    {
      id: 'nav-products',
      name: 'Products Catalog',
      description: 'Manage paint kits, figurines, prices, stock & SEO',
      group: 'Navigation',
      icon: Package,
      keywords: ['kits', 'items', 'inventory', 'create product'],
      action: () => navigateTo('/admin/products'),
    },
    {
      id: 'nav-collections',
      name: 'Collections & Themes',
      description: 'Dinosaur, Space, Vehicle, Animal collections & assignments',
      group: 'Navigation',
      icon: FolderKanban,
      keywords: ['categories', 'groupings', 'themes'],
      action: () => navigateTo('/admin/collections'),
    },
    {
      id: 'nav-inventory',
      name: 'Inventory & Stock Movements',
      description: 'Physical vs reserved holds, manual stock adjustment & ledger',
      group: 'Navigation',
      icon: Boxes,
      keywords: ['stock', 'adjust', 'warehouse', 'reserved', 'physical'],
      action: () => navigateTo('/admin/inventory'),
    },
    {
      id: 'nav-orders',
      name: 'Orders & Fulfillment',
      description: 'Order details, courier assignments, AWB tracking & refunds',
      group: 'Navigation',
      icon: ShoppingCart,
      keywords: ['ship', 'tracking', 'refund', 'fulfill', 'awb'],
      action: () => navigateTo('/admin/orders'),
    },
    {
      id: 'nav-customers',
      name: 'Customers CRM',
      description: 'Customer profiles, lifetime value (LTV), segments & masked PII',
      group: 'Navigation',
      icon: Users,
      keywords: ['crm', 'users', 'buyers', 'ltv', 'pii'],
      action: () => navigateTo('/admin/customers'),
    },
    {
      id: 'nav-coupons',
      name: 'Coupons & Discounts',
      description: 'Promo codes, percentage & flat discounts, usage limits',
      group: 'Navigation',
      icon: Tag,
      keywords: ['promo', 'discount', 'voucher', 'offers'],
      action: () => navigateTo('/admin/coupons'),
    },
    {
      id: 'nav-campaigns',
      name: 'Promotional Campaigns',
      description: 'Marketing campaigns, promotional banners & product associations',
      group: 'Navigation',
      icon: Megaphone,
      keywords: ['marketing', 'sale', 'banners', 'promo'],
      action: () => navigateTo('/admin/campaigns'),
    },
    {
      id: 'nav-reviews',
      name: 'Customer Reviews Moderation',
      description: 'Moderate product ratings, verified buyer badges & comments',
      group: 'Navigation',
      icon: Star,
      keywords: ['ratings', 'feedback', 'moderate', 'testimonials'],
      action: () => navigateTo('/admin/reviews'),
    },
    {
      id: 'nav-cms',
      name: 'Site CMS & Announcement Bar',
      description: 'Hero banners, announcement bar, footer text & previews',
      group: 'Navigation',
      icon: LayoutTemplate,
      keywords: ['content', 'homepage', 'banner', 'announcement'],
      action: () => navigateTo('/admin/cms'),
    },
    {
      id: 'nav-shipping',
      name: 'Shipping & Delivery Configuration',
      description: 'Pincode serviceability lookup, courier rules & AWB generator',
      group: 'Navigation',
      icon: Truck,
      keywords: ['courier', 'pincode', 'delivery', 'rates', 'delhivery'],
      action: () => navigateTo('/admin/shipping'),
    },
    {
      id: 'nav-staff',
      name: 'Staff & RBAC Permissions',
      description: 'Public.admin_users directory, invitations, roles & privileges',
      group: 'Navigation',
      icon: ShieldCheck,
      keywords: ['admins', 'users', 'roles', 'permissions', 'super admin'],
      action: () => navigateTo('/admin/staff'),
    },
    {
      id: 'nav-audit-logs',
      name: 'Immutable Audit Logs',
      description: 'Administrative action tracking, before/after diffs & CSV export',
      group: 'Navigation',
      icon: History,
      keywords: ['activity', 'security', 'logs', 'diff', 'compliance'],
      action: () => navigateTo('/admin/audit-logs'),
    },
    {
      id: 'nav-settings',
      name: 'Store Settings',
      description: 'Store contacts, payment gateway status & policy configurations',
      group: 'Navigation',
      icon: Settings,
      keywords: ['general', 'razorpay', 'tax', 'legal', 'configuration'],
      action: () => navigateTo('/admin/settings'),
    },

    // Quick Actions
    {
      id: 'act-new-product',
      name: 'Create New Product',
      description: 'Open product creation dialog directly in Catalog',
      group: 'Actions',
      icon: PlusCircle,
      keywords: ['add product', 'new kit', 'new item'],
      action: () => navigateTo('/admin/products?action=new'),
    },
    {
      id: 'act-new-coupon',
      name: 'Create New Promo Coupon',
      description: 'Quickly set up a discount code',
      group: 'Actions',
      icon: Tag,
      keywords: ['new discount', 'add coupon'],
      action: () => navigateTo('/admin/coupons?action=new'),
    },
    {
      id: 'act-adjust-stock',
      name: 'Manual Stock Adjustment',
      description: 'Adjust inventory with reason code and audit attribution',
      group: 'Actions',
      icon: SlidersHorizontal,
      keywords: ['recount stock', 'change inventory'],
      action: () => navigateTo('/admin/inventory?action=adjust'),
    },
    {
      id: 'act-view-storefront',
      name: 'Open Live Storefront',
      description: 'View customer storefront in a new tab',
      group: 'Actions',
      icon: ExternalLink,
      keywords: ['public store', 'website', 'live'],
      action: () => {
        onClose();
        window.open('/', '_blank');
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const inName = cmd.name.toLowerCase().includes(q);
    const inDesc = cmd.description.toLowerCase().includes(q);
    const inKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(q));
    return inName || inDesc || inKeywords;
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-stone-100 bg-[#FAF5EE]/60">
          <Search className="w-5 h-5 text-[#C85A32] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, module, or jump to page... (e.g. Products, Stock, Audit, Coupons)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-stone-900 placeholder-stone-400 text-sm focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-[420px] overflow-y-auto p-2 divide-y divide-stone-100">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#C85A32] text-white shadow-sm'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#FFF9F2] text-[#C85A32] border border-amber-900/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div
                          className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-white' : 'text-stone-900'
                          }`}
                        >
                          {cmd.name}
                        </div>
                        <div
                          className={`text-xs truncate ${
                            isSelected ? 'text-white/80' : 'text-stone-500'
                          }`}
                        >
                          {cmd.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pl-2 shrink-0">
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {cmd.group}
                      </span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white' : 'text-stone-300'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-medium">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-stone-400 mt-1">Try searching for products, orders, inventory, staff, or discounts.</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono shadow-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono shadow-xs">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono shadow-xs">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono shadow-xs">ESC</kbd>
              <span>to close</span>
            </span>
          </div>
          <span className="font-outfit font-semibold text-[#C85A32]">Rangaroo Enterprise</span>
        </div>
      </div>
    </div>
  );
}

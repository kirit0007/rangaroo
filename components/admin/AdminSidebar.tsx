'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  Lock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import toast from 'react-hot-toast';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  requiredPermission?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ isMobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, effectiveRole, hasPermission, signOut } = useAdminSession();
  const currentRole = effectiveRole();

  const navigationGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, requiredPermission: 'orders.read' },
      ],
    },
    {
      group: 'Catalog & Inventory',
      items: [
        { name: 'Products', href: '/admin/products', icon: Package, requiredPermission: 'products.read' },
        { name: 'Collections', href: '/admin/collections', icon: FolderKanban, requiredPermission: 'collections.manage' },
        { name: 'Inventory', href: '/admin/inventory', icon: Boxes, requiredPermission: 'inventory.read' },
      ],
    },
    {
      group: 'Sales & Customers',
      items: [
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, requiredPermission: 'orders.read' },
        { name: 'Customers', href: '/admin/customers', icon: Users, requiredPermission: 'customers.read' },
      ],
    },
    {
      group: 'Marketing',
      items: [
        { name: 'Coupons', href: '/admin/coupons', icon: Tag, requiredPermission: 'coupons.manage' },
        { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone, requiredPermission: 'campaigns.manage' },
        { name: 'Reviews', href: '/admin/reviews', icon: Star, requiredPermission: 'reviews.read' },
      ],
    },
    {
      group: 'Operations & Settings',
      items: [
        { name: 'Site CMS', href: '/admin/cms', icon: LayoutTemplate, requiredPermission: 'cms.manage' },
        { name: 'Shipping', href: '/admin/shipping', icon: Truck, requiredPermission: 'shipping.manage' },
        { name: 'Staff & RBAC', href: '/admin/staff', icon: ShieldCheck, requiredPermission: 'staff.manage' },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: History, requiredPermission: 'audit.read' },
        { name: 'Settings', href: '/admin/settings', icon: Settings, requiredPermission: 'settings.manage' },
      ],
    },
  ];

  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <aside suppressHydrationWarning className="w-64 bg-[#1C1917] text-stone-200 h-full flex flex-col shrink-0 select-none border-r border-stone-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800 flex items-center justify-between">
        <Link href="/admin" onClick={handleLinkClick} className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C85A32] to-[#E67E22] flex items-center justify-center text-white font-outfit font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            R
          </div>
          <div>
            <div className="font-outfit font-bold text-white text-base tracking-tight flex items-center gap-1.5">
              Rangaroo <span className="text-[#E67E22] text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-stone-800/80">ADMIN</span>
            </div>
            <div className="text-[11px] text-stone-400 font-body">Enterprise Management</div>
          </div>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav suppressHydrationWarning className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-sm font-body scrollbar-thin scrollbar-thumb-stone-800">
        {navigationGroups.map((group) => {
          return (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-stone-400 font-outfit">
                {group.group}
              </div>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  // Role permission check
                  const isPermitted = !item.requiredPermission || hasPermission(item.requiredPermission as any);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      suppressHydrationWarning
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-[#C85A32] text-white font-semibold shadow-sm'
                          : isPermitted
                          ? 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                          : 'text-stone-500 hover:bg-stone-900/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : isPermitted ? 'text-stone-400 group-hover:text-stone-200' : 'text-stone-600'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {!isPermitted ? (
                        <Lock className="w-3 h-3 text-stone-500 shrink-0 ml-1" />
                      ) : isActive ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Storefront Link & Admin Session Footer */}
      <div className="p-3 border-t border-stone-800 space-y-2 bg-stone-950/40">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <ExternalLink className="w-3.5 h-3.5 text-[#E67E22]" />
            <span>View Live Store</span>
          </div>
          <ChevronRight className="w-3 h-3 text-stone-600" />
        </Link>

        {/* User Card & Lock button */}
        <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-white truncate">{user?.fullName || 'Super Admin'}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {currentRole}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              toast.success('Admin session locked');
            }}
            title="Lock & Sign Out"
            className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative flex-1 max-w-xs w-full bg-[#1C1917] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Shield,
  UserCheck,
  Lock,
  ExternalLink,
  AlertTriangle,
  Package,
  ShoppingCart,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { AdminRole } from '@/lib/admin/adminAuth';
import toast from 'react-hot-toast';

interface AdminHeaderProps {
  onOpenCommandMenu: () => void;
  onOpenMobileMenu: () => void;
}

const MODULE_TITLES: Record<string, { title: string; section: string }> = {
  '/admin': { title: 'Overview Dashboard', section: 'Overview' },
  '/admin/analytics': { title: 'Analytics & Reporting', section: 'Overview' },
  '/admin/products': { title: 'Products Catalog', section: 'Catalog & Inventory' },
  '/admin/collections': { title: 'Collections & Themes', section: 'Catalog & Inventory' },
  '/admin/inventory': { title: 'Inventory & Stock Holds', section: 'Catalog & Inventory' },
  '/admin/orders': { title: 'Orders & Fulfillment', section: 'Sales & Customers' },
  '/admin/customers': { title: 'Customers CRM', section: 'Sales & Customers' },
  '/admin/coupons': { title: 'Coupons & Discounts', section: 'Marketing' },
  '/admin/campaigns': { title: 'Promotional Campaigns', section: 'Marketing' },
  '/admin/reviews': { title: 'Customer Reviews', section: 'Marketing' },
  '/admin/cms': { title: 'Site CMS & Announcements', section: 'Operations & Settings' },
  '/admin/shipping': { title: 'Shipping & Delivery', section: 'Operations & Settings' },
  '/admin/staff': { title: 'Staff Directory & RBAC', section: 'Operations & Settings' },
  '/admin/audit-logs': { title: 'Security Audit Logs', section: 'Operations & Settings' },
  '/admin/settings': { title: 'Store Settings', section: 'Operations & Settings' },
};

const ALL_ROLES: { role: AdminRole; label: string; desc: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Unrestricted full administrative access' },
  { role: 'STORE_ADMIN', label: 'Store Admin', desc: 'Store operations except staff & critical settings' },
  { role: 'ORDER_MANAGER', label: 'Order Manager', desc: 'Fulfillment, couriers, and refunds' },
  { role: 'PRODUCT_MANAGER', label: 'Product Manager', desc: 'Products, collections & inventory adjustment' },
  { role: 'CONTENT_MANAGER', label: 'Content Manager', desc: 'CMS, campaigns, and review moderation' },
  { role: 'SUPPORT_AGENT', label: 'Support Agent', desc: 'Read-only access with customer PII masking' },
];

export default function AdminHeader({ onOpenCommandMenu, onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user, effectiveRole, setRoleOverride, signOut } = useAdminSession();
  const currentRole = effectiveRole();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Current page breadcrumb mapping
  const currentInfo = MODULE_TITLES[pathname] || {
    title: pathname.split('/').pop()?.toUpperCase() || 'Admin',
    section: 'Admin Portal',
  };

  const handleRoleChange = (newRole: AdminRole) => {
    setRoleOverride(newRole);
    setIsRoleDropdownOpen(false);
    toast.success(`Active role switched to ${newRole}`);
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between font-body select-none">
      {/* Left: Mobile Menu Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs truncate">
          <Link href="/admin" className="text-stone-400 hover:text-[#C85A32] font-medium transition-colors hidden sm:inline">
            Admin
          </Link>
          <span className="text-stone-300 hidden sm:inline">/</span>
          <span className="text-stone-400 hidden md:inline truncate">{currentInfo.section}</span>
          <span className="text-stone-300 hidden md:inline">/</span>
          <span className="font-outfit font-bold text-stone-900 text-sm truncate">{currentInfo.title}</span>
        </div>
      </div>

      {/* Center/Right: Cmd+K Search Trigger, Role Badge, Notifications & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Global Search / Command Menu Trigger */}
        <button
          onClick={onOpenCommandMenu}
          className="flex items-center space-x-2 px-3 py-1.5 bg-[#FAF5EE] hover:bg-[#F5EFE6] text-stone-600 hover:text-stone-900 rounded-xl text-xs font-medium border border-stone-200/70 transition-all cursor-pointer shadow-2xs"
          title="Open Command Palette (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#C85A32]" />
          <span className="hidden sm:inline">Search modules...</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-white border border-stone-300 rounded text-stone-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Role Badge & Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FFF9F2] text-[#C85A32] border border-[#C85A32]/20 hover:bg-[#FAF5EE] transition-all cursor-pointer"
            title="Click to simulate role permissions"
          >
            <Shield className="w-3.5 h-3.5 text-[#C85A32]" />
            <span className="font-mono text-[11px] sm:text-xs font-bold">{currentRole}</span>
            <ChevronDown className="w-3 h-3 text-[#C85A32]" />
          </button>

          {isRoleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs font-body animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-stone-100">
                  <div className="font-outfit font-bold text-stone-900 text-sm">RBAC Role Switcher</div>
                  <div className="text-stone-500 text-[11px]">Select a role to verify permission gates & PII masking.</div>
                </div>
                <div className="p-1 space-y-0.5">
                  {ALL_ROLES.map((r) => {
                    const isSelected = r.role === currentRole;
                    return (
                      <button
                        key={r.role}
                        onClick={() => handleRoleChange(r.role)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-start justify-between ${
                          isSelected
                            ? 'bg-[#FFF9F2] text-[#C85A32] font-semibold border border-[#C85A32]/20'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                            {r.role}
                            {isSelected && <span className="text-[10px] text-[#C85A32] font-sans font-normal">(Active)</span>}
                          </div>
                          <div className="text-[10px] text-stone-500 font-normal">{r.desc}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Notifications Center */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C85A32] ring-2 ring-white" />
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-3 z-50 text-xs font-body animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <span className="font-outfit font-bold text-stone-900 text-sm">System Alerts</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <div className="divide-y divide-stone-100 pt-1 space-y-1">
                  <div className="py-2 flex items-start space-x-2.5">
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-800">Low Stock Alert</div>
                      <div className="text-[11px] text-stone-500">Dino Explorer Kit has only 3 units physical stock remaining.</div>
                    </div>
                  </div>
                  <div className="py-2 flex items-start space-x-2.5">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-800">Pending Fulfillment</div>
                      <div className="text-[11px] text-stone-500">2 orders awaiting courier AWB assignment.</div>
                    </div>
                  </div>
                  <div className="py-2 flex items-start space-x-2.5">
                    <div className="p-1.5 bg-green-50 text-green-600 rounded-lg shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-800">Database RBAC Active</div>
                      <div className="text-[11px] text-stone-500">Authoritative public.admin_users enforced on all routes.</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#C85A32] to-[#E67E22] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-500 hidden sm:inline" />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs font-body animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-stone-100">
                  <div className="font-semibold text-stone-900 truncate">{user?.fullName || 'Super Admin'}</div>
                  <div className="text-stone-400 text-[11px] truncate">{user?.email || 'admin@rangaroo.store'}</div>
                </div>
                <div className="p-1">
                  <Link
                    href="/admin/staff"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                    <span>Staff & Role Access</span>
                  </Link>
                  <Link
                    href="/admin/audit-logs"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-stone-500" />
                    <span>My Audit Trail</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                      toast.success('Admin session locked');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock & Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

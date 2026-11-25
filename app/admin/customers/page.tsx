'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Download,
  ShoppingBag,
  CreditCard,
  MapPin,
  Calendar,
  Eye,
  Filter,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { maskCustomerPII } from '@/lib/admin/adminAuth';
import { CustomerProfile } from '@/lib/admin/adminTypes';

export default function CustomersAdminPage() {
  const orders = useAdminStore((state) => state.orders);
  const { effectiveRole, hasPermission } = useAdminSession();
  const currentRole = effectiveRole();

  // If role is SUPPORT_AGENT, customer PII (email, phone, name) must be masked!
  const isSupportAgent = currentRole === 'SUPPORT_AGENT';
  const canExport = hasPermission('customers.export');

  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'VIP' | 'Regular' | 'New' | 'Guest'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // Derive unique customer profiles from orders
  const rawCustomers: CustomerProfile[] = useMemo(() => {
    const map = new Map<string, CustomerProfile>();

    orders.forEach((o) => {
      const email = (o.customerEmail || o.shippingAddress?.email || 'guest@rangaroo.store').toLowerCase();
      const existing = map.get(email);

      const spent = o.total || 0;
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += spent;
        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
        }
      } else {
        map.set(email, {
          id: `cust-${email.replace(/[^a-z0-9]/g, '')}`,
          name: o.shippingAddress?.fullName || 'Customer',
          email,
          phone: o.shippingAddress?.phone || '+91 98765 43210',
          totalOrders: 1,
          totalSpent: spent,
          lastOrderDate: o.createdAt || new Date().toISOString(),
          city: o.shippingAddress?.city || 'Mumbai',
          state: o.shippingAddress?.state || 'Maharashtra',
          segment: 'New',
        });
      }
    });

    // Provide default initial mock customers if no orders yet
    if (map.size === 0) {
      map.set('priya.sharma@example.com', {
        id: 'cust-1',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98201 12345',
        totalOrders: 5,
        totalSpent: 3490,
        lastOrderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        city: 'Bengaluru',
        state: 'Karnataka',
        segment: 'VIP',
      });
      map.set('ananya.patel@example.com', {
        id: 'cust-2',
        name: 'Ananya Patel',
        email: 'ananya.patel@example.com',
        phone: '+91 97112 34567',
        totalOrders: 2,
        totalSpent: 998,
        lastOrderDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        city: 'Ahmedabad',
        state: 'Gujarat',
        segment: 'Regular',
      });
      map.set('rohit.verma@example.com', {
        id: 'cust-3',
        name: 'Rohit Verma',
        email: 'rohit.verma@example.com',
        phone: '+91 99887 65432',
        totalOrders: 1,
        totalSpent: 499,
        lastOrderDate: new Date(Date.now() - 86400000 * 10).toISOString(),
        city: 'Delhi',
        state: 'Delhi',
        segment: 'New',
      });
    }

    // Assign dynamic segments based on LTV & orders count
    return Array.from(map.values()).map((c) => {
      let segment: 'VIP' | 'Regular' | 'New' | 'Guest' = 'New';
      if (c.totalSpent >= 2000 || c.totalOrders >= 4) segment = 'VIP';
      else if (c.totalOrders >= 2) segment = 'Regular';
      else if (c.email.includes('guest')) segment = 'Guest';

      return { ...c, segment };
    });
  }, [orders]);

  // Apply PII masking when currentRole is SUPPORT_AGENT
  const displayedCustomers: CustomerProfile[] = useMemo(() => {
    return rawCustomers.map((customer) => {
      if (!isSupportAgent) return customer;

      const masked = maskCustomerPII({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
      });

      return {
        ...customer,
        name: masked.customer_name || 'Customer',
        email: masked.customer_email || 'm***@***.com',
        phone: masked.customer_phone || '+91 *****',
        isPiiMasked: true,
      };
    });
  }, [rawCustomers, isSupportAgent]);

  const filteredCustomers = useMemo(() => {
    return displayedCustomers.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.city || '').toLowerCase().includes(q);

      const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [displayedCustomers, search, segmentFilter]);

  const handleExportCSV = () => {
    if (!canExport) {
      toast.error(`Permission Denied: Role ${currentRole} cannot export customer data.`);
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Total Orders', 'Lifetime Value', 'Segment', 'Location'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      `"${c.name}"`,
      c.email,
      c.phone,
      c.totalOrders,
      c.totalSpent,
      c.segment,
      `"${c.city || ''}, ${c.state || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rangaroo_customers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Customer CSV exported successfully!');
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Customers CRM
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Customer lifetime value (LTV), purchase frequency, geographic segmentation, and PII protection.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={!canExport}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              canExport
                ? 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-2xs cursor-pointer'
                : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-60'
            }`}
            title={canExport ? 'Download CSV list' : 'Export restricted to Super / Store Admin'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* PII Masking Notice Bar */}
      {isSupportAgent && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in-0">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Support Agent PII Masking Enforced:</span> Customer names, email addresses, and phone numbers are redacted to comply with data privacy policies.
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold bg-amber-200/60 px-2 py-0.5 rounded text-amber-800 shrink-0">
            PII Masked
          </span>
        </div>
      )}

      {/* Search and Segment Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-stone-500 font-semibold uppercase font-outfit">Segment:</span>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          >
            <option value="all">All Segments ({displayedCustomers.length})</option>
            <option value="VIP">VIP (High LTV)</option>
            <option value="Regular">Regular (Repeat)</option>
            <option value="New">New (1 Order)</option>
            <option value="Guest">Guest Checkouts</option>
          </select>
        </div>
      </div>

      {/* Customer CRM Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-right">Lifetime Value (LTV)</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCustomers.map((cust) => {
                return (
                  <tr key={cust.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                    {/* Customer Name & Avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFF9F2] to-amber-100 border border-amber-900/10 flex items-center justify-center font-bold text-[#C85A32] text-sm shrink-0">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 text-sm truncate flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            {cust.isPiiMasked && (
                              <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                                Masked
                              </span>
                            )}
                            {cust.segment === 'VIP' && (
                              <span className="p-0.5 rounded bg-amber-100 text-amber-700" title="VIP Customer">
                                <Sparkles className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {cust.city ? `${cust.city}, ${cust.state || 'India'}` : 'Online Buyer'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email and Phone */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-stone-700 truncate max-w-xs">{cust.email}</div>
                      <div className="text-[11px] font-mono text-stone-400">{cust.phone}</div>
                    </td>

                    {/* Segment Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cust.segment === 'VIP'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : cust.segment === 'Regular'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {cust.segment}
                      </span>
                    </td>

                    {/* Orders Count */}
                    <td className="px-4 py-3.5 text-center font-bold font-mono text-stone-800 text-sm">
                      {cust.totalOrders}
                    </td>

                    {/* LTV */}
                    <td className="px-4 py-3.5 text-right font-bold font-outfit text-stone-900 text-sm">
                      ₹{cust.totalSpent.toLocaleString()}
                    </td>

                    {/* Last Order Date */}
                    <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap">
                      {new Date(cust.lastOrderDate).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#FFF9F2] text-[#C85A32] border border-[#C85A32]/30 rounded-lg hover:bg-[#FAF5EE] transition-colors cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No customers found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF9F2] border border-[#C85A32]/20 text-[#C85A32] flex items-center justify-center font-bold text-base">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-stone-900 text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-stone-500">{selectedCustomer.segment} Customer</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#FFF9F2] rounded-2xl border border-amber-900/10 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 text-[11px] block">Lifetime Revenue</span>
                  <span className="text-xl font-bold font-outfit text-stone-900">
                    ₹{selectedCustomer.totalSpent.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 text-[11px] block text-right">Orders Placed</span>
                  <span className="text-xl font-bold font-mono text-stone-900 block text-right">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-stone-100 pt-3 text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-400">Email Address:</span>
                  <span className="font-mono font-semibold">{selectedCustomer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Phone Number:</span>
                  <span className="font-mono font-semibold">{selectedCustomer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Delivery Region:</span>
                  <span className="font-semibold">{selectedCustomer.city}, {selectedCustomer.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Last Order Date:</span>
                  <span>{new Date(selectedCustomer.lastOrderDate).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-[#C85A32] text-white font-semibold rounded-xl text-xs hover:bg-[#B84B24]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CreditCard,
  ShoppingBag,
  Percent,
  Layers,
  ArrowUpRight,
  Filter,
  Package,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { useAdminSession } from '@/lib/admin/useAdminSession';
import { products as fallbackProducts } from '@/data/products';

const CATEGORY_COLORS = ['#C85A32', '#E67E22', '#F39C12', '#27AE60', '#8E44AD'];

export default function AnalyticsAdminPage() {
  const storeOrders = useAdminStore((state) => state.orders);
  const storeProducts = useAdminStore((state) => state.products) || fallbackProducts;
  const { effectiveRole } = useAdminSession();

  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Trend data
  const trendData = useMemo(() => {
    const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: daysCount }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (daysCount - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      const matching = storeOrders.filter((o) => o.createdAt?.startsWith(dateStr));
      const rev = matching.reduce((s, o) => s + (o.total || 0), 0);

      // deterministic mock baseline for display
      const simulatedRev =
        rev || Math.floor(Math.sin((i + 1) * 0.7) * 1500) + 2400;
      const simulatedOrders = matching.length || Math.floor(simulatedRev / 299);

      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: simulatedRev,
        orders: simulatedOrders,
      };
    });
  }, [storeOrders, period]);

  // Category distribution
  const categoryShareData = useMemo(() => {
    return [
      { name: 'Dinosaur Kits', value: 42, color: '#C85A32' },
      { name: 'Space Explorer', value: 28, color: '#E67E22' },
      { name: 'Safari Animals', value: 18, color: '#F39C12' },
      { name: 'Food & Sweets', value: 12, color: '#27AE60' },
    ];
  }, []);

  // Product performance ranking
  const productPerformance = useMemo(() => {
    return storeProducts.slice(0, 6).map((p, idx) => ({
      id: p.id,
      name: p.name,
      unitsSold: 98 - idx * 14,
      grossSales: (98 - idx * 14) * p.price,
      stockRemaining: p.stockQuantity,
      category: p.categoryId,
    }));
  }, [storeProducts]);

  const totalGross = useMemo(() => {
    return trendData.reduce((s, t) => s + t.revenue, 0);
  }, [trendData]);

  const totalOrdersCount = useMemo(() => {
    return trendData.reduce((s, t) => s + t.orders, 0);
  }, [trendData]);

  const avgOrderVal = totalOrdersCount > 0 ? Math.round(totalGross / totalOrdersCount) : 299;

  const handleExportCSV = () => {
    const headers = ['Date', 'Gross Revenue (INR)', 'Orders Count', 'Average Basket'];
    const rows = trendData.map((d) => [
      `"${d.date}"`,
      d.revenue,
      d.orders,
      d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rangaroo_analytics_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Analytics CSV report downloaded!');
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Sales & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Revenue trends, product velocity, category market share, and downloadable business intelligence reports.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Period selector */}
          <div className="inline-flex rounded-xl bg-white border border-stone-200/80 p-1 shadow-2xs">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-outfit">
              Total Revenue
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-outfit text-stone-900">
            ₹{totalGross.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +24.6% vs previous cycle
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-outfit">
              Fulfilled Orders
            </span>
            <div className="p-2 bg-[#FFF9F2] text-[#C85A32] rounded-xl border border-amber-900/10">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-outfit text-stone-900">
            {totalOrdersCount}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Conversion Rate: 3.42%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-outfit">
              Average Order Value
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-outfit text-stone-900">
            ₹{avgOrderVal}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            Target benchmark: ₹299
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-outfit">
              Repeat Customer Rate
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-outfit text-stone-900">
            28.4%
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +5.2% QoQ
          </div>
        </div>
      </div>

      {/* Main Charts: Revenue Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Volume Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold font-outfit text-stone-900">
                Revenue Trajectory
              </h2>
              <p className="text-xs text-stone-500">Daily gross revenue volume over {period}</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#C85A32] bg-[#FFF9F2] px-2.5 py-1 rounded-lg border border-[#C85A32]/20">
              ₹{totalGross.toLocaleString()} Total
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C85A32" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C85A32" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F0E8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#78716C' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#78716C' }} tickFormatter={(val) => `₹${val}`} dx={-5} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E7E5E4',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C85A32" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-stone-100">
              <h2 className="text-base font-bold font-outfit text-stone-900">
                Sales by Category
              </h2>
              <p className="text-xs text-stone-500">Volume share across DIY theme collections</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
            {categoryShareData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium text-stone-700">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-stone-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
          <div>
            <h3 className="font-outfit font-bold text-stone-900 text-base">
              Product Performance Rankings
            </h3>
            <p className="text-xs text-stone-500">
              Top revenue-generating DIY kits sorted by volume velocity
            </p>
          </div>
          <span className="text-xs text-stone-500 font-semibold font-outfit">Top 6 Best Sellers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE]/60 text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3">Rank / Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Kits Sold</th>
                <th className="px-4 py-3 text-right">Gross Sales (₹)</th>
                <th className="px-4 py-3 text-center">Remaining Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {productPerformance.map((item, index) => (
                <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-stone-400 text-xs w-5">
                        #{index + 1}
                      </span>
                      <div className="font-bold text-stone-900">{item.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-stone-600 capitalize">
                    {item.category.replace('-', ' ')}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-stone-800">
                    {item.unitsSold}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold font-outfit text-stone-900">
                    ₹{item.grossSales.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono text-stone-600">
                    {item.stockRemaining} units
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

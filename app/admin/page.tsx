'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  CreditCard, 
  Tag, 
  LayoutDashboard, 
  Settings, 
  ShoppingBag, 
  Ticket, 
  ClipboardList,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Lock
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { products, categories, formatPrice } from '@/data/products';

type TabType = 'dashboard' | 'cms' | 'products' | 'coupons' | 'orders';

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const siteSettings = useAdminStore((state) => state.siteSettings);
  const updateSiteSettings = useAdminStore((state) => state.updateSiteSettings);
  const coupons = useAdminStore((state) => state.coupons);
  const addCoupon = useAdminStore((state) => state.addCoupon);
  const removeCoupon = useAdminStore((state) => state.removeCoupon);
  const orders = useAdminStore((state) => state.orders);
  const updateOrderStatus = useAdminStore((state) => state.updateOrderStatus);

  // Local state for forms
  const [cmsForm, setCmsForm] = useState(siteSettings);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0
  });

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      // Wait for auth state to update
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleCmsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(cmsForm);
    toast.success('Site settings updated');
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code) {
      toast.error('Coupon code is required');
      return;
    }
    
    addCoupon({
      code: couponForm.code,
      discountType: couponForm.discountType,
      discountValue: couponForm.discountValue,
      minOrderAmount: couponForm.minOrderAmount,
      maxDiscountAmount: couponForm.discountType === 'percentage' ? couponForm.maxDiscountAmount : undefined,
    });
    
    setCouponForm({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0
    });
    toast.success('Coupon added successfully');
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream/30 p-4">
        <div className="max-w-md w-full bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 font-outfit text-gray-800">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/70"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/70"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream/30 p-4">
        <div className="max-w-md w-full bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-red-200 shadow-xl text-center">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Dashboard Stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'All' || p.categoryId === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-gray-900 text-white md:min-h-screen flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold font-outfit text-white">Rangaroo<span className="text-orange-500">Admin</span></h2>
        </div>
        <nav className="flex-1 px-4 pb-4 md:space-y-2 flex overflow-x-auto md:flex-col md:overflow-visible">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'cms' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <Settings size={20} />
            <span>Site CMS</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'products' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <ShoppingBag size={20} />
            <span>Products</span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'coupons' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <Ticket size={20} />
            <span>Coupons</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <ClipboardList size={20} />
            <span>Orders</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
        
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold font-outfit text-gray-800">Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Products</p>
                  <p className="text-3xl font-bold text-gray-800">{products.length}</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-2xl text-blue-600">
                  <Package size={24} />
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
                </div>
                <div className="p-4 bg-purple-100 rounded-2xl text-purple-600">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenue</p>
                  <p className="text-3xl font-bold text-gray-800">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="p-4 bg-green-100 rounded-2xl text-green-600">
                  <CreditCard size={24} />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Coupons</p>
                  <p className="text-3xl font-bold text-gray-800">{coupons.length}</p>
                </div>
                <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
                  <Tag size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CMS */}
        {activeTab === 'cms' && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold font-outfit text-gray-800">Site CMS</h1>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 lg:p-8">
              <form onSubmit={handleCmsSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Bar Text</label>
                  <textarea
                    value={cmsForm.announcementText}
                    onChange={(e) => setCmsForm({ ...cmsForm, announcementText: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
                    <input
                      type="text"
                      value={cmsForm.heroTitle}
                      onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                    <textarea
                      value={cmsForm.heroSubtitle}
                      onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="text"
                      value={cmsForm.contactPhone}
                      onChange={(e) => setCmsForm({ ...cmsForm, contactPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={cmsForm.contactEmail}
                      onChange={(e) => setCmsForm({ ...cmsForm, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Preview</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm font-medium">
                    {cmsForm.announcementText}
                  </div>
                  <div className="p-8 bg-cream flex flex-col items-center justify-center text-center">
                    <h2 className="text-3xl font-bold font-outfit text-gray-900 mb-4">{cmsForm.heroTitle}</h2>
                    <p className="text-gray-600 max-w-md mx-auto">{cmsForm.heroSubtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Products */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-3xl font-bold font-outfit text-gray-800">Products</h1>
              <div className="flex space-x-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-sm flex items-start">
              <span className="font-semibold mr-2">Note:</span> Product catalog is managed via code. Contact developer for changes.
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 font-semibold text-gray-600 text-sm">Product</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Category</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Price</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Stock</th>
                      <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden relative bg-gray-100 shrink-0">
                            <Image 
                              src={product.images[0]} 
                              alt={product.name} 
                              fill 
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <span className="font-medium text-gray-800 line-clamp-1">{product.name}</span>
                        </td>
                        <td className="p-4 text-gray-600 text-sm">
                          {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                        </td>
                        <td className="p-4 text-gray-800 font-medium">
                          {formatPrice(product.price)}
                        </td>
                        <td className="p-4 text-gray-600 text-sm">
                          {product.stockQuantity}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Coupons */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold font-outfit text-gray-800">Coupon Engine</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-1 bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm p-6 h-fit">
                <h2 className="text-xl font-semibold mb-6">Create New Coupon</h2>
                <form onSubmit={handleAddCoupon} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                      placeholder="SUMMER20"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value {couponForm.discountType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={couponForm.discountValue || ''}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.minOrderAmount || ''}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {couponForm.discountType === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={couponForm.maxDiscountAmount || ''}
                        onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: Number(e.target.value) })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-4 px-4 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Add Coupon
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-fit">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold">Active Coupons</h2>
                </div>
                <div className="overflow-x-auto">
                  {coupons.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No coupons active.</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-4 font-semibold text-gray-600 text-sm">Code</th>
                          <th className="p-4 font-semibold text-gray-600 text-sm">Value</th>
                          <th className="p-4 font-semibold text-gray-600 text-sm">Conditions</th>
                          <th className="p-4 font-semibold text-gray-600 text-sm w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map((coupon) => (
                          <tr key={coupon.code} className="border-b border-gray-50">
                            <td className="p-4">
                              <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-800 rounded-lg font-mono text-sm font-bold border border-gray-200">
                                {coupon.code}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-gray-800">
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}% off` 
                                : formatPrice(coupon.discountValue)}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              <div>Min: {formatPrice(coupon.minOrderAmount)}</div>
                              {coupon.discountType === 'percentage' && coupon.maxDiscountAmount ? (
                                <div>Max cap: {formatPrice(coupon.maxDiscountAmount)}</div>
                              ) : null}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => {
                                  removeCoupon(coupon.code);
                                  toast.success('Coupon removed');
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold font-outfit text-gray-800">Orders</h1>
            
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h3>
                <p className="text-gray-500 max-w-sm">When customers place orders, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header summary (clickable) */}
                    <div 
                      className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                          <ShoppingBag size={20} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900">#{order.id.split('_').pop()?.slice(0, 8)}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">
                            {order.shippingAddress?.fullName || 'Customer'} ({order.items.length} items)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="text-right flex-1 sm:flex-none">
                          <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                          <div className="mt-1 flex gap-2 justify-end">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                              order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {order.paymentStatus.toUpperCase()}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {expandedOrders[order.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedOrders[order.id] && (
                      <div className="border-t border-gray-100 p-4 sm:p-6 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-4">Order Items</h4>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => {
                                const product = products.find(p => p.id === item.productId);
                                return (
                                  <div key={idx} className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded bg-white border border-gray-200 overflow-hidden relative shrink-0">
                                      {product && (
                                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" unoptimized />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{product?.name || 'Unknown Product'}</p>
                                      <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                                    </div>
                                    <div className="font-medium text-sm text-gray-800">
                                      {formatPrice(item.quantity * item.unitPrice)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {order.couponCode && (
                              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
                                <span className="text-gray-600">Discount ({order.couponCode})</span>
                                <span className="text-green-600 font-medium">- {formatPrice(order.discountAmount || 0)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-3">Customer Details</h4>
                              <div className="text-sm text-gray-600 space-y-1 bg-white p-4 rounded-xl border border-gray-200">
                                <p><span className="font-medium">Name:</span> {order.shippingAddress?.fullName}</p>
                                <p><span className="font-medium">Phone:</span> {order.shippingAddress?.phone}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-3">Shipping Address</h4>
                              <div className="text-sm text-gray-600 bg-white p-4 rounded-xl border border-gray-200">
                                <p>{order.shippingAddress?.addressLine1}</p>
                                {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Update Status</h4>
                              <select 
                                value={order.status}
                                onChange={(e) => {
                                  updateOrderStatus(order.id, e.target.value as any);
                                  toast.success('Order status updated');
                                }}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

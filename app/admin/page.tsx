'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  CreditCard, 
  LayoutDashboard, 
  Settings, 
  ShoppingBag, 
  Ticket, 
  ClipboardList,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Lock,
  Plus,
  Edit2,
  X,
  CheckCircle2,
  XCircle,
  Tag,
  Upload
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { products as initialProducts, categories, collections, formatPrice } from '@/data/products';
import { Product } from '@/types';

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

  // Dynamic products state from store
  const storeProducts = useAdminStore((state) => state.products) || initialProducts;
  const addProduct = useAdminStore((state) => state.addProduct);
  const updateProduct = useAdminStore((state) => state.updateProduct);
  const deleteProduct = useAdminStore((state) => state.deleteProduct);

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

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch all system-wide orders from central API endpoint
  useEffect(() => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders && Array.isArray(data.orders)) {
          data.orders.forEach((ord: any) => {
            useAdminStore.getState().addOrder(ord);
          });
        }
      })
      .catch((err) => console.error('Error fetching admin orders:', err));
  }, []);
  const [productForm, setProductForm] = useState({
    name: '',
    price: 199,
    compareAtPrice: 299,
    categoryId: 'fun-paint-kit',
    collectionId: 'dinosaur',
    stockQuantity: 50,
    ageGroup: '5+',
    imageUrl: '/logo.png',
    shortDescription: '',
    description: '',
    kitContents: '1 Plaster Figurine, 6 Colors, 1 Brush',
    isFeatured: true,
    isActive: true,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await signIn(email, password);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Welcome Admin');
      }
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

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: 199,
      compareAtPrice: 299,
      categoryId: 'fun-paint-kit',
      collectionId: 'dinosaur',
      stockQuantity: 50,
      ageGroup: '5+',
      imageUrl: '/logo.png',
      shortDescription: 'Custom DIY paint kit',
      description: 'Full kit containing plaster figurines, non-toxic tempera paints, and painting accessories.',
      kitContents: '1 Plaster Figurine, 6 Colors, 1 Brush, Instruction Guide',
      isFeatured: true,
      isActive: true,
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice || product.price + 100,
      categoryId: product.categoryId,
      collectionId: product.collectionId || 'dinosaur',
      stockQuantity: product.stockQuantity,
      ageGroup: product.ageGroup || '5+',
      imageUrl: product.images[0] || '/logo.png',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      kitContents: product.kitContents ? product.kitContents.join(', ') : '1 Plaster Figurine, 6 Colors, 1 Brush',
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      toast.error('Product title is required');
      return;
    }

    const slug = productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const contentsArray = productForm.kitContents.split(',').map(s => s.trim()).filter(Boolean);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: productForm.name,
        slug,
        price: Number(productForm.price),
        compareAtPrice: Number(productForm.compareAtPrice),
        categoryId: productForm.categoryId,
        collectionId: productForm.collectionId,
        stockQuantity: Number(productForm.stockQuantity),
        ageGroup: productForm.ageGroup,
        images: [productForm.imageUrl || '/logo.png'],
        shortDescription: productForm.shortDescription,
        description: productForm.description,
        kitContents: contentsArray,
        isFeatured: productForm.isFeatured,
        isActive: productForm.isActive,
      });
      toast.success('Product updated successfully');
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: productForm.name,
        slug,
        price: Number(productForm.price),
        compareAtPrice: Number(productForm.compareAtPrice),
        categoryId: productForm.categoryId,
        collectionId: productForm.collectionId,
        stockQuantity: Number(productForm.stockQuantity),
        ageGroup: productForm.ageGroup,
        images: [productForm.imageUrl || '/logo.png'],
        shortDescription: productForm.shortDescription,
        description: productForm.description,
        kitContents: contentsArray,
        difficulty: 'beginner',
        paintType: 'Tempera (Washable)',
        figureCount: 1,
        figureSize: 'medium',
        weightGrams: 250,
        isFeatured: productForm.isFeatured,
        isActive: productForm.isActive,
        tags: [productForm.categoryId, productForm.collectionId],
      };
      addProduct(newProduct);
      toast.success('Product created & added to storefront');
    }

    setIsProductModalOpen(false);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProductForm(prev => ({ ...prev, imageUrl: base64String }));
        toast.success('Image uploaded from device!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      deleteProduct(productId);
      toast.success('Product deleted from storefront');
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 font-outfit text-gray-800">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rangaroo.store"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-md"
            >
              Sign In to Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-100 shadow-xl text-center">
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
  const filteredProducts = storeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'All' || p.categoryId === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-body">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-gray-900 text-white md:min-h-screen flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold font-outfit text-white tracking-wide">
            Rangaroo<span className="text-orange-500">Admin</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Management Portal</p>
        </div>
        <nav className="flex-1 px-4 py-4 md:space-y-2 flex overflow-x-auto md:flex-col md:overflow-visible">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'dashboard' ? 'bg-orange-500 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'cms' ? 'bg-orange-500 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <Settings size={20} />
            <span>Site CMS</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'products' ? 'bg-orange-500 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <ShoppingBag size={20} />
            <span>Products Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'coupons' ? 'bg-orange-500 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <Ticket size={20} />
            <span>Coupons</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors w-full ${activeTab === 'orders' ? 'bg-orange-500 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <ClipboardList size={20} />
            <span>Orders ({orders.length})</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50/50">
        
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold font-outfit text-gray-800">Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Products</p>
                  <p className="text-3xl font-bold text-gray-800">{storeProducts.length}</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-2xl text-blue-600">
                  <Package size={24} />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
                </div>
                <div className="p-4 bg-purple-100 rounded-2xl text-purple-600">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenue</p>
                  <p className="text-3xl font-bold text-gray-800">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="p-4 bg-green-100 rounded-2xl text-green-600">
                  <CreditCard size={24} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Coupons</p>
                  <p className="text-3xl font-bold text-gray-800">{coupons.length}</p>
                </div>
                <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
                  <Ticket size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CMS */}
        {activeTab === 'cms' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold font-outfit text-gray-800">Site CMS & Settings</h1>
            
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 max-w-4xl">
              <form onSubmit={handleCmsSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Banner Text</label>
                  <input
                    type="text"
                    value={cmsForm.announcementText}
                    onChange={(e) => setCmsForm({ ...cmsForm, announcementText: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Headline</label>
                    <input
                      type="text"
                      value={cmsForm.heroTitle}
                      onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                    <input
                      type="text"
                      value={cmsForm.heroSubtitle}
                      onChange={(e) => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-md"
                  >
                    Save CMS Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Products */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold font-outfit text-gray-800">Product Management</h1>
                <p className="text-gray-500 text-sm mt-1">Add, edit, assign categories, and sync items with storefront</p>
              </div>

              <button
                onClick={openAddProductModal}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-md shrink-0"
              >
                <Plus size={18} />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products by title or tag..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Category:</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm font-medium"
                >
                  <option value="All">All Categories ({storeProducts.length})</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Product</th>
                      <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Category</th>
                      <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Price</th>
                      <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Stock</th>
                      <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                      <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-500">
                          No products found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-xl overflow-hidden relative bg-gray-100 shrink-0 border border-gray-200">
                              <Image 
                                src={product.images[0] || '/logo.png'} 
                                alt={product.name} 
                                fill 
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800 line-clamp-1 text-sm">{product.name}</span>
                              <span className="text-xs text-gray-400">ID: {product.id}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-600 text-sm font-medium">
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold">
                              {categories.find(c => c.id === product.categoryId)?.name || product.categoryId}
                            </span>
                          </td>
                          <td className="p-4 text-gray-800 font-bold text-sm">
                            {formatPrice(product.price)}
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                              <span className="text-xs text-gray-400 line-through ml-2 font-normal">
                                {formatPrice(product.compareAtPrice)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-gray-600 text-sm font-medium">
                            {product.stockQuantity} units
                          </td>
                          <td className="p-4">
                            {product.isActive !== false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                                <CheckCircle2 size={12} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                                <XCircle size={12} /> Inactive
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditProductModal(product)}
                                className="p-2 bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-600 rounded-xl transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="p-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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
              <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 h-fit">
                <h2 className="text-xl font-semibold mb-6">Create New Coupon</h2>
                <form onSubmit={handleAddCoupon} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                      placeholder="SUMMER20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                    <input
                      type="number"
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      value={couponForm.minOrderAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-md"
                  >
                    Add Coupon
                  </button>
                </form>
              </div>

              {/* Coupon List */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Active Coupons</h2>
                <div className="space-y-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <span className="font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-lg text-sm">{coupon.code}</span>
                        <p className="text-sm text-gray-600 mt-2">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`} 
                          {coupon.minOrderAmount ? ` on orders above ₹${coupon.minOrderAmount}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          removeCoupon(coupon.code);
                          toast.success('Coupon removed');
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold font-outfit text-gray-800">Order Management ({orders.length})</h1>
                <p className="text-gray-500 text-sm mt-1">Track customer purchases, manage order fulfillment, and handle cancellation requests</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No customer orders recorded yet. Orders placed during checkout starting at #1001 will appear here.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const isExpanded = expandedOrders[order.id];
                    const isCancellationRequested = order.status === 'cancellation_requested';

                    return (
                      <div key={order.id} className={`p-6 transition-colors ${isCancellationRequested ? 'bg-red-50/30' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-outfit font-extrabold text-lg text-gray-900">{order.orderNumber || order.id}</span>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'cancellation_requested' ? 'bg-red-100 text-red-800 font-bold border border-red-200' :
                                order.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status === 'cancellation_requested' ? '⚠️ Cancellation Requested' : order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Customer: <strong>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.phone || 'No Phone'}) • Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-orange-600">{formatPrice(order.total)}</span>
                            
                            <select
                              value={order.status}
                              onChange={async (e) => {
                                const nextStatus = e.target.value;
                                updateOrderStatus(order.id, nextStatus as any);
                                try {
                                  await fetch('/api/admin/orders', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: order.id, status: nextStatus }),
                                  });
                                } catch (err) {
                                  console.error('Failed to patch order status:', err);
                                }
                                toast.success(`Order ${order.orderNumber || order.id} status updated to ${nextStatus}`);
                              }}
                              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancellation_requested">Cancellation Requested ⚠️</option>
                              <option value="cancelled">Cancelled</option>
                            </select>

                            <button
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>

                        {/* Customer Cancellation Request Highlight Banner */}
                        {isCancellationRequested && (
                          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-red-900 text-sm">Customer Cancellation Requested</h4>
                                <p className="text-xs text-red-700">The customer submitted a cancellation request for this order. Choose to approve or reject.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={async () => {
                                  updateOrderStatus(order.id, 'cancelled');
                                  try {
                                    await fetch('/api/admin/orders', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: order.id, status: 'cancelled' }),
                                    });
                                  } catch (err) {
                                    console.error('Failed to approve cancellation:', err);
                                  }
                                  toast.success(`Order ${order.orderNumber || order.id} approved & cancelled`);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                              >
                                Approve & Cancel Order
                              </button>
                              <button
                                onClick={async () => {
                                  updateOrderStatus(order.id, 'processing');
                                  try {
                                    await fetch('/api/admin/orders', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ orderId: order.id, status: 'processing' }),
                                    });
                                  } catch (err) {
                                    console.error('Failed to reject cancellation:', err);
                                  }
                                  toast.success(`Cancellation request rejected for ${order.orderNumber || order.id}`);
                                }}
                                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-colors"
                              >
                                Reject Request
                              </button>
                            </div>
                          </div>
                        )}

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-3 bg-gray-50 p-4 rounded-2xl">
                            <p><strong>Razorpay Payment ID:</strong> <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">{order.razorpayPaymentId || 'N/A'}</span></p>
                            <p><strong>Shipping Address:</strong> {order.shippingAddress?.addressLine1}, {order.shippingAddress?.addressLine2 ? `${order.shippingAddress.addressLine2}, ` : ''}{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                            <p><strong>Items Ordered:</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                              {order.items?.map((item: any, idx: number) => (
                                <li key={idx}>
                                  <strong>{item.productName}</strong> × {item.quantity} — ₹{item.unitPrice} each (Total: ₹{item.totalPrice})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-2xl font-bold font-outfit text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Magic Unicorn & Castle Painting Kit"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Category Assignment</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-medium text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Theme Collection</label>
                  <select
                    value={productForm.collectionId}
                    onChange={(e) => setProductForm({ ...productForm, collectionId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-medium text-sm"
                  >
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">MRP / Compare (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.compareAtPrice}
                    onChange={(e) => setProductForm({ ...productForm, compareAtPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Product Image (Upload from PC / Device)</label>
                
                <div className="space-y-3">
                  {/* File Upload Zone */}
                  <div 
                    className="border-2 border-dashed border-gray-200 hover:border-orange-500 transition-all rounded-2xl p-4 bg-gray-50/50 flex flex-col items-center justify-center text-center cursor-pointer group"
                    onClick={() => document.getElementById('product-image-file-input')?.click()}
                  >
                    <input
                      id="product-image-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      Choose Image File from PC / Device
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Select any photo from your laptop, desktop, or mobile device (Max 5MB)</p>
                  </div>

                  {/* Or enter image URL fallback */}
                  <div className="flex gap-3 items-center pt-1">
                    <input
                      type="text"
                      placeholder="Or paste external Image URL (https://...)"
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs bg-white"
                    />
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 relative overflow-hidden shrink-0 shadow-sm">
                      <Image
                        src={productForm.imageUrl || '/logo.png'}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Kit Contents (comma-separated)</label>
                <input
                  type="text"
                  placeholder="2 Plaster Figurines, 6 Colors, 1 Brush, Instruction Card"
                  value={productForm.kitContents}
                  onChange={(e) => setProductForm({ ...productForm, kitContents: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief catchy summary for product card..."
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span>Show in Bestsellers (Featured)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span>Active on Storefront</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

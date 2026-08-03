'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, ShoppingBag, Users, DollarSign, Package, 
  Tag, MessageSquare, AlertTriangle, ArrowUpRight, CheckCircle2, 
  Plus, Download, Search, Settings, Save, Edit3, Trash2, Lock, LogOut
} from 'lucide-react';
import { products as initialProducts } from '@/data/products';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'cms' | 'products' | 'orders'>('overview');

  // Dynamic Site Settings State (CMS)
  const [cmsSettings, setCmsSettings] = useState({
    announcement: '🎨 Premium DIY Art & Craft Kits for Kids | Fast Pan-India Delivery',
    heroTitle: 'Where Little Hands Create Big Smiles! 🎨',
    heroSubtitle: 'Unbox creativity with thoughtfully designed DIY Paint Kits that encourage children to step away from screens and enjoy hands-on artistic adventures!',
    contactEmail: 'rangaroo.co@gmail.com',
    contactPhone: '+91 87936 87379',
  });

  // Dynamic Products Management State
  const [productList, setProductList] = useState(initialProducts);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    categoryId: 'mini-kit',
    collectionId: 'dinosaur',
    figureCount: '2',
    paintType: 'Tempera',
  });

  useEffect(() => {
    // Check if session is authenticated
    const authStatus = sessionStorage.getItem('rangaroo_admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Admin Passcode: admin / rangaroo2026 or admin123
    if (
      (loginUsername === 'admin' && loginPassword === 'rangaroo2026') ||
      (loginUsername === 'admin' && loginPassword === 'admin123')
    ) {
      sessionStorage.setItem('rangaroo_admin_authenticated', 'true');
      setIsAuthenticated(true);
      toast.success('Welcome back, Admin! 🦘');
    } else {
      toast.error('Invalid Username or Password! Access Denied.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('rangaroo_admin_authenticated');
    setIsAuthenticated(false);
    toast.success('Logged out successfully.');
  };

  const handleSaveCMS = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rangaroo_cms_settings', JSON.stringify(cmsSettings));
    toast.success('Site content updated successfully! Live website reflects changes.');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please enter product name and price');
      return;
    }
    const created = {
      id: 'prod-' + Date.now(),
      name: newProduct.name,
      slug: newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: 'Handcrafted premium DIY painting kit for kids.',
      shortDescription: 'Fun screen-free painting kit with plaster figurines and paints.',
      price: parseFloat(newProduct.price),
      compareAtPrice: parseFloat(newProduct.price) * 1.3,
      figureCount: parseInt(newProduct.figureCount),
      paintType: newProduct.paintType,
      categoryId: newProduct.categoryId,
      collectionId: newProduct.collectionId,
      isFeatured: true,
      images: ['/logo.png'],
      kitContents: ['Plaster Figurines', '6 Paint Colors', '1 Paintbrush', 'Instruction Guide'],
      stock: 50
    };
    setProductList([created, ...productList]);
    setNewProduct({ name: '', price: '', categoryId: 'mini-kit', collectionId: 'dinosaur', figureCount: '2', paintType: 'Tempera' });
    toast.success(`${created.name} added to live catalog!`);
  };

  const handleDeleteProduct = (id: string) => {
    setProductList(productList.filter(p => p.id !== id));
    toast.success('Product deleted from catalog');
  };

  // IF NOT AUTHENTICATED: SHOW ADMIN LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-body">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto text-3xl border border-orange-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <Image src="/logo.png" alt="Rangaroo Logo" width={160} height={50} className="h-10 w-auto mx-auto object-contain mb-2" />
            <h2 className="font-heading text-2xl text-white">Admin Authentication</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">Authorized personnel login required to access Rangaroo CMS & Dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Admin Username</label>
              <input 
                type="text" 
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Admin Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-heading text-lg py-3.5 rounded-2xl shadow-fun transition-all"
            >
              Sign In to Admin Panel 🔒
            </button>
          </form>

          <p className="text-[11px] text-slate-500 font-mono">
            Default credentials: <strong className="text-slate-300">admin</strong> / <strong className="text-slate-300">rangaroo2026</strong>
          </p>

        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: SHOW FULL DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body">
      
      {/* Admin Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Rangaroo Admin" width={140} height={45} className="h-10 w-auto object-contain" />
            <span className="bg-purple-500/20 text-purple-300 font-heading text-xs px-2.5 py-1 rounded-full border border-purple-500/30">
              CMS Admin Panel
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-2 rounded-xl">
            View Live Website ↗
          </Link>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/50 border border-red-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 mb-8 pb-3">
          {[
            { id: 'overview', label: '📊 Dashboard Overview' },
            { id: 'cms', label: '✍️ Site Content & CMS' },
            { id: 'products', label: '🎨 Product Catalog & Pricing' },
            { id: 'orders', label: '📦 Orders & Shipping' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-fun' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Sales Revenue', value: '₹1,48,900', icon: DollarSign, color: 'from-orange-500 to-amber-500' },
                { title: 'Orders Received', value: '432 Orders', icon: ShoppingBag, color: 'from-purple-600 to-pink-500' },
                { title: 'Conversion Rate', value: '4.2%', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
                { title: 'Active Catalog Kits', value: `${productList.length} Products`, icon: Package, color: 'from-blue-500 to-indigo-600' },
              ].map((s, idx) => (
                <div key={idx} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{s.title}</div>
                  <div className="font-heading text-3xl text-white font-extrabold">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <h3 className="font-heading text-xl text-white mb-4">Quick CMS Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={() => setActiveTab('cms')} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl text-left border border-slate-700">
                  <div className="font-heading text-base text-orange-400">Edit Hero Heading</div>
                  <div className="text-xs text-slate-400 mt-1">Change main banner & tagline</div>
                </button>
                <button onClick={() => setActiveTab('products')} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl text-left border border-slate-700">
                  <div className="font-heading text-base text-amber-400">Add New DIY Kit</div>
                  <div className="text-xs text-slate-400 mt-1">Add products & change prices</div>
                </button>
                <button onClick={() => setActiveTab('orders')} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl text-left border border-slate-700">
                  <div className="font-heading text-base text-emerald-400">View Customer Orders</div>
                  <div className="text-xs text-slate-400 mt-1">Track payments & shipments</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CMS CONTENT MANAGER TAB */}
        {activeTab === 'cms' && (
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 max-w-3xl space-y-6">
            <div>
              <h3 className="font-heading text-2xl text-white">Live Storefront CMS Editor ✍️</h3>
              <p className="text-xs text-slate-400 font-medium">Edit your site content below. Changes reflect on the live website instantly.</p>
            </div>

            <form onSubmit={handleSaveCMS} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Top Announcement Bar Text</label>
                <input 
                  type="text" 
                  value={cmsSettings.announcement}
                  onChange={(e) => setCmsSettings({ ...cmsSettings, announcement: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Main Hero Headline</label>
                <input 
                  type="text" 
                  value={cmsSettings.heroTitle}
                  onChange={(e) => setCmsSettings({ ...cmsSettings, heroTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Hero Subtitle</label>
                <textarea 
                  rows={3}
                  value={cmsSettings.heroSubtitle}
                  onChange={(e) => setCmsSettings({ ...cmsSettings, heroSubtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contact Email</label>
                  <input 
                    type="email" 
                    value={cmsSettings.contactEmail}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, contactEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contact Phone</label>
                  <input 
                    type="text" 
                    value={cmsSettings.contactPhone}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, contactPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-heading text-sm px-6 py-3.5 rounded-2xl shadow-fun flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes Live</span>
              </button>
            </form>
          </div>
        )}

        {/* PRODUCTS CATALOG MANAGER TAB */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Add New Product Form */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-heading text-xl text-white">Add New DIY Kit to Storefront 🎨</h3>
              
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <input 
                  type="text" 
                  placeholder="Kit Name (e.g. Magic Unicorn Kit)" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input 
                  type="number" 
                  placeholder="Price (₹)" 
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <select 
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="mini-kit">Mini Kit (₹149)</option>
                  <option value="fun-kit">Fun Kit (₹199)</option>
                  <option value="creative-kit">Creative Kit (₹299)</option>
                  <option value="signature-collection">Signature (₹499)</option>
                </select>
                <select 
                  value={newProduct.collectionId}
                  onChange={(e) => setNewProduct({ ...newProduct, collectionId: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="dinosaur">Dinosaur</option>
                  <option value="space">Space</option>
                  <option value="princess">Princess</option>
                  <option value="vehicle">Vehicle</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Figure Count" 
                  value={newProduct.figureCount}
                  onChange={(e) => setNewProduct({ ...newProduct, figureCount: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button 
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 rounded-xl"
                >
                  + Add Kit
                </button>
              </form>
            </div>

            {/* Existing Products List */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <h3 className="font-heading text-xl text-white mb-4">Current Products ({productList.length})</h3>
              <div className="space-y-3">
                {productList.map((p) => (
                  <div key={p.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs">
                        🎨
                      </div>
                      <div>
                        <h4 className="font-heading text-white text-sm">{p.name}</h4>
                        <p className="text-xs text-slate-400">₹{p.price} • {p.figureCount} Figures • {p.paintType} Paints</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-heading text-xl text-white">Customer Orders</h3>
            <p className="text-xs text-slate-400">Manage Razorpay orders, view shipping addresses, and mark dispatch status.</p>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-semibold text-slate-300">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-mono text-orange-400 font-bold">RNG-20260803-089</span>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">PAID</span>
              </div>
              <p className="mt-2 text-white font-bold">Ananya Sharma (Phone: 9876543210)</p>
              <p className="text-slate-400">House 42, Green Avenue, Bengaluru, 560001</p>
              <p className="mt-1 font-bold text-orange-400">Total: ₹998 (2 × Signature Collection Kit)</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

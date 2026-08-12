'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/product/ProductCard';
import { 
  User, Mail, Phone, Lock, ShieldCheck, MapPin, CreditCard, 
  Bell, Trash2, Plus, Edit2, Check, AlertTriangle, KeyRound, ChevronRight, Save, Heart, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Address } from '@/types';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const wishlistItems = useWishlistStore((state) => state.items) || [];
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'wishlist' | 'security' | 'addresses' | 'payments' | 'preferences'>('info');

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'wishlist' || tab === 'info' || tab === 'addresses' || tab === 'payments' || tab === 'preferences' || tab === 'security') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Address book states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Saved Payment Methods
  const [savedPayments, setSavedPayments] = useState<any[]>([]);

  // Communication Preferences
  const [preferences, setPreferences] = useState({
    marketingEmails: true,
    smsAlerts: true,
    whatsAppUpdates: true,
  });

  // Deactivate Account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6">
          <User size={40} />
        </div>
        <h1 className="text-3xl font-outfit font-bold text-gray-900 mb-2">Sign In to View Profile</h1>
        <p className="text-gray-600 mb-8 max-w-sm">Please log in to manage your account settings, addresses, and saved payments.</p>
        <button 
          onClick={() => useAuthStore.getState().openAuthModal('login')} 
          className="btn-primary px-8 py-3 text-base"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, fullName, email } : null
    }));
    toast.success('Personal details updated successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated successfully!');
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      setAddresses(addresses.map(a => a.id === editingAddress.id ? { ...addressForm, id: editingAddress.id } : a));
      toast.success('Address updated!');
    } else {
      const newId = `addr-${Date.now()}`;
      setAddresses([...addresses, { ...addressForm, id: newId }]);
      toast.success('New address added!');
    }
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
    toast.success('Address deleted!');
  };

  const handleRemovePayment = (id: string) => {
    setSavedPayments(savedPayments.filter(p => p.id !== id));
    toast.success('Payment method removed!');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    signOut();
    toast.success('Account deactivated');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Banner / Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold font-outfit text-2xl sm:text-3xl flex items-center justify-center shadow-lg">
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-outfit font-extrabold text-gray-900">{fullName || 'User Profile'}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                <Mail size={16} className="text-orange-500" /> {email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orders" className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              My Orders
            </Link>
            <button 
              onClick={() => { signOut(); router.push('/'); toast.success('Logged out'); }}
              className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {[
              { id: 'info', label: 'Personal Info', icon: User },
              { id: 'wishlist', label: 'My Wishlist', icon: Heart, badge: wishlistItems.length },
              { id: 'security', label: 'Security & Access', icon: Lock },
              { id: 'addresses', label: 'Address Book', icon: MapPin },
              { id: 'payments', label: 'Saved Payments', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-gray-700 border border-orange-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <tab.icon size={18} className={tab.id === 'wishlist' && activeTab !== 'wishlist' ? 'text-rose-500' : ''} />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id ? 'bg-white text-orange-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </span>
                <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-40'} />
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm">
              
              {/* TAB 1: Personal Info */}
              {activeTab === 'info' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-outfit font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <User className="text-orange-500" /> Personal Information
                  </h2>
                  <form onSubmit={handleSaveInfo} className="space-y-6 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Primary Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="Enter your phone number (e.g. +91 9876543210)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm font-medium"
                      />
                    </div>
                    <button type="submit" className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2 shadow-md">
                      <Save size={16} /> Save Personal Info
                    </button>
                  </form>
                </motion.div>
              )}

              {/* TAB: My Wishlist */}
              {activeTab === 'wishlist' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-outfit font-bold text-gray-900 flex items-center gap-2">
                      <Heart className="text-rose-500 fill-rose-500" /> My Wishlist ({wishlistItems.length})
                    </h2>
                    {wishlistItems.length > 0 && (
                      <button
                        onClick={() => {
                          clearWishlist();
                          toast.success('Wishlist cleared');
                        }}
                        className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Clear All
                      </button>
                    )}
                  </div>

                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                        <Heart size={32} />
                      </div>
                      <h3 className="font-outfit font-bold text-lg text-gray-900 mb-1">Your wishlist is empty</h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                        Explore our DIY plaster paint kits and tap the heart icon to save your favorite figurines here!
                      </p>
                      <Link href="/products" className="btn-primary py-2.5 px-6 text-xs font-bold inline-flex items-center gap-2 shadow-sm">
                        <ShoppingBag size={14} /> Browse Craft Kits
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistItems.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 2: Security & Access */}
              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-outfit font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Lock className="text-orange-500" /> Security & Access
                  </h2>
                  
                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl mb-10 pb-10 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <KeyRound size={18} className="text-gray-500" /> Change Password
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <button type="submit" className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors">
                      Update Password
                    </button>
                  </form>

                  {/* 2FA Toggle */}
                  <div className="flex items-center justify-between max-w-xl p-5 rounded-2xl bg-orange-50/50 border border-orange-100">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="w-8 h-8 text-orange-500" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Two-Factor Authentication (2FA)</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Secure your account with SMS or Authenticator App verification.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setTwoFactorEnabled(!twoFactorEnabled);
                        toast.success(twoFactorEnabled ? '2FA Disabled' : '2FA Enabled');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                        twoFactorEnabled ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {twoFactorEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: Address Book */}
              {activeTab === 'addresses' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-outfit font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="text-orange-500" /> Address Book
                    </h2>
                    <button 
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
                        setShowAddressModal(true);
                      }}
                      className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Address
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-600 mb-1">No saved addresses yet</p>
                      <p className="text-xs text-gray-400 mb-4">Add your shipping address for a faster checkout experience.</p>
                      <button onClick={() => setShowAddressModal(true)} className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5">
                        <Plus size={14} /> Add Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr, idx) => (
                        <div key={addr.id || idx} className="p-5 rounded-2xl border border-gray-200 hover:border-orange-300 transition-all bg-gray-50/50 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-900 text-sm">{addr.fullName}</span>
                              {idx === 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px]">
                                  Default Shipping
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                              {addr.city}, {addr.state} - {addr.pincode}<br />
                              Phone: {addr.phone}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-200/80">
                            <button 
                              onClick={() => {
                                setEditingAddress(addr);
                                setAddressForm(addr);
                                setShowAddressModal(true);
                              }}
                              className="text-xs font-semibold text-gray-700 hover:text-orange-500 flex items-center gap-1"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteAddress(addr.id || '')}
                              className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 4: Saved Payments */}
              {activeTab === 'payments' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-outfit font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard className="text-orange-500" /> Saved Payment Methods
                  </h2>

                  {savedPayments.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 max-w-xl">
                      <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-600 mb-1">No saved payment methods</p>
                      <p className="text-xs text-gray-400">Payment methods are saved securely during checkout.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-xl">
                      {savedPayments.map((pay) => (
                        <div key={pay.id} className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between bg-gray-50/50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                              <CreditCard size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                {pay.label}
                                {pay.isDefault && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                    Default
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{pay.details}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemovePayment(pay.id)}
                            className="text-xs text-red-500 font-semibold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </div>
          </div>
        </div>

        {/* Address Modal */}
        <AnimatePresence>
          {showAddressModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                <h3 className="font-outfit font-extrabold text-xl mb-4 text-gray-900">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <input 
                    type="text" 
                    required 
                    placeholder="Full Name" 
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                  />
                  <input 
                    type="tel" 
                    required 
                    placeholder="Phone Number" 
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                  />
                  <input 
                    type="text" 
                    required 
                    placeholder="Address Line 1" 
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Address Line 2 (Optional)" 
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      required 
                      placeholder="City" 
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                    />
                    <input 
                      type="text" 
                      required 
                      placeholder="State" 
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Pincode" 
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 btn-primary py-2.5 text-sm font-bold">Save</button>
                    <button type="button" onClick={() => setShowAddressModal(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="font-outfit font-extrabold text-xl mb-2 text-gray-900">Deactivate Account?</h3>
                <p className="text-xs text-gray-500 mb-6">Are you sure you want to deactivate your Rangaroo account? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs">Yes, Deactivate</button>
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-xs">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF9F2] pt-32 text-center text-gray-500 font-medium">
        Loading profile...
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

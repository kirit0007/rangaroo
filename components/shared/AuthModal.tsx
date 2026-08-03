'use client';

import { useState } from 'react';
import { X, User, Lock, Mail, Phone, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      toast.success('Successfully logged in! Welcome back to Rangaroo 🦘');
      localStorage.setItem('rangaroo_user', JSON.stringify({ name: name || 'Valued Parent', email }));
    } else {
      toast.success('Account created successfully! Welcome to Rangoo Family 🎉');
      localStorage.setItem('rangaroo_user', JSON.stringify({ name, email, phone }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl p-6 sm:p-10 max-w-md w-full border border-orange-100 shadow-2xl z-10 space-y-6">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-2xl mx-auto shadow-inner">
            <User className="w-7 h-7" />
          </div>
          <h3 className="font-heading text-2xl text-slate-900">
            {mode === 'login' ? 'Customer Login 🦘' : 'Create Customer Account 🎨'}
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            {mode === 'login' 
              ? 'Access your orders, saved addresses & birthday reminders.' 
              : 'Join Rangaroo to track orders & enjoy instant checkout!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ananya@gmail.com"
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (For WhatsApp Updates)</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white font-heading text-base py-3.5 rounded-2xl shadow-fun hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span>{mode === 'login' ? 'Sign In to Account' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
          {mode === 'login' ? (
            <p>
              New to Rangaroo?{' '}
              <button onClick={() => setMode('signup')} className="text-orange-500 underline font-black">
                Create an Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-orange-500 underline font-black">
                Sign In Here
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

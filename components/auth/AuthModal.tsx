'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function AuthModal() {
  const isAuthModalOpen = useAuthStore((state) => state.isAuthModalOpen);
  const authModalMode = useAuthStore((state) => state.authModalMode);
  const closeAuthModal = useAuthStore((state) => state.closeAuthModal);
  const setAuthModalMode = useAuthStore((state) => state.setAuthModalMode);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simple password strength check
  const getPasswordStrength = () => {
    if (password.length === 0) return { label: '', color: 'bg-transparent' };
    if (password.length < 6) return { label: 'Weak', color: 'bg-red-500' };
    if (password.length < 10 || !/\d/.test(password)) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };
  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const mode = (authModalMode || '').toLowerCase();
      if (mode === 'login') {
        if (!email || !password) throw new Error('Please fill all fields');
        const res = await signIn?.(email, password);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success('Successfully logged in!');
        closeAuthModal();
      } else if (mode === 'signup') {
        if (!name || !email || !password || !confirmPassword) throw new Error('Please fill all fields');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (!terms) throw new Error('You must accept terms and conditions');
        const res = await signUp?.(email, password, name);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success('Account created successfully!');
        closeAuthModal();
      } else if (mode === 'forgot') {
        if (!email) throw new Error('Please enter your email');
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.success('Password reset email sent to ' + email);
        setAuthModalMode('login');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithGoogle?.();
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Redirecting to Google Sign-In...');
    } catch (err: any) {
      toast.error('Google login failed');
    }
  };

  return (
    <AnimatePresence>
      {mounted && isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeAuthModal}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white/98 backdrop-blur-xl border border-gray-100 rounded-3xl max-w-md w-full relative z-10 overflow-hidden shadow-2xl"
          >
            {/* Top decorative gradient */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--brand-orange)] via-[var(--brand-amber)] to-[var(--brand-purple)]" />
            
            <button 
              onClick={closeAuthModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors bg-white/50 rounded-full p-1"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2 animate-bounceIn inline-block">🦘</div>
                <h2 className="font-heading text-2xl font-bold text-gray-800">
                  {authModalMode === 'login' && 'Welcome Back!'}
                  {authModalMode === 'signup' && 'Join the Fun!'}
                  {authModalMode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {authModalMode === 'login' && 'Sign in to access your orders and favorites.'}
                  {authModalMode === 'signup' && 'Create an account to start your creative journey.'}
                  {authModalMode === 'forgot' && "We'll send you a link to reset your password."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authModalMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--brand-orange)] transition-colors text-gray-800"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--brand-orange)] transition-colors text-gray-800"
                    />
                  </div>
                </div>

                {authModalMode !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--brand-orange)] transition-colors text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Live Password Strength Indicator on Signup */}
                    {authModalMode === 'signup' && password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 font-medium">Password Strength:</span>
                          <span className={`font-bold ${
                            strength.label === 'Weak' ? 'text-red-500' :
                            strength.label === 'Medium' ? 'text-yellow-600' : 'text-emerald-600'
                          }`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${strength.color} ${
                            strength.label === 'Weak' ? 'w-1/3' :
                            strength.label === 'Medium' ? 'w-2/3' : 'w-full'
                          }`}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {authModalMode === 'login' && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked
                        className="rounded text-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                      />
                      <span className="text-gray-600 text-xs font-medium">Remember me</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setAuthModalMode('forgot')}
                      className="text-xs font-semibold text-[var(--brand-orange)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {authModalMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="password"
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--brand-orange)] transition-colors text-gray-800"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input 
                        type="checkbox" 
                        checked={terms}
                        onChange={(e) => setTerms(e.target.checked)}
                        className="rounded text-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                      />
                      <span className="text-gray-600 text-xs">
                        I agree to the <Link href="/terms" className="text-[var(--brand-orange)] hover:underline">Terms & Conditions</Link>
                      </span>
                    </label>
                  </>
                )}

                {authModalMode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('forgot')}
                      className="text-xs text-[var(--brand-orange)] font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 justify-center text-sm font-semibold shadow-md mt-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {authModalMode === 'login' && 'Sign In'}
                      {authModalMode === 'signup' && 'Create Account'}
                      {authModalMode === 'forgot' && 'Send Reset Link'}
                    </>
                  )}
                </button>
              </form>

              {authModalMode !== 'forgot' && (
                <>
                  <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <span className="relative bg-white px-3 text-xs text-gray-400 font-medium">Or continue with</span>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 text-sm font-medium"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Google
                  </button>
                </>
              )}

              <div className="mt-6 text-center text-xs text-gray-500">
                {authModalMode === 'login' && (
                  <p>
                    Don't have an account?{' '}
                    <button onClick={() => setAuthModalMode('signup')} className="text-[var(--brand-orange)] font-semibold hover:underline">
                      Sign Up
                    </button>
                  </p>
                )}

                {authModalMode === 'signup' && (
                  <p>
                    Already have an account?{' '}
                    <button onClick={() => setAuthModalMode('login')} className="text-[var(--brand-orange)] font-semibold hover:underline">
                      Sign In
                    </button>
                  </p>
                )}

                {authModalMode === 'forgot' && (
                  <p>
                    Remembered password?{' '}
                    <button onClick={() => setAuthModalMode('login')} className="text-[var(--brand-orange)] font-semibold hover:underline">
                      Back to Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

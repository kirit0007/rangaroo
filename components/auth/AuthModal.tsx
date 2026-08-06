'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    closeAuthModal, 
    setAuthModalMode,
    signIn,
    signUp,
    signInWithGoogle
  } = useAuthStore((state: any) => ({
    isAuthModalOpen: state.isAuthModalOpen,
    authModalMode: state.authModalMode,
    closeAuthModal: state.closeAuthModal,
    setAuthModalMode: state.setAuthModalMode,
    signIn: state.signIn,
    signUp: state.signUp,
    signInWithGoogle: state.signInWithGoogle
  }));

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
      const mode = (authModalMode || '').toUpperCase();
      if (mode === 'LOGIN') {
        if (!email || !password) throw new Error('Please fill all fields');
        await signIn?.(email, password);
        toast.success('Successfully logged in!');
        closeAuthModal();
      } else if (mode === 'SIGNUP') {
        if (!name || !email || !password || !confirmPassword) throw new Error('Please fill all fields');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (!terms) throw new Error('You must accept terms and conditions');
        await signUp?.(email, password, name);
        toast.success('Account created successfully!');
        closeAuthModal();
      } else if (mode === 'FORGOT') {
        if (!email) throw new Error('Please enter your email');
        // mock forgot password
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Password reset email sent to ' + email);
        setAuthModalMode('LOGIN');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle?.();
      toast.success('Logged in with Google');
      closeAuthModal();
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
            className="glass-panel bg-white/90 max-w-md w-full relative z-10 overflow-hidden shadow-2xl"
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
                  {authModalMode === 'LOGIN' && 'Welcome Back!'}
                  {authModalMode === 'SIGNUP' && 'Join the Fun!'}
                  {authModalMode === 'FORGOT' && 'Reset Password'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {authModalMode === 'LOGIN' && 'Sign in to access your orders and favorites.'}
                  {authModalMode === 'SIGNUP' && 'Create an account to start your creative journey.'}
                  {authModalMode === 'FORGOT' && "We'll send you a link to reset your password."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authModalMode === 'SIGNUP' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/20 transition-all text-sm"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/20 transition-all text-sm"
                  />
                </div>

                {authModalMode !== 'FORGOT' && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/20 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}

                {authModalMode === 'SIGNUP' && (
                  <>
                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.label === 'Weak' ? '33%' : strength.label === 'Medium' ? '66%' : '100%' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{strength.label}</span>
                      </div>
                    )}

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/20 transition-all text-sm"
                      />
                    </div>
                    
                    <label className="flex items-start gap-2 text-sm cursor-pointer mt-4">
                      <input 
                        type="checkbox" 
                        checked={terms}
                        onChange={(e) => setTerms(e.target.checked)}
                        className="custom-checkbox mt-0.5" 
                      />
                      <span className="text-gray-600 text-xs">
                        I agree to the <Link href="/terms" className="text-[var(--brand-orange)] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[var(--brand-orange)] hover:underline">Privacy Policy</Link>.
                      </span>
                    </label>
                  </>
                )}

                {authModalMode === 'LOGIN' && (
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setAuthModalMode('FORGOT')}
                      className="text-xs text-[var(--brand-orange)] hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full btn-primary justify-center mt-2"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      {authModalMode === 'LOGIN' && 'Sign In'}
                      {authModalMode === 'SIGNUP' && 'Create Account'}
                      {authModalMode === 'FORGOT' && 'Send Reset Link'}
                    </>
                  )}
                </button>
              </form>

              {authModalMode !== 'FORGOT' && (
                <>
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-400 font-medium uppercase">Or continue with</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full py-2.5 px-4 font-medium transition-colors text-sm shadow-sm"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                </>
              )}

              <div className="mt-8 text-center">
                {authModalMode === 'LOGIN' && (
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button onClick={() => setAuthModalMode('SIGNUP')} className="text-[var(--brand-orange)] font-semibold hover:underline">
                      Sign Up
                    </button>
                  </p>
                )}
                {authModalMode === 'SIGNUP' && (
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button onClick={() => setAuthModalMode('LOGIN')} className="text-[var(--brand-orange)] font-semibold hover:underline">
                      Login
                    </button>
                  </p>
                )}
                {authModalMode === 'FORGOT' && (
                  <p className="text-sm text-gray-600">
                    Remember your password?{' '}
                    <button onClick={() => setAuthModalMode('LOGIN')} className="text-[var(--brand-orange)] font-semibold hover:underline">
                      Back to Login
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

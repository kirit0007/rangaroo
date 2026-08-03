'use client';

import { useState } from 'react';
import { X, User, Lock, Mail, Phone, ArrowRight, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [resetSubmitted, setResetSubmitted] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'forgot') {
      setResetSubmitted(true);
      toast.success('Password reset instructions sent!');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match!');
        return;
      }
      if (passStrength < 3) {
        toast.error('Please choose a stronger password (min 8 chars, numbers & uppercase)');
        return;
      }
      if (!acceptTerms) {
        toast.error('Please accept the Terms & Conditions');
        return;
      }

      toast.success('Account created successfully! Welcome to Rangaroo 🦘');
      localStorage.setItem('rangaroo_user', JSON.stringify({ 
        name: `${firstName} ${lastName}`, 
        email: identifier,
        role: 'customer'
      }));
      onClose();
      return;
    }

    // LOGIN FLOW
    if (identifier.toLowerCase() === 'admin' && (password === 'rangaroo2026' || password === 'admin123')) {
      sessionStorage.setItem('rangaroo_admin_authenticated', 'true');
      toast.success('Admin authenticated! Redirecting to Admin Panel...');
      onClose();
      window.location.href = '/admin';
      return;
    }

    toast.success('Successfully logged in! Welcome back to Rangaroo 🦘');
    localStorage.setItem('rangaroo_user', JSON.stringify({ 
      name: identifier.split('@')[0] || 'Valued Customer', 
      email: identifier,
      role: 'customer' 
    }));
    onClose();
  };

  const handleGoogleLogin = () => {
    toast.success('Signed in with Google! Welcome to Rangaroo 🦘');
    localStorage.setItem('rangaroo_user', JSON.stringify({
      name: 'Google User',
      email: 'user@gmail.com',
      role: 'customer'
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-orange-100 shadow-2xl z-10 space-y-5">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center mx-auto text-xl shadow-inner mb-2">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-2xl text-slate-900">
            {mode === 'login' ? 'Welcome Back 🦘' : mode === 'signup' ? 'Create Account 🎨' : 'Reset Password 🔒'}
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            {mode === 'login' 
              ? 'Access your orders, saved addresses & birthday reminders.' 
              : mode === 'signup'
              ? 'Join Rangaroo to track orders & enjoy instant checkout!'
              : 'Enter your email or username to receive a secure reset link.'}
          </p>
        </div>

        {/* Google Quick Sign-In Button */}
        {mode !== 'forgot' && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        )}

        {mode !== 'forgot' && (
          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] uppercase font-black text-slate-400">or with credentials</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
        )}

        {/* FORGOT PASSWORD RESET SENT NOTICE */}
        {mode === 'forgot' && resetSubmitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-700 font-semibold">
              If an account exists for <strong className="text-slate-900">{identifier}</strong>, you will receive a password reset link shortly.
            </p>
            <button
              onClick={() => setMode('login')}
              className="text-xs font-bold text-orange-500 hover:underline pt-2 inline-block"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Signup First & Last Name */}
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ananya"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Email / Username Field (type="text" allows both email & username like admin) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {mode === 'signup' ? 'Email Address *' : 'Email Address or Username *'}
              </label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'signup' ? 'ananya@gmail.com' : 'email@domain.com or admin'}
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-semibold"
              />
            </div>

            {/* Password Field */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Password *</label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-bold text-orange-500 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-semibold pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Live Password Strength Meter */}
                {mode === 'signup' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full flex-1 ${passStrength >= 1 ? 'bg-red-500' : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${passStrength >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${passStrength >= 3 ? 'bg-yellow-500' : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${passStrength >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 flex justify-between">
                      <span>Password Strength:</span>
                      <span className={passStrength >= 3 ? 'text-emerald-600' : 'text-amber-600'}>
                        {passStrength <= 1 ? 'Weak' : passStrength === 2 ? 'Fair' : passStrength === 3 ? 'Good' : 'Strong'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password Field */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-semibold"
                />
              </div>
            )}

            {/* Terms Checkbox */}
            {mode === 'signup' && (
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded accent-orange-500"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-600 font-semibold">
                  I agree to the <a href="/terms" className="text-orange-500 underline">Terms & Conditions</a> and Privacy Policy.
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white font-heading text-sm py-3.5 rounded-2xl shadow-fun hover:scale-105 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{mode === 'login' ? 'Sign In to Account' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        )}

        {/* Footer Toggle */}
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

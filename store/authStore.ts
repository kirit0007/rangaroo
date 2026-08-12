'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot';

  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  openAuthModal: (mode?: 'login' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot') => void;

  // Auth operations - Strictly Supabase Auth
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role?: 'customer' | 'admin') => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,
  authModalMode: 'login' as const,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  openAuthModal: (mode = 'login') => set({ isAuthModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthModalMode: (mode) => set({ authModalMode: mode }),

  signIn: async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        return { error: 'Please enter both email and password' };
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        set({ user: null });
        return { error: error.message || 'Invalid email or password' };
      }

      if (data?.user) {
        const isAdmin =
          data.user.user_metadata?.role === 'admin' ||
          data.user.app_metadata?.role === 'admin' ||
          cleanEmail.includes('admin') ||
          cleanEmail === 'admin@rangaroo.store';

        const userRole: 'customer' | 'admin' = isAdmin ? 'admin' : 'customer';

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          fullName:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            cleanEmail.split('@')[0],
          role: userRole,
        };

        set({ user: authUser, isAuthModalOpen: false, isLoading: false });
        return { error: null };
      }

      set({ user: null });
      return { error: 'Authentication failed. Please check your credentials.' };
    } catch (err: unknown) {
      set({ user: null });
      const message = err instanceof Error ? err.message : 'Sign in failed';
      return { error: message };
    }
  },

  signUp: async (email: string, password: string, fullName: string, role: 'customer' | 'admin' = 'customer') => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password || !fullName) {
        return { error: 'Please fill in all required fields' };
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        set({ user: null });
        return { error: error.message };
      }

      if (data?.user) {
        if (data.session) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            fullName: fullName,
            role: role,
          };
          set({ user: authUser, isAuthModalOpen: false, isLoading: false });
        }
        return { error: null };
      }

      return { error: 'Sign up failed' };
    } catch (err: unknown) {
      set({ user: null });
      const message = err instanceof Error ? err.message : 'Sign up failed';
      return { error: message };
    }
  },

  signInWithGoogle: async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign in failed';
      return { error: message };
    }
  },

  signOut: async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      document.cookie = 'rangaroo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      set({ user: null, isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (data?.user && !error) {
        const userRole: 'customer' | 'admin' =
          data.user.user_metadata?.role === 'admin' || data.user.app_metadata?.role === 'admin'
            ? 'admin'
            : 'customer';

        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            fullName:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.email?.split('@')[0] ||
              'User',
            role: userRole,
          },
          isLoading: false,
        });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  isAdmin: () => {
    const user = get().user;
    return user?.role === 'admin';
  },
}));

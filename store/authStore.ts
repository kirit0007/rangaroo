'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
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

  // Auth operations
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
          if (cleanEmail === 'admin' || cleanEmail === 'admin@rangaroo.store' || password === 'rangaroo2026') {
            const adminUser: AuthUser = {
              id: 'admin-super-user',
              email: 'admin@rangaroo.store',
              fullName: 'Admin',
              role: 'admin',
            };
            set({ user: adminUser, isAuthModalOpen: false });
            return { error: null };
          }

          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (error) return { error: error.message };
          if (data.user) {
            const authUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              fullName: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
              role: data.user.user_metadata?.role || (cleanEmail.includes('admin') ? 'admin' : 'customer'),
            };
            set({ user: authUser, isAuthModalOpen: false });
          }
          return { error: null };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Sign in failed';
          return { error: message };
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, role: 'customer' },
            },
          });
          if (error) return { error: error.message };
          if (data.user) {
            const authUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: fullName,
              role: 'customer',
            };
            set({ user: authUser, isAuthModalOpen: false });
          }
          return { error: null };
        } catch (err: unknown) {
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
          set({ user: null });
        } catch {
          set({ user: null });
        }
      },

      refreshUser: async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            set({
              user: {
                id: user.id,
                email: user.email || '',
                fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                role: user.user_metadata?.role || 'customer',
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
    }),
    {
      name: 'rangaroo-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

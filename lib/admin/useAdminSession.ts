'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminRole, AdminPermission, checkRolePermission } from './adminAuth';
import { createClient } from '@/lib/supabase/client';

export interface AdminSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
}

interface AdminSessionStore {
  user: AdminSessionUser | null;
  isLoading: boolean;
  activeRoleOverride: AdminRole | null;
  setUser: (user: AdminSessionUser | null) => void;
  setRoleOverride: (role: AdminRole | null) => void;
  fetchAdminSession: () => Promise<void>;
  hasPermission: (permission: AdminPermission) => boolean;
  effectiveRole: () => AdminRole;
  signOut: () => Promise<void>;
}

const DEFAULT_SUPER_ADMIN: AdminSessionUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@rangaroo.store',
  fullName: 'Rangaroo Lead Admin',
  role: 'SUPER_ADMIN',
  isActive: true,
};

export const useAdminSession = create<AdminSessionStore>()(
  persist(
    (set, get) => ({
      user: DEFAULT_SUPER_ADMIN,
      isLoading: false,
      activeRoleOverride: null,

      setUser: (user) => {
        if (user && typeof window !== 'undefined') {
          try {
            document.cookie = `rangaroo_admin_role=${user.role}; path=/; SameSite=Lax`;
          } catch {}
        }
        set({ user });
      },
      setRoleOverride: (role) => {
        if (role && typeof window !== 'undefined') {
          try {
            document.cookie = `rangaroo_admin_role=${role}; path=/; SameSite=Lax`;
          } catch {}
        }
        set({ activeRoleOverride: role });
      },

      effectiveRole: () => {
        const { user, activeRoleOverride } = get();
        return activeRoleOverride || user?.role || 'SUPER_ADMIN';
      },

      hasPermission: (permission: AdminPermission) => {
        const role = get().effectiveRole();
        return checkRolePermission(role, permission);
      },

      fetchAdminSession: async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // Check public.admin_users for authoritative role
            const { data: adminRecord } = await supabase
              .from('admin_users')
              .select('id, email, full_name, role, is_active')
              .eq('id', user.id)
              .maybeSingle();

            if (adminRecord && adminRecord.is_active) {
              set({
                user: {
                  id: adminRecord.id,
                  email: adminRecord.email,
                  fullName: adminRecord.full_name || 'Admin User',
                  role: adminRecord.role as AdminRole,
                  isActive: adminRecord.is_active,
                },
                isLoading: false,
              });
              return;
            }

            // Fallback for user metadata role
            const isMetaAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
            if (isMetaAdmin) {
              set({
                user: {
                  id: user.id,
                  email: user.email || 'admin@rangaroo.store',
                  fullName: user.user_metadata?.full_name || 'Admin User',
                  role: (user.user_metadata?.admin_role as AdminRole) || 'SUPER_ADMIN',
                  isActive: true,
                },
                isLoading: false,
              });
              return;
            }
          }

          set({ isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
        } catch (e) {
          console.error('Error during admin sign out:', e);
        } finally {
          if (typeof window !== 'undefined') {
            document.cookie = 'rangaroo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'rangaroo_admin_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          set({ user: null, activeRoleOverride: null, isLoading: false });
        }
      },
    }),
    {
      name: 'rangaroo-admin-session',
      partialize: (state) => ({
        user: state.user,
        activeRoleOverride: state.activeRoleOverride,
      }),
    }
  )
);

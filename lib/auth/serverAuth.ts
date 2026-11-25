import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { getAuthoritativeAdminUser } from '@/lib/admin/adminAuth';

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const supabase = createServerClient();

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        return user;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Authoritative check:
 * Validates strictly against public.admin_users table (never client-editable user_metadata).
 */
export async function isUserAdmin(request: NextRequest): Promise<boolean> {
  const admin = await getAuthoritativeAdminUser(request);
  return admin !== null && admin.is_active === true;
}

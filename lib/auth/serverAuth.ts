import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

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

export async function isUserAdmin(request: NextRequest): Promise<boolean> {
  // Check authorization header first
  const user = await getAuthenticatedUser(request);
  if (user) {
    return user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
  }

  // Check user role header if supplied by secure edge proxy
  const roleHeader = request.headers.get('x-user-role');
  if (roleHeader === 'admin') {
    return true;
  }

  return false;
}

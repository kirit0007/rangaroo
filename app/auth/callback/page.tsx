'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            role: session.user.user_metadata?.role || 'customer',
          });
          router.push('/');
        } else {
          setError('No session found. Please try logging in again.');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        console.error('Auth callback error:', message);
        setError(message);
      }
    };

    handleAuthCallback();
  }, [router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--brand-cream)] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-gray-100 text-center">
        {error ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="px-6 py-3 bg-[var(--brand-orange)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Go Home
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-[var(--brand-orange)] animate-spin mb-4" />
            <h1 className="text-xl font-bold text-gray-900">Completing login...</h1>
            <p className="text-gray-500 text-sm mt-2">Please wait while we securely sign you in.</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        
        // Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
              role: session.user.user_metadata?.role || 'customer',
            });
            subscription.unsubscribe();
            router.push('/');
          }
        });

        // Exchange code if PKCE parameter exists
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (data.session?.user) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
              fullName: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || '',
              role: data.session.user.user_metadata?.role || 'customer',
            });
            router.push('/');
            return;
          }
        }

        // Check getSession fallback
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
          // If no session found after 2 seconds, redirect to home
          setTimeout(() => {
            router.push('/');
          }, 2000);
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
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-gray-100 text-center">
        {error ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <Link
              href="/"
              className="btn-primary py-3 px-6 text-sm font-bold"
            >
              Go to Home Page
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <h1 className="text-xl font-bold text-gray-900 font-outfit">Completing login...</h1>
            <p className="text-gray-500 text-sm mt-2">Please wait while we securely sign you in.</p>
          </div>
        )}
      </div>
    </div>
  );
}

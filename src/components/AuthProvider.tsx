import { useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore, UserRole } from '@/lib/auth-store';
import LoginPage from '@/pages/LoginPage';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { setAuth, clearAuth, isLoading, userId } = useAuthStore();

  const loadUserData = useCallback(async (uid: string, email: string) => {
    try {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', uid),
        supabase.from('profiles').select('full_name').eq('user_id', uid).single(),
      ]);

      setAuth({
        userId: uid,
        email,
        fullName: profile?.full_name ?? '',
        roles: (roles?.map(r => r.role) ?? []) as UserRole[],
      });
    } catch {
      // If queries fail, still authenticate with minimal data
      setAuth({ userId: uid, email, fullName: '', roles: [] });
    }
  }, [setAuth]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id, session.user.email ?? '');
      } else {
        clearAuth();
      }
    });

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          clearAuth();
          return;
        }
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Use setTimeout to avoid Supabase deadlock with async calls inside listener
          setTimeout(() => {
            loadUserData(session.user.id, session.user.email ?? '');
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData, clearAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">TRANS MAX SIB</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

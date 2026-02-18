import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore, UserRole } from '@/lib/auth-store';
import LoginPage from '@/pages/LoginPage';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { setAuth, clearAuth, isLoading, setLoading, userId } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', session.user.id)
          .single();

        setAuth({
          userId: session.user.id,
          email: session.user.email ?? '',
          fullName: profile?.full_name ?? '',
          roles: (roles?.map(r => r.role) ?? []) as UserRole[],
        });
      } else {
        clearAuth();
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', session.user.id)
          .single();

        setAuth({
          userId: session.user.id,
          email: session.user.email ?? '',
          fullName: profile?.full_name ?? '',
          roles: (roles?.map(r => r.role) ?? []) as UserRole[],
        });
      } else {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

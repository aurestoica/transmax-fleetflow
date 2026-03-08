import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import NotificationBell from '@/components/NotificationBell';
import { Menu, Settings, Clock, ShieldX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStatus } from '@/hooks/useCompanyStatus';
import { useAuthStore } from '@/lib/auth-store';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

function CompanyBlockedOverlay() {
  const { isActive, pendingApproval, loading } = useCompanyStatus();
  const { isPlatformOwner } = useAuthStore();

  // Platform owners, or active companies, or still loading — don't block
  if (loading || isActive || isPlatformOwner()) return null;

  return (
    <div className="absolute inset-0 z-40 bg-background/90 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md text-center p-8">
        {pendingApproval ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">Companie în curs de verificare</h2>
            <p className="text-muted-foreground mb-2">
              Cererea ta de înregistrare a fost primită și este în curs de verificare de către administratorul platformei.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Acest proces durează de obicei până la <strong>48 de ore</strong>. Vei primi o notificare când contul este activat.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
              <Clock className="h-3 w-3" />
              <span>Verificare în curs...</span>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">Companie dezactivată</h2>
            <p className="text-muted-foreground mb-2">
              Contul companiei tale a fost dezactivat de administratorul platformei.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Pentru mai multe informații sau pentru a solicita reactivarea, contactează administratorul platformei.
            </p>
          </>
        )}
        <Button variant="outline" onClick={() => supabase.auth.signOut()} className="mt-4">
          Deconectare
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AdminSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30 bg-background">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Deschide meniul"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Setări"
          >
            <Settings className="h-5 w-5" />
          </button>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
        <CompanyBlockedOverlay />
      </div>
    </div>
  );
}

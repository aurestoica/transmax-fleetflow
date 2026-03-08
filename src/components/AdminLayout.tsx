import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import NotificationBell from '@/components/NotificationBell';
import { Menu, Settings, Clock, ShieldX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStatus } from '@/hooks/useCompanyStatus';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

function CompanyBlockedOverlay() {
  const { isActive, pendingApproval, loading } = useCompanyStatus();
  const { isPlatformOwner } = useAuthStore();
  const { t } = useI18n();

  if (loading || isActive || isPlatformOwner()) return null;

  return (
    <div className="absolute inset-0 z-40 bg-background/90 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md text-center p-8">
        {pendingApproval ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">{t('blocked.pendingTitle')}</h2>
            <p className="text-muted-foreground mb-2">{t('blocked.pendingMsg')}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {t('blocked.pendingTime')} <strong>{t('blocked.hours48')}</strong>. {t('blocked.pendingNotify')}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
              <Clock className="h-3 w-3" />
              <span>{t('blocked.verifying')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">{t('blocked.deactivatedTitle')}</h2>
            <p className="text-muted-foreground mb-2">{t('blocked.deactivatedMsg')}</p>
            <p className="text-sm text-muted-foreground mb-6">{t('blocked.deactivatedHint')}</p>
          </>
        )}
        <Button variant="outline" onClick={() => supabase.auth.signOut()} className="mt-4">
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <CompanyBlockedOverlay />
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30 bg-background">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-foreground hover:bg-muted rounded-lg">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

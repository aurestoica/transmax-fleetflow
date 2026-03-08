import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n, type Language } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Building2, LayoutDashboard, LogOut, Shield, Menu, X, Users, Globe, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { usePendingCompanies } from '@/hooks/usePendingCompanies';
import NotificationBell from '@/components/NotificationBell';

const langLabels: Record<Language, string> = { ro: '🇷🇴', en: '🇬🇧', es: '🇪🇸' };

export default function PlatformLayout() {
  const { fullName, email } = useAuthStore();
  const { t, language, setLanguage } = useI18n();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count: pendingCount } = usePendingCompanies();

  const platformLinks = [
    { key: 'platform.dashboard', to: '/', icon: LayoutDashboard },
    { key: 'platform.companies', to: '/companies', icon: Building2, badgeKey: 'companies' as const },
    { key: 'platform.users', to: '/platform-users', icon: Users },
    { key: 'nav.notifications', to: '/notifications', icon: Bell },
  ];

  const cycleLang = () => {
    const langs: Language[] = ['ro', 'en', 'es'];
    const idx = langs.indexOf(language);
    setLanguage(langs[(idx + 1) % langs.length]);
  };

  const navContent = (
    <>
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border gap-2">
        <Shield className="h-7 w-7 text-sidebar-primary flex-shrink-0" strokeWidth={1.5} />
        <span className="font-display font-bold text-sidebar-foreground text-sm truncate">
          {t('platform.title')}
        </span>
        <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden p-1 text-sidebar-foreground/70">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {platformLinks.map(({ key, to, icon: Icon, badgeKey }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          const badge = badgeKey === 'companies' ? pendingCount : 0;
          return (
            <RouterNavLink
              key={to} to={to} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="truncate">{t(key)}</span>
              {badge > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 animate-pulse">
                  {badge}
                </span>
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button onClick={cycleLang} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors">
          <Globe className="h-[18px] w-[18px] flex-shrink-0" />
          <span>{langLabels[language]} {language.toUpperCase()}</span>
        </button>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent/50 w-full transition-colors">
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground font-medium truncate">{fullName || t('platform.owner')}</div>
        <div className="text-xs text-sidebar-foreground/50 truncate">{email}</div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar transition-transform duration-300 md:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        {navContent}
      </aside>
      <aside className="hidden md:flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 flex-shrink-0 sticky top-0 w-60">
        {navContent}
      </aside>
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 border-b border-border flex items-center px-4 md:px-6 flex-shrink-0 z-30 bg-background">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-foreground hover:bg-muted rounded-lg"><Menu className="h-5 w-5" /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{t('platform.owner')}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}

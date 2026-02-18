import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useI18n, Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Route, Users, Truck, Container, Building2,
  DollarSign, MessageSquare, Settings, LogOut, ChevronLeft, ChevronRight, Globe
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { key: 'nav.dashboard', to: '/', icon: LayoutDashboard },
  { key: 'nav.trips', to: '/trips', icon: Route },
  { key: 'nav.drivers', to: '/drivers', icon: Users },
  { key: 'nav.vehicles', to: '/vehicles', icon: Truck },
  { key: 'nav.trailers', to: '/trailers', icon: Container },
  { key: 'nav.clients', to: '/clients', icon: Building2 },
  { key: 'nav.financial', to: '/financial', icon: DollarSign },
  { key: 'nav.chat', to: '/chat', icon: MessageSquare },
  { key: 'nav.users', to: '/users', icon: Settings },
];

const langLabels: Record<Language, string> = { ro: '🇷🇴', en: '🇬🇧', es: '🇪🇸' };

export default function AdminSidebar() {
  const { t, language, setLanguage } = useI18n();
  const { fullName, email, isOwner } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const filteredLinks = adminLinks.filter(link => {
    if (link.to === '/users' && !isOwner()) return false;
    return true;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const cycleLang = () => {
    const langs: Language[] = ['ro', 'en', 'es'];
    const idx = langs.indexOf(language);
    setLanguage(langs[(idx + 1) % langs.length]);
  };

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 flex-shrink-0",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border gap-2">
        <Truck className="h-7 w-7 text-sidebar-primary flex-shrink-0" strokeWidth={1.5} />
        {!collapsed && (
          <span className="font-display font-bold text-sidebar-foreground text-sm truncate">
            TRANS MAX SIB
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredLinks.map(({ key, to, icon: Icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <RouterNavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{t(key)}</span>}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button onClick={cycleLang} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors">
          <Globe className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>{langLabels[language]} {language.toUpperCase()}</span>}
        </button>

        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent/50 w-full transition-colors">
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs">Minimizează</span>}
        </button>
      </div>

      {/* User */}
      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground font-medium truncate">{fullName || 'User'}</div>
          <div className="text-xs text-sidebar-foreground/50 truncate">{email}</div>
        </div>
      )}
    </aside>
  );
}

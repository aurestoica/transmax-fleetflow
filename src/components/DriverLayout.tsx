import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { supabase } from '@/integrations/supabase/client';
import { Route, FileText, MapPin, MessageSquare, LogOut, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';

const driverLinks = [
  { key: 'nav.myTrip', to: '/driver', icon: Route },
  { key: 'nav.documents', to: '/driver/documents', icon: FileText },
  { key: 'nav.location', to: '/driver/location', icon: MapPin },
  { key: 'nav.chat', to: '/driver/chat', icon: MessageSquare },
];

export default function DriverLayout() {
  const { t } = useI18n();
  const { fullName } = useAuthStore();
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" strokeWidth={1.5} />
          <span className="font-display font-bold text-sm">TRANS MAX SIB</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <span className="text-xs text-muted-foreground">{fullName}</span>
          <button onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-20 overflow-auto animate-fade-in">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around z-50 safe-area-inset-bottom">
        {driverLinks.map(({ key, to, icon: Icon }) => {
          const isActive = to === '/driver' 
            ? location.pathname === '/driver' 
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 text-[10px] py-1 px-3 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(key)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

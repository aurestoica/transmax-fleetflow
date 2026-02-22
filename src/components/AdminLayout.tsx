import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import NotificationBell from '@/components/NotificationBell';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
      <AdminSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30 bg-background">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Deschide meniul"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

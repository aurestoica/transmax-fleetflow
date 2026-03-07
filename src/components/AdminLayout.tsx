import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import NotificationBell from '@/components/NotificationBell';
import { Menu, Settings } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AdminSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30 bg-background">
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
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

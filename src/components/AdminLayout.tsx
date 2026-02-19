import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import NotificationBell from '@/components/NotificationBell';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="h-14 border-b border-border flex items-center justify-end px-6 flex-shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

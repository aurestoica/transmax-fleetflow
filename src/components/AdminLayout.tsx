import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Truck, Route } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState({ companies: 0, users: 0, vehicles: 0, trips: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
      supabase.from('trips').select('id', { count: 'exact', head: true }),
    ]).then(([c, u, v, t]) => {
      setStats({ companies: c.count ?? 0, users: u.count ?? 0, vehicles: v.count ?? 0, trips: t.count ?? 0 });
    });
  }, []);

  const cards = [
    { label: 'Companii', value: stats.companies, icon: Building2, color: 'text-primary', to: '/companies' },
    { label: 'Utilizatori', value: stats.users, icon: Users, color: 'text-accent-foreground' },
    { label: 'Vehicule', value: stats.vehicles, icon: Truck, color: 'text-accent-foreground' },
    { label: 'Curse totale', value: stats.trips, icon: Route, color: 'text-accent-foreground' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Platform Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, to }) => {
          const content = (
            <div key={label} className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          );
          return to ? <Link key={label} to={to}>{content}</Link> : <div key={label}>{content}</div>;
        })}
      </div>
    </div>
  );
}

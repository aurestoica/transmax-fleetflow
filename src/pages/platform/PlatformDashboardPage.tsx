import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Building2, Users, Truck, Route, DollarSign, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePendingCompanies } from '@/hooks/usePendingCompanies';

export default function PlatformDashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState({ companies: 0, users: 0, vehicles: 0, trips: 0, drivers: 0, totalRevenue: 0 });
  const [companyStats, setCompanyStats] = useState<any[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { count: pendingCount } = usePendingCompanies();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [companiesRes, profilesRes, vehiclesRes, tripsRes, driversRes] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('profiles').select('id, company_id', { count: 'exact' }),
      supabase.from('vehicles').select('id, company_id', { count: 'exact' }),
      supabase.from('trips').select('id, company_id, revenue, status'),
      supabase.from('drivers').select('id, company_id, status'),
    ]);

    const companies = companiesRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const vehicles = vehiclesRes.data ?? [];
    const trips = tripsRes.data ?? [];
    const drivers = driversRes.data ?? [];

    setPendingCompanies(companies.filter(c => c.pending_approval && !c.is_active));

    const totalRevenue = trips.reduce((sum, t) => sum + (Number(t.revenue) || 0), 0);

    setStats({
      companies: companies.length,
      users: profiles.length,
      vehicles: vehicles.length,
      trips: trips.length,
      drivers: drivers.length,
      totalRevenue,
    });

    // Per-company stats
    const perCompany = companies.map(c => ({
      id: c.id,
      name: c.name,
      is_active: c.is_active,
      users: profiles.filter(p => p.company_id === c.id).length,
      drivers: drivers.filter(d => d.company_id === c.id).length,
      vehicles: vehicles.filter(v => v.company_id === c.id).length,
      trips: trips.filter(t => t.company_id === c.id).length,
      activeTrips: trips.filter(t => t.company_id === c.id && ['in_transit', 'loading', 'unloading'].includes(t.status!)).length,
      revenue: trips.filter(t => t.company_id === c.id).reduce((s, t) => s + (Number(t.revenue) || 0), 0),
    }));
    setCompanyStats(perCompany);
    setLoading(false);
  };

  const cards = [
    { label: 'Companii', value: stats.companies, icon: Building2, color: 'text-primary', to: '/companies' },
    { label: 'Utilizatori', value: stats.users, icon: Users, color: 'text-accent-foreground', to: '/platform-users' },
    { label: 'Șoferi', value: stats.drivers, icon: Users, color: 'text-accent-foreground' },
    { label: 'Vehicule', value: stats.vehicles, icon: Truck, color: 'text-accent-foreground' },
    { label: 'Curse totale', value: stats.trips, icon: Route, color: 'text-accent-foreground' },
    { label: 'Venit total', value: `€${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Se încarcă...</div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Platform Dashboard</h1>

      {/* Pending company requests banner */}
      {pendingCompanies.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-semibold text-amber-800 dark:text-amber-300">
                {pendingCompanies.length} {pendingCompanies.length === 1 ? 'cerere nouă' : 'cereri noi'} de companie
              </h2>
            </div>
            <Link to="/companies">
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50">
                Vezi toate <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {pendingCompanies.map(c => (
              <Link key={c.id} to={`/companies/${c.id}`} className="block">
                <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 rounded-lg p-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.contact_email || 'Fără email'} • {c.cif || 'Fără CIF'}</div>
                  </div>
                  <span className="text-[10px] font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Așteaptă aprobare
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, to }) => {
          const content = (
            <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="text-xl md:text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          );
          return to ? <Link key={label} to={to}>{content}</Link> : <div key={label}>{content}</div>;
        })}
      </div>

      {/* Per-company breakdown */}
      <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Statistici per companie
      </h2>
      <div className="space-y-3">
        {companyStats.map(c => (
          <Link key={c.id} to={`/companies/${c.id}`} className="block">
            <div className="bg-card rounded-xl border p-4 hover:border-primary/30 transition-colors" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <span className={`text-xs ${c.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      {c.is_active ? 'Activă' : 'Inactivă'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
                  <div><div className="text-lg font-bold text-foreground">{c.users}</div><div className="text-[10px] text-muted-foreground">Utilizatori</div></div>
                  <div><div className="text-lg font-bold text-foreground">{c.drivers}</div><div className="text-[10px] text-muted-foreground">Șoferi</div></div>
                  <div><div className="text-lg font-bold text-foreground">{c.vehicles}</div><div className="text-[10px] text-muted-foreground">Vehicule</div></div>
                  <div><div className="text-lg font-bold text-foreground">{c.activeTrips}</div><div className="text-[10px] text-muted-foreground">Active</div></div>
                  <div><div className="text-lg font-bold text-primary">€{c.revenue.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">Venit</div></div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {companyStats.length === 0 && <div className="text-center text-muted-foreground py-8">Nicio companie încă</div>}
      </div>
    </div>
  );
}

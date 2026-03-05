import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import ExpiryWidget from '@/components/ExpiryWidget';
import { Route, Users, Truck, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  activeTrips: number;
  plannedTrips: number;
  availableDrivers: number;
  availableTrucks: number;
  delays: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats>({ activeTrips: 0, plannedTrips: 0, availableDrivers: 0, availableTrucks: 0, delays: 0, totalRevenue: 0 });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tripsRes, driversRes, vehiclesRes] = await Promise.all([
      supabase.from('trips').select('*').order('created_at', { ascending: false }),
      supabase.from('drivers').select('*'),
      supabase.from('vehicles').select('*'),
    ]);

    const trips = tripsRes.data ?? [];
    const drivers = driversRes.data ?? [];
    const vehicles = vehiclesRes.data ?? [];

    setStats({
      activeTrips: trips.filter(t => ['in_transit', 'loading', 'unloading'].includes(t.status!)).length,
      plannedTrips: trips.filter(t => t.status === 'planned').length,
      availableDrivers: drivers.filter(d => d.status === 'available').length,
      availableTrucks: vehicles.filter(v => v.status === 'available').length,
      delays: trips.filter(t => t.status === 'delayed').length,
      totalRevenue: trips.reduce((sum, t) => sum + (Number(t.revenue) || 0), 0),
    });

    setRecentTrips(trips.slice(0, 5));
    setLoading(false);
  };

  const statCards = [
    { label: t('dash.activeTrips'), value: stats.activeTrips, icon: Route, color: 'text-info' },
    { label: t('dash.plannedTrips'), value: stats.plannedTrips, icon: Clock, color: 'text-muted-foreground' },
    { label: t('dash.availableDrivers'), value: stats.availableDrivers, icon: Users, color: 'text-success' },
    { label: t('dash.availableTrucks'), value: stats.availableTrucks, icon: Truck, color: 'text-success' },
    { label: t('dash.delays'), value: stats.delays, icon: AlertTriangle, color: 'text-destructive' },
    { label: t('dash.revenue'), value: `€${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.dashboard')}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-xl md:text-2xl font-display font-bold text-foreground">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Expiry widget + Recent trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ExpiryWidget />

      {/* Recent trips */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-4 md:px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">{t('dash.recentTrips')}</h2>
          <Link to="/trips" className="text-sm text-primary hover:underline">{t('common.details')} →</Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('common.from')}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('common.to')}</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t('common.status')}</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">€</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map(trip => (
                <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{trip.trip_number}</td>
                  <td className="px-5 py-3 text-muted-foreground">{trip.pickup_address}</td>
                  <td className="px-5 py-3 text-muted-foreground">{trip.delivery_address}</td>
                  <td className="px-5 py-3"><StatusBadge status={trip.status} /></td>
                  <td className="px-5 py-3 text-right font-medium">€{Number(trip.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
              {recentTrips.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y">
          {recentTrips.map(trip => (
            <Link key={trip.id} to={`/trips/${trip.id}`} className="block p-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{trip.trip_number}</span>
                <StatusBadge status={trip.status} />
              </div>
              <div className="text-xs text-muted-foreground truncate">{trip.pickup_address} → {trip.delivery_address}</div>
              <div className="text-xs font-medium mt-1">€{Number(trip.revenue || 0).toLocaleString()}</div>
            </Link>
          ))}
          {recentTrips.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

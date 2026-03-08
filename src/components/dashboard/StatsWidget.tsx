import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Route, Users, Truck, AlertTriangle, DollarSign, Clock } from 'lucide-react';

export default function StatsWidget() {
  const { t } = useI18n();
  const [stats, setStats] = useState({ activeTrips: 0, plannedTrips: 0, availableDrivers: 0, availableTrucks: 0, delays: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('trips').select('status, revenue'),
      supabase.from('drivers').select('status'),
      supabase.from('vehicles').select('status'),
    ]).then(([tripsRes, driversRes, vehiclesRes]) => {
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
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: t('dash.activeTrips'), value: stats.activeTrips, icon: Route, color: 'text-info' },
    { label: t('dash.plannedTrips'), value: stats.plannedTrips, icon: Clock, color: 'text-muted-foreground' },
    { label: t('dash.availableDrivers'), value: stats.availableDrivers, icon: Users, color: 'text-success' },
    { label: t('dash.availableTrucks'), value: stats.availableTrucks, icon: Truck, color: 'text-success' },
    { label: t('dash.delays'), value: stats.delays, icon: AlertTriangle, color: 'text-destructive' },
    { label: t('dash.revenue'), value: `€${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-5 w-5 bg-muted rounded mb-2" />
            <div className="h-7 w-12 bg-muted rounded mb-1" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
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
  );
}

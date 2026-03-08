import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';

export default function RecentTripsWidget() {
  const { t } = useI18n();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
      setTrips(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
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
            {trips.map(trip => (
              <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-medium">{trip.trip_number}</td>
                <td className="px-5 py-3 text-muted-foreground">{trip.pickup_address}</td>
                <td className="px-5 py-3 text-muted-foreground">{trip.delivery_address}</td>
                <td className="px-5 py-3"><StatusBadge status={trip.status} /></td>
                <td className="px-5 py-3 text-right font-medium">€{Number(trip.revenue || 0).toLocaleString()}</td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="md:hidden divide-y">
        {trips.map(trip => (
          <Link key={trip.id} to={`/trips/${trip.id}`} className="block p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{trip.trip_number}</span>
              <StatusBadge status={trip.status} />
            </div>
            <div className="text-xs text-muted-foreground truncate">{trip.pickup_address} → {trip.delivery_address}</div>
            <div className="text-xs font-medium mt-1">€{Number(trip.revenue || 0).toLocaleString()}</div>
          </Link>
        ))}
        {trips.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</div>
        )}
      </div>
    </div>
  );
}

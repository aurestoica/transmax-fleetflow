import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Route, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const [client, setClient] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const [cRes, tripsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id!).single(),
      supabase.from('trips').select('id, trip_number, pickup_address, delivery_address, status, revenue, fuel_cost, road_taxes, other_expenses, driver_advance, pickup_date, drivers(full_name), vehicles(plate_number)').eq('client_id', id!).order('created_at', { ascending: false }),
    ]);
    setClient(cRes.data);
    setTrips(tripsRes.data ?? []);
    setLoading(false);
  };

  if (loading || !client) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  const totalRevenue = trips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
  const totalProfit = trips.reduce((s, t) => {
    const rev = Number(t.revenue) || 0;
    const costs = (Number(t.fuel_cost) || 0) + (Number(t.road_taxes) || 0) + (Number(t.other_expenses) || 0) + (Number(t.driver_advance) || 0);
    return s + rev - costs;
  }, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/clients" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <Building2 className="h-5 w-5 text-primary" />
        <h1 className="page-title">{client.company_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Info */}
        <div className="bg-card rounded-xl border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="font-display font-semibold">{t('common.details')}</h3>
          <div className="space-y-3 text-sm">
            {client.cif && <div className="text-muted-foreground">CIF: {client.cif}</div>}
            {client.contact_name && <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{client.contact_name}</span></div>}
            {client.contact_phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${client.contact_phone}`} className="text-primary hover:underline">{client.contact_phone}</a></div>}
            {client.contact_email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${client.contact_email}`} className="text-primary hover:underline">{client.contact_email}</a></div>}
            {client.address && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{client.address}</span></div>}
            {client.rate_per_km && <div className="flex items-center gap-3"><DollarSign className="h-4 w-4 text-muted-foreground" /><span className="font-semibold text-primary">€{client.rate_per_km}/km</span></div>}
            {client.notes && <div className="text-muted-foreground mt-2">📝 {client.notes}</div>}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-xl border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="font-display font-semibold">Statistici</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-display font-bold text-foreground">{trips.length}</div>
              <div className="text-xs text-muted-foreground">Total curse</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-display font-bold text-foreground">{trips.filter(t => ['in_transit', 'loading', 'unloading'].includes(t.status)).length}</div>
              <div className="text-xs text-muted-foreground">Curse active</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-display font-bold text-primary">€{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Venit total</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className={`text-2xl font-display font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>€{totalProfit.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Profit total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips */}
      <div className="mt-6 bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-4 border-b">
          <h3 className="font-display font-semibold flex items-center gap-2"><Route className="h-4 w-4" />Curse ({trips.length})</h3>
        </div>
        {trips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">{t('common.noData')}</div>
        ) : (
          <div className="divide-y">
            {trips.map((trip: any) => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{trip.trip_number}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{trip.pickup_address} → {trip.delivery_address}</div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    {trip.drivers?.full_name && <span>👤 {trip.drivers.full_name}</span>}
                    {trip.vehicles?.plate_number && <span>🚛 {trip.vehicles.plate_number}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-sm font-semibold">€{Number(trip.revenue || 0).toLocaleString()}</div>
                  {trip.pickup_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.pickup_date), 'dd.MM.yyyy')}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

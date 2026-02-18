import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusActions = [
  { from: 'planned', to: 'loading', key: 'driver.arrivedLoading' },
  { from: 'loading', to: 'in_transit', key: 'driver.departed' },
  { from: 'in_transit', to: 'unloading', key: 'driver.arrivedUnloading' },
  { from: 'unloading', to: 'completed', key: 'driver.delivered' },
];

export default function DriverTripsPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTrips(); }, []);

  const loadTrips = async () => {
    const { data: driver } = await supabase.from('drivers').select('id').eq('user_id', userId!).single();
    if (!driver) { setLoading(false); return; }

    const [active, completed] = await Promise.all([
      supabase.from('trips')
        .select('*, clients(company_name), vehicles(plate_number)')
        .eq('driver_id', driver.id)
        .in('status', ['planned', 'loading', 'in_transit', 'unloading'])
        .order('pickup_date'),
      supabase.from('trips')
        .select('*, clients(company_name), vehicles(plate_number)')
        .eq('driver_id', driver.id)
        .in('status', ['completed', 'cancelled', 'delayed'])
        .order('updated_at', { ascending: false })
        .limit(20),
    ]);

    setActiveTrips(active.data ?? []);
    setCompletedTrips(completed.data ?? []);
    setLoading(false);
  };

  const changeStatus = async (tripId: string, newStatus: string, label: string) => {
    await supabase.from('trips').update({ status: newStatus }).eq('id', tripId);
    await supabase.from('trip_events').insert({
      trip_id: tripId, user_id: userId,
      event_type: 'status_change',
      description: label
    });
    toast.success('Status actualizat!');
    loadTrips();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  const TripCard = ({ trip, showActions }: { trip: any; showActions: boolean }) => {
    const nextAction = statusActions.find(a => a.from === trip.status);
    return (
      <div className="bg-card rounded-xl border p-4 space-y-3" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold">{trip.trip_number}</span>
          <StatusBadge status={trip.status} />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Încărcare</div>
              <div>{trip.pickup_address}</div>
              {trip.pickup_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.pickup_date), 'dd.MM.yyyy HH:mm')}</div>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Descărcare</div>
              <div>{trip.delivery_address}</div>
              {trip.delivery_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.delivery_date), 'dd.MM.yyyy HH:mm')}</div>}
            </div>
          </div>
          {trip.clients?.company_name && <div className="flex items-center gap-2 text-muted-foreground"><Package className="h-3.5 w-3.5" />{trip.clients.company_name}</div>}
          {trip.vehicles?.plate_number && <div className="flex items-center gap-2 text-muted-foreground"><Truck className="h-3.5 w-3.5" />{trip.vehicles.plate_number}</div>}
        </div>
        {showActions && nextAction && (
          <Button className="driver-portal-btn w-full" onClick={() => changeStatus(trip.id, nextAction.to, t(nextAction.key))}>
            {t(nextAction.key)}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-xl font-display font-bold mb-4">{t('nav.myTrip')}</h1>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Curse active {activeTrips.length > 0 && <span className="ml-1.5 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">{activeTrips.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="history">
            Istoric {completedTrips.length > 0 && <span className="ml-1.5 bg-muted text-muted-foreground text-xs rounded-full px-1.5 py-0.5">{completedTrips.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeTrips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-3">🚛</div>
              <div className="font-medium">Nu ai curse active</div>
              <div className="text-sm mt-1">Contactează dispeceratul pentru atribuire</div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrips.map(trip => <TripCard key={trip.id} trip={trip} showActions={true} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {completedTrips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t('common.noData')}</div>
          ) : (
            <div className="space-y-4">
              {completedTrips.map(trip => <TripCard key={trip.id} trip={trip} showActions={false} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

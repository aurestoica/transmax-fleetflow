import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import RealtimeMap, { MapLocation } from '@/components/RealtimeMap';
import { MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function MapPage() {
  const { t } = useI18n();
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLocations = async () => {
    // Get latest location per active trip
    const { data: activeTrips } = await supabase
      .from('trips')
      .select('id, trip_number, driver_id, drivers(full_name)')
      .in('status', ['loading', 'in_transit', 'unloading']);

    if (!activeTrips || activeTrips.length === 0) {
      setLocations([]);
      setLoading(false);
      return;
    }

    const tripIds = activeTrips.map(t => t.id);
    
    // Get latest location for each trip
    const { data: locs } = await supabase
      .from('locations')
      .select('*')
      .in('trip_id', tripIds)
      .order('created_at', { ascending: false });

    if (!locs) { setLocations([]); setLoading(false); return; }

    // Keep only latest per trip
    const latestByTrip = new Map<string, typeof locs[0]>();
    locs.forEach(l => {
      if (!latestByTrip.has(l.trip_id)) latestByTrip.set(l.trip_id, l);
    });

    const tripMap = new Map(activeTrips.map(t => [t.id, t]));

    const mapped: MapLocation[] = Array.from(latestByTrip.values()).map(l => {
      const trip = tripMap.get(l.trip_id);
      return {
        id: l.id,
        lat: Number(l.lat),
        lng: Number(l.lng),
        tripNumber: trip?.trip_number,
        driverName: (trip?.drivers as any)?.full_name,
        updatedAt: l.created_at ? format(new Date(l.created_at), 'dd.MM.yyyy HH:mm') : undefined,
      };
    });

    setLocations(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadLocations();

    // Realtime subscription
    const channel = supabase
      .channel('locations-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, () => {
        loadLocations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h1 className="page-title">Hartă Live</h1>
        <span className="text-xs text-muted-foreground ml-2">
          {locations.length} {locations.length === 1 ? 'șofer activ' : 'șoferi activi'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>
      ) : locations.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nu există locații active. Șoferii vor apărea pe hartă când trimit locația.</p>
        </div>
      ) : (
        <RealtimeMap locations={locations} className="h-[calc(100vh-180px)]" />
      )}
    </div>
  );
}

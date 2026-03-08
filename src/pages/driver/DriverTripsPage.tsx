import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Package, Truck, Weight, FileBox, MessageSquare, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusActions = [
  { from: 'planned', to: 'loading', key: 'driver.arrivedLoading' },
  { from: 'loading', to: 'in_transit', key: 'driver.departed' },
  { from: 'in_transit', to: 'unloading', key: 'driver.arrivedUnloading' },
  { from: 'unloading', to: 'completed', key: 'driver.delivered' },
];

interface TripCardProps {
  trip: any;
  showActions: boolean;
  onStatusChange: (tripId: string, newStatus: string, label: string) => void;
  t: (key: string) => string;
}

function TripCard({ trip, showActions, onStatusChange, t }: TripCardProps) {
  const [expanded, setExpanded] = useState(false);
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
            <div className="text-xs text-muted-foreground">{t('driver.loading')}</div>
            <div>{trip.pickup_address}</div>
            {trip.pickup_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.pickup_date), 'dd.MM.yyyy HH:mm')}</div>}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">{t('driver.unloading')}</div>
            <div>{trip.delivery_address}</div>
            {trip.delivery_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.delivery_date), 'dd.MM.yyyy HH:mm')}</div>}
          </div>
        </div>
        {trip.clients?.company_name && <div className="flex items-center gap-2 text-muted-foreground"><Package className="h-3.5 w-3.5" />{trip.clients.company_name}</div>}
        {trip.vehicles?.plate_number && <div className="flex items-center gap-2 text-muted-foreground"><Truck className="h-3.5 w-3.5" />{trip.vehicles.plate_number}</div>}
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary font-medium w-full justify-center py-1"
      >
        {expanded ? t('driver.lessDetails') : t('driver.moreDetails')}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="space-y-2 text-sm border-t pt-3">
          {trip.cargo_type && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileBox className="h-3.5 w-3.5" />
              <span>{t('driver.cargo')}: <span className="text-foreground">{trip.cargo_type}</span></span>
            </div>
          )}
          {trip.weight_tons && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Weight className="h-3.5 w-3.5" />
              <span>{t('driver.weight')}: <span className="text-foreground">{trip.weight_tons} t</span></span>
            </div>
          )}
          {trip.distance_km && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Distanță: <span className="text-foreground">{trip.distance_km} km</span></span>
            </div>
          )}
          {trip.observations && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5" />
              <span>Observații: <span className="text-foreground">{trip.observations}</span></span>
            </div>
          )}
          {trip.clients?.contact_phone && (
            <a href={`tel:${trip.clients.contact_phone}`} className="flex items-center gap-2 text-primary">
              <Phone className="h-3.5 w-3.5" />
              {trip.clients.contact_phone}
            </a>
          )}
          {trip.clients?.contact_email && (
            <a href={`mailto:${trip.clients.contact_email}`} className="flex items-center gap-2 text-primary">
              <Mail className="h-3.5 w-3.5" />
              {trip.clients.contact_email}
            </a>
          )}
        </div>
      )}

      {showActions && nextAction && (
        <Button className="driver-portal-btn w-full" onClick={() => onStatusChange(trip.id, nextAction.to, t(nextAction.key))}>
          {t(nextAction.key)}
        </Button>
      )}
    </div>
  );
}

export default function DriverTripsPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ tripId: string; newStatus: string; label: string; note: string } | null>(null);

  useEffect(() => { loadTrips(); }, []);

  const loadTrips = async () => {
    const { data: driver } = await supabase.from('drivers').select('id').eq('user_id', userId!).single();
    if (!driver) { setLoading(false); return; }

    const [active, completed] = await Promise.all([
      supabase.from('trips')
        .select('*, clients(company_name, contact_phone, contact_email), vehicles(plate_number)')
        .eq('driver_id', driver.id)
        .in('status', ['planned', 'loading', 'in_transit', 'unloading'])
        .order('pickup_date'),
      supabase.from('trips')
        .select('*, clients(company_name, contact_phone, contact_email), vehicles(plate_number)')
        .eq('driver_id', driver.id)
        .in('status', ['completed', 'cancelled', 'delayed'])
        .order('updated_at', { ascending: false })
        .limit(20),
    ]);

    setActiveTrips(active.data ?? []);
    setCompletedTrips(completed.data ?? []);
    setLoading(false);
  };

  const requestStatusChange = (tripId: string, newStatus: string, label: string) => {
    setConfirmDialog({ tripId, newStatus, label, note: '' });
  };

  const confirmStatusChange = async () => {
    if (!confirmDialog) return;
    const { tripId, newStatus, label, note } = confirmDialog;

    await supabase.from('trips').update({ status: newStatus }).eq('id', tripId);

    // Insert event with optional note
    await supabase.from('trip_events').insert({
      trip_id: tripId, user_id: userId,
      event_type: 'status_change',
      description: label + (note ? ` — ${note}` : '')
    });

    // If driver added a note, also update trip observations
    if (note.trim()) {
      const { data: trip } = await supabase.from('trips').select('observations').eq('id', tripId).single();
      const existingObs = trip?.observations || '';
      const timestamp = format(new Date(), 'dd.MM HH:mm');
      const newObs = existingObs ? `${existingObs}\n[${timestamp}] ${note}` : `[${timestamp}] ${note}`;
      await supabase.from('trips').update({ observations: newObs }).eq('id', tripId);
    }

    toast.success('Status actualizat!');
    setConfirmDialog(null);
    loadTrips();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-xl font-display font-bold mb-4">{t('nav.myTrip')}</h1>

      {/* Status change confirmation dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmă schimbarea statusului</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să schimbi statusul la „{confirmDialog?.label}"?
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Notă (opțional)</label>
            <Textarea
              placeholder="Adaugă o notă sau observație..."
              value={confirmDialog?.note ?? ''}
              onChange={e => setConfirmDialog(prev => prev ? { ...prev, note: e.target.value } : null)}
              className="min-h-[60px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Anulează</Button>
            <Button onClick={confirmStatusChange}>Confirmă</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {activeTrips.map(trip => <TripCard key={trip.id} trip={trip} showActions={true} onStatusChange={requestStatusChange} t={t} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {completedTrips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t('common.noData')}</div>
          ) : (
            <div className="space-y-4">
              {completedTrips.map(trip => <TripCard key={trip.id} trip={trip} showActions={false} onStatusChange={requestStatusChange} t={t} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

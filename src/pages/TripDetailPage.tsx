import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Truck, User, Package, DollarSign, FileText, Image, Eye, Download, Pencil, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

const allStatuses = ['planned', 'loading', 'in_transit', 'unloading', 'completed', 'cancelled', 'delayed'];

export default function TripDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [trip, setTrip] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Financial edit mode
  const [editingFinancial, setEditingFinancial] = useState(false);
  const [finForm, setFinForm] = useState({ revenue: '', fuel_cost: '', road_taxes: '', other_expenses: '', driver_advance: '', distance_km: '' });
  const [savingFin, setSavingFin] = useState(false);

  useEffect(() => { loadTrip(); }, [id]);

  const loadTrip = async () => {
    const { data } = await supabase.from('trips')
      .select('*, clients(company_name), drivers(full_name), vehicles(plate_number, model), trailers(plate_number)')
      .eq('id', id!).single();
    setTrip(data);
    if (data) {
      setFinForm({
        revenue: data.revenue?.toString() || '0',
        fuel_cost: data.fuel_cost?.toString() || '0',
        road_taxes: data.road_taxes?.toString() || '0',
        other_expenses: data.other_expenses?.toString() || '0',
        driver_advance: data.driver_advance?.toString() || '0',
        distance_km: data.distance_km?.toString() || '',
      });
    }

    const { data: ev } = await supabase.from('trip_events')
      .select('*').eq('trip_id', id!).order('created_at', { ascending: false });
    setEvents(ev ?? []);

    const { data: docs } = await supabase.from('documents')
      .select('*, drivers:driver_id(full_name)')
      .eq('trip_id', id!)
      .order('created_at', { ascending: false });
    
    // Fetch uploader names from profiles separately (FK points to auth.users, not public.profiles)
    const uploaderIds = [...new Set((docs ?? []).map(d => d.uploaded_by).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (uploaderIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', uploaderIds);
      profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.full_name]));
    }
    setDocuments((docs ?? []).map(d => ({ ...d, uploader_name: d.uploaded_by ? profileMap[d.uploaded_by] : null })));

    setLoading(false);
  };

  const changeStatus = async (newStatus: string) => {
    await supabase.from('trips').update({ status: newStatus }).eq('id', id!);
    await supabase.from('trip_events').insert({
      trip_id: id!, user_id: userId,
      event_type: 'status_change',
      description: `Status schimbat: ${newStatus}`
    });
    toast.success('Status actualizat!');
    loadTrip();
  };

  const saveFinancial = async () => {
    setSavingFin(true);
    const { error } = await supabase.from('trips').update({
      revenue: parseFloat(finForm.revenue) || 0,
      fuel_cost: parseFloat(finForm.fuel_cost) || 0,
      road_taxes: parseFloat(finForm.road_taxes) || 0,
      other_expenses: parseFloat(finForm.other_expenses) || 0,
      driver_advance: parseFloat(finForm.driver_advance) || 0,
      distance_km: finForm.distance_km ? parseFloat(finForm.distance_km) : null,
    }).eq('id', id!);
    setSavingFin(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Date financiare actualizate!');
    setEditingFinancial(false);
    loadTrip();
  };

  if (loading || !trip) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  const profit = (Number(trip.revenue) || 0) - (Number(trip.fuel_cost) || 0) - (Number(trip.road_taxes) || 0) - (Number(trip.other_expenses) || 0) - (Number(trip.driver_advance) || 0);
  const margin = trip.revenue ? ((profit / Number(trip.revenue)) * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/trips" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="page-title">{trip.trip_number}</h1>
        <StatusBadge status={trip.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Trip info */}
        <div className="bg-card rounded-xl border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="font-display font-semibold">{t('common.details')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-success mt-0.5" />
              <div><div className="text-muted-foreground text-xs">Încărcare</div><div>{trip.pickup_address}</div>
                {trip.pickup_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.pickup_date), 'dd.MM.yyyy HH:mm')}</div>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-destructive mt-0.5" />
              <div><div className="text-muted-foreground text-xs">Descărcare</div><div>{trip.delivery_address}</div>
                {trip.delivery_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.delivery_date), 'dd.MM.yyyy HH:mm')}</div>}
              </div>
            </div>
            {trip.clients?.company_name && <div className="flex items-center gap-3"><Package className="h-4 w-4 text-muted-foreground" /><span>Client: {trip.clients.company_name}</span></div>}
            {trip.drivers?.full_name && <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span>Șofer: {trip.drivers.full_name}</span></div>}
            {trip.vehicles?.plate_number && <div className="flex items-center gap-3"><Truck className="h-4 w-4 text-muted-foreground" /><span>{trip.vehicles.plate_number} - {trip.vehicles.model}</span></div>}
            {trip.cargo_type && <div className="text-muted-foreground">Marfă: {trip.cargo_type} ({trip.weight_tons}t)</div>}
            {trip.distance_km && <div className="text-muted-foreground">Distanță: {trip.distance_km} km</div>}
          </div>

          <div className="pt-3 border-t">
            <label className="text-xs text-muted-foreground">Schimbă status:</label>
            <Select value={trip.status} onValueChange={changeStatus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Financial */}
        <div className="bg-card rounded-xl border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" />Financiar</h3>
            {!editingFinancial ? (
              <Button variant="ghost" size="sm" onClick={() => setEditingFinancial(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />Editează
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingFinancial(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" onClick={saveFinancial} disabled={savingFin}>
                  <Check className="h-3.5 w-3.5 mr-1" />Salvează
                </Button>
              </div>
            )}
          </div>

          {editingFinancial ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Venit (€)</Label>
                  <Input type="number" value={finForm.revenue} onChange={e => setFinForm({...finForm, revenue: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Combustibil (€)</Label>
                  <Input type="number" value={finForm.fuel_cost} onChange={e => setFinForm({...finForm, fuel_cost: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Taxe drum (€)</Label>
                  <Input type="number" value={finForm.road_taxes} onChange={e => setFinForm({...finForm, road_taxes: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alte cheltuieli (€)</Label>
                  <Input type="number" value={finForm.other_expenses} onChange={e => setFinForm({...finForm, other_expenses: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Avans șofer (€)</Label>
                  <Input type="number" value={finForm.driver_advance} onChange={e => setFinForm({...finForm, driver_advance: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distanță (km)</Label>
                  <Input type="number" value={finForm.distance_km} onChange={e => setFinForm({...finForm, distance_km: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Venit</span><span className="font-medium">€{Number(trip.revenue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Combustibil</span><span>-€{Number(trip.fuel_cost || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxe drum</span><span>-€{Number(trip.road_taxes || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Alte cheltuieli</span><span>-€{Number(trip.other_expenses || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avans șofer</span><span>-€{Number(trip.driver_advance || 0).toLocaleString()}</span></div>
              {trip.distance_km && <div className="flex justify-between"><span className="text-muted-foreground">Distanță</span><span>{trip.distance_km} km</span></div>}
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Profit brut</span>
                <span className={profit >= 0 ? 'text-success' : 'text-destructive'}>€{profit.toLocaleString()} ({margin}%)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents section */}
      <div className="bg-card rounded-xl border p-5 mt-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" />{t('nav.documents')} ({documents.length})
        </h3>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center flex-shrink-0">
                  {doc.file_type?.startsWith('image/') ? (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(doc.uploader_name || doc.drivers?.full_name) && <span>de {doc.uploader_name || doc.drivers?.full_name} · </span>}
                    {doc.doc_category && <span className="capitalize">{doc.doc_category.replace('_', ' ')} · </span>}
                    {doc.created_at && format(new Date(doc.created_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPreviewUrl(doc.file_url)} className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-background transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <a href={doc.file_url} download target="_blank" rel="noopener" className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-background transition-colors">
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-xl border p-5 mt-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 className="font-display font-semibold mb-4">Timeline</h3>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-foreground">{ev.description}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(ev.created_at), 'dd.MM.yyyy HH:mm')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Previzualizare</DialogTitle></DialogHeader>
          {previewUrl && (
            previewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
              <img src={previewUrl} alt="Document" className="w-full rounded-lg" />
            ) : (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg border" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

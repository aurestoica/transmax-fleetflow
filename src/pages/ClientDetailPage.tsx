import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Route, DollarSign, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', cif: '', address: '', contact_name: '', contact_email: '', contact_phone: '', rate_per_km: '' });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const openEdit = () => {
    setForm({
      company_name: client.company_name || '',
      cif: client.cif || '',
      address: client.address || '',
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      rate_per_km: client.rate_per_km?.toString() || '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, rate_per_km: form.rate_per_km ? parseFloat(form.rate_per_km) : null };
    const { error } = await supabase.from('clients').update(payload).eq('id', id!);
    if (error) { toast.error(error.message); return; }
    toast.success('Client actualizat!');
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('clients').delete().eq('id', id!);
    if (error) { toast.error(error.message); return; }
    toast.success('Client șters!');
    navigate('/clients');
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
      <div className="flex items-center gap-3 mb-6 min-w-0">
        <Link to="/clients" className="text-muted-foreground hover:text-foreground flex-shrink-0"><ArrowLeft className="h-5 w-5" /></Link>
        <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
        <h1 className="page-title flex-1 truncate">{client.company_name}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openEdit}><Pencil className="h-3.5 w-3.5 mr-2" />Editează</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Șterge</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editare client</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2"><Label>Numele firmei *</Label><Input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>CIF</Label><Input value={form.cif} onChange={e => setForm({...form, cif: e.target.value})} /></div>
            <div className="space-y-2"><Label>Persoana contact</Label><Input value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} /></div>
            <div className="col-span-2 space-y-2"><Label>Adresă</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
            <div className="space-y-2"><Label>Tarif €/km</Label><Input type="number" step="0.01" value={form.rate_per_km} onChange={e => setForm({...form, rate_per_km: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.company_name}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi clientul?</AlertDialogTitle>
            <AlertDialogDescription>Această acțiune nu poate fi anulată. Clientul va fi șters permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

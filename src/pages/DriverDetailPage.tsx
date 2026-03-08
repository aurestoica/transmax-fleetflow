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
import { ArrowLeft, Phone, Mail, CreditCard, Star, Route, FileText, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DriverDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', license_number: '', license_expiry: '', tachograph_card: '', tachograph_expiry: '', notes: '' });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const [driverRes, tripsRes, docsRes] = await Promise.all([
      supabase.from('drivers').select('*').eq('id', id!).single(),
      supabase.from('trips').select('id, trip_number, pickup_address, delivery_address, status, revenue, pickup_date').eq('driver_id', id!).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('driver_id', id!).order('created_at', { ascending: false }),
    ]);
    setDriver(driverRes.data);
    setTrips(tripsRes.data ?? []);
    setDocuments(docsRes.data ?? []);
    setLoading(false);
  };

  const openEdit = () => {
    setForm({
      full_name: driver.full_name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      license_number: driver.license_number || '',
      license_expiry: driver.license_expiry || '',
      tachograph_card: driver.tachograph_card || '',
      tachograph_expiry: driver.tachograph_expiry || '',
      notes: driver.notes || '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const { error } = await supabase.from('drivers').update(form).eq('id', id!);
    if (error) { toast.error(error.message); return; }
    toast.success('Șofer actualizat!');
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('drivers').delete().eq('id', id!);
    if (error) { toast.error(error.message); return; }
    toast.success('Șofer șters!');
    navigate('/drivers');
  };

  if (loading || !driver) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };
  const isExpired = (date: string | null) => date ? new Date(date) < new Date() : false;

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/drivers" className="text-muted-foreground hover:text-foreground flex-shrink-0"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="page-title flex-1 truncate">{driver.full_name}</h1>
          <StatusBadge status={driver.status} />
        </div>
        <div className="flex items-center gap-2 pl-8">
          <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-3.5 w-3.5 mr-1" />Editează</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editare șofer</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2"><Label>Nume complet *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Nr. permis</Label><Input value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} /></div>
            <div className="space-y-2"><Label>Expirare permis</Label><Input type="date" value={form.license_expiry} onChange={e => setForm({...form, license_expiry: e.target.value})} /></div>
            <div className="space-y-2"><Label>Card tahograf</Label><Input value={form.tachograph_card} onChange={e => setForm({...form, tachograph_card: e.target.value})} /></div>
            <div className="space-y-2"><Label>Expirare tahograf</Label><Input type="date" value={form.tachograph_expiry} onChange={e => setForm({...form, tachograph_expiry: e.target.value})} /></div>
            <div className="col-span-2 space-y-2"><Label>Notițe</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.full_name}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi șoferul?</AlertDialogTitle>
            <AlertDialogDescription>Această acțiune nu poate fi anulată. Șoferul va fi șters permanent.</AlertDialogDescription>
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
            {driver.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${driver.phone}`} className="text-primary hover:underline">{driver.phone}</a></div>}
            {driver.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${driver.email}`} className="text-primary hover:underline">{driver.email}</a></div>}
            {driver.rating && <div className="flex items-center gap-3"><Star className="h-4 w-4 text-amber-500" /><span>Rating: {driver.rating}</span></div>}
            {driver.license_number && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span>Permis: {driver.license_number}</span>
                  {driver.license_expiry && (
                    <span className={`ml-2 text-xs ${isExpired(driver.license_expiry) ? 'text-destructive font-semibold' : isExpiringSoon(driver.license_expiry) ? 'text-amber-500 font-semibold' : 'text-muted-foreground'}`}>
                      (exp: {driver.license_expiry})
                    </span>
                  )}
                </div>
              </div>
            )}
            {driver.tachograph_card && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span>Tahograf: {driver.tachograph_card}</span>
                  {driver.tachograph_expiry && (
                    <span className={`ml-2 text-xs ${isExpired(driver.tachograph_expiry) ? 'text-destructive font-semibold' : isExpiringSoon(driver.tachograph_expiry) ? 'text-amber-500 font-semibold' : 'text-muted-foreground'}`}>
                      (exp: {driver.tachograph_expiry})
                    </span>
                  )}
                </div>
              </div>
            )}
            {driver.notes && <div className="text-muted-foreground mt-2">📝 {driver.notes}</div>}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-card rounded-xl border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />Documente</h3>
            <span className="text-xs text-muted-foreground">{documents.length} documente</span>
          </div>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">{t('common.noData')}</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {documents.map(doc => (
                <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{doc.name}</div>
                    {doc.created_at && <div className="text-xs text-muted-foreground">{format(new Date(doc.created_at), 'dd.MM.yyyy')}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trips */}
      <div className="mt-6 bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-display font-semibold flex items-center gap-2"><Route className="h-4 w-4" />Curse ({trips.length})</h3>
        </div>
        {trips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">{t('common.noData')}</div>
        ) : (
          <div className="divide-y">
            {trips.map(trip => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{trip.trip_number}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{trip.pickup_address} → {trip.delivery_address}</div>
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

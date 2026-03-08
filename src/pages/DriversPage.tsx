import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Phone, Mail, Pencil, Trash2, Clock } from 'lucide-react';
import DriverAvatarDisplay from '@/components/DriverAvatarDisplay';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const emptyForm = { full_name: '', phone: '', email: '', license_number: '', license_expiry: '', tachograph_card: '', tachograph_expiry: '', notes: '' };

export default function DriversPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Record<string, number>>({});

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const [driversRes, requestsRes] = await Promise.all([
      supabase.from('drivers').select('*').order('full_name'),
      supabase.from('profile_change_requests').select('driver_id').eq('status', 'pending'),
    ]);
    setDrivers(driversRes.data ?? []);
    // Count pending requests per driver
    const counts: Record<string, number> = {};
    (requestsRes.data ?? []).forEach((r: any) => { counts[r.driver_id] = (counts[r.driver_id] || 0) + 1; });
    setPendingRequests(counts);
    setLoading(false);

    // Auto-open edit dialog if highlight param is present
    const highlightId = searchParams.get('highlight');
    if (highlightId && driversRes.data) {
      const driver = driversRes.data.find((d: any) => d.id === highlightId);
      if (driver) {
        setEditingId(driver.id);
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
        setDialogOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (driver: any) => {
    setEditingId(driver.id);
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
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingId) {
      const { error } = await supabase.from('drivers').update(form).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success('Șofer actualizat!');
    } else {
      const { error } = await supabase.from('drivers').insert(form);
      if (error) { toast.error(error.message); return; }
      toast.success('Șofer adăugat!');
    }
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('drivers').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success('Șofer șters!');
    setDeleteId(null);
    loadData();
  };

  const filtered = drivers.filter(d => !search || d.full_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.drivers')}</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editare șofer' : 'Șofer nou'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2"><Label>Nume complet *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Nr. permis</Label><Input value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} /></div>
            <div className="space-y-2"><Label>Expirare permis</Label><Input type="date" value={form.license_expiry} onChange={e => setForm({...form, license_expiry: e.target.value})} /></div>
            <div className="space-y-2"><Label>Card tahograf</Label><Input value={form.tachograph_card} onChange={e => setForm({...form, tachograph_card: e.target.value})} /></div>
            <div className="space-y-2"><Label>Expirare tahograf</Label><Input type="date" value={form.tachograph_expiry} onChange={e => setForm({...form, tachograph_expiry: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.full_name}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
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

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(driver => (
          <div key={driver.id} className="bg-card rounded-xl border p-4 relative" style={{ boxShadow: 'var(--shadow-card)' }}>
            {pendingRequests[driver.id] && (
              <div className="absolute -top-1.5 -right-1.5">
                <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px] font-bold flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />{pendingRequests[driver.id]}
                </Badge>
              </div>
            )}
            <div className="flex items-start gap-3 mb-3">
              <DriverAvatarDisplay avatarUrl={driver.avatar_url} driverName={driver.full_name} size="sm" />
              <div className="flex-1 min-w-0">
                <Link to={`/drivers/${driver.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">{driver.full_name}</Link>
                <div className="text-xs text-muted-foreground">⭐ {driver.rating}</div>
              </div>
              <StatusBadge status={driver.status} />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {driver.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{driver.phone}</div>}
              {driver.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{driver.email}</div>}
              {driver.license_number && <div>Permis: {driver.license_number}</div>}
              {driver.license_expiry && <div className="text-xs">Exp: {driver.license_expiry}</div>}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(driver)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />Editează
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(driver.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{t('common.noData')}</div>}
      </div>
    </div>
  );
}

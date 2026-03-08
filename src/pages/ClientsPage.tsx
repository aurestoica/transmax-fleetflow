import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Building2, Phone, Mail, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { company_name: '', cif: '', address: '', contact_name: '', contact_email: '', contact_phone: '', rate_per_km: '' };

export default function ClientsPage() {
  const { t } = useI18n();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const { data } = await supabase.from('clients').select('*').order('company_name');
    setClients(data ?? []); setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      company_name: c.company_name || '',
      cif: c.cif || '',
      address: c.address || '',
      contact_name: c.contact_name || '',
      contact_email: c.contact_email || '',
      contact_phone: c.contact_phone || '',
      rate_per_km: c.rate_per_km?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, rate_per_km: form.rate_per_km ? parseFloat(form.rate_per_km) : null };
    if (editingId) {
      const { error } = await supabase.from('clients').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success('Client actualizat!');
    } else {
      const { error } = await supabase.from('clients').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Client adăugat!');
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null); loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('clients').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success('Client șters!');
    setDeleteId(null); loadData();
  };

  const filtered = clients.filter(c => !search || c.company_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.clients')}</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editare client' : 'Client nou'}</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.company_name}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
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

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-card rounded-xl border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <Link to={`/clients/${c.id}`} className="font-semibold text-foreground flex-1 truncate hover:text-primary transition-colors">{c.company_name}</Link>
            </div>
            {c.cif && <div className="text-xs text-muted-foreground mb-2">CIF: {c.cif}</div>}
            <div className="space-y-1 text-sm text-muted-foreground">
              {c.contact_name && <div>{c.contact_name}</div>}
              {c.contact_phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{c.contact_phone}</div>}
              {c.contact_email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{c.contact_email}</div>}
              {c.rate_per_km && <div className="text-xs font-medium text-primary">€{c.rate_per_km}/km</div>}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(c)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />Editează
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
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

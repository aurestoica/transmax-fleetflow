import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { plate_number: '', type: '', capacity_tons: '', itp_expiry: '' };

export default function TrailersPage() {
  const { t } = useI18n();
  const [trailers, setTrailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const { data } = await supabase.from('trailers').select('*').order('plate_number');
    setTrailers(data ?? []); setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (tr: any) => {
    setEditingId(tr.id);
    setForm({
      plate_number: tr.plate_number || '',
      type: tr.type || '',
      capacity_tons: tr.capacity_tons?.toString() || '',
      itp_expiry: tr.itp_expiry || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      plate_number: form.plate_number,
      type: form.type || null,
      capacity_tons: form.capacity_tons ? parseFloat(form.capacity_tons) : null,
      itp_expiry: form.itp_expiry || null,
    };
    if (editingId) {
      const { error } = await supabase.from('trailers').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success('Remorcă actualizată!');
    } else {
      const { error } = await supabase.from('trailers').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Remorcă adăugată!');
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null); loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('trailers').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success('Remorcă ștearsă!');
    setDeleteId(null); loadData();
  };

  const filtered = trailers.filter(tr => !search || tr.plate_number?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.trailers')}</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Editare remorcă' : 'Remorcă nouă'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nr. înmatriculare *</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} /></div>
            <div className="space-y-2"><Label>Tip</Label><Input value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="Prelată / Frigorific" /></div>
            <div className="space-y-2"><Label>Capacitate (tone)</Label><Input type="number" value={form.capacity_tons} onChange={e => setForm({...form, capacity_tons: e.target.value})} /></div>
            <div className="space-y-2"><Label>ITP expirare</Label><Input type="date" value={form.itp_expiry} onChange={e => setForm({...form, itp_expiry: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.plate_number}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi remorca?</AlertDialogTitle>
            <AlertDialogDescription>Această acțiune nu poate fi anulată. Remorca va fi ștearsă permanent.</AlertDialogDescription>
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
        {filtered.map(tr => (
          <div key={tr.id} className="bg-card rounded-xl border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="font-display font-semibold">{tr.plate_number}</div>
              <StatusBadge status={tr.status} />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {tr.type && <div>Tip: {tr.type}</div>}
              {tr.capacity_tons && <div>Capacitate: {tr.capacity_tons}t</div>}
              {tr.itp_expiry && <div>ITP: {tr.itp_expiry}</div>}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(tr)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />Editează
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(tr.id)}>
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

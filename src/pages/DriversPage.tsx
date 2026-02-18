import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function DriversPage() {
  const { t } = useI18n();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', license_number: '', license_expiry: '', tachograph_card: '', tachograph_expiry: '', notes: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const { data } = await supabase.from('drivers').select('*').order('full_name');
    setDrivers(data ?? []); setLoading(false);
  };

  const handleCreate = async () => {
    const { error } = await supabase.from('drivers').insert(form);
    if (error) { toast.error(error.message); return; }
    toast.success('Șofer adăugat!');
    setDialogOpen(false);
    setForm({ full_name: '', phone: '', email: '', license_number: '', license_expiry: '', tachograph_card: '', tachograph_expiry: '', notes: '' });
    loadData();
  };

  const filtered = drivers.filter(d => !search || d.full_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.drivers')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Șofer nou</DialogTitle></DialogHeader>
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
              <Button onClick={handleCreate} disabled={!form.full_name}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(driver => (
          <div key={driver.id} className="bg-card rounded-xl border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-foreground">{driver.full_name}</div>
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
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{t('common.noData')}</div>}
      </div>
    </div>
  );
}

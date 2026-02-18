import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientsPage() {
  const { t } = useI18n();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', cif: '', address: '', contact_name: '', contact_email: '', contact_phone: '', rate_per_km: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { const { data } = await supabase.from('clients').select('*').order('company_name'); setClients(data ?? []); setLoading(false); };

  const handleCreate = async () => {
    const { error } = await supabase.from('clients').insert({
      ...form, rate_per_km: form.rate_per_km ? parseFloat(form.rate_per_km) : null
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Client adăugat!');
    setDialogOpen(false); setForm({ company_name: '', cif: '', address: '', contact_name: '', contact_email: '', contact_phone: '', rate_per_km: '' }); loadData();
  };

  const filtered = clients.filter(c => !search || c.company_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.clients')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Client nou</DialogTitle></DialogHeader>
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
              <Button onClick={handleCreate} disabled={!form.company_name}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-card rounded-xl border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <div className="font-semibold text-foreground">{c.company_name}</div>
            </div>
            {c.cif && <div className="text-xs text-muted-foreground mb-2">CIF: {c.cif}</div>}
            <div className="space-y-1 text-sm text-muted-foreground">
              {c.contact_name && <div>{c.contact_name}</div>}
              {c.contact_phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{c.contact_phone}</div>}
              {c.contact_email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{c.contact_email}</div>}
              {c.rate_per_km && <div className="text-xs font-medium text-primary">€{c.rate_per_km}/km</div>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{t('common.noData')}</div>}
      </div>
    </div>
  );
}

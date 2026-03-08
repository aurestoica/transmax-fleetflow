import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2, Check, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', cif: '', address: '', contact_email: '', contact_phone: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies(data ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Numele companiei este obligatoriu'); return; }
    const { error } = await supabase.from('companies').insert(form as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Companie creată!');
    setDialogOpen(false);
    setForm({ name: '', cif: '', address: '', contact_email: '', contact_phone: '' });
    loadData();
  };

  const toggleActive = async (id: string, currentActive: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from('companies').update({ is_active: !currentActive } as any).eq('id', id);
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Se încarcă...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Companii</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Companie nouă</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Companie nouă</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nume companie *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>CIF</Label><Input value={form.cif} onChange={e => setForm({ ...form, cif: e.target.value })} /></div>
              <div className="space-y-2"><Label>Adresă</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email contact</Label><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefon</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
              <Button onClick={handleCreate} disabled={!form.name.trim()}>Creează</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {companies.map(c => (
          <Link key={c.id} to={`/companies/${c.id}`}>
            <div className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/30 transition-colors" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.cif || 'Fără CIF'} • {c.contact_email || 'Fără email'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {c.is_active ? <><Check className="h-3 w-3" />Activă</> : <><X className="h-3 w-3" />Inactivă</>}
                </span>
                <Button variant="outline" size="sm" onClick={(e) => toggleActive(c.id, c.is_active, e)}>
                  {c.is_active ? 'Dezactivează' : 'Activează'}
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        ))}
        {companies.length === 0 && <div className="text-center text-muted-foreground py-8">Nicio companie încă</div>}
      </div>
    </div>
  );
}

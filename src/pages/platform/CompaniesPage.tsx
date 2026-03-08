import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Building2, Check, X, ChevronRight, Pencil, Trash2, Search, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const emptyForm = { name: '', cif: '', address: '', contact_email: '', contact_phone: '' };
const emptyAdminForm = { full_name: '', email: '', password: '' };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');

  // Admin creation alongside company
  const [createAdmin, setCreateAdmin] = useState(true);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies(data ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAdminForm(emptyAdminForm);
    setCreateAdmin(true);
    setDialogOpen(true);
  };

  const openEdit = (c: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(c.id);
    setForm({
      name: c.name || '',
      cif: c.cif || '',
      address: c.address || '',
      contact_email: c.contact_email || '',
      contact_phone: c.contact_phone || '',
    });
    setCreateAdmin(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Numele companiei este obligatoriu'); return; }
    setSaving(true);

    try {
      if (editingId) {
        // Update existing company
        const { error } = await supabase.from('companies').update(form as any).eq('id', editingId);
        if (error) throw error;
        toast.success('Companie actualizată!');
      } else {
        // Create new company
        const { data: newCompany, error } = await supabase.from('companies').insert(form as any).select().single();
        if (error) throw error;

        // Create admin user if requested
        if (createAdmin && adminForm.email && adminForm.password && adminForm.full_name) {
          const { data, error: userError } = await supabase.functions.invoke('create-user', {
            body: {
              email: adminForm.email,
              password: adminForm.password,
              full_name: adminForm.full_name,
              role: 'owner',
              company_id: newCompany.id,
            }
          });
          if (userError || data?.error) {
            toast.warning(`Companie creată, dar eroare la creare admin: ${data?.error || userError?.message}`);
          } else {
            toast.success(`Companie creată cu administrator ${adminForm.email}!`);
          }
        } else {
          toast.success('Companie creată!');
        }
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setAdminForm(emptyAdminForm);
      setEditingId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('companies').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success('Companie ștearsă!');
    setDeleteId(null);
    loadData();
  };

  const toggleActive = async (id: string, currentActive: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from('companies').update({ is_active: !currentActive } as any).eq('id', id);
    toast.success(currentActive ? 'Companie dezactivată' : 'Companie activată');
    loadData();
  };

  const pendingCount = companies.filter(c => c.pending_approval && !c.is_active).length;
  const filtered = companies
    .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.cif?.toLowerCase().includes(search.toLowerCase()))
    .filter(c => {
      if (filter === 'pending') return c.pending_approval && !c.is_active;
      if (filter === 'active') return c.is_active;
      if (filter === 'inactive') return !c.is_active && !c.pending_approval;
      return true;
    });

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Se încarcă...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Companii</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Companie nouă</Button>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editare companie' : 'Companie nouă'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nume companie *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>CIF</Label><Input value={form.cif} onChange={e => setForm({ ...form, cif: e.target.value })} /></div>
            <div className="space-y-2"><Label>Adresă</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email contact</Label><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefon</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
            </div>

            {/* Admin creation section - only for new companies */}
            {!editingId && (
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm font-semibold">Crează cont administrator</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Administratorul va putea gestiona compania</p>
                  </div>
                  <Switch checked={createAdmin} onCheckedChange={setCreateAdmin} />
                </div>
                {createAdmin && (
                  <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                      <UserPlus className="h-4 w-4" /> Date cont administrator
                    </div>
                    <div className="space-y-2"><Label className="text-xs">Nume complet *</Label><Input value={adminForm.full_name} onChange={e => setAdminForm({ ...adminForm, full_name: e.target.value })} placeholder="Ion Popescu" /></div>
                    <div className="space-y-2"><Label className="text-xs">Email *</Label><Input type="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin@companie.ro" /></div>
                    <div className="space-y-2"><Label className="text-xs">Parolă *</Label><Input type="password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Minim 6 caractere" /></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving || (!editingId && createAdmin && (!adminForm.email || !adminForm.password || !adminForm.full_name))}>
              {saving ? 'Se salvează...' : editingId ? 'Salvează' : 'Creează'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi compania?</AlertDialogTitle>
            <AlertDialogDescription>Această acțiune nu poate fi anulată. Compania, utilizatorii și toate datele asociate vor fi afectate.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută companii..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
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
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => openEdit(c, e)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(c.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">Nicio companie găsită</div>}
      </div>
    </div>
  );
}
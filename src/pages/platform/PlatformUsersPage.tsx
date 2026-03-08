import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Shield, Trash2, Search, Building2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  platform_owner: 'Platform Owner',
  owner: 'Administrator',
  dispatcher: 'Dispecer',
  driver: 'Șofer',
};

const roleColors: Record<string, string> = {
  platform_owner: 'bg-purple-100 text-purple-700',
  owner: 'bg-primary/10 text-primary',
  dispatcher: 'bg-blue-100 text-blue-700',
  driver: 'bg-green-100 text-green-700',
};

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'owner', company_id: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [profilesRes, rolesRes, companiesRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('companies').select('id, name').order('name'),
    ]);

    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const merged = profiles.map(p => ({
      ...p,
      roles: roles.filter(r => r.user_id === p.user_id).map(r => r.role),
      company: companiesRes.data?.find(c => c.id === p.company_id),
    }));
    setUsers(merged);
    setCompanies(companiesRes.data ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name) {
      toast.error('Completează toate câmpurile obligatorii');
      return;
    }
    if (form.role !== 'platform_owner' && !form.company_id) {
      toast.error('Selectează compania');
      return;
    }

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        company_id: form.role !== 'platform_owner' ? form.company_id : undefined,
      }
    });

    if (error) { toast.error(error.message); return; }
    if (data?.error) { toast.error(data.error); return; }

    toast.success('Utilizator creat!');
    setDialogOpen(false);
    setForm({ email: '', password: '', full_name: '', role: 'owner', company_id: '' });
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'delete', user_id: deleteUserId }
    });
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    toast.success('Utilizator șters!');
    setDeleteUserId(null);
    loadData();
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.company?.name?.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Se încarcă...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Utilizatori platformă</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Utilizator nou</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Utilizator nou</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nume complet *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Parolă *</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Administrator companie</SelectItem>
                    <SelectItem value="dispatcher">Dispecer</SelectItem>
                    <SelectItem value="driver">Șofer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role !== 'platform_owner' && (
                <div className="space-y-2">
                  <Label>Companie *</Label>
                  <Select value={form.company_id} onValueChange={v => setForm({ ...form, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selectează compania" /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
              <Button onClick={handleCreate} disabled={!form.email || !form.password || !form.full_name}>Creează</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută utilizatori..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map(user => (
          <div key={user.id} className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div>
              <div className="font-semibold text-foreground">{user.full_name || 'N/A'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              {user.company && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {user.company.name}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user.roles.map((role: string) => (
                <span key={role} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || 'bg-muted text-muted-foreground'}`}>
                  <Shield className="h-3 w-3" />{roleLabels[role] || role}
                </span>
              ))}
              {!user.roles.includes('platform_owner') && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUserId(user.user_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">Niciun utilizator găsit</div>}
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge utilizator</AlertDialogTitle>
            <AlertDialogDescription>Ești sigur? Această acțiune este ireversibilă.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

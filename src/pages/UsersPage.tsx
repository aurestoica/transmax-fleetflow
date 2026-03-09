import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Shield, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  owner: 'Administrator',
  dispatcher: 'Dispecer',
  driver: 'Șofer',
};

export default function UsersPage() {
  const { t } = useI18n();
  const { isOwner, userId, companyId, isPlatformOwner } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'dispatcher' });

  useEffect(() => { if (companyId || isPlatformOwner()) loadData(); }, [companyId]);

  const loadData = async () => {
    const { companyId } = useAuthStore.getState();
    
    // Filter profiles by company_id so each company only sees its own users
    let profilesQuery = supabase.from('profiles').select('*');
    if (companyId) {
      profilesQuery = profilesQuery.eq('company_id', companyId);
    }
    
    const { data: profiles } = await profilesQuery;
    const { data: roles } = await supabase.from('user_roles').select('*');

    const merged = (profiles ?? []).map(p => ({
      ...p,
      roles: (roles ?? []).filter(r => r.user_id === p.user_id).map(r => r.role),
    }));
    setUsers(merged);
    setLoading(false);
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email: form.email, password: form.password, full_name: form.full_name, role: form.role }
    });

    if (error) { toast.error(error.message); return; }
    if (data?.error) { toast.error(data.error); return; }

    toast.success('Utilizator creat!');
    setDialogOpen(false);
    resetForm();
    loadData();
  };

  const handleEdit = async () => {
    if (!editUser) return;

    // Update profile
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'update_profile', user_id: editUser.user_id, full_name: form.full_name, email: form.email, phone: form.phone }
    });
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }

    // Update role if changed
    const currentRole = editUser.roles[0];
    if (form.role !== currentRole) {
      const { data: rd, error: re } = await supabase.functions.invoke('manage-user', {
        body: { action: 'update_role', user_id: editUser.user_id, role: form.role }
      });
      if (re || rd?.error) { toast.error(rd?.error || re?.message); return; }
    }

    toast.success('Utilizator actualizat!');
    setEditUser(null);
    resetForm();
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

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.roles[0] || 'dispatcher',
      password: '',
    });
  };

  const resetForm = () => setForm({ email: '', password: '', full_name: '', phone: '', role: 'dispatcher' });

  if (!isOwner()) return <div className="flex items-center justify-center h-64 text-muted-foreground">Acces restricționat</div>;
  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.users')}</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Utilizator nou</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nume complet *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="space-y-2"><Label>Parolă *</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dispatcher">Dispecer</SelectItem>
                    <SelectItem value="driver">Șofer</SelectItem>
                    <SelectItem value="owner">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleCreate} disabled={!form.email || !form.password || !form.full_name}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div>
              <div className="font-semibold text-foreground">{user.full_name || 'N/A'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
            </div>
            <div className="flex items-center gap-2">
              {user.roles.map((role: string) => (
                <span key={role} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <Shield className="h-3 w-3" />{roleLabels[role] || role}
                </span>
              ))}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                <Pencil className="h-4 w-4" />
              </Button>
              {user.user_id !== userId && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUserId(user.user_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) { setEditUser(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editare utilizator</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nume complet</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispatcher">Dispecer</SelectItem>
                  <SelectItem value="driver">Șofer</SelectItem>
                  <SelectItem value="owner">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setEditUser(null); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={handleEdit} disabled={!form.full_name || !form.email}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge utilizator</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi acest utilizator? Această acțiune este ireversibilă.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

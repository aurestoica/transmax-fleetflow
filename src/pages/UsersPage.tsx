import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const { t } = useI18n();
  const { isOwner } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'dispatcher' as string });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    const merged = (profiles ?? []).map(p => ({
      ...p,
      roles: (roles ?? []).filter(r => r.user_id === p.user_id).map(r => r.role),
    }));
    setUsers(merged);
    setLoading(false);
  };

  const handleCreate = async () => {
    // Create user via edge function
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email: form.email, password: form.password, full_name: form.full_name, role: form.role }
    });

    if (error) { toast.error(error.message); return; }
    if (data?.error) { toast.error(data.error); return; }

    toast.success('Utilizator creat!');
    setDialogOpen(false);
    setForm({ email: '', password: '', full_name: '', role: 'dispatcher' });
    loadData();
  };

  if (!isOwner()) return <div className="flex items-center justify-center h-64 text-muted-foreground">Acces restricționat</div>;
  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.users')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
          <div key={user.id} className="bg-card rounded-xl border p-4 flex items-center justify-between" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div>
              <div className="font-semibold text-foreground">{user.full_name || 'N/A'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {user.roles.map((role: string) => (
                <span key={role} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <Shield className="h-3 w-3" />{role}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

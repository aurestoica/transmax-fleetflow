import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Truck, Route, Container, ArrowLeft, Plus, Check, X, Shield, DollarSign } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'drivers' | 'vehicles' | 'trips'>('overview');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', role: 'owner' });

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    const [companyRes, profilesRes, rolesRes, driversRes, vehiclesRes, trailersRes, tripsRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id!).single(),
      supabase.from('profiles').select('*').eq('company_id', id!),
      supabase.from('user_roles').select('*'),
      supabase.from('drivers').select('*').eq('company_id', id!),
      supabase.from('vehicles').select('*').eq('company_id', id!),
      supabase.from('trailers').select('*').eq('company_id', id!),
      supabase.from('trips').select('*').eq('company_id', id!).order('created_at', { ascending: false }).limit(20),
    ]);

    setCompany(companyRes.data);
    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    setUsers(profiles.map(p => ({ ...p, roles: roles.filter(r => r.user_id === p.user_id).map(r => r.role) })));
    setDrivers(driversRes.data ?? []);
    setVehicles(vehiclesRes.data ?? []);
    setTrailers(trailersRes.data ?? []);
    setTrips(tripsRes.data ?? []);
    setLoading(false);
  };

  const toggleActive = async () => {
    if (!company) return;
    await supabase.from('companies').update({ is_active: !company.is_active } as any).eq('id', company.id);
    loadData();
  };

  const handleCreateUser = async () => {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email: userForm.email, password: userForm.password, full_name: userForm.full_name, role: userForm.role, company_id: id }
    });
    if (error || data?.error) { toast.error(data?.error || error?.message); return; }
    toast.success('Utilizator creat!');
    setUserDialogOpen(false);
    setUserForm({ email: '', password: '', full_name: '', role: 'owner' });
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Se încarcă...</div>;
  if (!company) return <div className="flex items-center justify-center h-64 text-muted-foreground">Compania nu a fost găsită</div>;

  const totalRevenue = trips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
  const activeTrips = trips.filter(t => ['in_transit', 'loading', 'unloading'].includes(t.status!)).length;

  const tabs = [
    { key: 'overview' as const, label: 'Prezentare', icon: Building2 },
    { key: 'users' as const, label: `Utilizatori (${users.length})`, icon: Users },
    { key: 'drivers' as const, label: `Șoferi (${drivers.length})`, icon: Users },
    { key: 'vehicles' as const, label: `Vehicule (${vehicles.length})`, icon: Truck },
    { key: 'trips' as const, label: `Curse (${trips.length})`, icon: Route },
  ];

  const roleLabels: Record<string, string> = { owner: 'Administrator', dispatcher: 'Dispecer', driver: 'Șofer' };

  return (
    <div>
      <Link to="/companies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Înapoi la companii
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{company.name}</h1>
            <div className="text-sm text-muted-foreground">{company.cif || 'Fără CIF'} • {company.contact_email || 'Fără email'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${company.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {company.is_active ? <><Check className="h-3 w-3" />Activă</> : <><X className="h-3 w-3" />Inactivă</>}
          </span>
          <Button variant="outline" size="sm" onClick={toggleActive}>
            {company.is_active ? 'Dezactivează' : 'Activează'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <Users className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <div className="text-xs text-muted-foreground">Utilizatori</div>
          </div>
          <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <Truck className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground">{vehicles.length}</div>
            <div className="text-xs text-muted-foreground">Vehicule</div>
          </div>
          <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <Route className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground">{activeTrips}</div>
            <div className="text-xs text-muted-foreground">Curse active</div>
          </div>
          <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
            <DollarSign className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold text-primary">€{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Venit total</div>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <div className="flex justify-end mb-4">
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Utilizator nou</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Utilizator nou pentru {company.name}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Nume complet *</Label><Input value={userForm.full_name} onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Parolă *</Label><Input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Administrator</SelectItem>
                        <SelectItem value="dispatcher">Dispecer</SelectItem>
                        <SelectItem value="driver">Șofer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Anulează</Button>
                  <Button onClick={handleCreateUser} disabled={!userForm.email || !userForm.password || !userForm.full_name}>Creează</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-card rounded-xl border p-4 flex items-center justify-between gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div>
                  <div className="font-semibold text-foreground">{u.full_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {u.roles.map((r: string) => (
                    <span key={r} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      <Shield className="h-3 w-3" />{roleLabels[r] || r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="text-center text-muted-foreground py-8">Niciun utilizator</div>}
          </div>
        </div>
      )}

      {/* Drivers tab */}
      {tab === 'drivers' && (
        <div className="space-y-3">
          {drivers.map(d => (
            <div key={d.id} className="bg-card rounded-xl border p-4 flex items-center justify-between gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div>
                <div className="font-semibold text-foreground">{d.full_name}</div>
                <div className="text-sm text-muted-foreground">{d.phone || 'Fără telefon'} • {d.email || 'Fără email'}</div>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
          {drivers.length === 0 && <div className="text-center text-muted-foreground py-8">Niciun șofer</div>}
        </div>
      )}

      {/* Vehicles tab */}
      {tab === 'vehicles' && (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-card rounded-xl border p-4 flex items-center justify-between gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div>
                <div className="font-semibold text-foreground">{v.plate_number}</div>
                <div className="text-sm text-muted-foreground">{v.model || 'N/A'} • {v.year || 'N/A'}</div>
              </div>
              <StatusBadge status={v.status} />
            </div>
          ))}
          {vehicles.length === 0 && <div className="text-center text-muted-foreground py-8">Niciun vehicul</div>}
        </div>
      )}

      {/* Trips tab */}
      {tab === 'trips' && (
        <div className="space-y-3">
          {trips.map(t => (
            <div key={t.id} className="bg-card rounded-xl border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{t.trip_number}</span>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-sm text-muted-foreground">{t.pickup_address} → {t.delivery_address}</div>
              <div className="text-xs text-primary font-medium mt-1">€{Number(t.revenue || 0).toLocaleString()}</div>
            </div>
          ))}
          {trips.length === 0 && <div className="text-center text-muted-foreground py-8">Nicio cursă</div>}
        </div>
      )}
    </div>
  );
}

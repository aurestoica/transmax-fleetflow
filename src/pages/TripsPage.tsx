import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function TripsPage() {
  const { t } = useI18n();
  const [trips, setTrips] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    client_id: '', driver_id: '', vehicle_id: '', trailer_id: '',
    pickup_address: '', pickup_date: '', delivery_address: '', delivery_date: '',
    cargo_type: '', weight_tons: '', observations: '', revenue: '', fuel_cost: '',
    road_taxes: '', other_expenses: '', driver_advance: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [t, c, d, v, tr] = await Promise.all([
      supabase.from('trips').select('*, clients(company_name), drivers(full_name), vehicles(plate_number)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, company_name'),
      supabase.from('drivers').select('id, full_name').eq('status', 'available'),
      supabase.from('vehicles').select('id, plate_number').eq('status', 'available'),
      supabase.from('trailers').select('id, plate_number').eq('status', 'available'),
    ]);
    setTrips(t.data ?? []);
    setClients(c.data ?? []);
    setDrivers(d.data ?? []);
    setVehicles(v.data ?? []);
    setTrailers(tr.data ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    const { error } = await supabase.from('trips').insert({
      client_id: form.client_id || null,
      driver_id: form.driver_id || null,
      vehicle_id: form.vehicle_id || null,
      trailer_id: form.trailer_id || null,
      pickup_address: form.pickup_address,
      pickup_date: form.pickup_date || null,
      delivery_address: form.delivery_address,
      delivery_date: form.delivery_date || null,
      cargo_type: form.cargo_type || null,
      weight_tons: form.weight_tons ? parseFloat(form.weight_tons) : null,
      observations: form.observations || null,
      revenue: form.revenue ? parseFloat(form.revenue) : 0,
      fuel_cost: form.fuel_cost ? parseFloat(form.fuel_cost) : 0,
      road_taxes: form.road_taxes ? parseFloat(form.road_taxes) : 0,
      other_expenses: form.other_expenses ? parseFloat(form.other_expenses) : 0,
      driver_advance: form.driver_advance ? parseFloat(form.driver_advance) : 0,
      trip_number: '',
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Cursă creată!');
    setDialogOpen(false);
    setForm({ client_id: '', driver_id: '', vehicle_id: '', trailer_id: '', pickup_address: '', pickup_date: '', delivery_address: '', delivery_date: '', cargo_type: '', weight_tons: '', observations: '', revenue: '', fuel_cost: '', road_taxes: '', other_expenses: '', driver_advance: '' });
    loadData();
  };

  const filtered = trips.filter(trip => {
    const matchSearch = !search || trip.pickup_address?.toLowerCase().includes(search.toLowerCase()) || trip.delivery_address?.toLowerCase().includes(search.toLowerCase()) || trip.trip_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.trips')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cursă nouă</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={form.client_id} onValueChange={v => setForm({...form, client_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Șofer</Label>
                <Select value={form.driver_id} onValueChange={v => setForm({...form, driver_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                  <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Camion</Label>
                <Select value={form.vehicle_id} onValueChange={v => setForm({...form, vehicle_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                  <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Remorcă</Label>
                <Select value={form.trailer_id} onValueChange={v => setForm({...form, trailer_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                  <SelectContent>{trailers.map(tr => <SelectItem key={tr.id} value={tr.id}>{tr.plate_number}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adresă încărcare *</Label>
                <Input value={form.pickup_address} onChange={e => setForm({...form, pickup_address: e.target.value})} placeholder="Sibiu, România" />
              </div>
              <div className="space-y-2">
                <Label>Data încărcare</Label>
                <Input type="datetime-local" value={form.pickup_date} onChange={e => setForm({...form, pickup_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Adresă descărcare *</Label>
                <Input value={form.delivery_address} onChange={e => setForm({...form, delivery_address: e.target.value})} placeholder="Madrid, España" />
              </div>
              <div className="space-y-2">
                <Label>Data descărcare</Label>
                <Input type="datetime-local" value={form.delivery_date} onChange={e => setForm({...form, delivery_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tip marfă</Label>
                <Input value={form.cargo_type} onChange={e => setForm({...form, cargo_type: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Greutate (tone)</Label>
                <Input type="number" value={form.weight_tons} onChange={e => setForm({...form, weight_tons: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Venit (€)</Label>
                <Input type="number" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cost combustibil (€)</Label>
                <Input type="number" value={form.fuel_cost} onChange={e => setForm({...form, fuel_cost: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Taxe drum (€)</Label>
                <Input type="number" value={form.road_taxes} onChange={e => setForm({...form, road_taxes: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Alte cheltuieli (€)</Label>
                <Input type="number" value={form.other_expenses} onChange={e => setForm({...form, other_expenses: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Avans șofer (€)</Label>
                <Input type="number" value={form.driver_advance} onChange={e => setForm({...form, driver_advance: e.target.value})} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observații</Label>
                <Textarea value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleCreate} disabled={!form.pickup_address || !form.delivery_address}>{t('common.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="planned">Planificate</SelectItem>
            <SelectItem value="in_transit">În tranzit</SelectItem>
            <SelectItem value="loading">La încărcare</SelectItem>
            <SelectItem value="unloading">La descărcare</SelectItem>
            <SelectItem value="completed">Finalizate</SelectItem>
            <SelectItem value="cancelled">Anulate</SelectItem>
            <SelectItem value="delayed">Întârziate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trip cards */}
      <div className="space-y-3">
        {filtered.map(trip => {
          const profit = (Number(trip.revenue) || 0) - (Number(trip.fuel_cost) || 0) - (Number(trip.road_taxes) || 0) - (Number(trip.other_expenses) || 0) - (Number(trip.driver_advance) || 0);
          return (
            <Link key={trip.id} to={`/trips/${trip.id}`} className="block bg-card rounded-xl border p-4 hover:shadow-md transition-all group" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-display font-semibold text-foreground">{trip.trip_number}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{trip.pickup_address}</span>
                    <span>→</span>
                    <span className="truncate">{trip.delivery_address}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    {trip.clients?.company_name && <span>📦 {trip.clients.company_name}</span>}
                    {trip.drivers?.full_name && <span>👤 {trip.drivers.full_name}</span>}
                    {trip.vehicles?.plate_number && <span>🚛 {trip.vehicles.plate_number}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">€{Number(trip.revenue || 0).toLocaleString()}</div>
                    <div className={`text-xs ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      Profit: €{profit.toLocaleString()}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">{t('common.noData')}</div>
        )}
      </div>
    </div>
  );
}

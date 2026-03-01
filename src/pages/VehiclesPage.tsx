import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Upload, FileText, Eye, Download, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const vehicleDocTypes = [
  { key: 'Talon', category: 'vehicle_registration' },
  { key: 'Asigurare CASCO', category: 'vehicle_insurance' },
  { key: 'RCA', category: 'vehicle_rca' },
  { key: 'ITP', category: 'vehicle_itp' },
];

const emptyForm = { plate_number: '', vin: '', model: '', year: '', avg_consumption: '', capacity_tons: '', itp_expiry: '', rca_expiry: '', insurance_expiry: '' };

export default function VehiclesPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Vehicle docs
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleDocs, setVehicleDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const { data } = await supabase.from('vehicles').select('*').order('plate_number');
    setVehicles(data ?? []); setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      plate_number: v.plate_number || '',
      vin: v.vin || '',
      model: v.model || '',
      year: v.year?.toString() || '',
      avg_consumption: v.avg_consumption?.toString() || '',
      capacity_tons: v.capacity_tons?.toString() || '',
      itp_expiry: v.itp_expiry || '',
      rca_expiry: v.rca_expiry || '',
      insurance_expiry: v.insurance_expiry || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      year: form.year ? parseInt(form.year) : null,
      avg_consumption: form.avg_consumption ? parseFloat(form.avg_consumption) : null,
      capacity_tons: form.capacity_tons ? parseFloat(form.capacity_tons) : null,
      itp_expiry: form.itp_expiry || null,
      rca_expiry: form.rca_expiry || null,
      insurance_expiry: form.insurance_expiry || null,
    };
    if (editingId) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success('Camion actualizat!');
    } else {
      const { error } = await supabase.from('vehicles').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Camion adăugat!');
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null); loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success('Camion șters!');
    setDeleteId(null); loadData();
  };

  const openVehicleDocs = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setDocsDialogOpen(true);
    const { data } = await supabase.from('documents')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: false });
    setVehicleDocs(data ?? []);
  };

  const handleVehicleDocUpload = async (file: File) => {
    if (!selectedVehicle || !userId || !uploadCategory) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `vehicles/${selectedVehicle.id}/${uploadCategory}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      const docLabel = vehicleDocTypes.find(d => d.category === uploadCategory)?.key || uploadCategory;
      await supabase.from('documents').insert({
        name: `${docLabel} - ${selectedVehicle.plate_number}`,
        file_url: urlData.publicUrl,
        file_type: file.type,
        doc_category: uploadCategory,
        vehicle_id: selectedVehicle.id,
        uploaded_by: userId,
      });
      toast.success('Document încărcat!');
      openVehicleDocs(selectedVehicle);
    } catch (err: any) {
      toast.error(err.message || 'Eroare la încărcare');
    } finally {
      setUploading(false);
      setUploadCategory('');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVehicleDocUpload(file);
    e.target.value = '';
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocId) return;
    const { error } = await supabase.from('documents').delete().eq('id', deleteDocId);
    if (error) { toast.error(error.message); return; }
    toast.success('Document șters!');
    setDeleteDocId(null);
    if (selectedVehicle) openVehicleDocs(selectedVehicle);
  };

  const getDocForCategory = (category: string) => {
    return vehicleDocs.find(d => d.doc_category === category);
  };

  const filtered = vehicles.filter(v => !search || v.plate_number?.toLowerCase().includes(search.toLowerCase()) || v.model?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.vehicles')}</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t('common.add')}</Button>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editare camion' : 'Camion nou'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nr. înmatriculare *</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} /></div>
            <div className="space-y-2"><Label>VIN</Label><Input value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} /></div>
            <div className="space-y-2"><Label>Model</Label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Mercedes Actros" /></div>
            <div className="space-y-2"><Label>An</Label><Input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} /></div>
            <div className="space-y-2"><Label>Consum mediu (L/100km)</Label><Input type="number" value={form.avg_consumption} onChange={e => setForm({...form, avg_consumption: e.target.value})} /></div>
            <div className="space-y-2"><Label>Capacitate (tone)</Label><Input type="number" value={form.capacity_tons} onChange={e => setForm({...form, capacity_tons: e.target.value})} /></div>
            <div className="space-y-2"><Label>ITP expirare</Label><Input type="date" value={form.itp_expiry} onChange={e => setForm({...form, itp_expiry: e.target.value})} /></div>
            <div className="space-y-2"><Label>RCA expirare</Label><Input type="date" value={form.rca_expiry} onChange={e => setForm({...form, rca_expiry: e.target.value})} /></div>
            <div className="space-y-2"><Label>Asigurare expirare</Label><Input type="date" value={form.insurance_expiry} onChange={e => setForm({...form, insurance_expiry: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.plate_number}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi camionul?</AlertDialogTitle>
            <AlertDialogDescription>Această acțiune nu poate fi anulată. Camionul va fi șters permanent.</AlertDialogDescription>
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
        {filtered.map(v => (
          <div key={v.id} className="bg-card rounded-xl border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-display font-semibold text-foreground">{v.plate_number}</div>
                <div className="text-sm text-muted-foreground">{v.model} {v.year ? `(${v.year})` : ''}</div>
              </div>
              <StatusBadge status={v.status} />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {v.capacity_tons && <div>Capacitate: {v.capacity_tons}t</div>}
              {v.avg_consumption && <div>Consum: {v.avg_consumption} L/100km</div>}
              {v.itp_expiry && <div>ITP: {v.itp_expiry}</div>}
              {v.rca_expiry && <div>RCA: {v.rca_expiry}</div>}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openVehicleDocs(v)}>
                <FileText className="h-3.5 w-3.5 mr-1" />Documente
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(v.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{t('common.noData')}</div>}
      </div>

      {/* Vehicle documents dialog */}
      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Documente {selectedVehicle?.plate_number}</DialogTitle>
          </DialogHeader>
          {uploading && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Se încarcă...
            </div>
          )}
          <div className="space-y-3">
            {vehicleDocTypes.map(({ key, category }) => {
              const existingDoc = getDocForCategory(category);
              return (
                <div key={category} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{key}</span>
                  </div>
                  {existingDoc ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground truncate">
                          {existingDoc.created_at && format(new Date(existingDoc.created_at), 'dd.MM.yyyy HH:mm')}
                        </div>
                      </div>
                      <button onClick={() => setPreviewUrl(existingDoc.file_url)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" title="Vizualizare">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setUploadCategory(category); fileInputRef.current?.click(); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" title="Înlocuire" disabled={uploading}>
                        <Upload className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteDocId(existingDoc.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Șterge">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-2 w-full" disabled={uploading}
                      onClick={() => { setUploadCategory(category); fileInputRef.current?.click(); }}>
                      <Upload className="h-3.5 w-3.5 mr-2" />Adaugă document
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={onFileChange} />

      {/* Delete doc confirmation */}
      <AlertDialog open={!!deleteDocId} onOpenChange={open => !open && setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi documentul?</AlertDialogTitle>
            <AlertDialogDescription>Documentul va fi șters permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoc} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Previzualizare</DialogTitle></DialogHeader>
          {previewUrl && (
            previewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
              <img src={previewUrl} alt="Document" className="w-full rounded-lg" />
            ) : (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg border" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

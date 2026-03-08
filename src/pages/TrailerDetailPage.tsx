import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Truck, Calendar, Weight, Route, FileText, Pencil, Trash2, Upload, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const trailerDocTypes = [
  { key: 'Talon', category: 'trailer_registration' },
  { key: 'ITP', category: 'trailer_itp' },
  { key: 'Asigurare', category: 'trailer_insurance' },
];

export default function TrailerDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [trailer, setTrailer] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ plate_number: '', type: '', capacity_tons: '', itp_expiry: '' });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Doc upload
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const [trRes, tripsRes, docsRes] = await Promise.all([
      supabase.from('trailers').select('*').eq('id', id!).single(),
      supabase.from('trips').select('id, trip_number, pickup_address, delivery_address, status, revenue, pickup_date, drivers(full_name)').eq('trailer_id', id!).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('trailer_id', id!).order('created_at', { ascending: false }),
    ]);
    setTrailer(trRes.data);
    setTrips(tripsRes.data ?? []);
    setDocuments(docsRes.data ?? []);
    setLoading(false);
  };

  const openEdit = () => {
    setForm({
      plate_number: trailer.plate_number || '',
      type: trailer.type || '',
      capacity_tons: trailer.capacity_tons?.toString() || '',
      itp_expiry: trailer.itp_expiry || '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      plate_number: form.plate_number,
      type: form.type || null,
      capacity_tons: form.capacity_tons ? parseFloat(form.capacity_tons) : null,
      itp_expiry: form.itp_expiry || null,
    };
    const { error } = await supabase.from('trailers').update(payload).eq('id', id!);
    if (error) { toast.error(error.message); return; }
    toast.success('Remorcă actualizată!');
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('trailers').delete().eq('id', id!);
    if (error) { toast.error(error.message); return; }
    toast.success('Remorcă ștearsă!');
    navigate('/trailers');
  };

  // Document management
  const handleDocUpload = async (file: File) => {
    if (!userId || !uploadCategory) return;
    setUploading(true);
    try {
      await supabase.from('documents').update({ trailer_id: null }).eq('trailer_id', id!).eq('doc_category', uploadCategory);
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `trailers/${id}/${uploadCategory}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      const docLabel = trailerDocTypes.find(d => d.category === uploadCategory)?.key || uploadCategory;
      await supabase.from('documents').insert({
        name: `${docLabel} - ${trailer.plate_number}`,
        file_url: urlData.publicUrl,
        file_type: file.type,
        doc_category: uploadCategory,
        trailer_id: id,
        uploaded_by: userId,
      });
      toast.success('Document încărcat!');
      loadData();
    } catch (err: any) { toast.error(err.message || 'Eroare la încărcare'); }
    finally { setUploading(false); setUploadCategory(''); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDocUpload(file);
    e.target.value = '';
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocId) return;
    const { error } = await supabase.from('documents').update({ trailer_id: null }).eq('id', deleteDocId);
    if (error) { toast.error(error.message); return; }
    toast.success('Document eliminat!');
    setDeleteDocId(null);
    loadData();
  };

  const getDocForCategory = (category: string) => documents.find(d => d.doc_category === category);

  if (loading || !trailer) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  const isExpired = (date: string | null) => date ? new Date(date) < new Date() : false;
  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };
  const expiryClass = (date: string | null) => isExpired(date) ? 'text-destructive font-semibold' : isExpiringSoon(date) ? 'text-amber-500 font-semibold' : 'text-muted-foreground';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/trailers" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="page-title flex-1">{trailer.plate_number}</h1>
        {trailer.type && <span className="text-muted-foreground text-sm">— {trailer.type}</span>}
        <StatusBadge status={trailer.status} />
        <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-3.5 w-3.5 mr-1" />Editează</Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editare remorcă</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nr. înmatriculare *</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} /></div>
            <div className="space-y-2"><Label>Tip</Label><Input value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="Prelată / Frigorific" /></div>
            <div className="space-y-2"><Label>Capacitate (tone)</Label><Input type="number" value={form.capacity_tons} onChange={e => setForm({...form, capacity_tons: e.target.value})} /></div>
            <div className="space-y-2"><Label>ITP expirare</Label><Input type="date" value={form.itp_expiry} onChange={e => setForm({...form, itp_expiry: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.plate_number}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Ștergi remorca?</AlertDialogTitle><AlertDialogDescription>Această acțiune nu poate fi anulată.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete doc confirmation */}
      <AlertDialog open={!!deleteDocId} onOpenChange={open => !open && setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Ștergi documentul?</AlertDialogTitle><AlertDialogDescription>Documentul va fi eliminat.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoc} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Șterge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={onFileChange} />

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Previzualizare</DialogTitle></DialogHeader>
          {previewUrl && (previewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? <img src={previewUrl} alt="Document" className="w-full rounded-lg" /> : <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg border" />)}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Info */}
        <div className="bg-card rounded-xl border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="font-display font-semibold">{t('common.details')}</h3>
          <div className="space-y-3 text-sm">
            {trailer.type && <div className="flex items-center gap-3"><Truck className="h-4 w-4 text-muted-foreground" /><span>Tip: {trailer.type}</span></div>}
            {trailer.capacity_tons && <div className="flex items-center gap-3"><Weight className="h-4 w-4 text-muted-foreground" /><span>Capacitate: {trailer.capacity_tons}t</span></div>}
            {trailer.itp_expiry && <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>ITP: <span className={expiryClass(trailer.itp_expiry)}>{trailer.itp_expiry}</span></span></div>}
            {trailer.notes && <div className="text-muted-foreground mt-2">📝 {trailer.notes}</div>}
          </div>
        </div>

        {/* Documents by category */}
        <div className="bg-card rounded-xl border p-5 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />Documente</h3>
          </div>
          {uploading && <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Se încarcă...</div>}
          <div className="space-y-3">
            {trailerDocTypes.map(({ key, category }) => {
              const existingDoc = getDocForCategory(category);
              return (
                <div key={category} className="rounded-lg border p-3">
                  <span className="text-sm font-semibold">{key}</span>
                  {existingDoc ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground truncate">{existingDoc.created_at && format(new Date(existingDoc.created_at), 'dd.MM.yyyy HH:mm')}</div>
                      </div>
                      <button onClick={() => setPreviewUrl(existingDoc.file_url)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" title="Vizualizare"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => { setUploadCategory(category); fileInputRef.current?.click(); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary" title="Înlocuire" disabled={uploading}><Upload className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteDocId(existingDoc.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Șterge"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-2 w-full" disabled={uploading} onClick={() => { setUploadCategory(category); fileInputRef.current?.click(); }}>
                      <Upload className="h-3.5 w-3.5 mr-2" />Adaugă document
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trips */}
      <div className="mt-6 bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-4 border-b">
          <h3 className="font-display font-semibold flex items-center gap-2"><Route className="h-4 w-4" />Curse ({trips.length})</h3>
        </div>
        {trips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">{t('common.noData')}</div>
        ) : (
          <div className="divide-y">
            {trips.map((trip: any) => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{trip.trip_number}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{trip.pickup_address} → {trip.delivery_address}</div>
                  {trip.drivers?.full_name && <div className="text-xs text-muted-foreground mt-0.5">👤 {trip.drivers.full_name}</div>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-sm font-semibold">€{Number(trip.revenue || 0).toLocaleString()}</div>
                  {trip.pickup_date && <div className="text-xs text-muted-foreground">{format(new Date(trip.pickup_date), 'dd.MM.yyyy')}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

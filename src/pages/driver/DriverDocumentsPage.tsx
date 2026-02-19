import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, FileText, AlertTriangle, FileCheck, Upload, Image, File, X, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const docTypes = [
  { key: 'CMR Semnat', category: 'cmr', icon: FileCheck, color: 'text-primary' },
  { key: 'Poză Marfă', category: 'cargo_photo', icon: Camera, color: 'text-info' },
  { key: 'Poză Avarie', category: 'damage_photo', icon: AlertTriangle, color: 'text-destructive' },
  { key: 'POD', category: 'pod', icon: FileText, color: 'text-success' },
];

export default function DriverDocumentsPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Find driver & active trip
    const { data: driver } = await supabase.from('drivers').select('id').eq('user_id', userId!).single();
    if (!driver) { setLoading(false); return; }
    setDriverId(driver.id);

    const { data: trip } = await supabase.from('trips')
      .select('id, trip_number')
      .eq('driver_id', driver.id)
      .in('status', ['planned', 'loading', 'in_transit', 'unloading'])
      .limit(1)
      .single();

    setActiveTrip(trip);

    // Load documents uploaded by this user
    const { data: docs } = await supabase.from('documents')
      .select('*')
      .eq('uploaded_by', userId!)
      .order('created_at', { ascending: false });

    setDocuments(docs ?? []);
    setLoading(false);
  };

  const handleCategoryClick = (category: string) => {
    if (!activeTrip) {
      toast.error('Nu ai o cursă activă pentru a încărca documente');
      return;
    }
    setSelectedCategory(category);
  };

  const handleFileUpload = async (file: File, category: string) => {
    if (!activeTrip || !userId) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/${activeTrip.id}/${category}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save document record
      const { error: dbError } = await supabase.from('documents').insert({
        name: `${category} - ${activeTrip.trip_number}`,
        file_url: urlData.publicUrl,
        file_type: file.type,
        doc_category: category,
        trip_id: activeTrip.id,
        driver_id: driverId,
        uploaded_by: userId,
      });

      if (dbError) throw dbError;

      toast.success('Document încărcat cu succes!');
      setSelectedCategory(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Eroare la încărcare');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCategory) {
      handleFileUpload(file, selectedCategory);
    }
    e.target.value = '';
  };

  const getCategoryLabel = (cat: string) => {
    const found = docTypes.find(d => d.category === cat);
    return found?.key ?? cat;
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-xl font-display font-bold mb-4">{t('nav.documents')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('driver.uploadDoc')}</p>

      {activeTrip && (
        <div className="text-xs text-muted-foreground mb-4 bg-muted/50 rounded-lg px-3 py-2">
          Cursă activă: <span className="font-semibold text-foreground">{activeTrip.trip_number}</span>
        </div>
      )}

      {/* Upload buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {docTypes.map(({ key, category, icon: Icon, color }) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className="bg-card rounded-xl border p-6 flex flex-col items-center gap-3 hover:shadow-md transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <Icon className={`h-8 w-8 ${color}`} />
            <span className="text-sm font-medium text-foreground text-center">{key}</span>
          </button>
        ))}
      </div>

      {/* Upload source picker dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? getCategoryLabel(selectedCategory) : ''}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="h-14 justify-start gap-3 text-base"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-5 w-5 text-primary" />
              Fă o poză
            </Button>
            <Button
              variant="outline"
              className="h-14 justify-start gap-3 text-base"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*';
                  fileInputRef.current.click();
                }
              }}
              disabled={uploading}
            >
              <Image className="h-5 w-5 text-success" />
              Galerie foto
            </Button>
            <Button
              variant="outline"
              className="h-14 justify-start gap-3 text-base"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*,.pdf,.doc,.docx';
                  fileInputRef.current.click();
                }
              }}
              disabled={uploading}
            >
              <File className="h-5 w-5 text-info" />
              Fișiere
            </Button>
            {uploading && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se încarcă...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

      {/* Uploaded documents list */}
      {documents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Documente încărcate</h2>
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="bg-card rounded-lg border p-3 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {doc.file_type?.startsWith('image/') ? (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.created_at && format(new Date(doc.created_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewUrl(doc.file_url)}
                  className="text-primary hover:text-primary/80 p-1"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Previzualizare</DialogTitle>
          </DialogHeader>
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

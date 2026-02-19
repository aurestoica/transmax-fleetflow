import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, FileText, Image, Eye, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

const categoryLabels: Record<string, string> = {
  cmr: 'CMR',
  cargo_photo: 'Poză Marfă',
  damage_photo: 'Poză Avarie',
  pod: 'POD',
  vehicle_registration: 'Talon',
  vehicle_insurance: 'Asigurare',
  vehicle_rca: 'RCA',
  vehicle_itp: 'ITP',
  other: 'Altele',
};

export default function DocumentsPage() {
  const { t } = useI18n();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from('documents')
      .select('*, profiles:uploaded_by(full_name), trips:trip_id(trip_number), drivers:driver_id(full_name)')
      .order('created_at', { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  };

  const filtered = documents.filter(doc => {
    if (categoryFilter !== 'all' && doc.doc_category !== categoryFilter) return false;
    if (search && !doc.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.documents')}</h1>
        <span className="text-sm text-muted-foreground">{documents.length} documente</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.noData')}</div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Document</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Categorie</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cursă</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Autor</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {doc.file_type?.startsWith('image/') ? (
                            <Image className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize">
                        {categoryLabels[doc.doc_category] || doc.doc_category || 'Altele'}
                      </span>
                    </td>
                    <td className="p-3">
                      {(doc as any).trips?.trip_number ? (
                        <a href={`/trips/${doc.trip_id}`} className="text-primary hover:underline text-xs font-medium">
                          {(doc as any).trips.trip_number}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {doc.profiles?.full_name || (doc as any).drivers?.full_name || 'Necunoscut'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {doc.created_at && format(new Date(doc.created_at), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setPreviewUrl(doc.file_url)} className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-muted transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <a href={doc.file_url} download target="_blank" rel="noopener" className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-muted transition-colors">
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview dialog */}
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

import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Camera, FileText, AlertTriangle, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

const docTypes = [
  { key: 'CMR Semnat', icon: FileCheck, color: 'text-primary' },
  { key: 'Poză Marfă', icon: Camera, color: 'text-info' },
  { key: 'Poză Avarie', icon: AlertTriangle, color: 'text-destructive' },
  { key: 'POD', icon: FileText, color: 'text-success' },
];

export default function DriverDocumentsPage() {
  const { t } = useI18n();

  const handleUpload = (docType: string) => {
    // In a real app, this would open file picker and upload to storage
    toast.info(`Upload ${docType} - funcționalitate de stocare necesară`);
  };

  return (
    <div>
      <h1 className="text-xl font-display font-bold mb-4">{t('nav.documents')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('driver.uploadDoc')}</p>

      <div className="grid grid-cols-2 gap-4">
        {docTypes.map(({ key, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => handleUpload(key)}
            className="bg-card rounded-xl border p-6 flex flex-col items-center gap-3 hover:shadow-md transition-all active:scale-[0.98]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <Icon className={`h-8 w-8 ${color}`} />
            <span className="text-sm font-medium text-foreground text-center">{key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

const statusStyles: Record<string, string> = {
  planned: 'bg-secondary text-secondary-foreground',
  loading: 'bg-warning/15 text-warning',
  in_transit: 'bg-info/15 text-info',
  unloading: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
  delayed: 'bg-destructive/15 text-destructive',
  available: 'bg-success/15 text-success',
  on_trip: 'bg-info/15 text-info',
  leave: 'bg-warning/15 text-warning',
  inactive: 'bg-muted text-muted-foreground',
  maintenance: 'bg-warning/15 text-warning',
};

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return (
    <span className={cn('status-badge', statusStyles[status] ?? 'bg-muted text-muted-foreground')}>
      {t(`status.${status}`) || status}
    </span>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DriverStat {
  status: string;
  count: number;
  color: string;
}

export default function DriverStatusWidget() {
  const { t } = useI18n();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('drivers').select('id, full_name, status, avatar_url').then(({ data }) => {
      setDrivers(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const statusGroups = [
    { status: 'available', count: drivers.filter(d => d.status === 'available').length, color: 'bg-green-500', label: t('driverStatus.available') },
    { status: 'on_trip', count: drivers.filter(d => d.status === 'on_trip').length, color: 'bg-blue-500', label: t('driverStatus.onTrip') },
    { status: 'off_duty', count: drivers.filter(d => d.status === 'off_duty').length, color: 'bg-muted-foreground', label: t('driverStatus.offDuty') },
    { status: 'unavailable', count: drivers.filter(d => !['available', 'on_trip', 'off_duty'].includes(d.status ?? '')).length, color: 'bg-destructive', label: t('driverStatus.unavailable') },
  ];

  const total = drivers.length;

  return (
    <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="px-4 md:px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Status Șoferi</h2>
        </div>
        <Link to="/drivers" className="text-sm text-primary hover:underline">Toți →</Link>
      </div>
      <div className="p-4 md:p-5">
        {/* Progress bar */}
        {total > 0 && (
          <div className="flex rounded-full h-2.5 overflow-hidden mb-4">
            {statusGroups.map(g => g.count > 0 && (
              <div key={g.status} className={cn(g.color)} style={{ width: `${(g.count / total) * 100}%` }} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {statusGroups.map(g => (
            <div key={g.status} className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', g.color)} />
              <span className="text-sm text-muted-foreground">{statusLabels[g.status]}</span>
              <span className="text-sm font-semibold text-foreground ml-auto">{g.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

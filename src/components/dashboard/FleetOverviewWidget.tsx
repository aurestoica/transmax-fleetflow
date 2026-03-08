import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function FleetOverviewWidget() {
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('vehicles').select('id, plate_number, status, model').then(({ data }) => {
      setVehicles(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const groups = [
    { status: 'available', label: 'Disponibile', count: vehicles.filter(v => v.status === 'available').length, color: 'bg-green-500' },
    { status: 'on_trip', label: 'În cursă', count: vehicles.filter(v => v.status === 'on_trip').length, color: 'bg-blue-500' },
    { status: 'maintenance', label: 'Service', count: vehicles.filter(v => v.status === 'maintenance').length, color: 'bg-amber-500' },
    { status: 'other', label: 'Altele', count: vehicles.filter(v => !['available', 'on_trip', 'maintenance'].includes(v.status ?? '')).length, color: 'bg-muted-foreground' },
  ];

  const total = vehicles.length;

  return (
    <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="px-4 md:px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Flotă Vehicule</h2>
        </div>
        <Link to="/vehicles" className="text-sm text-primary hover:underline">Toate →</Link>
      </div>
      <div className="p-4 md:p-5">
        <div className="text-3xl font-bold text-foreground mb-1">{total}</div>
        <div className="text-xs text-muted-foreground mb-4">vehicule în flotă</div>
        {total > 0 && (
          <div className="flex rounded-full h-2.5 overflow-hidden mb-4">
            {groups.map(g => g.count > 0 && (
              <div key={g.status} className={cn(g.color)} style={{ width: `${(g.count / total) * 100}%` }} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {groups.map(g => (
            <div key={g.status} className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', g.color)} />
              <span className="text-sm text-muted-foreground">{g.label}</span>
              <span className="text-sm font-semibold text-foreground ml-auto">{g.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

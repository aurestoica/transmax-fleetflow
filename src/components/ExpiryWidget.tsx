import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { AlertTriangle, Shield, FileCheck, CreditCard, Truck, Container } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';


interface ExpiryItem {
  id: string;
  label: string;
  detail: string;
  expiryDate: string;
  daysUntil: number;
  type: 'vehicle' | 'trailer' | 'driver' | 'document';
  icon: 'rca' | 'itp' | 'casco' | 'license' | 'tachograph' | 'document';
  entityId: string;
}

function getUrgency(days: number) {
  if (days <= 0) return { bg: 'bg-destructive/15', text: 'text-destructive', border: 'border-destructive/30', label: 'Expirat' };
  if (days <= 7) return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: `${days}z` };
  if (days <= 15) return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', label: `${days}z` };
  return { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', label: `${days}z` };
}

function getIcon(icon: ExpiryItem['icon']) {
  switch (icon) {
    case 'rca': return Shield;
    case 'itp': return FileCheck;
    case 'casco': return Shield;
    case 'license': return CreditCard;
    case 'tachograph': return CreditCard;
    case 'document': return FileCheck;
  }
}

function getRoute(item: ExpiryItem) {
  switch (item.type) {
    case 'vehicle': return `/vehicles`;
    case 'trailer': return `/trailers`;
    case 'driver': return `/drivers`;
    case 'document': return `/documents`;
  }
}

export default function ExpiryWidget() {
  const { t } = useI18n();
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpiryData();
  }, []);

  const loadExpiryData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: ExpiryItem[] = [];

    const [vehiclesRes, trailersRes, driversRes, docsRes] = await Promise.all([
      supabase.from('vehicles').select('id, plate_number, rca_expiry, itp_expiry, insurance_expiry'),
      supabase.from('trailers').select('id, plate_number, itp_expiry'),
      supabase.from('drivers').select('id, full_name, license_expiry, tachograph_expiry'),
      supabase.from('documents').select('id, name, expiry_date, doc_category').not('expiry_date', 'is', null),
    ]);

    for (const v of vehiclesRes.data ?? []) {
      const fields = [
        { date: v.rca_expiry, icon: 'rca' as const, detail: 'RCA' },
        { date: v.itp_expiry, icon: 'itp' as const, detail: 'ITP' },
        { date: v.insurance_expiry, icon: 'casco' as const, detail: 'CASCO' },
      ];
      for (const f of fields) {
        if (!f.date) continue;
        const days = Math.ceil((new Date(f.date).getTime() - today.getTime()) / 86400000);
        if (days <= 30) {
          result.push({ id: `v-${v.id}-${f.icon}`, label: v.plate_number, detail: f.detail, expiryDate: f.date, daysUntil: days, type: 'vehicle', icon: f.icon, entityId: v.id });
        }
      }
    }

    for (const tr of trailersRes.data ?? []) {
      if (!tr.itp_expiry) continue;
      const days = Math.ceil((new Date(tr.itp_expiry).getTime() - today.getTime()) / 86400000);
      if (days <= 30) {
        result.push({ id: `t-${tr.id}`, label: tr.plate_number, detail: 'ITP Remorcă', expiryDate: tr.itp_expiry, daysUntil: days, type: 'trailer', icon: 'itp', entityId: tr.id });
      }
    }

    for (const d of driversRes.data ?? []) {
      const fields = [
        { date: d.license_expiry, icon: 'license' as const, detail: 'Permis' },
        { date: d.tachograph_expiry, icon: 'tachograph' as const, detail: 'Card Tahograf' },
      ];
      for (const f of fields) {
        if (!f.date) continue;
        const days = Math.ceil((new Date(f.date).getTime() - today.getTime()) / 86400000);
        if (days <= 30) {
          result.push({ id: `d-${d.id}-${f.icon}`, label: d.full_name, detail: f.detail, expiryDate: f.date, daysUntil: days, type: 'driver', icon: f.icon, entityId: d.id });
        }
      }
    }

    for (const doc of docsRes.data ?? []) {
      if (!doc.expiry_date) continue;
      const days = Math.ceil((new Date(doc.expiry_date).getTime() - today.getTime()) / 86400000);
      if (days <= 30) {
        result.push({ id: `doc-${doc.id}`, label: doc.name, detail: doc.doc_category ?? 'Document', expiryDate: doc.expiry_date, daysUntil: days, type: 'document', icon: 'document', entityId: doc.id });
      }
    }

    result.sort((a, b) => a.daysUntil - b.daysUntil);
    setItems(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="px-4 md:px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="font-display font-semibold text-foreground">Expirări Apropiate</h2>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-muted-foreground text-sm">
          ✅ Nicio expirare în următoarele 30 de zile
        </div>
      ) : (
        <div className="divide-y max-h-[320px] overflow-y-auto">
          {items.map(item => {
            const urgency = getUrgency(item.daysUntil);
            const Icon = getIcon(item.icon);
            return (
              <Link
                key={item.id}
                to={getRoute(item)}
                className={cn(
                  'flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-muted/30 transition-colors',
                  item.daysUntil <= 0 && 'bg-destructive/5'
                )}
              >
                <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', urgency.bg)}>
                  <Icon className={cn('h-4 w-4', urgency.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{item.label}</span>
                    <span className="text-xs text-muted-foreground">— {item.detail}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.expiryDate).toLocaleDateString('ro-RO')}
                  </div>
                </div>
                <span className={cn(
                  'flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border',
                  urgency.bg, urgency.text, urgency.border
                )}>
                  {urgency.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

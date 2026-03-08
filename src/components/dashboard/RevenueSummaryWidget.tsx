import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function RevenueSummaryWidget() {
  const { t } = useI18n();
  const [data, setData] = useState({ revenue: 0, fuelCost: 0, roadTaxes: 0, otherExpenses: 0, driverAdvances: 0, tripsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    supabase.from('trips').select('revenue, fuel_cost, road_taxes, other_expenses, driver_advance')
      .gte('created_at', startOfMonth)
      .then(({ data: trips }) => {
        const t = trips ?? [];
        setData({
          revenue: t.reduce((s, tr) => s + (Number(tr.revenue) || 0), 0),
          fuelCost: t.reduce((s, tr) => s + (Number(tr.fuel_cost) || 0), 0),
          roadTaxes: t.reduce((s, tr) => s + (Number(tr.road_taxes) || 0), 0),
          otherExpenses: t.reduce((s, tr) => s + (Number(tr.other_expenses) || 0), 0),
          driverAdvances: t.reduce((s, tr) => s + (Number(tr.driver_advance) || 0), 0),
          tripsCount: t.length,
        });
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

  const totalExpenses = data.fuelCost + data.roadTaxes + data.otherExpenses + data.driverAdvances;
  const profit = data.revenue - totalExpenses;

  return (
    <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="px-4 md:px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Sumar Financiar</h2>
        </div>
        <span className="text-xs text-muted-foreground capitalize">{monthName}</span>
      </div>
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Venituri</div>
            <div className="text-xl font-bold text-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              €{data.revenue.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Cheltuieli</div>
            <div className="text-xl font-bold text-foreground flex items-center gap-1 justify-end">
              <TrendingDown className="h-4 w-4 text-destructive" />
              €{totalExpenses.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Profit net</span>
            <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              €{profit.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{data.tripsCount} curse în această lună</div>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Combustibil</span><span className="text-foreground">€{data.fuelCost.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Taxe drum</span><span className="text-foreground">€{data.roadTaxes.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avans șoferi</span><span className="text-foreground">€{data.driverAdvances.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Alte cheltuieli</span><span className="text-foreground">€{data.otherExpenses.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );
}

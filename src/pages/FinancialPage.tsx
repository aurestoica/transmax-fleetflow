import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function FinancialPage() {
  const { t } = useI18n();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('trips').select('*, clients(company_name)').order('created_at', { ascending: false })
      .then(({ data }) => { setTrips(data ?? []); setLoading(false); });
  }, []);

  const totals = trips.reduce((acc, t) => ({
    revenue: acc.revenue + (Number(t.revenue) || 0),
    fuel: acc.fuel + (Number(t.fuel_cost) || 0),
    taxes: acc.taxes + (Number(t.road_taxes) || 0),
    other: acc.other + (Number(t.other_expenses) || 0),
    advance: acc.advance + (Number(t.driver_advance) || 0),
  }), { revenue: 0, fuel: 0, taxes: 0, other: 0, advance: 0 });

  const totalExpenses = totals.fuel + totals.taxes + totals.other + totals.advance;
  const totalProfit = totals.revenue - totalExpenses;
  const margin = totals.revenue ? ((totalProfit / totals.revenue) * 100).toFixed(1) : '0';

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('nav.financial')}</h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Venit Total</span></div>
          <div className="text-2xl font-display font-bold">€{totals.revenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-5 w-5 text-destructive" /><span className="text-sm text-muted-foreground">Cheltuieli</span></div>
          <div className="text-2xl font-display font-bold">€{totalExpenses.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-success" /><span className="text-sm text-muted-foreground">Profit ({margin}%)</span></div>
          <div className={`text-2xl font-display font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>€{totalProfit.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cursă</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Venit</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Combustibil</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Taxe</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Altele</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Avans</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Profit</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => {
                const profit = (Number(trip.revenue) || 0) - (Number(trip.fuel_cost) || 0) - (Number(trip.road_taxes) || 0) - (Number(trip.other_expenses) || 0) - (Number(trip.driver_advance) || 0);
                return (
                  <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{trip.trip_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{trip.clients?.company_name ?? '-'}</td>
                    <td className="px-4 py-3 text-right">€{Number(trip.revenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">€{Number(trip.fuel_cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">€{Number(trip.road_taxes || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">€{Number(trip.other_expenses || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">€{Number(trip.driver_advance || 0).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>€{profit.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

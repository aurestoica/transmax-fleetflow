import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { Route, Users, Truck, AlertTriangle, DollarSign, Clock, FileText, Container } from 'lucide-react';

export interface WidgetDefinition {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultVisible: boolean;
  size: 'full' | 'half';
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  { id: 'stats', label: 'Statistici rapide', description: 'Curse active, șoferi disponibili, venit', icon: Route, defaultVisible: true, size: 'full' },
  { id: 'expiry', label: 'Expirări apropiate', description: 'Documente și acte ce expiră în curând', icon: AlertTriangle, defaultVisible: true, size: 'half' },
  { id: 'recent-trips', label: 'Curse recente', description: 'Ultimele 5 curse adăugate', icon: Route, defaultVisible: true, size: 'half' },
  { id: 'driver-status', label: 'Status șoferi', description: 'Vizualizare rapidă status șoferi', icon: Users, defaultVisible: true, size: 'half' },
  { id: 'fleet-overview', label: 'Flotă vehicule', description: 'Statusul vehiculelor din flotă', icon: Truck, defaultVisible: true, size: 'half' },
  { id: 'revenue-summary', label: 'Sumar financiar', description: 'Venituri și cheltuieli pe luna curentă', icon: DollarSign, defaultVisible: false, size: 'half' },
];

export interface WidgetLayout {
  id: string;
  visible: boolean;
}

export const DEFAULT_LAYOUT: WidgetLayout[] = WIDGET_REGISTRY.map(w => ({
  id: w.id,
  visible: w.defaultVisible,
}));

export function useDashboardLayout() {
  const { userId } = useAuthStore();
  const [layout, setLayout] = useState<WidgetLayout[]>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadLayout();
  }, [userId]);

  const loadLayout = async () => {
    const { data } = await supabase
      .from('dashboard_layouts')
      .select('layout')
      .eq('user_id', userId!)
      .maybeSingle();

    if (data?.layout && Array.isArray(data.layout) && data.layout.length > 0) {
      // Merge with registry to handle new widgets added after user saved
      const saved = data.layout as unknown as WidgetLayout[];
      const merged = WIDGET_REGISTRY.map(w => {
        const found = saved.find(s => s.id === w.id);
        return found ?? { id: w.id, visible: w.defaultVisible };
      });
      // Preserve saved order, add new ones at end
      const ordered: WidgetLayout[] = [];
      for (const s of saved) {
        const reg = WIDGET_REGISTRY.find(w => w.id === s.id);
        if (reg) ordered.push(s);
      }
      for (const w of WIDGET_REGISTRY) {
        if (!ordered.find(o => o.id === w.id)) {
          ordered.push({ id: w.id, visible: w.defaultVisible });
        }
      }
      setLayout(ordered);
    } else {
      setLayout(DEFAULT_LAYOUT);
    }
    setLoading(false);
  };

  const saveLayout = async (newLayout: WidgetLayout[]) => {
    if (!userId) return;
    setSaving(true);
    setLayout(newLayout);

    const { data: existing } = await supabase
      .from('dashboard_layouts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('dashboard_layouts')
        .update({ layout: newLayout as any, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('dashboard_layouts')
        .insert({ user_id: userId, layout: newLayout as any });
    }
    setSaving(false);
  };

  const resetLayout = async () => {
    if (!userId) return;
    setSaving(true);
    setLayout(DEFAULT_LAYOUT);
    await supabase.from('dashboard_layouts').delete().eq('user_id', userId);
    setSaving(false);
  };

  return { layout, loading, saving, saveLayout, resetLayout };
}

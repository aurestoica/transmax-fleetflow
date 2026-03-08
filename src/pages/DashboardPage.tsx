import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useI18n } from '@/lib/i18n';
import { useDashboardLayout, WIDGET_REGISTRY, DEFAULT_LAYOUT, type WidgetLayout } from '@/hooks/useDashboardLayout';
import SortableWidget from '@/components/dashboard/SortableWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import ExpiryWidget from '@/components/ExpiryWidget';
import RecentTripsWidget from '@/components/dashboard/RecentTripsWidget';
import DriverStatusWidget from '@/components/dashboard/DriverStatusWidget';
import FleetOverviewWidget from '@/components/dashboard/FleetOverviewWidget';
import RevenueSummaryWidget from '@/components/dashboard/RevenueSummaryWidget';
import { Settings2, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function WidgetRenderer({ id }: { id: string }) {
  switch (id) {
    case 'stats': return <StatsWidget />;
    case 'expiry': return <ExpiryWidget />;
    case 'recent-trips': return <RecentTripsWidget />;
    case 'driver-status': return <DriverStatusWidget />;
    case 'fleet-overview': return <FleetOverviewWidget />;
    case 'revenue-summary': return <RevenueSummaryWidget />;
    default: return null;
  }
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { layout, loading, saving, saveLayout, resetLayout } = useDashboardLayout();
  const [isEditing, setIsEditing] = useState(false);
  const [editLayout, setEditLayout] = useState<WidgetLayout[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const startEditing = () => {
    setEditLayout([...layout]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditLayout([]);
    setIsEditing(false);
  };

  const saveEditing = async () => {
    await saveLayout(editLayout);
    setIsEditing(false);
    toast.success(t('dash.saved'));
  };

  const handleReset = async () => {
    await resetLayout();
    setEditLayout([...DEFAULT_LAYOUT]);
    setIsEditing(false);
    toast.success(t('dash.resetDone'));
  };

  const currentLayout = isEditing ? editLayout : layout;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = editLayout.findIndex(w => w.id === active.id);
    const newIndex = editLayout.findIndex(w => w.id === over.id);
    setEditLayout(arrayMove(editLayout, oldIndex, newIndex));
  };

  const toggleVisibility = (widgetId: string) => {
    setEditLayout(prev => prev.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w));
  };

  const toggleSize = (widgetId: string) => {
    setEditLayout(prev => prev.map(w => w.id === widgetId ? { ...w, size: w.size === 'full' ? 'half' : 'full' } : w));
  };

  const visibleWidgets = currentLayout.filter(w => w.visible || isEditing);

  // Group into rows: consecutive 'half' widgets pair up, 'full' gets own row
  const rows: WidgetLayout[][] = [];
  let i = 0;
  while (i < visibleWidgets.length) {
    const w = visibleWidgets[i];
    if (w.size === 'full') {
      rows.push([w]);
      i++;
    } else {
      // try to pair with next half
      const next = visibleWidgets[i + 1];
      if (next && next.size === 'half') {
        rows.push([w, next]);
        i += 2;
      } else {
        rows.push([w]);
        i++;
      }
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="page-title">{t('nav.dashboard')}</h1>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleReset} className="text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                {t('dash.reset')}
              </Button>
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={saveEditing} disabled={saving}>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                {saving ? t('dash.saving') : t('common.save')}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              {t('dash.customize')}
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary flex items-center gap-2">
          <Settings2 className="h-4 w-4 flex-shrink-0" />
          <span>{t('dash.editHint')}</span>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 md:space-y-6">
            {rows.map((row, ri) => (
              <div key={ri} className={cn('grid gap-4 md:gap-6', row.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                {row.map(widget => (
                  <SortableWidget
                    key={widget.id}
                    id={widget.id}
                    isEditing={isEditing}
                    visible={widget.visible}
                    size={widget.size}
                    onToggleVisibility={() => toggleVisibility(widget.id)}
                    onToggleSize={() => toggleSize(widget.id)}
                  >
                    <WidgetRenderer id={widget.id} />
                  </SortableWidget>
                ))}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

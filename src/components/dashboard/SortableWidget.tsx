import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditing: boolean;
  visible: boolean;
  onToggleVisibility: () => void;
}

export default function SortableWidget({ id, children, isEditing, visible, onToggleVisibility }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!visible && !isEditing) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 opacity-80',
        !visible && isEditing && 'opacity-40',
      )}
    >
      {isEditing && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1">
          <button
            onClick={onToggleVisibility}
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center shadow-md border transition-colors',
              visible
                ? 'bg-card border-border text-foreground hover:bg-muted'
                : 'bg-muted border-border text-muted-foreground hover:bg-card'
            )}
          >
            {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-6 rounded-lg bg-card border border-border shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className={cn(
        isEditing && 'ring-2 ring-primary/20 ring-dashed rounded-xl',
        !visible && isEditing && 'ring-muted-foreground/20',
      )}>
        {children}
      </div>
    </div>
  );
}

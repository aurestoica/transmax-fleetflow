import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Search, CalendarIcon, Clock, User, Truck, Package, FileText, MapPin,
  MessageSquare, Users, Shield, ChevronLeft, ChevronRight, Filter, X, Loader2,
  Plus, Pencil, Trash2, ArrowRight
} from 'lucide-react';

const ENTITY_TYPES = [
  { value: 'all', label: 'Toate', icon: Filter },
  { value: 'trips', label: 'Curse', icon: ArrowRight },
  { value: 'drivers', label: 'Șoferi', icon: User },
  { value: 'vehicles', label: 'Vehicule', icon: Truck },
  { value: 'trailers', label: 'Remorci', icon: Truck },
  { value: 'clients', label: 'Clienți', icon: Package },
  { value: 'documents', label: 'Documente', icon: FileText },
  { value: 'messages', label: 'Mesaje', icon: MessageSquare },
  { value: 'locations', label: 'Locații', icon: MapPin },
  { value: 'user_roles', label: 'Roluri utilizatori', icon: Shield },
];

const ACTION_TYPES = [
  { value: 'all', label: 'Toate acțiunile' },
  { value: 'create', label: 'Creare' },
  { value: 'update', label: 'Modificare' },
  { value: 'delete', label: 'Ștergere' },
];

const PAGE_SIZE = 50;

function getEntityIcon(entity: string) {
  switch (entity) {
    case 'trips': return <ArrowRight className="h-4 w-4" />;
    case 'drivers': return <User className="h-4 w-4" />;
    case 'vehicles': case 'trailers': return <Truck className="h-4 w-4" />;
    case 'clients': return <Package className="h-4 w-4" />;
    case 'documents': return <FileText className="h-4 w-4" />;
    case 'messages': return <MessageSquare className="h-4 w-4" />;
    case 'locations': return <MapPin className="h-4 w-4" />;
    case 'user_roles': return <Shield className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case 'create': return <Plus className="h-3.5 w-3.5 text-success" />;
    case 'update': return <Pencil className="h-3.5 w-3.5 text-warning" />;
    case 'delete': return <Trash2 className="h-3.5 w-3.5 text-destructive" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case 'create': return 'Creat';
    case 'update': return 'Modificat';
    case 'delete': return 'Șters';
    default: return action;
  }
}

function getEntityLabel(entity: string) {
  const map: Record<string, string> = {
    trips: 'Cursă', drivers: 'Șofer', vehicles: 'Vehicul', trailers: 'Remorcă',
    clients: 'Client', documents: 'Document', messages: 'Mesaj',
    locations: 'Locație', user_roles: 'Rol utilizator',
  };
  return map[entity] || entity;
}

function summarizeChanges(log: any): string {
  const details = log.details;
  if (!details) return '';

  if (log.action === 'create') {
    switch (log.entity_type) {
      case 'trips': return details.trip_number ? `Cursă ${details.trip_number}: ${details.pickup_address} → ${details.delivery_address}` : '';
      case 'drivers': return details.full_name || '';
      case 'vehicles': return details.plate_number ? `${details.plate_number} ${details.model || ''}` : '';
      case 'trailers': return details.plate_number || '';
      case 'clients': return details.company_name || '';
      case 'documents': return details.name || '';
      case 'messages': return details.content ? details.content.substring(0, 80) + (details.content.length > 80 ? '...' : '') : 'Atașament';
      case 'locations': return `Lat: ${details.lat}, Lng: ${details.lng}`;
      case 'user_roles': return `Rol: ${details.role}`;
      default: return '';
    }
  }

  if (log.action === 'update' && details.old && details.new) {
    const old = details.old;
    const newD = details.new;
    const changes: string[] = [];
    const skipKeys = ['updated_at', 'created_at', 'id'];
    
    for (const key of Object.keys(newD)) {
      if (skipKeys.includes(key)) continue;
      if (JSON.stringify(old[key]) !== JSON.stringify(newD[key])) {
        const label = key.replace(/_/g, ' ');
        const oldVal = old[key] ?? '—';
        const newVal = newD[key] ?? '—';
        changes.push(`${label}: ${String(oldVal).substring(0, 30)} → ${String(newVal).substring(0, 30)}`);
      }
    }
    return changes.slice(0, 3).join(' · ') + (changes.length > 3 ? ` (+${changes.length - 3})` : '');
  }

  if (log.action === 'delete') {
    switch (log.entity_type) {
      case 'trips': return details.trip_number || '';
      case 'drivers': return details.full_name || '';
      case 'vehicles': return details.plate_number || '';
      case 'trailers': return details.plate_number || '';
      case 'clients': return details.company_name || '';
      case 'documents': return details.name || '';
      default: return '';
    }
  }

  return '';
}

export default function ActivityLogPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);
    if (actionFilter !== 'all') query = query.eq('action', actionFilter);
    if (dateFrom) query = query.gte('created_at', format(dateFrom, 'yyyy-MM-dd') + 'T00:00:00');
    if (dateTo) query = query.lte('created_at', format(dateTo, 'yyyy-MM-dd') + 'T23:59:59');

    const { data, count } = await query;
    const items = data ?? [];
    setLogs(items);
    setTotalCount(count ?? 0);

    // Load profile names
    const userIds = [...new Set(items.map(l => l.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      setProfiles(Object.fromEntries((profs ?? []).map(p => [p.user_id, p.full_name])));
    }
    setLoading(false);
  }, [page, entityFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => { loadLogs(); }, [loadLogs]);
  useEffect(() => { setPage(0); }, [entityFilter, actionFilter, dateFrom, dateTo]);

  const filtered = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    const summary = summarizeChanges(log).toLowerCase();
    const userName = (profiles[log.user_id] || '').toLowerCase();
    const entityLabel = getEntityLabel(log.entity_type || '').toLowerCase();
    return summary.includes(s) || userName.includes(s) || entityLabel.includes(s);
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasActiveFilters = entityFilter !== 'all' || actionFilter !== 'all' || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setEntityFilter('all');
    setActionFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Jurnal de activitate</h1>
        <p className="text-muted-foreground text-sm mt-1">Istoricul complet al tuturor acțiunilor din platformă</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4 space-y-3" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută în activitate..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Entity filter */}
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map(et => (
                <SelectItem key={et.value} value={et.value}>
                  <span className="flex items-center gap-2">
                    <et.icon className="h-3.5 w-3.5" />
                    {et.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map(at => (
                <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date from */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 gap-2", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateFrom ? format(dateFrom, 'dd.MM.yyyy') : 'De la'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" locale={ro} />
            </PopoverContent>
          </Popover>

          {/* Date to */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 gap-2", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateTo ? format(dateTo, 'dd.MM.yyyy') : 'Până la'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" locale={ro} />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground">
              <X className="h-3.5 w-3.5 mr-1" />Resetează
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{totalCount} {totalCount === 1 ? 'înregistrare' : 'înregistrări'}</span>
          {totalPages > 1 && <span>Pagina {page + 1} din {totalPages}</span>}
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nu s-au găsit înregistrări</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(log => {
            const summary = summarizeChanges(log);
            const isExpanded = expandedLog === log.id;
            return (
              <div
                key={log.id}
                className="bg-card rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                style={{ boxShadow: 'var(--shadow-card)' }}
                onClick={() => setExpandedLog(isExpanded ? null : log.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Entity icon */}
                  <div className="mt-0.5 p-1.5 rounded-md bg-muted flex-shrink-0">
                    {getEntityIcon(log.entity_type || '')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionIcon(log.action)}
                      <span className="text-sm font-medium">
                        {getActionLabel(log.action)} {getEntityLabel(log.entity_type || '').toLowerCase()}
                      </span>
                    </div>

                    {summary && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{summary}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {profiles[log.user_id] || 'Sistem'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.created_at ? format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss') : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && log.details && (
                  <div className="mt-3 pt-3 border-t">
                    <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Următor<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

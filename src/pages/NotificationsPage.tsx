import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { formatDistanceToNow, format, type Locale } from 'date-fns';
import { ro, es } from 'date-fns/locale';
import { Bell, Search, Filter, CheckCheck, FileText, Truck, MapPin, MessageSquare, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string | null;
  read: boolean | null;
  created_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
}

const localeMap: Record<string, Locale> = { ro, es };

const typeIcons: Record<string, typeof Bell> = {
  trip: Truck,
  chat: MessageSquare,
  document: FileText,
  location: MapPin,
  driver: Users,
  vehicle: Truck,
  trailer: Truck,
};

// Map entity_types to filter categories
const typeToFilter: Record<string, string> = {
  trip: 'trip',
  chat: 'chat',
  document: 'document',
  location: 'location',
  driver: 'driver',
  vehicle: 'vehicle',
  trailer: 'vehicle',
};

// Strip leading emojis from notification titles
const stripEmoji = (text: string) => text.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getRoute = (n: Notification): string | null => {
    if (n.entity_type && n.entity_id) {
      switch (n.entity_type) {
        case 'trip': return `/trips/${n.entity_id}`;
        case 'chat': return `/chat?trip=${n.entity_id}`;
        case 'document': return `/documents`;
        case 'vehicle': return `/vehicles`;
        case 'trailer': return `/trailers`;
        case 'driver': return `/drivers`;
        default: break;
      }
    }
    const text = `${n.title} ${n.message || ''}`.toLowerCase();
    if (text.includes('cursă') || text.includes('cursa') || text.includes('trip')) return '/trips';
    if (text.includes('document')) return '/documents';
    if (text.includes('locație') || text.includes('locatie') || text.includes('gps')) return '/map';
    if (text.includes('mesaj') || text.includes('chat')) return '/chat';
    if (text.includes('șofer') || text.includes('sofer') || text.includes('driver')) return '/drivers';
    return null;
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    const route = getRoute(n);
    if (route) navigate(route);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getEntityTypeFromContent = (n: Notification): string => {
    if (n.entity_type) return n.entity_type;
    const text = `${n.title} ${n.message || ''}`.toLowerCase();
    if (text.includes('cursă') || text.includes('cursa') || text.includes('trip') || text.includes('status')) return 'trip';
    if (text.includes('document')) return 'document';
    if (text.includes('locație') || text.includes('locatie') || text.includes('gps')) return 'location';
    if (text.includes('mesaj') || text.includes('chat')) return 'chat';
    if (text.includes('șofer') || text.includes('sofer') || text.includes('driver')) return 'driver';
    return 'other';
  };

  const filtered = notifications.filter(n => {
    if (search) {
      const q = search.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !(n.message || '').toLowerCase().includes(q)) return false;
    }
    if (filterType !== 'all') {
      if (getEntityTypeFromContent(n) !== filterType) return false;
    }
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

  const timeAgo = (date: string | null) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: localeMap[language as keyof typeof localeMap] || ro,
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasActiveFilters = search || filterType !== 'all' || filterRead !== 'all';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="page-title">Notificări</h1>
          {unreadCount > 0 && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-destructive px-2 text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marchează toate citite
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4 mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută în notificări..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              <SelectItem value="trip">🚛 Curse</SelectItem>
              <SelectItem value="document">📄 Documente</SelectItem>
              <SelectItem value="chat">💬 Mesaje</SelectItem>
              <SelectItem value="location">📍 Locații</SelectItem>
              <SelectItem value="driver">👤 Șoferi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRead} onValueChange={setFilterRead}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="unread">Necitite</SelectItem>
              <SelectItem value="read">Citite</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={() => { setSearch(''); setFilterType('all'); setFilterRead('all'); }} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {hasActiveFilters ? 'Nicio notificare găsită cu filtrele selectate.' : 'Nicio notificare.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(n => {
              const type = getEntityTypeFromContent(n);
              const Icon = typeIcons[type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors",
                    !n.read && "bg-accent/30"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      <span className={cn("text-sm font-medium", !n.read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </span>
                    </div>
                    {n.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(n.created_at)}</span>
                      {n.created_at && (
                        <span className="text-[10px] text-muted-foreground/40">
                          · {format(new Date(n.created_at), 'dd.MM.yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

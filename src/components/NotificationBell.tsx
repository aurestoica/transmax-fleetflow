import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { ro, es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const { language } = useI18n();

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationRoute = (n: Notification): string | null => {
    if (n.entity_type && n.entity_id) {
      switch (n.entity_type) {
        case 'trip': return `/trips/${n.entity_id}`;
        case 'chat': return `/chat?trip=${n.entity_id}`;
        case 'document': return `/documents`;
        case 'vehicle': return `/vehicles?highlight=${n.entity_id}`;
        case 'trailer': return `/trailers?highlight=${n.entity_id}`;
        case 'driver': return `/drivers?highlight=${n.entity_id}`;
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

  const handleNotificationClick = async (n: Notification) => {
    await markAsRead(n.id);
    setOpen(false);
    const route = getNotificationRoute(n);
    if (route) navigate(route);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const timeAgo = (date: string | null) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: localeMap[language as keyof typeof localeMap] || ro,
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto bg-popover z-50">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Notificări</span>
          {unreadCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); markAllRead(); }}
              className="text-xs text-primary hover:underline"
            >
              Marchează toate citite
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nicio notificare
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn(
                "flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer",
                !n.read && "bg-accent/50"
              )}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="flex items-center gap-2 w-full">
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                <span className={cn("text-sm font-medium truncate", !n.read ? "text-foreground" : "text-muted-foreground")}>
                  {n.title}
                </span>
              </div>
              {n.message && (
                <span className="text-xs text-muted-foreground line-clamp-2 pl-4">
                  {n.message}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground/60 pl-4">
                {timeAgo(n.created_at)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs text-primary font-medium cursor-pointer"
              onClick={() => { setOpen(false); navigate('/notifications'); }}
            >
              Vezi toate notificările
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

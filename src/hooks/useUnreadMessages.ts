import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';

interface UnreadState {
  count: number;
  setCount: (c: number) => void;
}

const useUnreadStore = create<UnreadState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));

export function useUnreadMessages() {
  const { userId } = useAuthStore();
  const { count, setCount } = useUnreadStore();

  useEffect(() => {
    if (!userId) return;

    const fetchCount = () => {
      const lastSeen = localStorage.getItem(`chat_last_seen_${userId}`);
      if (!lastSeen) {
        // New account: mark everything as read by setting "now" as baseline
        localStorage.setItem(`chat_last_seen_${userId}`, new Date().toISOString());
        setCount(0);
        return;
      }
      const since = lastSeen;

      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', since)
        .neq('sender_id', userId)
        .is('deleted_at', null)
        .then(({ count: c }) => {
          setCount(c ?? 0);
        });
    };

    fetchCount();

    const channel = supabase.channel('unread-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchCount())
      .subscribe();

    // Poll every 30s as backup
    const interval = setInterval(fetchCount, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId, setCount]);

  const markAsRead = () => {
    if (!userId) return;
    localStorage.setItem(`chat_last_seen_${userId}`, new Date().toISOString());
    setCount(0);
  };

  return { unreadCount: count, markAsRead };
}

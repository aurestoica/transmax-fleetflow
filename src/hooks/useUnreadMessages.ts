import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';

export function useUnreadMessages() {
  const { userId, isAdmin } = useAuthStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchCount = async () => {
      // Get the last time the user opened chat (stored in localStorage)
      const lastSeen = localStorage.getItem(`chat_last_seen_${userId}`);
      const since = lastSeen || new Date(0).toISOString();

      let query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', since)
        .neq('sender_id', userId)
        .is('deleted_at', null);

      const { count: c } = await query;
      setCount(c ?? 0);
    };

    fetchCount();

    // Listen for new messages in realtime
    const channel = supabase.channel('unread-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAsRead = () => {
    if (!userId) return;
    localStorage.setItem(`chat_last_seen_${userId}`, new Date().toISOString());
    setCount(0);
  };

  return { unreadCount: count, markAsRead };
}

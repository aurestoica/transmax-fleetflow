import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

export default function DriverChatPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [tripId, setTripId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find driver's active trip for chat
    const findTrip = async () => {
      const { data: driver } = await supabase.from('drivers').select('id').eq('user_id', userId!).single();
      if (!driver) return;
      const { data: trip } = await supabase.from('trips')
        .select('id').eq('driver_id', driver.id)
        .in('status', ['planned', 'loading', 'in_transit', 'unloading'])
        .limit(1).single();
      if (trip) setTripId(trip.id);
    };
    findTrip();
  }, [userId]);

  useEffect(() => {
    if (!tripId) return;
    loadMessages();
    const channel = supabase.channel(`driver-chat-${tripId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` }, () => loadMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*, profiles:sender_id(full_name)')
      .eq('trip_id', tripId).order('created_at');
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !tripId) return;
    await supabase.from('messages').insert({ trip_id: tripId, sender_id: userId, content: newMsg.trim() });
    setNewMsg('');
  };

  if (!tripId) return <div className="flex items-center justify-center h-64 text-muted-foreground">Nu ai o cursă activă pentru chat</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <h1 className="text-xl font-display font-bold mb-4">{t('nav.chat')}</h1>

      <div className="flex-1 overflow-y-auto space-y-3 bg-card rounded-xl border p-4 mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        {messages.length === 0 && <div className="text-center text-muted-foreground py-8">{t('common.noData')}</div>}
        {messages.map(msg => {
          const isMe = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {!isMe && <div className="text-xs font-medium mb-1 opacity-70">{msg.profiles?.full_name ?? 'Dispecer'}</div>}
                <div className="text-sm">{msg.content}</div>
                <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Scrie un mesaj..."
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          className="flex-1 h-12"
        />
        <Button onClick={sendMessage} disabled={!newMsg.trim()} className="h-12 w-12 p-0">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

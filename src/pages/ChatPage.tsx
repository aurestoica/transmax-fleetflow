import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('trips').select('id, trip_number, pickup_address, delivery_address')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTrips(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedTrip) return;
    loadMessages();

    const channel = supabase.channel(`chat-${selectedTrip}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${selectedTrip}` }, () => loadMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTrip]);

  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*, profiles:sender_id(full_name)')
      .eq('trip_id', selectedTrip).order('created_at');
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedTrip) return;
    await supabase.from('messages').insert({ trip_id: selectedTrip, sender_id: userId, content: newMsg.trim() });
    setNewMsg('');
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="page-header">
        <h1 className="page-title">{t('nav.chat')}</h1>
        <Select value={selectedTrip} onValueChange={setSelectedTrip}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selectează cursa..." /></SelectTrigger>
          <SelectContent>{trips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.trip_number} - {trip.pickup_address} → {trip.delivery_address}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!selectedTrip ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Selectează o cursă pentru a vedea mesajele</div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-3 bg-card rounded-xl border p-4 mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            {messages.length === 0 && <div className="text-center text-muted-foreground py-8">{t('common.noData')}</div>}
            {messages.map(msg => {
              const isMe = msg.sender_id === userId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {!isMe && <div className="text-xs font-medium mb-1 opacity-70">{msg.profiles?.full_name ?? 'User'}</div>}
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
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMsg.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

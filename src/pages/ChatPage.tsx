import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import ChatMessageBubble from '@/components/chat/ChatMessageBubble';
import { useChatMessages } from '@/components/chat/useChatMessages';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import ChatMessageBubble from '@/components/chat/ChatMessageBubble';
import { useChatMessages } from '@/components/chat/useChatMessages';

export default function ChatPage() {
  const { t } = useI18n();
  const { userId, isAdmin } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { markAsRead } = useUnreadMessages();

  useEffect(() => { markAsRead(); }, []);

  const { messages, uploading, bottomRef, fileInputRef, sendMessage, editMessage, deleteMessage, uploadFile } = useChatMessages(selectedTrip, userId);

  useEffect(() => {
    supabase.from('trips').select('id, trip_number, pickup_address, delivery_address')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTrips(data ?? []));
  }, []);

  const handleSend = async () => { await sendMessage(newMsg); setNewMsg(''); };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) uploadFile(file); };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="page-header">
        <h1 className="page-title">{t('nav.chat')}</h1>
        <Select value={selectedTrip} onValueChange={setSelectedTrip}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selectează cursa..." /></SelectTrigger>
          <SelectContent>{trips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.trip_number} - {trip.pickup_address} → {trip.delivery_address}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Previzualizare</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />

      {!selectedTrip ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Selectează o cursă pentru a vedea mesajele</div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-3 bg-card rounded-xl border p-4 mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            {messages.length === 0 && <div className="text-center text-muted-foreground py-8">{t('common.noData')}</div>}
            {messages.map(msg => (
              <ChatMessageBubble
                key={msg.id}
                msg={msg}
                isMe={msg.sender_id === userId}
                isAdmin={isAdmin()}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onPreviewImage={setPreviewUrl}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-shrink-0">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Input placeholder="Scrie un mesaj..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1" />
            <Button onClick={handleSend} disabled={!newMsg.trim()}><Send className="h-4 w-4" /></Button>
          </div>
        </>
      )}
    </div>
  );
}

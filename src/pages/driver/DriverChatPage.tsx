import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import ChatMessageBubble from '@/components/chat/ChatMessageBubble';
import { useChatMessages } from '@/components/chat/useChatMessages';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export default function DriverChatPage() {
  const { t } = useI18n();
  const { userId, isAdmin } = useAuthStore();
  const [tripId, setTripId] = useState('');
  const [tripLoading, setTripLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { markAsRead } = useUnreadMessages();

  useEffect(() => { markAsRead(); }, []);

  const { messages, uploading, bottomRef, fileInputRef, sendMessage, editMessage, deleteMessage, uploadFile } = useChatMessages(tripId, userId);

  useEffect(() => {
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

  const handleSend = async () => { await sendMessage(newMsg); setNewMsg(''); };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) uploadFile(file); };

  if (!tripId) return <div className="flex items-center justify-center h-64 text-muted-foreground">Nu ai o cursă activă pentru chat</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <h1 className="text-xl font-display font-bold mb-4">{t('nav.chat')}</h1>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Previzualizare</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />

      <div className="flex-1 overflow-y-auto flex flex-col bg-card rounded-xl border p-4 mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex-1" />
        <div className="space-y-3">
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
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-shrink-0 h-12 w-12">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        </Button>
        <Input placeholder="Scrie un mesaj..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1 h-12" />
        <Button onClick={handleSend} disabled={!newMsg.trim()} className="h-12 w-12 p-0"><Send className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Paperclip, Loader2, Image as ImageIcon, FileText, Film, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
const isVideo = (url: string) => /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);

export default function ChatPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const { data: msgs } = await supabase.from('messages').select('*')
      .eq('trip_id', selectedTrip).order('created_at');
    if (!msgs || msgs.length === 0) { setMessages([]); return; }

    const senderIds = [...new Set(msgs.map(m => m.sender_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name')
      .in('user_id', senderIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p.full_name]));

    const enriched = msgs.map(m => ({ ...m, sender_name: profileMap.get(m.sender_id) ?? 'User' }));
    setMessages(enriched);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedTrip) return;
    await supabase.from('messages').insert({ trip_id: selectedTrip, sender_id: userId, content: newMsg.trim() });
    setNewMsg('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTrip || !userId) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const filePath = `chat/${selectedTrip}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      await supabase.from('messages').insert({
        trip_id: selectedTrip,
        sender_id: userId,
        content: file.name,
        attachment_url: publicUrl,
      });
    } catch (err: any) {
      toast.error('Eroare la upload: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderAttachment = (url: string, isMe: boolean) => {
    if (isImage(url)) {
      return (
        <img
          src={url}
          alt="Attachment"
          className="max-w-full max-h-60 rounded-lg mt-1 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setPreviewUrl(url)}
        />
      );
    }
    if (isVideo(url)) {
      return (
        <video
          src={url}
          controls
          className="max-w-full max-h-60 rounded-lg mt-1"
          preload="metadata"
        />
      );
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 mt-1 text-xs underline ${isMe ? 'text-primary-foreground/80' : 'text-primary'}`}
      >
        <FileText className="h-3.5 w-3.5" />
        Descarcă fișier
      </a>
    );
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

      {/* Image preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Previzualizare</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileUpload}
      />

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
                    {!isMe && <div className="text-xs font-medium mb-1 opacity-70">{msg.sender_name ?? 'User'}</div>}
                    {msg.attachment_url && renderAttachment(msg.attachment_url, isMe)}
                    {msg.content && !msg.attachment_url && <div className="text-sm">{msg.content}</div>}
                    {msg.content && msg.attachment_url && <div className="text-xs mt-1 opacity-70">{msg.content}</div>}
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
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

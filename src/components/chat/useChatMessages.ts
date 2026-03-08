import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useChatMessages(tripId: string, userId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!tripId) return;
    const { data: msgs } = await supabase.from('messages').select('*')
      .eq('trip_id', tripId).order('created_at', { ascending: true });
    if (!msgs || msgs.length === 0) { setMessages([]); return; }

    const senderIds = [...new Set(msgs.map(m => m.sender_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name')
      .in('user_id', senderIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p.full_name]));

    const enriched = msgs.map(m => ({ ...m, sender_name: profileMap.get(m.sender_id) ?? 'User' }));
    setMessages(enriched);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    loadMessages();
    const channel = supabase.channel(`chat-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` }, () => loadMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId, loadMessages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !tripId || !userId) return;
    await supabase.from('messages').insert({ trip_id: tripId, sender_id: userId, content: content.trim() });
  };

  const editMessage = async (msgId: string, newContent: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const history = [...(msg.edit_history || []), { old_content: msg.content, edited_at: new Date().toISOString() }];
    await supabase.from('messages').update({
      content: newContent,
      edited_at: new Date().toISOString(),
      edit_history: history as any,
    }).eq('id', msgId);
  };

  const deleteMessage = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const elapsed = Date.now() - new Date(msg.created_at).getTime();
    if (elapsed > 10 * 60 * 1000) { toast.error('Poți șterge mesajele doar în primele 10 minute'); return; }
    await supabase.from('messages').update({
      deleted_at: new Date().toISOString(),
      deleted_content: msg.content,
      content: null,
    }).eq('id', msgId);
  };

  const uploadFile = async (file: File) => {
    if (!tripId || !userId) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const filePath = `chat/${tripId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('documents').upload(filePath, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      await supabase.from('messages').insert({ trip_id: tripId, sender_id: userId, content: file.name, attachment_url: urlData.publicUrl });
    } catch (err: any) {
      toast.error('Eroare la upload: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return { messages, uploading, bottomRef, fileInputRef, sendMessage, editMessage, deleteMessage, uploadFile };
}

import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Check, X, FileText, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
const isVideo = (url: string) => /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string | null;
  attachment_url: string | null;
  created_at: string;
  edited_at: string | null;
  edit_history: any[];
  deleted_at: string | null;
  deleted_content: string | null;
}

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  isMe: boolean;
  isAdmin: boolean;
  onEdit: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
  onPreviewImage: (url: string) => void;
}

export default function ChatMessageBubble({ msg, isMe, isAdmin, onEdit, onDelete, onPreviewImage }: ChatMessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const canEdit = isMe && !msg.deleted_at && !msg.attachment_url;
  const canDelete = isMe && !msg.deleted_at && (Date.now() - new Date(msg.created_at).getTime()) < 10 * 60 * 1000;

  // Deleted message - only admin sees it
  if (msg.deleted_at) {
    if (!isAdmin) return null;
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] rounded-xl px-4 py-2 bg-destructive/10 border border-destructive/20 opacity-60">
          <div className="text-xs text-destructive italic flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            Mesaj șters: "{msg.deleted_content}"
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {msg.sender_name} • {format(new Date(msg.created_at), 'HH:mm')} • șters la {format(new Date(msg.deleted_at), 'HH:mm')}
          </div>
        </div>
      </div>
    );
  }

  const startEdit = () => { setEditText(msg.content ?? ''); setEditing(true); };
  const confirmEdit = () => { if (editText.trim() && editText.trim() !== msg.content) onEdit(msg.id, editText.trim()); setEditing(false); };

  const renderAttachment = (url: string) => {
    if (isImage(url)) {
      return <img src={url} alt="Attachment" className="max-w-full max-h-60 rounded-lg mt-1 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onPreviewImage(url)} />;
    }
    if (isVideo(url)) {
      return <video src={url} controls className="max-w-full max-h-60 rounded-lg mt-1" preload="metadata" />;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 mt-1 text-xs underline ${isMe ? 'text-primary-foreground/80' : 'text-primary'}`}>
        <FileText className="h-3.5 w-3.5" /> Descarcă fișier
      </a>
    );
  };

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
        <div className={`max-w-[70%] rounded-xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'} relative`}>
          {!isMe && <div className="text-xs font-medium mb-1 opacity-70">{msg.sender_name ?? 'User'}</div>}
          
          {msg.attachment_url && renderAttachment(msg.attachment_url)}
          
          {editing ? (
            <div className="flex items-center gap-1 mt-1">
              <Input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmEdit()} className="h-7 text-sm bg-background text-foreground" autoFocus />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={confirmEdit}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <>
              {msg.content && !msg.attachment_url && <div className="text-sm">{msg.content}</div>}
              {msg.content && msg.attachment_url && <div className="text-xs mt-1 opacity-70">{msg.content}</div>}
            </>
          )}

          <div className={`flex items-center gap-1 text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
            {format(new Date(msg.created_at), 'HH:mm')}
            {msg.edited_at && <span className="italic">(editat)</span>}
          </div>

          {/* Action buttons */}
          {!editing && (canEdit || canDelete || (isAdmin && msg.edit_history?.length > 0)) && (
            <div className="absolute -top-3 right-1 hidden group-hover:flex items-center gap-0.5 bg-background border rounded-md shadow-sm px-0.5">
              {canEdit && (
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={startEdit}><Pencil className="h-3 w-3" /></Button>
                </TooltipTrigger><TooltipContent>Editează</TooltipContent></Tooltip></TooltipProvider>
              )}
              {canDelete && (
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(msg.id)}><Trash2 className="h-3 w-3" /></Button>
                </TooltipTrigger><TooltipContent>Șterge</TooltipContent></Tooltip></TooltipProvider>
              )}
              {isAdmin && msg.edit_history?.length > 0 && (
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowHistory(true)}><History className="h-3 w-3" /></Button>
                </TooltipTrigger><TooltipContent>Istoric editări</TooltipContent></Tooltip></TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit history dialog - admin only */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Istoric editări</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(msg.edit_history ?? []).map((entry: any, i: number) => (
              <div key={i} className="rounded-lg bg-muted p-3 text-sm">
                <div className="text-muted-foreground text-xs mb-1">{format(new Date(entry.edited_at), 'dd.MM.yyyy HH:mm')}</div>
                <div>{entry.old_content}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

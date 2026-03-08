import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Camera, Trash2, Loader2, Eye, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface DriverAvatarUploadProps {
  driverId: string;
  avatarUrl: string | null;
  driverName: string;
  onUpdated: (newUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export default function DriverAvatarUpload({ driverId, avatarUrl, driverName, onUpdated, size = 'md', editable = true }: DriverAvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sizeClasses = { sm: 'h-10 w-10', md: 'h-16 w-16', lg: 'h-20 w-20' };
  const iconSizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

  const initials = driverName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selectează o imagine'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Imaginea trebuie să fie sub 2MB'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `drivers/${driverId}/avatar.${ext}`;
      await supabase.storage.from('avatars').remove([`drivers/${driverId}/avatar.jpg`, `drivers/${driverId}/avatar.png`, `drivers/${driverId}/avatar.webp`]);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from('drivers').update({ avatar_url: urlWithCache }).eq('id', driverId);
      if (updateError) throw updateError;
      onUpdated(urlWithCache);
      toast.success('Poză actualizată!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    try {
      await supabase.storage.from('avatars').remove([`drivers/${driverId}/avatar.jpg`, `drivers/${driverId}/avatar.png`, `drivers/${driverId}/avatar.webp`]);
      const { error } = await supabase.from('drivers').update({ avatar_url: null }).eq('id', driverId);
      if (error) throw error;
      onUpdated(null);
      toast.success('Poză ștearsă!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const avatarElement = (
    <Avatar className={`${sizeClasses[size]} cursor-pointer`}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={driverName} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
        {uploading ? <Loader2 className={`${iconSizes[size]} animate-spin`} /> : initials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className="flex items-center gap-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {editable && !uploading ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              {avatarElement}
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            {avatarUrl && (
              <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />Vizualizează
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4 mr-2" />{avatarUrl ? 'Înlocuiește' : 'Adaugă poză'}
            </DropdownMenuItem>
            {avatarUrl && (
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Șterge poza
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div>{avatarElement}</div>
      )}

      {/* Full-size preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xs p-6 flex items-center justify-center bg-background/95 backdrop-blur">
          <div className="h-56 w-56 rounded-full overflow-hidden border-4 border-border shadow-lg">
            {avatarUrl && (
              <img src={avatarUrl} alt={driverName} className="h-full w-full object-cover" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

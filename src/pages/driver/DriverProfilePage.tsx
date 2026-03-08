import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n, Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Globe, Save, Loader2, Camera, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const langOptions: { value: Language; label: string; flag: string }[] = [
  { value: 'ro', label: 'Română', flag: '🇷🇴' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function DriverProfilePage() {
  const { t, language, setLanguage } = useI18n();
  const { userId, fullName, email } = useAuthStore();
  const [profile, setProfile] = useState<{ full_name: string; phone: string; email: string }>({
    full_name: fullName || '', phone: '', email: email || '',
  });
  const [driver, setDriver] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProfile(); }, [userId]);

  const loadProfile = async () => {
    const [profileRes, driverRes, requestsRes] = await Promise.all([
      supabase.from('profiles').select('full_name, phone, email, language').eq('user_id', userId!).single(),
      supabase.from('drivers').select('*').eq('user_id', userId!).single(),
      supabase.from('profile_change_requests').select('*').eq('user_id', userId!).order('created_at', { ascending: false }).limit(10),
    ]);
    if (profileRes.data) {
      setProfile({ full_name: profileRes.data.full_name, phone: profileRes.data.phone || '', email: profileRes.data.email || '' });
      if (profileRes.data.language && ['ro', 'en', 'es'].includes(profileRes.data.language)) {
        setLanguage(profileRes.data.language as Language);
      }
    }
    setDriver(driverRes.data);
    setPendingRequests(requestsRes.data ?? []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!driver) return;
    setSaving(true);
    try {
      // Save language directly (no approval needed)
      await supabase.from('profiles').update({ language }).eq('user_id', userId!);

      // Check if name or phone changed from driver record
      const changes: Record<string, any> = {};
      if (profile.full_name !== driver.full_name) changes.full_name = profile.full_name;
      if ((profile.phone || '') !== (driver.phone || '')) changes.phone = profile.phone;

      if (Object.keys(changes).length > 0) {
        // Create approval request
        const { error } = await supabase.from('profile_change_requests').insert({
          driver_id: driver.id,
          user_id: userId!,
          changes,
        });
        if (error) throw error;
        toast.success('Cerere de modificare trimisă! Așteaptă aprobarea.');
        loadProfile();
      } else {
        toast.success('Profil actualizat!');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !driver) return;

    if (!file.type.startsWith('image/')) { toast.error('Selectează o imagine'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Maxim 2MB'); return; }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/pending-avatar.${ext}`;

      await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;

      // Create approval request for photo change
      const { error } = await supabase.from('profile_change_requests').insert({
        driver_id: driver.id,
        user_id: userId!,
        changes: { avatar_url: urlWithCache },
      });
      if (error) throw error;
      toast.success('Cerere de schimbare poză trimisă!');
      loadProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handlePhotoDelete = async () => {
    if (!driver) return;
    setUploadingPhoto(true);
    try {
      const { error } = await supabase.from('profile_change_requests').insert({
        driver_id: driver.id,
        user_id: userId!,
        changes: { avatar_url: null },
      });
      if (error) throw error;
      toast.success('Cerere de ștergere poză trimisă!');
      loadProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  const initials = (driver?.full_name || profile.full_name)?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hasPendingPhoto = pendingRequests.some(r => r.status === 'pending' && (r.changes as any)?.avatar_url !== undefined);

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="h-3 w-3 text-emerald-500" />;
    if (status === 'rejected') return <XCircle className="h-3 w-3 text-destructive" />;
    return <Clock className="h-3 w-3 text-amber-500" />;
  };

  const changeLabels: Record<string, string> = { full_name: 'Nume', phone: 'Telefon', avatar_url: 'Poză' };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-display font-bold mb-6">Profil</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6 gap-2">
        <div className="relative group">
          <Avatar className="h-20 w-20">
            {driver?.avatar_url && <AvatarImage src={driver.avatar_url} alt={driver.full_name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">{initials}</AvatarFallback>
          </Avatar>
          {!uploadingPhoto && !hasPendingPhoto && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
          )}
          {uploadingPhoto && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <div className="flex gap-2">
          {!hasPendingPhoto && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}>
              <Camera className="h-3 w-3 mr-1" />Schimbă poza
            </Button>
          )}
          {driver?.avatar_url && !hasPendingPhoto && (
            <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={handlePhotoDelete} disabled={uploadingPhoto}>
              <Trash2 className="h-3 w-3 mr-1" />Șterge
            </Button>
          )}
          {hasPendingPhoto && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
              <Clock className="h-3 w-3 mr-1" />Cerere poză în așteptare
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Nume complet</Label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="pl-10" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Telefon</Label>
          <div className="relative mt-1.5">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+40..." className="pl-10" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Email</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={profile.email} disabled className="pl-10 opacity-60" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Email-ul nu poate fi modificat</p>
        </div>

        {/* Language selector */}
        <div>
          <Label className="text-sm font-medium">Limbă</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {langOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                  language === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full mt-4" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvează
        </Button>

        {/* Recent requests */}
        {pendingRequests.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Istoric cereri</h3>
            <div className="space-y-2">
              {pendingRequests.slice(0, 5).map(req => {
                const changes = req.changes as Record<string, any>;
                return (
                  <div key={req.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2.5">
                    {statusIcon(req.status)}
                    <div className="flex-1">
                      {Object.entries(changes).map(([k, v]) => (
                        <span key={k} className="mr-2">
                          {changeLabels[k] || k}: {k === 'avatar_url' ? (v ? 'nouă' : 'ștergere') : `"${String(v)}"`}
                        </span>
                      ))}
                    </div>
                    <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'outline'} className="text-[10px] h-4">
                      {req.status === 'pending' ? 'În așteptare' : req.status === 'approved' ? 'Aprobat' : 'Respins'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

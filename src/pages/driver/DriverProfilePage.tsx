import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n, Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, Globe, Save, Loader2 } from 'lucide-react';
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
    full_name: fullName || '',
    phone: '',
    email: email || '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('full_name, phone, email, language')
        .eq('user_id', userId!).single();
      if (data) {
        setProfile({ full_name: data.full_name, phone: data.phone || '', email: data.email || '' });
        if (data.language && ['ro', 'en', 'es'].includes(data.language)) {
          setLanguage(data.language as Language);
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        phone: profile.phone || null,
        language,
      }).eq('user_id', userId!);

      if (error) throw error;
      toast.success('Profil actualizat!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-display font-bold mb-6">Profil</h1>

      {/* Avatar placeholder */}
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-10 w-10 text-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Nume complet</Label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Telefon</Label>
          <div className="relative mt-1.5">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+40..."
              className="pl-10"
            />
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
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { Bell, Mail, Shield, Building2, Save, Loader2, ScrollText, ChevronRight, User, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageCropDialog from '@/components/ImageCropDialog';

interface NotificationSettings {
  email_enabled: boolean;
  email_trip_status: boolean;
  email_trip_assigned: boolean;
  email_new_message: boolean;
  email_document_uploaded: boolean;
  email_expiry_alert: boolean;
  email_location_update: boolean;
  email_driver_status: boolean;
}

const defaultSettings: NotificationSettings = {
  email_enabled: false,
  email_trip_status: true,
  email_trip_assigned: true,
  email_new_message: true,
  email_document_uploaded: false,
  email_expiry_alert: true,
  email_location_update: false,
  email_driver_status: true,
};

const notificationTypes = [
  {
    key: 'email_trip_status' as const,
    icon: '🚛',
    label: { ro: 'Schimbare status cursă', en: 'Trip status change', es: 'Cambio de estado del viaje' },
    desc: { ro: 'Când o cursă își schimbă statusul', en: 'When a trip changes status', es: 'Cuando un viaje cambia de estado' },
  },
  {
    key: 'email_trip_assigned' as const,
    icon: '📋',
    label: { ro: 'Cursă nouă atribuită', en: 'New trip assigned', es: 'Nuevo viaje asignado' },
    desc: { ro: 'Când ți se atribuie o cursă nouă', en: 'When a new trip is assigned to you', es: 'Cuando se te asigna un nuevo viaje' },
  },
  {
    key: 'email_new_message' as const,
    icon: '💬',
    label: { ro: 'Mesaj nou primit', en: 'New message received', es: 'Nuevo mensaje recibido' },
    desc: { ro: 'Când primești un mesaj pe o cursă', en: 'When you receive a message on a trip', es: 'Cuando recibes un mensaje en un viaje' },
  },
  {
    key: 'email_document_uploaded' as const,
    icon: '📄',
    label: { ro: 'Document încărcat', en: 'Document uploaded', es: 'Documento subido' },
    desc: { ro: 'Când un șofer încarcă un document', en: 'When a driver uploads a document', es: 'Cuando un conductor sube un documento' },
  },
  {
    key: 'email_expiry_alert' as const,
    icon: '⚠️',
    label: { ro: 'Alerte de expirare', en: 'Expiry alerts', es: 'Alertas de vencimiento' },
    desc: { ro: 'Documente, RCA, ITP sau permise care expiră curând', en: 'Documents, insurance, or licenses expiring soon', es: 'Documentos, seguros o licencias que vencen pronto' },
  },
  {
    key: 'email_location_update' as const,
    icon: '📍',
    label: { ro: 'Actualizări locație', en: 'Location updates', es: 'Actualizaciones de ubicación' },
    desc: { ro: 'Când un șofer trimite locația', en: 'When a driver sends their location', es: 'Cuando un conductor envía su ubicación' },
  },
  {
    key: 'email_driver_status' as const,
    icon: '👤',
    label: { ro: 'Status șofer modificat', en: 'Driver status changed', es: 'Estado del conductor cambiado' },
    desc: { ro: 'Când un șofer își schimbă statusul', en: 'When a driver changes status', es: 'Cuando un conductor cambia de estado' },
  },
];

interface CompanyProfile {
  name: string;
  cif: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
}

interface UserProfile {
  full_name: string;
  phone: string;
  email: string;
}

export default function SettingsPage() {
  const { userId, companyId, isOwner } = useAuthStore();
  const { language, t } = useI18n();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(defaultSettings);

  // Company profile state
  const [company, setCompany] = useState<CompanyProfile>({ name: '', cif: '', address: '', contact_email: '', contact_phone: '', logo_url: '' });
  const [originalCompany, setOriginalCompany] = useState<CompanyProfile>({ name: '', cif: '', address: '', contact_email: '', contact_phone: '', logo_url: '' });
  const [companyEditing, setCompanyEditing] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);

  // User profile state
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [originalProfile, setOriginalProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Load notification settings
      const { data: notifData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (notifData) {
        const s: NotificationSettings = {
          email_enabled: notifData.email_enabled,
          email_trip_status: notifData.email_trip_status,
          email_trip_assigned: notifData.email_trip_assigned,
          email_new_message: notifData.email_new_message,
          email_document_uploaded: notifData.email_document_uploaded,
          email_expiry_alert: notifData.email_expiry_alert,
          email_location_update: notifData.email_location_update,
          email_driver_status: notifData.email_driver_status,
        };
        setSettings(s);
        setOriginalSettings(s);
      }

      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', userId)
        .single();
      if (profileData) {
        const p: UserProfile = {
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
        };
        setProfile(p);
        setOriginalProfile(p);
      }

      // Load company profile
      if (companyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name, cif, address, contact_email, contact_phone, logo_url')
          .eq('id', companyId)
          .single();
        if (companyData) {
          const c: CompanyProfile = {
            name: companyData.name || '',
            cif: companyData.cif || '',
            address: companyData.address || '',
            contact_email: companyData.contact_email || '',
            contact_phone: companyData.contact_phone || '',
            logo_url: (companyData as any).logo_url || '',
          };
          setCompany(c);
          setOriginalCompany(c);
        }
      }

      setLoading(false);
    })();
  }, [userId, companyId]);

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSettings));
  };

  const handleSaveNotifications = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from('notification_settings')
      .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    } else {
      setOriginalSettings(settings);
      setHasChanges(false);
      toast({ title: 'Setări salvate' });
    }
  };

  const handleSaveCompany = async () => {
    if (!companyId) return;
    setCompanySaving(true);
    const { error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        cif: company.cif || null,
        address: company.address || null,
        contact_email: company.contact_email || null,
        contact_phone: company.contact_phone || null,
        logo_url: company.logo_url || null,
      } as any)
      .eq('id', companyId);
    setCompanySaving(false);
    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    } else {
      setOriginalCompany(company);
      setCompanyEditing(false);
      toast({ title: 'Profil companie actualizat' });
    }
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Selectează o imagine', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Imaginea trebuie să fie sub 5MB', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleLogoCropComplete = async (croppedBlob: Blob) => {
    setLogoCropSrc(null);
    if (!companyId) return;
    setLogoUploading(true);
    try {
      const filePath = `logos/${companyId}.jpeg`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const logoUrl = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('companies').update({ logo_url: logoUrl } as any).eq('id', companyId);
      setCompany(prev => ({ ...prev, logo_url: logoUrl }));
      setOriginalCompany(prev => ({ ...prev, logo_url: logoUrl }));
      toast({ title: 'Logo actualizat' });
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message, variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setProfileSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone || null,
        email: profile.email || null,
      })
      .eq('user_id', userId);
    setProfileSaving(false);
    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    } else {
      setOriginalProfile(profile);
      setProfileEditing(false);
      // Also update auth store
      useAuthStore.getState().setAuth({
        userId,
        email: useAuthStore.getState().email || '',
        fullName: profile.full_name,
        roles: useAuthStore.getState().roles,
        companyId,
      });
      toast({ title: 'Profil actualizat' });
    }
  };

  const companyHasChanges = JSON.stringify(company) !== JSON.stringify(originalCompany);
  const profileHasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">{t('settings.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profilul meu</CardTitle>
                <CardDescription>Datele contului tău de utilizator</CardDescription>
              </div>
            </div>
            {!profileEditing && (
              <Button variant="ghost" size="sm" onClick={() => setProfileEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Editează
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileEditing ? (
            <>
              <div className="space-y-2">
                <Label>Nume complet</Label>
                <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setProfile(originalProfile); setProfileEditing(false); }}>Anulează</Button>
                <Button onClick={handleSaveProfile} disabled={profileSaving || !profileHasChanges}>
                  {profileSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Salvează
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nume</p>
                <p className="text-sm font-medium">{profile.full_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{profile.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="text-sm font-medium">{profile.phone || '—'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Profile - only for owner role */}
      {companyId && isOwner() && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Building2 className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profil companie</CardTitle>
                  <CardDescription>Datele companiei tale — vizibile și pentru administratorul platformei</CardDescription>
                </div>
              </div>
              {!companyEditing && (
                <Button variant="ghost" size="sm" onClick={() => setCompanyEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editează
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo upload */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border-2 border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Logo companie</p>
                <p className="text-xs text-muted-foreground mb-2">Imaginea va apărea în sidebar-ul tuturor utilizatorilor companiei</p>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFileSelect} />
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading}>
                  {logoUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Pencil className="h-3 w-3 mr-1" />}
                  {company.logo_url ? 'Schimbă logo' : 'Încarcă logo'}
                </Button>
              </div>
            </div>

            <Separator />

            {companyEditing ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Denumire companie</Label>
                    <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>CIF</Label>
                    <Input value={company.cif} onChange={e => setCompany({ ...company, cif: e.target.value })} placeholder="RO12345678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresă</Label>
                  <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} placeholder="Str. Exemplu, Nr. 1, Sibiu" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email contact</Label>
                    <Input value={company.contact_email} onChange={e => setCompany({ ...company, contact_email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon contact</Label>
                    <Input value={company.contact_phone} onChange={e => setCompany({ ...company, contact_phone: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setCompany(originalCompany); setCompanyEditing(false); }}>Anulează</Button>
                  <Button onClick={handleSaveCompany} disabled={companySaving || !companyHasChanges}>
                    {companySaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Salvează
                  </Button>
                </div>
              </>

            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Denumire</p>
                  <p className="text-sm font-medium">{company.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CIF</p>
                  <p className="text-sm font-medium">{company.cif || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Adresă</p>
                  <p className="text-sm font-medium">{company.address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email contact</p>
                  <p className="text-sm font-medium">{company.contact_email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefon contact</p>
                  <p className="text-sm font-medium">{company.contact_phone || '—'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Notificări Email</CardTitle>
              <CardDescription>Alege ce notificări dorești să primești pe email</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Activează notificări pe email</Label>
              <p className="text-xs text-muted-foreground">Primește notificări importante direct pe adresa ta de email</p>
            </div>
            <Switch
              checked={settings.email_enabled}
              onCheckedChange={(v) => updateSetting('email_enabled', v)}
            />
          </div>

          {settings.email_enabled && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selectează notificările</p>
              <div className="space-y-1">
                {notificationTypes.map((nt) => (
                  <div
                    key={nt.key}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{nt.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{nt.label[language]}</p>
                        <p className="text-xs text-muted-foreground">{nt.desc[language]}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[nt.key]}
                      onCheckedChange={(v) => updateSetting(nt.key, v)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {hasChanges && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvează notificările
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Securitate</CardTitle>
              <CardDescription>Setări legate de securitatea contului</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              const { email } = useAuthStore.getState();
              if (!email) return;
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              if (error) toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
              else toast({ title: 'Email trimis', description: 'Verifică inbox-ul pentru link-ul de resetare.' });
            }}
          >
            Schimbă parola
          </Button>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="group hover:border-primary/30 transition-colors">
        <Link to="/activity-log">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <ScrollText className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Jurnal de activitate</CardTitle>
                  <CardDescription>Istoricul complet al acțiunilor din platformă</CardDescription>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </CardHeader>
        </Link>
      </Card>

      {/* Logo crop dialog */}
      {logoCropSrc && (
        <ImageCropDialog
          open={!!logoCropSrc}
          imageSrc={logoCropSrc}
          onClose={() => setLogoCropSrc(null)}
          onCropComplete={handleLogoCropComplete}
          cropShape="round"
          title="Ajustează logo-ul companiei"
        />
      )}
    </div>
  );
}

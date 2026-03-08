import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Bell, Mail, Shield, Palette, Save, Loader2, ScrollText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function SettingsPage() {
  const { userId } = useAuthStore();
  const { language } = useI18n();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        const s: NotificationSettings = {
          email_enabled: data.email_enabled,
          email_trip_status: data.email_trip_status,
          email_trip_assigned: data.email_trip_assigned,
          email_new_message: data.email_new_message,
          email_document_uploaded: data.email_document_uploaded,
          email_expiry_alert: data.email_expiry_alert,
          email_location_update: data.email_location_update,
          email_driver_status: data.email_driver_status,
        };
        setSettings(s);
        setOriginalSettings(s);
      }
      setLoading(false);
    })();
  }, [userId]);

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSettings));
  };

  const handleSave = async () => {
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
      toast({ title: language === 'ro' ? 'Setări salvate' : language === 'es' ? 'Configuración guardada' : 'Settings saved' });
    }
  };

  const labels = {
    ro: {
      title: 'Setări',
      subtitle: 'Gestionează preferințele tale',
      notifTitle: 'Notificări Email',
      notifDesc: 'Alege ce notificări dorești să primești pe email',
      masterToggle: 'Activează notificări pe email',
      masterDesc: 'Primește notificări importante direct pe adresa ta de email',
      selectNotifs: 'Selectează notificările',
      save: 'Salvează setările',
      securityTitle: 'Securitate',
      securityDesc: 'Setări legate de securitatea contului',
      changePassword: 'Schimbă parola',
      appearanceTitle: 'Aspect',
      appearanceDesc: 'Personalizează aspectul platformei',
      comingSoon: 'În curând',
    },
    en: {
      title: 'Settings',
      subtitle: 'Manage your preferences',
      notifTitle: 'Email Notifications',
      notifDesc: 'Choose which notifications you want to receive via email',
      masterToggle: 'Enable email notifications',
      masterDesc: 'Receive important notifications directly to your email address',
      selectNotifs: 'Select notifications',
      save: 'Save settings',
      securityTitle: 'Security',
      securityDesc: 'Account security settings',
      changePassword: 'Change password',
      appearanceTitle: 'Appearance',
      appearanceDesc: 'Customize the look and feel',
      comingSoon: 'Coming soon',
    },
    es: {
      title: 'Configuración',
      subtitle: 'Gestiona tus preferencias',
      notifTitle: 'Notificaciones por Email',
      notifDesc: 'Elige qué notificaciones quieres recibir por email',
      masterToggle: 'Activar notificaciones por email',
      masterDesc: 'Recibe notificaciones importantes directamente en tu correo',
      selectNotifs: 'Seleccionar notificaciones',
      save: 'Guardar configuración',
      securityTitle: 'Seguridad',
      securityDesc: 'Configuración de seguridad de la cuenta',
      changePassword: 'Cambiar contraseña',
      appearanceTitle: 'Apariencia',
      appearanceDesc: 'Personalizar la apariencia',
      comingSoon: 'Próximamente',
    },
  };

  const l = labels[language];

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
        <h1 className="text-2xl font-bold text-foreground font-display">{l.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{l.subtitle}</p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{l.notifTitle}</CardTitle>
              <CardDescription>{l.notifDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Master toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">{l.masterToggle}</Label>
              <p className="text-xs text-muted-foreground">{l.masterDesc}</p>
            </div>
            <Switch
              checked={settings.email_enabled}
              onCheckedChange={(v) => updateSetting('email_enabled', v)}
            />
          </div>

          {settings.email_enabled && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{l.selectNotifs}</p>
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
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Shield className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">{l.securityTitle}</CardTitle>
              <CardDescription>{l.securityDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              const { email } = useAuthStore.getState();
              if (!email) return;
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
              else toast({ title: language === 'ro' ? 'Email trimis' : 'Email sent', description: language === 'ro' ? 'Verifică inbox-ul pentru link-ul de resetare.' : 'Check your inbox for the reset link.' });
            }}
          >
            {l.changePassword}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance - placeholder */}
      <Card className="opacity-60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Palette className="h-5 w-5 text-info" />
            </div>
            <div>
              <CardTitle className="text-lg">{l.appearanceTitle}</CardTitle>
              <CardDescription>{l.appearanceDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">{l.comingSoon}</p>
        </CardContent>
      </Card>

      {/* Save button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {l.save}
          </Button>
        </div>
      )}
    </div>
  );
}

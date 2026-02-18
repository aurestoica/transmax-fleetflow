import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export default function DriverLocationPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [sending, setSending] = useState(false);

  const sendLocation = () => {
    setSending(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation nu este suportat');
      setSending(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Find active trip
        const { data: driver } = await supabase.from('drivers').select('id').eq('user_id', userId!).single();
        if (!driver) { toast.error('Nu ai un profil de șofer'); setSending(false); return; }

        const { data: activeTrip } = await supabase.from('trips')
          .select('id')
          .eq('driver_id', driver.id)
          .in('status', ['loading', 'in_transit', 'unloading'])
          .limit(1)
          .single();

        if (!activeTrip) { toast.error('Nu ai o cursă activă'); setSending(false); return; }

        await supabase.from('locations').insert({
          trip_id: activeTrip.id,
          user_id: userId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        toast.success('Locația a fost trimisă!');
        setSending(false);
      },
      (err) => {
        toast.error('Nu am putut obține locația');
        setSending(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <MapPin className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-xl font-display font-bold mb-2">{t('nav.location')}</h1>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
        Trimite locația ta curentă către dispecerat
      </p>

      <Button
        onClick={sendLocation}
        disabled={sending}
        className="driver-portal-btn max-w-xs"
        size="lg"
      >
        {sending ? (
          <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
        ) : (
          <>
            <Navigation className="h-5 w-5 mr-2" />
            {t('driver.sendLocation')}
          </>
        )}
      </Button>
    </div>
  );
}

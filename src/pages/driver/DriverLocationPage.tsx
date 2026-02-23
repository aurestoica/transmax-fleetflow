import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

const SEND_INTERVAL = 30_000; // 30 seconds

export default function DriverLocationPage() {
  const { t } = useI18n();
  const { userId } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const sendCoords = useCallback(async (lat: number, lng: number) => {
    if (!userId) return;
    const { data: driver } = await supabase.from('drivers').select('id').eq('user_id', userId).single();
    if (!driver) return;

    const { data: activeTrip } = await supabase.from('trips')
      .select('id')
      .eq('driver_id', driver.id)
      .in('status', ['loading', 'in_transit', 'unloading'])
      .limit(1)
      .single();

    if (!activeTrip) return;

    await supabase.from('locations').insert({
      trip_id: activeTrip.id,
      user_id: userId,
      lat,
      lng,
    });

    setLastSent(new Date().toLocaleTimeString('ro-RO'));
  }, [userId]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation nu este suportat');
      return;
    }

    // Use watchPosition to continuously track
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        latestCoordsRef.current = newCoords;
      },
      (err) => {
        toast.error('Nu am putut obține locația');
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    watchIdRef.current = watchId;

    // Send immediately after first position
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await sendCoords(pos.coords.latitude, pos.coords.longitude);
        toast.success('Tracking pornit! Locația se trimite la fiecare 30 secunde.');
      },
      () => {}
    );

    // Set interval to send every 30 seconds
    const interval = setInterval(async () => {
      const c = latestCoordsRef.current;
      if (c) {
        await sendCoords(c.lat, c.lng);
      }
    }, SEND_INTERVAL);
    intervalRef.current = interval;

    setTracking(true);
  }, [sendCoords]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTracking(false);
    setCoords(null);
    latestCoordsRef.current = null;
    toast.info('Tracking oprit.');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // One-time manual send
  const sendOnce = () => {
    setSending(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation nu este suportat');
      setSending(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await sendCoords(pos.coords.latitude, pos.coords.longitude);
        toast.success('Locația a fost trimisă!');
        setSending(false);
      },
      () => {
        toast.error('Nu am putut obține locația');
        setSending(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <MapPin className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-xl font-display font-bold mb-2">{t('nav.location')}</h1>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
        Activează tracking-ul pentru a trimite locația automat la fiecare 30 de secunde
      </p>

      {/* Tracking toggle */}
      <Button
        onClick={tracking ? stopTracking : startTracking}
        variant={tracking ? 'destructive' : 'default'}
        className="max-w-xs w-full mb-3"
        size="lg"
      >
        {tracking ? (
          <>
            <PowerOff className="h-5 w-5 mr-2" />
            Oprește tracking
          </>
        ) : (
          <>
            <Power className="h-5 w-5 mr-2" />
            Pornește tracking live
          </>
        )}
      </Button>

      {/* Status indicator */}
      {tracking && (
        <div className="bg-card border rounded-xl p-4 max-w-xs w-full text-center space-y-2 mb-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-3 w-3 rounded-full animate-pulse" style={{ background: 'hsl(142, 76%, 36%)' }} />
            <span className="text-sm font-medium text-foreground">Tracking activ</span>
          </div>
          {coords && (
            <p className="text-xs text-muted-foreground">
              📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
          {lastSent && (
            <p className="text-xs text-muted-foreground">
              Ultima trimitere: {lastSent}
            </p>
          )}
          <p className="text-xs text-muted-foreground/70">
            Se trimite automat la fiecare 30 sec
          </p>
        </div>
      )}

      {/* Manual send button */}
      {!tracking && (
        <>
          <div className="text-xs text-muted-foreground mb-3">sau</div>
          <Button
            onClick={sendOnce}
            disabled={sending}
            variant="outline"
            className="max-w-xs w-full"
            size="lg"
          >
            {sending ? (
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
              <>
                <Navigation className="h-5 w-5 mr-2" />
                Trimite o singură dată
              </>
            )}
          </Button>
        </>
      )}

      <p className="text-xs text-muted-foreground/60 mt-6 text-center max-w-xs">
        ⚠️ Tracking-ul funcționează cât timp aplicația rămâne deschisă în browser. Dacă închizi tab-ul, tracking-ul se oprește.
      </p>
    </div>
  );
}

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

/**
 * Initialize push notifications on native platforms.
 * Call this after the user is authenticated.
 */
export async function initPushNotifications(userId: string) {
  // Only works on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not a native platform, skipping push setup');
    return;
  }

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    console.warn('[Push] Permission not granted');
    return;
  }

  // Register for push
  await PushNotifications.register();

  // Listen for registration success → save token
  PushNotifications.addListener('registration', async (token) => {
    console.log('[Push] Token received:', token.value);
    const platform = Capacitor.getPlatform(); // 'ios' | 'android'

    // Upsert token in database
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        { user_id: userId, token: token.value, platform },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      console.error('[Push] Failed to save token:', error.message);
    } else {
      console.log('[Push] Token saved successfully');
    }
  });

  // Handle registration errors
  PushNotifications.addListener('registrationError', (err) => {
    console.error('[Push] Registration error:', err.error);
  });

  // Handle received notifications (foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notification received in foreground:', notification);
  });

  // Handle notification tap (background/killed)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Notification action performed:', action);
  });
}

/**
 * Remove the device token on logout.
 */
export async function removePushToken(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Get current token before unregistering
    await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId);

    await PushNotifications.removeAllListeners();
  } catch (err) {
    console.error('[Push] Error removing token:', err);
  }
}

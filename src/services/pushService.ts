import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not running on a native platform.');
    return;
  }

  console.log('[Push] Initializing push notifications...');
  
  // Request permission
  const permissionStatus = await PushNotifications.requestPermissions();
  if (permissionStatus.receive !== 'granted') {
    console.warn('[Push] Permission not granted for push notifications.');
    return;
  }

  // Register with FCM/APNs
  await PushNotifications.register();

  // Handle successful registration
  PushNotifications.addListener('registration', (token) => {
    console.log('[Push] Device registered with token:', token.value);
    // Optionally send token to your Supabase backend for user association
  });

  // Handle registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('[Push] Registration error:', error);
  });

  // Handle notification received while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notification received:', notification);
    alert(`📢 ${notification.title}\n${notification.body}`);
  });

  // Handle notification action (user taps)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Notification action performed:', action);
  });
}

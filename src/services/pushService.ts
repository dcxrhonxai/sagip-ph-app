// src/services/pushService.ts
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Initialize Push Notifications
 */
export async function initPushService() {
  console.log('🔔 Initializing Push Notifications...');

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('🚫 Push permission not granted');
      return;
    }

    // Register with FCM/APNs
    await PushNotifications.register();

    // Event listeners
    PushNotifications.addListener('registration', token => {
      console.log('✅ Push token:', token.value);
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('❌ Push registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('📨 Notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      console.log('🎯 Notification action performed:', action);
    });
  } catch (error) {
    console.error('⚠️ initPushService failed:', error);
  }
}

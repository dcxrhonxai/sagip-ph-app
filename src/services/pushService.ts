// src/services/pushService.ts
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Initialize push notifications for both web and native (Android/iOS)
 */
export const initPushService = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push Notifications are only available on native devices.');
    return;
  }

  console.log('Initializing Push Notifications...');

  try {
    // 1️⃣ Request permission from the user
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    // 2️⃣ Register the device for push notifications
    await PushNotifications.register();

    // 3️⃣ Listen for successful registration
    PushNotifications.addListener('registration', (token) => {
      console.log('📱 Push registration token:', token.value);
      // TODO: You can send this token to your backend or Supabase
    });

    // 4️⃣ Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    // 5️⃣ Handle notifications received while app is running
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📩 Push notification received:', notification);
    });

    // 6️⃣ Handle notification actions (when user taps a notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🔔 Notification action performed:', action.notification);
    });

    console.log('✅ Push Notifications initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize push notifications:', error);
  }
};

import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  console.log('🔔 Initializing push notifications...');

  // Request permission on Android & iOS
  const permStatus = await PushNotifications.requestPermissions();
  if (permStatus.receive !== 'granted') {
    console.warn('Push notification permission not granted.');
    return;
  }

  // Register with FCM
  await PushNotifications.register();

  // Listen for registration token
  PushNotifications.addListener('registration', (token) => {
    console.log('✅ Device registered for push:', token.value);
    // Send token to your backend if needed
  });

  // Listen for errors
  PushNotifications.addListener('registrationError', (error) => {
    console.error('❌ Registration error:', error);
  });

  // Listen for notifications received while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📩 Notification received in foreground:', notification);
  });

  // Listen for notification tap actions
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('👆 Notification tapped:', notification);
  });
}

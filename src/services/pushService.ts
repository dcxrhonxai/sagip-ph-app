import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  console.log('Initializing push notifications...');

  // Request permission for iOS (Android auto-granted)
  let permStatus = await PushNotifications.requestPermissions();
  if (permStatus.receive !== 'granted') {
    console.warn('Push notification permission not granted');
    return;
  }

  // Register with FCM
  await PushNotifications.register();

  // On successful registration
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token:', token.value);
  });

  // On registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // On receiving a notification
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  // On notification action
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Notification action performed:', action);
  });
}

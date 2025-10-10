import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  console.log('Initializing push notifications...');

  const permStatus = await PushNotifications.requestPermissions();
  if (permStatus.receive === 'granted') {
    await PushNotifications.register();
  } else {
    console.warn('Push permission not granted');
    return;
  }

  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token:', token.value);
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
    alert(`Push Received: ${notification.title}\n${notification.body}`);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action performed:', action);
  });
}

import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushService() {
  console.log('Initializing push notifications...');
  
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.warn('Push notifications permission not granted.');
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', token => {
    console.log('Push registration token:', token.value);
  });

  PushNotifications.addListener('registrationError', err => {
    console.error('Push registration error:', err.error);
  });

  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push notification received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    console.log('Push action performed:', action);
  });
}

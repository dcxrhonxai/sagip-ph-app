// src/services/pushService.ts
import { PushNotifications } from '@capacitor/push-notifications';
import { Toast } from 'sonner';

export const initPushNotifications = () => {
  // Request permission to use push notifications
  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') {
      // Register with APNS / FCM
      PushNotifications.register();
    } else {
      console.warn('Push notification permission not granted');
      Toast.error('Push notifications permission denied');
    }
  });

  // On successful registration
  PushNotifications.addListener('registration', token => {
    console.log('Push registration success, token:', token.value);
    // TODO: send token to your backend if needed
  });

  // On registration error
  PushNotifications.addListener('registrationError', error => {
    console.error('Push registration error:', error);
    Toast.error('Push registration failed');
  });

  // On push notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push received:', notification);
    Toast('Push received: ' + notification.title);
  });

  // On push notification action performed (tap, click)
  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    console.log('Push action performed:', action.notification);
    // Example: navigate to a screen based on data
    const data = action.notification.data;
    if (data?.screen) {
      window.location.href = data.screen; // or use React Router navigate()
    }
  });
};

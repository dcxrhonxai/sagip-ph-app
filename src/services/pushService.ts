import { PushNotifications } from '@capacitor/push-notifications';
import { Toast } from 'sonner'; // Optional, for notification toasts

export const initPushNotifications = async () => {
  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    // Register with APNS/FCM
    await PushNotifications.register();

    // On successful registration, get the device token
    PushNotifications.addListener('registration', (token) => {
      console.log('Device token:', token.value);
      // Send this token to your backend if needed
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Handle push notifications received while the app is open
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      Toast.success(notification.title || 'Notification received');
    });

    // Handle notification actions (tapping the notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed:', notification);
      // Optionally navigate in your app based on notification data
    });
  } catch (err) {
    console.error('Error initializing push notifications:', err);
  }
};

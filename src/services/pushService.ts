import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export const initPushNotifications = async () => {
  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      console.log('Device token:', token.value);
      // Send token to your backend if needed
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      toast.success(notification.title || 'Notification received');
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed:', notification);
      // Handle notification tap actions
    });

  } catch (err) {
    console.error('Error initializing push notifications:', err);
  }
};

import { Plugins } from '@capacitor/core';
const { PushPlugin } = Plugins;

export const initPushNotifications = () => {
  PushPlugin.addListener('pushNotificationReceived', (notification) => {
    console.log('Received push notification:', notification);
  });
};

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Plugins } from "@capacitor/core";
import { initPushNotifications } from './services/pushService';

initPushNotifications();


const { PushPlugin } = Plugins;

// Listen for push notifications
PushPlugin.addListener("pushNotificationReceived", (notification) => {
  console.log("Received push notification:", notification);
});

// Render your app
createRoot(document.getElementById("root")!).render(<App />);

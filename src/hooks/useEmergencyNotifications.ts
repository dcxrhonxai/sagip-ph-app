import { useCallback } from "react";
import axios from "axios";

interface NotificationPayload {
  title: string;
  message: string;
  recipients: string[]; // array of device tokens or emails
  data?: Record<string, any>; // optional additional data
}

export const useEmergencyNotifications = () => {
  /**
   * Sends a notification to the specified recipients
   * @param payload - Notification data
   */
  const sendNotifications = useCallback(async (payload: NotificationPayload) => {
    try {
      const response = await axios.post("/api/notifications/send", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        console.log("Notification sent successfully:", response.data);
        return true;
      } else {
        console.warn("Failed to send notification:", response.statusText);
        return false;
      }
    } catch (error: any) {
      console.error("Error sending notification:", error?.response?.data || error.message);
      return false;
    }
  }, []);

  return { sendNotifications };
};

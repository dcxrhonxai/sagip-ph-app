import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationContact {
  name: string;
  email?: string;
  phone: string;
}

export const useEmergencyNotifications = () => {
  const sendNotifications = async (
    alertId: string,
    contacts: NotificationContact[],
    emergencyType: string,
    situation: string,
    location: { lat: number; lng: number },
    evidenceFiles?: Array<{ url: string; type: string }>
  ) => {
    try {
      const emailContacts = contacts.filter(c => c.email);
      
      if (emailContacts.length === 0) {
        toast.info("No email contacts to notify");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "send-emergency-email",
        {
          body: {
            alertId,
            contacts: emailContacts,
            emergencyType,
            situation,
            location: {
              latitude: location.lat,
              longitude: location.lng,
            },
            evidenceFiles,
          },
        }
      );

      if (error) {
        console.error("Error sending notifications:", error);
        toast.error("Failed to send email notifications");
        return;
      }

      if (data?.emailSent > 0 || data?.smsSent > 0) {
        const messages = [];
        if (data.emailSent > 0) messages.push(`${data.emailSent} email(s)`);
        if (data.smsSent > 0) messages.push(`${data.smsSent} SMS`);
        toast.success(`Sent to ${messages.join(" and ")}`);
      }
      if (data?.emailFailed > 0 || data?.smsFailed > 0) {
        const messages = [];
        if (data.emailFailed > 0) messages.push(`${data.emailFailed} email(s)`);
        if (data.smsFailed > 0) messages.push(`${data.smsFailed} SMS`);
        toast.warning(`Failed to send ${messages.join(" and ")}`);
      }
    } catch (error) {
      console.error("Error in sendNotifications:", error);
      toast.error("Failed to send notifications");
    }
  };

  return { sendNotifications };
};

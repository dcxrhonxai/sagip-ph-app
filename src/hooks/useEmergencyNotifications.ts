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

      if (data?.sent > 0) {
        toast.success(`Email sent to ${data.sent} contact(s)`);
      }
      if (data?.failed > 0) {
        toast.warning(`Failed to send to ${data.failed} contact(s)`);
      }
    } catch (error) {
      console.error("Error in sendNotifications:", error);
      toast.error("Failed to send notifications");
    }
  };

  return { sendNotifications };
};

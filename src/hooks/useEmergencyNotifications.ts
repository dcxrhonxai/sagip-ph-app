// src/hooks/useEmergencyNotifications.ts
import { supabase } from '@/integrations/supabase/client';
import axios from 'axios';

interface NotificationOptions {
  alertId: string;
  mediaUrls?: string[];
}

export const useEmergencyNotifications = () => {
  // Example: fetch emergency providers from your database
  const fetchProviders = async () => {
    const { data, error } = await supabase.from('emergency_providers').select('*');
    if (error) console.error('Failed to fetch providers:', error);
    return data || [];
  };

  // Send notifications to providers
  const sendNotifications = async (alertId: string, mediaUrls: string[] = []) => {
    const providers = await fetchProviders();

    const notifications: Promise<any>[] = providers.map(async (provider) => {
      const { phone, email, webhook_url } = provider;

      // 1️⃣ SMS Notification (via Twilio or similar service)
      if (phone) {
        try {
          await axios.post('https://your-sms-api.com/send', {
            to: phone,
            message: `🚨 Emergency Alert! ID: ${alertId}. Check details in your dashboard.`,
          });
        } catch (err) {
          console.error('SMS notification failed:', err);
        }
      }

      // 2️⃣ Email Notification (via SendGrid, SES, etc.)
      if (email) {
        try {
          await axios.post('https://your-email-api.com/send', {
            to: email,
            subject: '🚨 Emergency Alert Received',
            body: `Alert ID: ${alertId}\nMedia: ${mediaUrls.join(', ')}`,
          });
        } catch (err) {
          console.error('Email notification failed:', err);
        }
      }

      // 3️⃣ Webhook Push
      if (webhook_url) {
        try {
          await axios.post(webhook_url, { alertId, mediaUrls });
        } catch (err) {
          console.error('Webhook push failed:', err);
        }
      }
    });

    // Wait for all notifications to finish
    await Promise.allSettled(notifications);
  };

  return { sendNotifications };
};

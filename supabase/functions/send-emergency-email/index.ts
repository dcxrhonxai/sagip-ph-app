import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SEMAPHORE_API_KEY = Deno.env.get("SEMAPHORE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmergencyEmailRequest {
  alertId: string;
  contacts: Array<{
    name: string;
    email?: string;
    phone: string;
  }>;
  emergencyType: string;
  situation: string;
  location: {
    latitude: number;
    longitude: number;
  };
  evidenceFiles?: Array<{
    url: string;
    type: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      alertId,
      contacts,
      emergencyType,
      situation,
      location,
      evidenceFiles,
    }: EmergencyEmailRequest = await req.json();

    console.log("Processing emergency notification for alert:", alertId);

    const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    const evidenceHtml = evidenceFiles && evidenceFiles.length > 0
      ? `
        <h3 style="color: #333; margin-top: 20px;">Evidence Files:</h3>
        <ul style="list-style: none; padding: 0;">
          ${evidenceFiles.map(file => `
            <li style="margin: 10px 0;">
              <a href="${file.url}" style="color: #e74c3c; text-decoration: none;">
                📎 View ${file.type}
              </a>
            </li>
          `).join('')}
        </ul>
      `
      : '';

    const emailPromises = contacts
      .filter(contact => contact.email)
      .map(async (contact) => {
        try {
          const emailHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .alert-header { background-color: #e74c3c; color: white; padding: 20px; border-radius: 5px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
                    .button { display: inline-block; background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                    .info-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="alert-header">
                      <h1 style="margin: 0;">🚨 EMERGENCY ALERT</h1>
                      <p style="margin: 10px 0 0 0; font-size: 18px;">${emergencyType.toUpperCase()}</p>
                    </div>
                    
                    <div class="content">
                      <h2 style="color: #e74c3c;">Dear ${contact.name},</h2>
                      <p style="font-size: 16px;">
                        Your emergency contact has triggered an emergency alert and needs assistance.
                      </p>
                      
                      <div class="info-box">
                        <strong>Emergency Type:</strong> ${emergencyType}<br>
                        <strong>Situation:</strong> ${situation}
                      </div>
                      
                      <h3 style="color: #333;">📍 Location:</h3>
                      <p>
                        Latitude: ${location.latitude}<br>
                        Longitude: ${location.longitude}
                      </p>
                      <a href="${googleMapsUrl}" class="button" target="_blank">
                        View Location on Map
                      </a>
                      
                      ${evidenceHtml}
                      
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p style="color: #666; font-size: 14px;">
                          <strong>What to do:</strong><br>
                          1. Try to contact them immediately<br>
                          2. If you cannot reach them, consider contacting emergency services<br>
                          3. Share this location information with authorities if needed
                        </p>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                      <p>This is an automated emergency notification. Please respond immediately.</p>
                    </div>
                  </div>
                </body>
              </html>
            `;

          // Use Resend API directly via fetch
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Emergency Alert <onboarding@resend.dev>",
              to: [contact.email!],
              subject: `🚨 EMERGENCY ALERT: ${emergencyType.toUpperCase()}`,
              html: emailHtml,
            }),
          });

          const emailData = await emailResponse.json();
          console.log(`Email sent to ${contact.name} (${contact.email}):`, emailData);

          // Record notification in database
          await supabase.from("alert_notifications").insert({
            alert_id: alertId,
            contact_name: contact.name,
            contact_phone: contact.phone,
            notified_at: new Date().toISOString(),
          });

          return { success: true, contact: contact.name };
        } catch (error: any) {
          console.error(`Failed to send email to ${contact.name}:`, error);
          return { success: false, contact: contact.name, error: error.message };
        }
      });

    const emailResults = await Promise.all(emailPromises);
    const emailSuccessful = emailResults.filter(r => r.success).length;
    const emailFailed = emailResults.filter(r => !r.success).length;

    console.log(`Email notifications complete: ${emailSuccessful} successful, ${emailFailed} failed`);

    // Send SMS notifications via Semaphore
    const smsContacts = contacts.filter(contact => contact.phone);
    const smsPromises = smsContacts.map(async (contact) => {
      try {
        const smsMessage = `🚨 EMERGENCY ALERT 🚨\n\n${emergencyType}\n\n${situation}\n\nLocation: https://www.google.com/maps?q=${location.latitude},${location.longitude}\n\nThis is an automated emergency notification.`;

        const response = await fetch("https://api.semaphore.co/api/v4/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            apikey: SEMAPHORE_API_KEY!,
            number: contact.phone,
            message: smsMessage,
            sendername: "EmergencyPH",
          }),
        });

        const smsData = await response.json();
        console.log(`SMS response for ${contact.name} (${contact.phone}):`, smsData);

        if (response.ok && Array.isArray(smsData) && smsData.length > 0 && smsData[0].message_id) {
          // Record SMS notification in database
          await supabase.from("alert_notifications").insert({
            alert_id: alertId,
            contact_name: contact.name,
            contact_phone: contact.phone,
            notified_at: new Date().toISOString(),
          });

          return { success: true, contact: contact.name };
        } else {
          return { success: false, contact: contact.name, error: smsData };
        }
      } catch (error: any) {
        console.error(`Failed to send SMS to ${contact.name}:`, error);
        return { success: false, contact: contact.name, error: error.message };
      }
    });

    const smsResults = await Promise.all(smsPromises);
    const smsSuccessful = smsResults.filter(r => r.success).length;
    const smsFailed = smsResults.filter(r => !r.success).length;

    console.log(`SMS notifications complete: ${smsSuccessful} successful, ${smsFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        emailSent: emailSuccessful,
        emailFailed: emailFailed,
        smsSent: smsSuccessful,
        smsFailed: smsFailed,
        results: {
          email: emailResults,
          sms: smsResults,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-emergency-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

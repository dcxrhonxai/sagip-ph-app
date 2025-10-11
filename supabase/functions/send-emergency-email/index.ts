import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SEMAPHORE_API_KEY = Deno.env.get("SEMAPHORE_API_KEY");

// ✅ Updated Supabase credentials
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "https://svjkmttqhlbeosqdrqyb.supabase.co";
const SUPABASE_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2amttdHRxaGxiZW9zcWRycXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzMxNDAsImV4cCI6MjA3NDA0OTE0MH0.P6fFz7-2knP0BOM6GsEqBbQlFewKosaG4MGFrAllp5s";

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      ? `<h3 style="color: #333; margin-top: 20px;">Evidence Files:</h3>
         <ul style="list-style: none; padding: 0;">
           ${evidenceFiles.map(file => `
             <li style="margin: 10px 0;">
               <a href="${file.url}" style="color: #e74c3c; text-decoration: none;">
                 📎 View ${file.type}
               </a>
             </li>
           `).join('')}
         </ul>`
      : '';

    // Email notifications
    const emailPromises = contacts
      .filter(contact => contact.email)
      .map(async (contact) => {
        try {
          const emailHtml = `<html> ... your email template ... </html>`; // Keep your existing email template here

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

    // SMS notifications via Semaphore
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

        if (response.ok) {
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

    return new Response(
      JSON.stringify({
        success: true,
        emailResults,
        smsResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-emergency-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

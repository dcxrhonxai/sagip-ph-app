// ✅ Load environment variables from .env file
import "https://deno.land/x/dotenv/load.ts";

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SEMAPHORE_API_KEY = Deno.env.get("SEMAPHORE_API_KEY");
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
    const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

    const {
      alertId,
      contacts,
      emergencyType,
      situation,
      location,
      evidenceFiles,
    }: EmergencyEmailRequest = await req.json();

    const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    const evidenceHtml = evidenceFiles && evidenceFiles.length > 0
      ? `<h3>Evidence Files:</h3><ul>${evidenceFiles.map(file => `<li><a href="${file.url}">📎 View ${file.type}</a></li>`).join('')}</ul>`
      : '';

    // Send emails via Resend
    const emailPromises = contacts
      .filter(contact => contact.email)
      .map(async (contact) => {
        try {
          const emailHtml = `
            <div>
              <h1>🚨 EMERGENCY ALERT: ${emergencyType}</h1>
              <p>Dear ${contact.name},</p>
              <p>Location: <a href="${googleMapsUrl}">View on Map</a></p>
              ${evidenceHtml}
            </div>
          `;

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

          await supabase.from("alert_notifications").insert({
            alert_id: alertId,
            contact_name: contact.name,
            contact_phone: contact.phone,
            notified_at: new Date().toISOString(),
          });

          return { success: true, contact: contact.name };
        } catch (error: any) {
          return { success: false, contact: contact.name, error: error.message };
        }
      });

    const emailResults = await Promise.all(emailPromises);

    // Send SMS via Semaphore
    const smsContacts = contacts.filter(contact => contact.phone);
    const smsPromises = smsContacts.map(async (contact) => {
      try {
        const smsMessage = `🚨 EMERGENCY ALERT 🚨\n${emergencyType}\n${situation}\nLocation: ${googleMapsUrl}`;

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

        if (response.ok && Array.isArray(smsData) && smsData.length > 0 && smsData[0].message_id) {
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

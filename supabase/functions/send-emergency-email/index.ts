// send-emergency-email/index.ts

// ✅ Load environment variables from .env
import "https://deno.land/x/dotenv/load.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Read environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SEMAPHORE_API_KEY = Deno.env.get("SEMAPHORE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!RESEND_API_KEY || !SEMAPHORE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Set them in .env or system environment.");
  Deno.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyEmailRequest {
  alertId: string;
  contacts: Array<{ name: string; email?: string; phone: string }>;
  emergencyType: string;
  situation: string;
  location: { latitude: number; longitude: number };
  evidenceFiles?: Array<{ url: string; type: string }>;
}

// The main handler for Supabase Functions
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { alertId, contacts, emergencyType, situation, location, evidenceFiles }: EmergencyEmailRequest = await req.json();

    const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    // Format evidence HTML if any
    const evidenceHtml = evidenceFiles?.length
      ? `<h3>Evidence Files:</h3><ul>${evidenceFiles.map(file => `<li><a href="${file.url}">${file.type}</a></li>`).join('')}</ul>`
      : '';

    // Send Emails via Resend
    const emailPromises = contacts.filter(c => c.email).map(async c => {
      const emailHtml = `
        <p>🚨 Emergency Alert: ${emergencyType}</p>
        <p><strong>Situation:</strong> ${situation}</p>
        <p><strong>Location:</strong> <a href="${googleMapsUrl}">View on Map</a></p>
        ${evidenceHtml}
      `;

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Emergency Alert <onboarding@resend.dev>",
          to: [c.email!],
          subject: `🚨 Emergency Alert: ${emergencyType}`,
          html: emailHtml,
        }),
      });

      // Record notification in Supabase
      await supabase.from("alert_notifications").insert({
        alert_id: alertId,
        contact_name: c.name,
        contact_phone: c.phone,
        notified_at: new Date().toISOString(),
      });

      return { contact: c.name, status: resp.ok };
    });

    // Send SMS via Semaphore
    const smsPromises = contacts.filter(c => c.phone).map(async c => {
      const smsBody = `🚨 Emergency Alert: ${emergencyType}\n${situation}\nLocation: ${googleMapsUrl}`;

      const resp = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          apikey: SEMAPHORE_API_KEY!,
          number: c.phone,
          message: smsBody,
          sendername: "EmergencyPH",
        }),
      });

      return { contact: c.name, status: resp.ok };
    });

    const emailResults = await Promise.all(emailPromises);
    const smsResults = await Promise.all(smsPromises);

    return new Response(
      JSON.stringify({ emailResults, smsResults }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (err: any) {
    console.error("Error processing request:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

// ✅ For Supabase Functions, just export the handler
export default handler;

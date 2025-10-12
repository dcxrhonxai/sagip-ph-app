// Load environment variables (local or AppFlow)
import "https://deno.land/x/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Read environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || Deno.env.get("APPFLOW_RESEND_API_KEY");
const SEMAPHORE_API_KEY = Deno.env.get("SEMAPHORE_API_KEY") || Deno.env.get("APPFLOW_SEMAPHORE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("APPFLOW_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("APPFLOW_SUPABASE_SERVICE_ROLE_KEY");

if (!RESEND_API_KEY || !SEMAPHORE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Set them in .env or AppFlow secrets.");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { alertId, contacts, emergencyType, situation, location, evidenceFiles }: EmergencyEmailRequest = await req.json();
    const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    const evidenceHtml = evidenceFiles?.length
      ? `<h3 style="color: #333; margin-top: 20px;">Evidence Files:</h3>
         <ul style="list-style: none; padding: 0;">
         ${evidenceFiles.map(file => `<li style="margin: 10px 0;">
           <a href="${file.url}" style="color: #e74c3c; text-decoration: none;">
           📎 View ${file.type}</a></li>`).join('')}
         </ul>`
      : '';

    // Email via Resend
    const emailPromises = contacts.filter(c => c.email).map(async c => {
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
                <h1>🚨 EMERGENCY ALERT</h1>
                <p style="font-size: 18px;">${emergencyType.toUpperCase()}</p>
              </div>
              <div class="content">
                <h2 style="color: #e74c3c;">Dear ${c.name},</h2>
                <p>Your emergency contact has triggered an alert and needs assistance.</p>
                <div class="info-box">
                  <strong>Emergency Type:</strong> ${emergencyType}<br>
                  <strong>Situation:</strong> ${situation}
                </div>
                <h3>📍 Location:</h3>
                <p>Latitude: ${location.latitude}<br>Longitude: ${location.longitude}</p>
                <a href="${googleMapsUrl}" class="button" target="_blank">View Location on Map</a>
                ${evidenceHtml}
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="color: #666; font-size: 14px;">
                    <strong>Instructions:</strong><br>
                    1. Try to contact immediately<br>
                    2. If unreachable, contact emergency services<br>
                    3. Share location info with authorities if needed
                  </p>
                </div>
              </div>
              <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                <p>Automated emergency notification.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Emergency Alert <onboarding@resend.dev>",
          to: [c.email!],
          subject: `🚨 EMERGENCY ALERT: ${emergencyType.toUpperCase()}`,
          html: emailHtml,
        }),
      });

      await supabase.from("alert_notifications").insert({
        alert_id: alertId,
        contact_name: c.name,
        contact_phone: c.phone,
        notified_at: new Date().toISOString(),
      });

      return { contact: c.name, status: resp.ok };
    });

    // SMS via Semaphore
    const smsPromises = contacts.filter(c => c.phone).map(async c => {
      const smsBody = `🚨 ${emergencyType}\n${situation}\nLocation: ${googleMapsUrl}`;
      const resp = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ apikey: SEMAPHORE_API_KEY!, number: c.phone, message: smsBody, sendername: "EmergencyPH" }),
      });

      await supabase.from("alert_notifications").insert({
        alert_id: alertId,
        contact_name: c.name,
        contact_phone: c.phone,
        notified_at: new Date().toISOString(),
      });

      return { contact: c.name, status: resp.ok };
    });

    const emailResults = await Promise.all(emailPromises);
    const smsResults = await Promise.all(smsPromises);

    return new Response(JSON.stringify({ emailResults, smsResults }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (err: any) {
    console.error("Error processing request:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

console.log("🚀 Emergency Email function running on http://localhost:8000");
serve(handler, { port: 8000 });

// Load environment variables (local or AppFlow)
import "https://deno.land/x/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Support AppFlow environment variables if .env not available
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

    // Email via Resend
    const emailPromises = contacts.filter(c => c.email).map(async c => {
      const emailHtml = `<p>🚨 ${emergencyType}</p>`; // Replace with full HTML email if needed
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Emergency Alert <onboarding@resend.dev>",
          to: [c.email!],
          subject: `🚨 Emergency Alert: ${emergencyType}`,
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

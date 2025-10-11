// Load environment variables from .env
import "https://deno.land/x/dotenv/load.ts";

// Import Deno's HTTP server
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Import Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Access API keys from environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SEMAPHORE_API_KEY = Deno.env.get("SEMAPHORE_API_KEY");
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Your HTTP request handler goes here
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Your request processing code here
    const { alertId, contacts, emergencyType, situation, location, evidenceFiles } =
      await req.json();

    // ...rest of your email + SMS logic...

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

// Start the HTTP server
serve(handler);

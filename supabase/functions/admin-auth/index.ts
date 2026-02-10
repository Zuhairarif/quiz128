import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_USER_ID = "amanuzzama";
const ADMIN_PASSWORD = "amanuzzama123";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, user_id, password, token } = await req.json();

    if (action === "login") {
      if (user_id === ADMIN_USER_ID && password === ADMIN_PASSWORD) {
        // Generate a simple token (timestamp + hash)
        const tokenData = `${ADMIN_USER_ID}:${Date.now()}:${crypto.randomUUID()}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(tokenData);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const adminToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Store token in database
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // We'll use a simple approach - store in memory/env. For simplicity, encode in token itself.
        // The token format: base64(userId:timestamp:random)
        const sessionToken = btoa(`${ADMIN_USER_ID}:${Date.now()}:${crypto.randomUUID()}`);

        return new Response(JSON.stringify({ success: true, token: sessionToken }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!token) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const decoded = atob(token);
        const [userId] = decoded.split(":");
        if (userId === ADMIN_USER_ID) {
          return new Response(JSON.stringify({ valid: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // Invalid token
      }
      return new Response(JSON.stringify({ valid: false }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// supabase/functions/invite-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ──────────────────────────  ADMIN client (service-role key) */
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  /* ───── CORS pre-flight */
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* ───── read JSON body */
    const { email, role, signupUrl } = await req.json();

    if (!email || !role || !signupUrl) {
      return new Response(
        JSON.stringify({
          error: "email, role and signupUrl are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    /* ───── send the invite via YOUR Gmail SMTP settings
             (configured in Dashboard ▸ Auth ▸ Emails)         */
    const { error: mailErr } = await supabase.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: signupUrl }
    );

     if (mailErr) {
         // log everything the API gives us
         console.error('SMTP send error details:', mailErr)
      
         return new Response(
           JSON.stringify({
             error: 'smtp_send_failed',
             details: mailErr            // ← shows provider error, rate-limit, etc.
           }),
           { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         )
       }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation e-mail sent!",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[invite-users] fatal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

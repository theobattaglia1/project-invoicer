// supabase/functions/invite-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ───────────── Supabase service client (server-side secrets) */
const supabase = createClient(
  // ①  Supabase URL (kept in the project automatically)
  Deno.env.get("SUPABASE_URL")!,
  // ②  Service-role key – Settings ▸ API ▸ "Service key"
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

/* ───────────── CORS helper  */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  /* Pre-flight */
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* 1. Parse & validate payload from the front-end */
    const { email, role, signupUrl } = await req.json();
    if (!email || !role || !signupUrl) {
      return new Response(
        JSON.stringify({ error: "email, role & signupUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* 2. Let Supabase Auth **re-send** (or send) the invite */
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: signupUrl,
    });

    /*  ── Success case ────────────────────────────────── */
    if (!error) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /*  ── User exists → send “reset-password / magic link” instead ── */
    if (error?.status === 400 && error.message.includes("already registered")) {
      const { error: pwErr } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: signupUrl },
      });
      if (!pwErr) {
        return new Response(
          JSON.stringify({ success: true, note: "sent recovery link" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // fall through to generic 500 if recovery also failed
    }

    /*  ── Everything else is a hard failure ───────────── */
    console.error("[invite-users] admin.invite error:", error);
    throw new Error(error.message);
  } catch (err) {
    console.error("[invite-users] fatal:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

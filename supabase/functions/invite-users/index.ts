// supabase/functions/invite-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body),
               { status, headers: { ...cors, "Content-Type":"application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    /* ─── body ─────────────────────────────────────────────── */
    const { email, role, signupUrl } = await req.json();
    if (!email || !role || !signupUrl)
      return json({ error:"email, role and signupUrl are required" }, 400);

    /* ─── send via Supabase-Auth SMTP (same template you saw)─ */
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await sb.auth.admin.inviteUserByEmail(email, {
      redirectTo: signupUrl,
    });

    /* ─── ignore “already exists” ───────────────────────────── */
    if (error && error.code !== "email_exists") throw error;

    /* either it was sent, or the user already had the e-mail —
       in both cases we’re good.  */
    return json({ success:true, signupUrl });
  } catch (err) {
    console.error("[invite-users] fatal:", err);
    return json({ error:"smtp_send_failed", details:err }, 500);
  }
});

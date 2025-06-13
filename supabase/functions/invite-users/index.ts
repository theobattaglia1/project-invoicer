// supabase/functions/invite-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ------------------------------------------------------------- util */
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/* ----------------------------------------------------------- handler */
serve(async (req) => {
  /* ── CORS pre-flight ───────────────────────────────────────────── */
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    /* ── payload ─────────────────────────────────────────────────── */
    const { email, role, signupUrl } = await req.json();
    if (!email || !role || !signupUrl)
      return json({ error: "email, role and signupUrl are required" }, 400);

    /* ── Supabase admin client ───────────────────────────────────── */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    /* ── 1 · try to send a normal ‘invite’ e-mail ───────────────── */
    const { data: inviteMail, error: inviteErr } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: signupUrl,
      });

    /* ── 2 · if user already exists → send password-reset instead ─ */
    if (inviteErr && inviteErr.code === "email_exists") {
      const { error: pwErr } = await supabase.auth.admin
        .generateLink({
          type: "recovery", // ← password-reset template
          email,
          options: { redirectTo: signupUrl },
        })
        // generateLink() sends the e-mail automatically
        ;

      if (pwErr) throw pwErr; // only fail if the fallback also fails

      console.log("[invite-users] user existed – sent recovery mail instead");
      return json({ success: true, sent: "recovery" });
    }

    /* ── any other SMTP / Auth error ─────────────────────────────── */
    if (inviteErr) throw inviteErr;

    /* ── success ────────────────────────────────────────────────── */
    return json({ success: true, sent: "invite" });
  } catch (err) {
    console.error("[invite-users] Fatal:", err);
    return json({ error: "smtp_send_failed", details: err }, 500);
  }
});

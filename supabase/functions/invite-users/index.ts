import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  /* CORS pre-flight */
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email, role, signupUrl } = await req.json();
    if (!email || !role || !signupUrl)
      return json({ error: "email, role, signupUrl required" }, 400);

    /* ─── send through the Auth SMTP server directly ────────────── */
    const { error } = await sb.auth.api
      .sendEmail({
        to: email,
        subject: "You’re invited to All My Friends Accounting",
        html: buildHtml(email, role, signupUrl),
      });

    if (error) return json({ error }, 500);

    return json({ success: true });
  } catch (e) {
    console.error("[invite-users]", e);
    return json({ error: e.message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function buildHtml(email: string, role: string, link: string) {
  const nice = role[0].toUpperCase() + role.slice(1);
  return `<!doctype html><html><body>
  <h2>You’re invited to All My Friends Accounting</h2>
  <p><b>Email:</b> ${email}<br><b>Role:</b> ${nice}</p>
  <p><a href="${link}">Accept invitation</a> (expires in 7 days)</p>
</body></html>`;
}

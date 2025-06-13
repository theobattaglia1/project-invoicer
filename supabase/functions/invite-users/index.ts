// supabase/functions/invite-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ─────────────────────────── bootstrap ─────────────────────────── */
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/* ───────────────────────────── handler ──────────────────────────── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { email, role, signupUrl } = await req.json();

    if (!email || !role || !signupUrl) {
      return json({ error: "email, role and signupUrl are required" }, 400);
    }

    /* ── does a user row with that e-mail already exist? ─────────── */
    const { data: existing } = await supabase.auth.admin.getUserByEmail(email);

    let actionLink: string;

    if (!existing) {
      /* first time – let Auth send the real invite */
      const { data, error } =
        await supabase.auth.admin.inviteUserByEmail(email, {
          data: { role },
          redirectTo: signupUrl,
        });

      if (error) throw error;
      actionLink = data?.action_link!; // Auth already mailed it
    } else {
      /* second+ time – just create a fresh signup link */
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        options: { redirectTo: signupUrl },
      });
      if (error) throw error;
      actionLink = data?.action_link!;
    }

    /* return 😉 – front-end will copy-to-clipboard or toast it */
    return json({ success: true, signupUrl: actionLink });
  } catch (err) {
    console.error("[invite-users] error:", err);
    return json({ error: err.message ?? err }, 500);
  }
});

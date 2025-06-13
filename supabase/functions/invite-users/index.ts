import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/*
  ▸  Minimal edge‑function that ONLY sends the email.
  ▸  No DB look‑ups, no Supabase auth – the frontend already
    gave us everything we need in the POST body.
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  /* ───────────────────────────────────────── CORS pre‑flight */
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* ─────────────────────────────── parse & validate payload */
    const { email, role, signupUrl } = await req.json();

    if (!email || !role || !signupUrl) {
      return new Response(
        JSON.stringify({ error: "email, role and signupUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    /* ─────────────────────────────────────── build email HTML */
    const rolePretty = role.charAt(0).toUpperCase() + role.slice(1);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> 
  <title>You\'re Invited – All My Friends Accounting</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f4;margin:0;padding:0;line-height:1.6;color:#333}
    .container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1)}
    .header{background:linear-gradient(135deg,#1db954 0%,#169c46 100%);color:#fff;padding:40px 30px;text-align:center}
    .header h1{margin:0;font-size:28px;font-weight:700}
    .content{padding:40px 30px}
    h2{color:#1db954;margin-top:0}
    .button{display:inline-block;background:#1db954;color:#fff;padding:14px 32px;text-decoration:none;border-radius:24px;font-weight:600;margin:20px 0}
    .info-box{background:#f8f9fa;border-left:4px solid #1db954;padding:16px;margin:20px 0;border-radius:4px}
    .info-box p{margin:8px 0}
    .footer{background:#f8f9fa;padding:30px;text-align:center;font-size:14px;color:#666}
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>All My Friends Accounting</h1></div>
    <div class="content">
      <h2>You\'re Invited!</h2>
      <p>Hello,</p>
      <p>You\'ve been invited to join All My Friends Accounting. Click the button below to create your account and set up your password.</p>
      <div class="info-box">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${rolePretty}</p>
      </div>
      <p style="text-align:center"><a class="button" href="${signupUrl}">Create Your Account</a></p>
      <p><strong>This invitation will expire in 7&nbsp;days.</strong></p>
    </div>
    <div class="footer">
      <p>This invitation was sent to ${email}. If you didn\'t expect it, you can safely ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} All My Friends Inc.</p>
    </div>
  </div>
</body>
</html>`;

    /* ────────────────────────────────────────── send via Resend */
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      // Dev / fallback – just echo the link so the caller can copy‑paste
      return new Response(
        JSON.stringify({ success: true, signupUrl, message: "Email service not configured – share link manually." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "All My Friends Accounting <noreply@allmyfriendsinc.com>",
        to: [email],
        subject: "You're Invited to All My Friends Accounting",
        html,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error("[invite-users] Resend error:", text);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[invite-users] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

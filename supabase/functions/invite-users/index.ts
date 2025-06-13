import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, role, signupUrl } = await req.json();
    
    if (!email || !role || !signupUrl) {
      return new Response(
        JSON.stringify({ error: "email, role & signupUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[invite-users] Sending invite to ${email}`);

    // Try to send the invite email
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: signupUrl,
        shouldCreateUser: false,
        data: { invite_link: signupUrl }
      }
    });

    if (error) {
      console.error(`[invite-users] Failed to send email:`, error);
      // Return the signup URL so it can be shared manually
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Email service unavailable - share link manually",
          signupUrl: signupUrl
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[invite-users] Email sent successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation email sent"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[invite-users] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
// supabase/functions/invite-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    console.log(`[invite-users] Processing invite for ${email}`);

    // Try to invite the user
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: signupUrl,
    });

    // Success case
    if (!error) {
      console.log(`[invite-users] Successfully sent invite to ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Invitation email sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the actual error for debugging
    console.log(`[invite-users] Invite error:`, error);

    // Check if user already exists - check the actual error message we're getting
    const errorMessage = error.message?.toLowerCase() || '';
    if (errorMessage.includes("already been registered") || 
        errorMessage.includes("already registered") ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("user already exists")) {
      
      console.log(`[invite-users] User ${email} already exists, sending magic link instead`);
      
      // For existing users, just send a magic link
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: signupUrl,
        }
      });

      if (magicLinkError) {
        console.error(`[invite-users] Failed to send magic link:`, magicLinkError);
        throw magicLinkError;
      }

      console.log(`[invite-users] Magic link sent successfully`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Login link sent to existing user",
          isExistingUser: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Any other error - return it
    throw error;

  } catch (err) {
    console.error("[invite-users] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
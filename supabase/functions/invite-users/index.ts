import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check CSRF token for non-GET requests
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken) {
      return new Response(
        JSON.stringify({ error: "CSRF token required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role, signupUrl } = await req.json();
    
    if (!email || !role || !signupUrl) {
      return new Response(
        JSON.stringify({ error: "email, role & signupUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[invite-users] Processing invite for ${email}`);

    // First, try the proper invite method
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: signupUrl,
      data: {
        invite_url: signupUrl,
        role: role
      }
    });

    if (!error) {
      console.log(`[invite-users] Successfully sent invite to ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Invitation email sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the error for debugging
    console.log(`[invite-users] Invite error:`, error);

    // If user already exists, we can't use inviteUserByEmail
    // Instead, send them a magic link that redirects to the signup URL
    if (error.message?.toLowerCase().includes("already") || 
        error.message?.toLowerCase().includes("exists")) {
      
      console.log(`[invite-users] User already has an auth account, sending magic link instead`);
      
      // Send a magic link that will redirect to the signup URL
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: signupUrl,
          shouldCreateUser: false,
          data: {
            invite_url: signupUrl,
            role: role
          }
        }
      });

      if (magicLinkError) {
        console.error(`[invite-users] Failed to send magic link:`, magicLinkError);
        // Return the URL for manual sharing
        return new Response(
          JSON.stringify({ 
            success: false,
            message: "Email service unavailable - share link manually",
            signupUrl: signupUrl
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[invite-users] Magic link sent successfully`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitation email sent to existing user"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Any other error
    throw error;

  } catch (err) {
    console.error("[invite-users] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
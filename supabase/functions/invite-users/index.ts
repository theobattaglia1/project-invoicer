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

    // Success case - new user
    if (!error) {
      console.log(`[invite-users] Successfully sent invite to ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Invitation email sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the actual error for debugging
    console.log(`[invite-users] Invite error:`, error);

    // Check if user already exists
    const errorMessage = error.message?.toLowerCase() || '';
    if (errorMessage.includes("already been registered") || 
        errorMessage.includes("already registered") ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("user already exists")) {
      
      console.log(`[invite-users] User ${email} already exists, looking up existing invite`);
      
      // Look up the existing pending invite for this email
      const { data: existingInvite, error: inviteError } = await supabase
        .from('pending_invites')
        .select('invite_token')
        .eq('email', email)
        .eq('accepted', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (inviteError || !existingInvite) {
        console.error(`[invite-users] No valid pending invite found for ${email}`);
        throw new Error("No valid pending invitation found for this email");
      }

      // Build the signup URL with the existing token
      const url = new URL(signupUrl);
      url.searchParams.set('token', existingInvite.invite_token);
      const signupUrlWithToken = url.toString();

      console.log(`[invite-users] Found existing invite token, sending email with signup link`);
      
      // Send a custom email with the signup link
      // For now, we'll use the magic link system but redirect to our signup page
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: signupUrlWithToken,
          shouldCreateUser: false, // Don't create another user
        }
      });

      if (magicLinkError) {
        console.error(`[invite-users] Failed to send magic link:`, magicLinkError);
        // If magic link fails, return the URL for manual sharing
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email service unavailable - share this link manually",
            signupUrl: signupUrlWithToken,
            isExistingUser: true
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[invite-users] Email sent successfully`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Signup link sent to existing user",
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
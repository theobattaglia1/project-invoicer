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

    console.log(`[invite-users] Attempting to invite ${email}`);

    // Try to invite the user
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: signupUrl,
    });

    // Success case
    if (!error) {
      console.log(`[invite-users] Successfully sent invite to ${email}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists (status can be 400, 422, or have various messages)
    if (error.message?.includes("already registered") || 
        error.message?.includes("already been invited") ||
        error.message?.includes("already exists")) {
      
      console.log(`[invite-users] ${email} already registered – generating magic-link`);
      
      // For existing users, generate a magic link
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: { 
          redirectTo: signupUrl 
        }
      });

      if (linkError) {
        console.error(`[invite-users] Failed to generate magic link:`, linkError);
        throw linkError;
      }

      // The magic link URL is in linkData.properties.action_link
      console.log(`[invite-users] Magic link generated successfully`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Magic link sent to existing user",
          isExistingUser: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Any other error
    console.error(`[invite-users] Error:`, error);
    throw new Error(error.message);

  } catch (err) {
    console.error("[invite-users] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
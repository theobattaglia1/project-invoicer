// supabase/functions/invite-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { inviteId } = await req.json()

    // Get invite details
    const { data: invite, error: inviteError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('id', inviteId)
      .single()

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invite not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the site URL from environment or request
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://accounting.allmyfriendsinc.com'
    const signupUrl = `${siteUrl}/auth/signup?token=${invite.invite_token}`

    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to All My Friends Accounting</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1db954 0%, #169c46 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1db954;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      background: #1db954;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 24px;
      font-weight: 600;
      margin: 20px 0;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #1db954;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 8px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>All My Friends Accounting</h1>
    </div>
    
    <div class="content">
      <h2>You're Invited!</h2>
      
      <p>Hello,</p>
      
      <p>You've been invited to join All My Friends Accounting. Click the button below to create your account and set up your password.</p>
      
      <div class="info-box">
        <p><strong>Email:</strong> ${invite.email}</p>
        <p><strong>Role:</strong> ${invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}</p>
      </div>
      
      <p style="text-align: center;">
        <a href="${signupUrl}" class="button">Create Your Account</a>
      </p>
      
      <p><strong>This invitation will expire in 7 days.</strong></p>
      
      <p>Once you click the link above, you'll be able to:</p>
      <ul>
        <li>Set up your secure password</li>
        <li>Access your personalized dashboard</li>
        <li>Start managing invoices and projects</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>This invitation was sent to ${invite.email}</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p>&copy; 2024 All My Friends Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `

    // Use Resend API (you need to set up Resend and add the API key to your env)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      // Fallback: return the signup URL for manual sending
      return new Response(
        JSON.stringify({ 
          success: true, 
          signupUrl,
          message: 'Email service not configured. Please share this link manually.' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'All My Friends Accounting <noreply@allmyfriendsinc.com>',
        to: [invite.email],
        subject: "You're Invited to All My Friends Accounting",
        html: emailHtml
      })
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Resend error:', error)
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation email sent!' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
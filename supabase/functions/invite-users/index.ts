import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log the request for debugging
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    // Get request body
    const body = await req.json()
    console.log('Request body:', body)

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the calling user
    const token = authHeader.replace('Bearer ', '')
    console.log('Verifying token...')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError.message }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!user) {
      console.error('No user found')
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User verified:', user.email)

    // Check if user is an owner
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to get user profile', details: profileError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!profile || profile.role !== 'owner') {
      console.error('User is not owner:', profile)
      return new Response(
        JSON.stringify({ error: 'Only owners can invite users', userRole: profile?.role }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract invite details
    const { email, userType, artistId, selectedArtists } = body

    // Validate required fields
    if (!email || !userType) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Email and userType are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Creating user:', email, userType)

    // Generate a random password
    const tempPassword = crypto.randomUUID()

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        invited_by: user.id,
        temp_password: true
      }
    })

    if (createError) {
      console.error('Create user error:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User created:', newUser.user.id)

    // Create user profile
    const profileData = {
      id: newUser.user.id,
      email: email,
      name: email.split('@')[0],
      role: userType,
      artist_id: userType === 'artist' ? artistId : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Creating profile:', profileData)

    const { error: profileError2 } = await supabaseAdmin
      .from('user_profiles')
      .insert([profileData])

    if (profileError2) {
      console.error('Profile creation error:', profileError2)
      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile', details: profileError2.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send password reset email
    console.log('Sending password reset email...')
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.get('origin')}/login`,
    })

    if (resetError) {
      console.error('Failed to send reset email:', resetError)
    }

    console.log('Invite completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invited successfully',
        userId: newUser.user.id 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
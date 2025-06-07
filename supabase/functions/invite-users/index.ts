import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header to verify the calling user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is an owner
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'Only owners can invite users' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get request body
    const { email, userType, artistId, selectedArtists } = await req.json()

    // Validate required fields
    if (!email || !userType) {
      return new Response(
        JSON.stringify({ error: 'Email and userType are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate a random password for the invite
    const tempPassword = crypto.randomUUID()

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        invited_by: user.id,
        temp_password: true
      }
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create user profile
    const profileData = {
      id: newUser.user.id,
      email: email,
      name: email.split('@')[0], // Default name from email
      role: userType,
      artist_id: userType === 'artist' ? artistId : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([profileData])

    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If user is an editor with specific artist permissions, add them
    if (userType === 'editor' && selectedArtists && selectedArtists.length > 0) {
      const permissions = selectedArtists.map((artistId: string) => ({
        user_id: newUser.user.id,
        artist_id: artistId,
        permission: 'edit',
        created_at: new Date().toISOString()
      }))

      await supabaseAdmin
        .from('user_artist_permissions')
        .insert(permissions)
    }

    // Store invite details
    await supabaseAdmin
      .from('pending_invites')
      .insert({
        email: email,
        role: userType,
        artist_id: artistId,
        selected_artists: selectedArtists || [],
        invited_by: user.id,
        accepted: false,
        created_at: new Date().toISOString()
      })

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.get('origin')}/login`,
    })

    if (resetError) {
      console.error('Failed to send reset email:', resetError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invited successfully. They will receive an email to set their password.',
        userId: newUser.user.id 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in invite-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
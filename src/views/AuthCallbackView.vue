<template>
  <div class="auth-callback">
    <div class="spinner"></div>
    <p>Authenticating...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  console.log('AuthCallback mounted, URL:', window.location.href)
  try {
    // Check if we have an access_token in the hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')
    if (accessToken) {
      console.log('Found access token in hash, type:', type)
      // Set the session using the tokens from the hash
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      })
      if (error) {
        console.error('Error setting session:', error)
        router.push('/login?error=auth_failed')
        return
      }
      console.log('Session set successfully')
      // Check if this is a password recovery
      if (type === 'recovery') {
        console.log('Password recovery flow - redirecting to reset password')
        router.push('/reset-password')
        return
      }
    } else if (route.query.code) {
      // Handle OAuth code exchange (for other auth methods)
      console.log('Found code in query:', route.query.code)
      const { error } = await supabase.auth.exchangeCodeForSession(route.query.code)
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/login?error=auth_failed')
        return
      }
    } else {
      console.error('No auth credentials found in URL')
      router.push('/login?error=no_credentials')
      return
    }
    // Initialize auth store to get user profile
    await authStore.initialize()
    console.log('Auth store initialized, profile:', authStore.profile)
    // Check if this is a first-time user
    if (!authStore.profile) {
      console.log('No profile found, creating new profile')
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if this user was invited (has metadata)
        const metadata = user.user_metadata
        console.log('User metadata:', metadata)
        // Create profile based on invitation data
        const profileData = {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0],
          role: metadata.role || 'viewer',
          artist_id: metadata.artist_id || null,
          setup_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('Creating profile:', profileData)
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData])
        if (profileError) {
          console.error('Failed to create profile:', profileError)
          // Profile might already exist, try to fetch it
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (existingProfile) {
            authStore.profile = existingProfile
          }
        } else {
          authStore.profile = profileData
        }
        // Add permissions if this is an editor with selected artists
        if (metadata.selected_artists && metadata.selected_artists.length > 0) {
          const permissions = metadata.selected_artists.map(artistId => ({
            user_id: user.id,
            artist_id: artistId,
            permission: 'edit'
          }))
          await supabase
            .from('user_artist_permissions')
            .insert(permissions)
        }
        // Mark invite as accepted if applicable
        if (metadata.invite_token) {
          const { error: inviteError } = await supabase
            .from('pending_invites')
            .update({ accepted: true })
            .eq('invite_token', metadata.invite_token)
          if (inviteError) {
            console.error('Failed to mark invite as accepted:', inviteError)
          }
        }
      }
    }
    // Determine where to redirect
    if (authStore.profile && (!authStore.profile.setup_complete || !authStore.profile.name || authStore.profile.name === authStore.profile.email.split('@')[0])) {
      console.log('Redirecting to setup')
      router.push('/setup')
    } else if (authStore.isArtist && authStore.profile.artist_id) {
      console.log('Redirecting to artist page')
      router.push(`/artist/${authStore.profile.artist_id}/overview`)
    } else {
      console.log('Redirecting to dashboard')
      router.push('/')
    }
  } catch (err) {
    console.error('Callback error:', err)
    router.push('/login?error=callback_failed')
  }
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000;
  color: white;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #1db954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

// Create a new file: src/views/AuthCallbackView.vue
// This handles the magic link callback

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
  try {
    // Handle the callback from magic link
    const { error } = await supabase.auth.exchangeCodeForSession(route.query.code)
    
    if (error) {
      console.error('Auth callback error:', error)
      router.push('/login?error=auth_failed')
      return
    }
    
    // Initialize auth store to get user profile
    await authStore.initialize()
    
    // Check if this is a first-time user
    if (authStore.profile && (!authStore.profile.name || authStore.profile.name === authStore.profile.email.split('@')[0])) {
      // First time user - send to setup
      router.push('/setup')
    } else if (authStore.isArtist && authStore.profile.artist_id) {
      // Artist - send to their page
      router.push(`/artist/${authStore.profile.artist_id}/overview`)
    } else {
      // Team member - send to dashboard
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

// Add this route to your router:
{
  path: '/auth/callback',
  name: 'AuthCallback',
  component: AuthCallbackView,
  meta: { requiresAuth: false }
}
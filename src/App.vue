<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/lib/supabase'

const router = useRouter()
let authListener = null

onMounted(() => {
  // Listen for auth state changes
  authListener = auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      // User signed in
      localStorage.setItem('isAuthenticated', 'true')
      if (session?.user) {
        localStorage.setItem('userId', session.user.id)
        localStorage.setItem('userEmail', session.user.email)
      }
    } else if (event === 'SIGNED_OUT') {
      // User signed out
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      router.push('/login')
    }
  })
})

onUnmounted(() => {
  // Clean up the listener
  if (authListener) {
    authListener.data.subscription.unsubscribe()
  }
})
</script>

<style>
/* Global styles - keep minimal here */
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
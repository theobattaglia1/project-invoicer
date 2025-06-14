<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth } from '@/lib/supabase'

const router = useRouter()
const route = useRoute()
let authListener = null

// Debug route changes
watch(() => route.fullPath, (newPath) => {
  console.log('App.vue - Route changed to:', newPath)
})

onMounted(() => {
  console.log('App.vue mounted, initial route:', route.fullPath)
  
  // Listen for auth state changes
  authListener = auth.onAuthStateChange((event, session) => {
    console.log('Auth state change:', event, session?.user?.email)
    
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
  background: #000;
  color: white;
  height: 100vh;
  overflow: hidden;
}

body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: #000;
}
</style>
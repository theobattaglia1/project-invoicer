import { auth } from '@/lib/supabase'

export const requireAuth = async (to, from, next) => {
  const user = await auth.getUser()
  
  if (!user) {
    // Not authenticated, redirect to login
    next('/login')
  } else {
    // Authenticated, proceed
    next()
  }
}

export const requireGuest = async (to, from, next) => {
  const user = await auth.getUser()
  
  if (user) {
    // Already authenticated, redirect to home
    next('/')
  } else {
    // Not authenticated, proceed
    next()
  }
}
// src/composables/useAuth.js
import { useRouter } from 'vue-router'
import { signOut } from '@/lib/supabase'

export const useAuth = () => {
  const router = useRouter()
  
  const logout = async () => {
    try {
      const { error } = await signOut()
      if (error) throw error
      
      // Clear any local storage items
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      
      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  return {
    logout
  }
}
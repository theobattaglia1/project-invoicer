// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://frdaskeysbghpzknsyoh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZGFza2V5c2JnaHB6a25zeW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNzE4ODIsImV4cCI6MjA2NDc0Nzg4Mn0.poKfhEP6AQj9sTSwtfwEIt5waOdJVjevsnX1r22daB4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for auth
export const auth = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
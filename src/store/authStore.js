// src/store/authStore.js
import { defineStore } from 'pinia'
import { auth, supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    permissions: [],
    initialized: false,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    
    isOwner: (state) => state.profile?.role === 'owner',
    
    isTeam: (state) => ['owner', 'editor', 'invoicer'].includes(state.profile?.role),
    
    isArtist: (state) => state.profile?.role === 'artist',
    
    userRole: (state) => state.profile?.role || null,
    
    canViewArtist: (state) => {
      return (artistId) => {
        if (!state.isAuthenticated) return false
        
        // Owners can view all artists
        if (state.isOwner) return true
        
        // Artists can only view their own profile
        if (state.isArtist) {
          return state.profile?.artist_id === artistId
        }
        
        // Team members check permissions
        return state.permissions.some(p => p.artist_id === artistId)
      }
    },
    
    canEditArtist: (state) => {
      return (artistId) => {
        if (!state.isAuthenticated) return false
        
        // Owners can edit all
        if (state.isOwner) return true
        
        // Artists cannot edit
        if (state.isArtist) return false
        
        // Check if user has edit permission
        return state.permissions.some(p => 
          p.artist_id === artistId && 
          p.permission === 'edit'
        )
      }
    },
    
    canInvoiceArtist: (state) => {
      return (artistId) => {
        if (!state.isAuthenticated) return false
        
        // Owners and invoicers can invoice all
        if (state.isOwner || state.profile?.role === 'invoicer') return true
        
        // Artists cannot invoice
        if (state.isArtist) return false
        
        // Check if user has invoice permission
        return state.permissions.some(p => 
          p.artist_id === artistId && 
          p.permission === 'invoice'
        )
      }
    }
  },

  actions: {
    async initialize() {
      try {
        // Get current user from Supabase
        const user = await auth.getUser()
        
        if (user) {
          this.user = user
          
          // Fetch user profile from user_profiles table
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (!error && profile) {
            this.profile = profile
            
            // If team member, fetch their permissions
            if (this.isTeam && !this.isOwner) {
              const { data: permissions } = await supabase
                .from('user_artist_permissions')
                .select('*')
                .eq('user_id', user.id)
              
              this.permissions = permissions || []
            }
          }
        }
        
        this.initialized = true
        
        // Set up auth state listener
        auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            this.user = session.user
            
            // Fetch updated profile
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profile) {
              this.profile = profile
              
              // Fetch permissions if team member
              if (this.isTeam && !this.isOwner) {
                const { data: permissions } = await supabase
                  .from('user_artist_permissions')
                  .select('*')
                  .eq('user_id', session.user.id)
                
                this.permissions = permissions || []
              }
            }
          } else {
            this.user = null
            this.profile = null
            this.permissions = []
          }
        })
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        this.initialized = true
      }
    },

    async login(email, password) {
      this.loading = true
      try {
        const { data, error } = await auth.signIn(email, password)
        
        if (error) throw error
        
        if (data.user) {
          this.user = data.user
          
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (!profileError && profile) {
            this.profile = profile
            
            // Fetch permissions if team member
            if (this.isTeam && !this.isOwner) {
              const { data: permissions } = await supabase
                .from('user_artist_permissions')
                .select('*')
                .eq('user_id', data.user.id)
              
              this.permissions = permissions || []
            }
          }
          
          return { success: true }
        }
      } catch (error) {
        console.error('Login error:', error)
        return { 
          success: false, 
          error: error.message || 'Failed to login' 
        }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        const { error } = await auth.signOut()
        if (error) throw error
        
        this.user = null
        this.profile = null
        this.permissions = []
      } catch (error) {
        console.error('Logout error:', error)
      }
    },

    async updateProfile(updates) {
      if (!this.user) return { success: false, error: 'Not authenticated' }
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.user.id)
          .select()
          .single()
        
        if (error) throw error
        
        this.profile = data
        return { success: true, data }
      } catch (error) {
        console.error('Profile update error:', error)
        return { 
          success: false, 
          error: error.message || 'Failed to update profile' 
        }
      }
    },

    // Helper to check if user has any permission for an artist
    hasAnyPermissionForArtist(artistId) {
      if (this.isOwner) return true
      if (this.isArtist && this.profile?.artist_id === artistId) return true
      return this.permissions.some(p => p.artist_id === artistId)
    }
  }
})
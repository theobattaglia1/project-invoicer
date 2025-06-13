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
    async initialize () {
      /* ─────────── 1. always enter loading state ─────────── */
      try {
        /* 2️⃣  Ask Supabase for the *current session* instead of `getUser()` —
               this avoids a 401 that sometimes bubbles up as an exception.     */
        const { data: { session }, error: sessionErr } =
          await supabase.auth.getSession()
    
        if (sessionErr) throw sessionErr          // network / CORS problems
        this.user = session?.user ?? null         // may still be null
    
        /* ─────────── 3. fetch profile if we have a user ─────────── */
        if (this.user) {
          const { data: profile, error: profileErr } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', this.user.id)
            .single()
    
          if (profileErr) throw profileErr        // bad RLS, etc.
    
          this.profile = profile ?? null
    
          /* ── permissions for team members (optional) ────────── */
          if (this.isTeam && !this.isOwner) {
            const { data: perms } = await supabase
              .from('user_artist_permissions')
              .select('*')
              .eq('user_id', this.user.id)
    
            this.permissions = perms || []
          }
        }
      } catch (err) {
        /* 4️⃣  NEVER throw – just log.  
               The router only cares that `initialized` flips to true.          */
        console.error('[authStore] initialise failed:', err)
      } finally {
        /* 5️⃣  GUARANTEE the guard can continue */
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
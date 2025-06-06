// src/store/authStore.js
import { defineStore } from 'pinia'
import { supabase, auth } from '@/lib/supabase'
import { useArtistStore } from './artistStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    permissions: [],
    loading: false,
    initialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    
    userRole: (state) => state.profile?.role || null,
    
    isOwner: (state) => state.profile?.role === 'owner',
    
    isArtist: (state) => state.profile?.role === 'artist',
    
    isTeamMember: (state) => ['editor', 'invoicer'].includes(state.profile?.role),
    
    // Check if user can view a specific artist
    canViewArtist: (state) => (artistId) => {
      if (!state.profile) return false
      
      // Owners can see all
      if (state.profile.role === 'owner') return true
      
      // Artists can only see themselves
      if (state.profile.role === 'artist') {
        return state.profile.artist_id === artistId
      }
      
      // Team members check permissions
      return state.permissions.some(p => 
        p.artist_id === artistId && 
        ['view', 'edit', 'invoice'].includes(p.permission)
      )
    },
    
    // Check if user can edit
    canEditArtist: (state) => (artistId) => {
      if (!state.profile) return false
      if (state.profile.role === 'owner') return true
      
      return state.permissions.some(p => 
        p.artist_id === artistId && 
        ['edit'].includes(p.permission)
      )
    },
    
    // Check if user can create/edit invoices
    canInvoiceArtist: (state) => (artistId) => {
      if (!state.profile) return false
      if (state.profile.role === 'owner') return true
      
      return state.permissions.some(p => 
        p.artist_id === artistId && 
        ['invoice', 'edit'].includes(p.permission)
      )
    },
    
    // Get filtered artists based on permissions
    visibleArtists: (state) => {
      const artistStore = useArtistStore()
      if (!state.profile) return []
      
      // Owners see all
      if (state.profile.role === 'owner') {
        return artistStore.artists
      }
      
      // Artists see only themselves
      if (state.profile.role === 'artist') {
        return artistStore.artists.filter(a => a.id === state.profile.artist_id)
      }
      
      // Team members see based on permissions
      const allowedArtistIds = state.permissions.map(p => p.artist_id)
      return artistStore.artists.filter(a => allowedArtistIds.includes(a.id))
    },
    
    // Get list of artist IDs user can access
    allowedArtistIds: (state) => {
      if (!state.profile) return []
      
      if (state.profile.role === 'owner') {
        // Owner can see all - return null to indicate no filtering needed
        return null
      }
      
      if (state.profile.role === 'artist') {
        return [state.profile.artist_id]
      }
      
      return [...new Set(state.permissions.map(p => p.artist_id))]
    }
  },

  actions: {
    async initialize() {
      if (this.initialized) return
      
      this.loading = true
      try {
        // Check for existing session
        const user = await auth.getUser()
        if (user) {
          await this.loadUserData(user)
        }
        
        // Listen for auth changes
        auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await this.loadUserData(session.user)
          } else if (event === 'SIGNED_OUT') {
            this.clearUserData()
          }
        })
        
        this.initialized = true
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadUserData(user) {
      this.user = user
      
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        this.profile = profile
      }
      
      // Load permissions if team member
      if (this.isTeamMember) {
        const { data: permissions } = await supabase
          .from('user_artist_permissions')
          .select('*')
          .eq('user_id', user.id)
        
        this.permissions = permissions || []
      }
    },
    
    clearUserData() {
      this.user = null
      this.profile = null
      this.permissions = []
    },
    
    async signIn(email, password) {
      this.loading = true
      try {
        const { data, error } = await auth.signIn(email, password)
        if (error) throw error
        
        // User data will be loaded by the auth state change listener
        return { success: true }
      } catch (error) {
        console.error('Sign in error:', error)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },
    
    async signOut() {
      try {
        await auth.signOut()
        this.clearUserData()
        return { success: true }
      } catch (error) {
        console.error('Sign out error:', error)
        return { success: false, error: error.message }
      }
    },
    
    async createUser(email, password, name, role, artistId = null) {
      // Only owners can create users
      if (!this.isOwner) {
        throw new Error('Unauthorized')
      }
      
      try {
        const metadata = { name, role }
        if (role === 'artist' && artistId) {
          metadata.artist_id = artistId
        }
        
        const { data, error } = await auth.signUp(email, password, metadata)
        if (error) throw error
        
        return { success: true, user: data.user }
      } catch (error) {
        console.error('Create user error:', error)
        return { success: false, error: error.message }
      }
    },
    
    async grantPermission(userId, artistId, permission) {
      if (!this.isOwner) {
        throw new Error('Unauthorized')
      }
      
      try {
        const { error } = await supabase
          .from('user_artist_permissions')
          .insert({
            user_id: userId,
            artist_id: artistId,
            permission: permission,
            granted_by: this.user.id
          })
        
        if (error) throw error
        return { success: true }
      } catch (error) {
        console.error('Grant permission error:', error)
        return { success: false, error: error.message }
      }
    },
    
    async revokePermission(userId, artistId, permission) {
      if (!this.isOwner) {
        throw new Error('Unauthorized')
      }
      
      try {
        const { error } = await supabase
          .from('user_artist_permissions')
          .delete()
          .match({
            user_id: userId,
            artist_id: artistId,
            permission: permission
          })
        
        if (error) throw error
        return { success: true }
      } catch (error) {
        console.error('Revoke permission error:', error)
        return { success: false, error: error.message }
      }
    }
  }
})
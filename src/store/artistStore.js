// src/store/artistStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { cache, cacheKeys, invalidateArtistCache } from '@/utils/cache'

export const useArtistStore = defineStore('artists', {
  state: () => ({
    artists: [],
    loading: false,
    error: null,
    lastFetch: null,
    cacheEnabled: true
  }),

  getters: {
    getArtistById: (state) => (id) => {
      return state.artists.find(artist => artist.id === id)
    },
    
    sortedArtists: (state) => {
      return [...state.artists].sort((a, b) => 
        a.name.localeCompare(b.name)
      )
    }
  },

  actions: {
    async loadArtists(forceRefresh = false) {
      const cacheKey = cacheKeys.artistList()
      
      // Check cache first unless forced refresh
      if (!forceRefresh && this.cacheEnabled) {
        const cached = cache.get(cacheKey)
        if (cached) {
          this.artists = cached
          this.lastFetch = Date.now()
          return cached
        }
      }
      
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .order('name')
        
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        
        this.artists = data || []
        this.lastFetch = Date.now()
        
        // Cache the result
        if (this.cacheEnabled) {
          cache.set(cacheKey, this.artists, 5 * 60 * 1000) // 5 minutes
        }
        
        return this.artists
      } catch (err) {
        this.error = err.message
        console.error('Failed to load artists:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async createArtist(artistData) {
      try {
        console.log('Creating artist with data:', artistData)
        
        const { data, error } = await supabase
          .from('artists')
          .insert({
            name: artistData.name,
            company_name: artistData.company_name || null,
            email: artistData.email || null,
            phone: artistData.phone || null,
            address: artistData.address || null,
            wire_details: artistData.wire_details || null,
            notes: artistData.notes || null
          })
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        
        console.log('Artist created:', data)
        this.artists.push(data)
        
        // Invalidate cache
        invalidateArtistCache(data.id)
        
        return data
      } catch (err) {
        this.error = err.message
        console.error('Create artist error:', err)
        throw err
      }
    },

    async updateArtist(id, artistData) {
      try {
        const { data, error } = await supabase
          .from('artists')
          .update({
            name: artistData.name,
            company_name: artistData.company_name || null,
            email: artistData.email || null,
            phone: artistData.phone || null,
            address: artistData.address || null,
            wire_details: artistData.wire_details || null,
            notes: artistData.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
            console.error('Supabase error:', error)
            throw error
        }
        
        const index = this.artists.findIndex(a => a.id === id)
        if (index !== -1) {
          this.artists[index] = data
        }
        
        // Invalidate cache
        invalidateArtistCache(id)
        
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async deleteArtist(id) {
      try {
        const { error } = await supabase
          .from('artists')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        this.artists = this.artists.filter(a => a.id !== id)
        
        // Invalidate cache
        invalidateArtistCache(id)
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
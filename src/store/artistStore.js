// src/store/artistStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useArtistStore = defineStore('artists', {
  state: () => ({
    artists: [],
    loading: false,
    error: null
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
    async loadArtists() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .order('name')
        
        if (error) throw error
        this.artists = data || []
      } catch (err) {
        this.error = err.message
        console.error('Failed to load artists:', err)
      } finally {
        this.loading = false
      }
    },

    async createArtist(artistData) {
      try {
        const { data, error } = await supabase
          .from('artists')
          .insert([{
            name: artistData.name,
            company_name: artistData.company_name || null,
            email: artistData.email || null,
            phone: artistData.phone || null,
            address: artistData.address || null,
            wire_details: artistData.wire_details || null,
            notes: artistData.notes || null
          }])
          .select()
          .single()
        
        if (error) throw error
        this.artists.push(data)
        return data
      } catch (err) {
        this.error = err.message
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
        
        if (error) throw error
        
        const index = this.artists.findIndex(a => a.id === id)
        if (index !== -1) {
          this.artists[index] = data
        }
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
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
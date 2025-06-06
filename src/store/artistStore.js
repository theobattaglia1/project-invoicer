// src/store/artistStore.js
import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/tauri'

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
        const result = await invoke('get_all_artists')
        this.artists = result
      } catch (err) {
        this.error = err.toString()
        console.error('Failed to load artists:', err)
      } finally {
        this.loading = false
      }
    },

    async createArtist(artistData) {
      try {
        const newArtist = await invoke('create_artist', {
          name: artistData.name,
          companyName: artistData.company_name || null,
          email: artistData.email || null,
          phone: artistData.phone || null,
          address: artistData.address || null,
          wireDetails: artistData.wire_details || null,
          notes: artistData.notes || null
        })
        this.artists.push(newArtist)
        return newArtist
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async updateArtist(id, artistData) {
      try {
        const updated = await invoke('update_artist', {
          artistId: id,
          name: artistData.name,
          companyName: artistData.company_name || null,
          email: artistData.email || null,
          phone: artistData.phone || null,
          address: artistData.address || null,
          wireDetails: artistData.wire_details || null,
          notes: artistData.notes || null
        })
        const index = this.artists.findIndex(a => a.id === id)
        if (index !== -1) {
          this.artists[index] = updated
        }
        return updated
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async deleteArtist(id) {
      try {
        await invoke('delete_artist', { artistId: id })
        this.artists = this.artists.filter(a => a.id !== id)
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    }
  }
})
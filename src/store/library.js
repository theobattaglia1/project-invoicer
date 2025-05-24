import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

// Create a singleton store
const artists = ref([])
const songs = ref([])
const playlists = ref([])

export function useLibraryStore() {
  const refreshLibrary = async () => {
    try {
      const [dbSongs, dbArtists, dbPlaylists] = await Promise.all([
        invoke('get_all_songs'),
        invoke('get_all_artists'),
        invoke('get_all_playlists')
      ])
      
      songs.value = dbSongs || []
      artists.value = dbArtists || []
      playlists.value = dbPlaylists || []
    } catch (error) {
      console.error('Error refreshing library:', error)
    }
  }

  return {
    artists,
    songs,
    playlists,
    refreshLibrary
  }
}
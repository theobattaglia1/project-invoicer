// src/store/index.js
import { createStore } from 'vuex'
import { invoke } from '@tauri-apps/api/tauri'

export default createStore({
  state: {
    // Music Library
    artists: [],
    albums: [],
    songs: [],
    playlists: [],
    
    // Playback State
    currentSong: null,
    playQueue: [],
    queueIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 70,
    isMuted: false,
    isRepeat: false,
    isShuffle: false,
    
    // UI State
    selectedArtistId: null,
    selectedPlaylistId: null,
    searchQuery: '',
    sortBy: 'title',
    
    // Settings
    musicFolders: [],
    theme: 'dark'
  },
  
  mutations: {
    // Library Mutations
    SET_ARTISTS(state, artists) {
      state.artists = artists
    },
    
    ADD_ARTIST(state, artist) {
      state.artists.push(artist)
    },
    
    SET_SONGS(state, songs) {
      state.songs = songs
    },
    
    ADD_SONGS(state, songs) {
      state.songs.push(...songs)
    },
    
    SET_PLAYLISTS(state, playlists) {
      state.playlists = playlists
    },
    
    ADD_PLAYLIST(state, playlist) {
      state.playlists.push(playlist)
    },
    
    UPDATE_PLAYLIST(state, { id, updates }) {
      const index = state.playlists.findIndex(p => p.id === id)
      if (index !== -1) {
        state.playlists[index] = { ...state.playlists[index], ...updates }
      }
    },
    
    // Playback Mutations
    SET_CURRENT_SONG(state, song) {
      state.currentSong = song
    },
    
    SET_PLAY_QUEUE(state, queue) {
      state.playQueue = queue
      state.queueIndex = 0
    },
    
    ADD_TO_QUEUE(state, songs) {
      state.playQueue.push(...(Array.isArray(songs) ? songs : [songs]))
    },
    
    SET_IS_PLAYING(state, playing) {
      state.isPlaying = playing
    },
    
    SET_CURRENT_TIME(state, time) {
      state.currentTime = time
    },
    
    SET_DURATION(state, duration) {
      state.duration = duration
    },
    
    SET_VOLUME(state, volume) {
      state.volume = volume
      if (volume > 0) state.isMuted = false
    },
    
    TOGGLE_MUTE(state) {
      state.isMuted = !state.isMuted
    },
    
    TOGGLE_REPEAT(state) {
      state.isRepeat = !state.isRepeat
    },
    
    TOGGLE_SHUFFLE(state) {
      state.isShuffle = !state.isShuffle
    },
    
    // UI Mutations
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query
    },
    
    SET_SORT_BY(state, sortBy) {
      state.sortBy = sortBy
    }
  },
  
  actions: {
    // Initialize the music library
    async initializeLibrary({ commit }) {
      try {
        // Load saved data from Tauri
        const artists = await invoke('get_all_artists')
        const songs = await invoke('get_all_songs')
        const playlists = await invoke('get_all_playlists')
        
        commit('SET_ARTISTS', artists)
        commit('SET_SONGS', songs)
        commit('SET_PLAYLISTS', playlists)
      } catch (error) {
        console.error('Failed to initialize library:', error)
      }
    },
    
    // Import music files
    async importMusic({ commit, dispatch }, files) {
      try {
        const importedSongs = await invoke('import_music_files', { 
          file_paths: files  // Fixed: snake_case
        })
        commit('ADD_SONGS', importedSongs)
        
        // Update artists if new ones were found
        await dispatch('refreshArtists')
      } catch (error) {
        console.error('Failed to import music:', error)
      }
    },
    
    // Scan a directory for music
    async scanMusicFolder({ commit, dispatch }, folderPath) {
      try {
        const files = await invoke('scan_music_directory', { 
          directory_path: folderPath  // Fixed: snake_case
        })
        await dispatch('importMusic', files)
      } catch (error) {
        console.error('Failed to scan folder:', error)
      }
    },
    
    // Add a new artist
    async addArtist({ commit }, artistData) {
      try {
        const artist = await invoke('create_artist', { 
          name: artistData.name,
          genre: artistData.genre || null
        })
        commit('ADD_ARTIST', artist)
        return artist
      } catch (error) {
        console.error('Failed to add artist:', error)
        throw error
      }
    },
    
    // Create a new playlist
    async createPlaylist({ commit }, playlistData) {
      try {
        const playlist = await invoke('create_playlist', { 
          name: playlistData.name,
          description: playlistData.description || null,
          color: playlistData.color || null
        })
        commit('ADD_PLAYLIST', playlist)
        return playlist
      } catch (error) {
        console.error('Failed to create playlist:', error)
        throw error
      }
    },
    
    // Add songs to playlist
    async addSongsToPlaylist({ commit }, { playlistId, songIds }) {
      try {
        await invoke('add_songs_to_playlist', { 
          playlist_id: playlistId,  // Fixed: snake_case
          song_ids: songIds         // Fixed: snake_case
        })
        // Refresh playlist data
        const updatedPlaylist = await invoke('get_playlist_by_id', { 
          playlist_id: playlistId  // Fixed: snake_case
        })
        commit('UPDATE_PLAYLIST', { id: playlistId, updates: updatedPlaylist })
      } catch (error) {
        console.error('Failed to add songs to playlist:', error)
      }
    },
    
    // Playback Actions
    playSong({ commit, state }, song) {
      commit('SET_CURRENT_SONG', song)
      commit('SET_IS_PLAYING', true)
      
      // If not in queue, set single song as queue
      if (!state.playQueue.find(s => s.id === song.id)) {
        commit('SET_PLAY_QUEUE', [song])
      }
    },
    
    playAlbum({ commit }, { album, songs }) {
      const albumSongs = songs.filter(s => s.album_id === album.id)
      if (albumSongs.length > 0) {
        commit('SET_PLAY_QUEUE', albumSongs)
        commit('SET_CURRENT_SONG', albumSongs[0])
        commit('SET_IS_PLAYING', true)
      }
    },
    
    playArtist({ commit, state }, artistId) {
      const artistSongs = state.songs.filter(s => s.artist_id === artistId)
      if (artistSongs.length > 0) {
        const shuffled = state.isShuffle ? 
          [...artistSongs].sort(() => Math.random() - 0.5) : 
          artistSongs
        commit('SET_PLAY_QUEUE', shuffled)
        commit('SET_CURRENT_SONG', shuffled[0])
        commit('SET_IS_PLAYING', true)
      }
    },
    
    playPlaylist({ commit, state }, playlistId) {
      const playlist = state.playlists.find(p => p.id === playlistId)
      if (playlist && playlist.song_ids) {
        const songs = playlist.song_ids.map(songId => 
          state.songs.find(s => s.id === songId)
        ).filter(Boolean)
        
        if (songs.length > 0) {
          const shuffled = state.isShuffle ? 
            [...songs].sort(() => Math.random() - 0.5) : 
            songs
          commit('SET_PLAY_QUEUE', shuffled)
          commit('SET_CURRENT_SONG', shuffled[0])
          commit('SET_IS_PLAYING', true)
        }
      }
    },
    
    togglePlayPause({ commit, state }) {
      commit('SET_IS_PLAYING', !state.isPlaying)
    },
    
    playNext({ commit, state }) {
      if (state.playQueue.length === 0) return
      
      let nextIndex = state.queueIndex + 1
      
      if (nextIndex >= state.playQueue.length) {
        if (state.isRepeat) {
          nextIndex = 0
        } else {
          commit('SET_IS_PLAYING', false)
          return
        }
      }
      
      state.queueIndex = nextIndex
      commit('SET_CURRENT_SONG', state.playQueue[nextIndex])
    },
    
    playPrevious({ commit, state }) {
      if (state.playQueue.length === 0) return
      
      let prevIndex = state.queueIndex - 1
      
      if (prevIndex < 0) {
        if (state.isRepeat) {
          prevIndex = state.playQueue.length - 1
        } else {
          prevIndex = 0
        }
      }
      
      state.queueIndex = prevIndex
      commit('SET_CURRENT_SONG', state.playQueue[prevIndex])
    },
    
    seekTo({ commit }, time) {
      commit('SET_CURRENT_TIME', time)
      // Emit to audio player
    },
    
    setVolume({ commit }, volume) {
      commit('SET_VOLUME', volume)
      // Update audio player volume
    }
  },
  
  getters: {
    // Get all songs for a specific artist
    artistSongs: (state) => (artistId) => {
      return state.songs.filter(song => song.artist_id === artistId)
    },
    
    // Get all albums for a specific artist
    artistAlbums: (state) => (artistId) => {
      return state.albums.filter(album => album.artist_id === artistId)
    },
    
    // Get artist by ID
    artistById: (state) => (id) => {
      return state.artists.find(artist => artist.id === id)
    },
    
    // Get playlist by ID
    playlistById: (state) => (id) => {
      return state.playlists.find(playlist => playlist.id === id)
    },
    
    // Get songs for a playlist
    playlistSongs: (state) => (playlistId) => {
      const playlist = state.playlists.find(p => p.id === playlistId)
      if (!playlist || !playlist.song_ids) return []
      
      return playlist.song_ids.map(songId => 
        state.songs.find(s => s.id === songId)
      ).filter(Boolean)
    },
    
    // Search results
    searchResults: (state) => {
      if (!state.searchQuery) return { songs: [], artists: [], albums: [], playlists: [] }
      
      const query = state.searchQuery.toLowerCase()
      
      return {
        songs: state.songs.filter(song => 
          song.name.toLowerCase().includes(query) ||
          song.artist?.toLowerCase().includes(query) ||
          song.album?.toLowerCase().includes(query)
        ),
        artists: state.artists.filter(artist => 
          artist.name.toLowerCase().includes(query)
        ),
        albums: state.albums.filter(album => 
          album.name.toLowerCase().includes(query)
        ),
        playlists: state.playlists.filter(playlist => 
          playlist.name.toLowerCase().includes(query)
        )
      }
    },
    
    // Sorted songs
    sortedSongs: (state) => {
      const songs = [...state.songs]
      
      switch (state.sortBy) {
        case 'title':
          return songs.sort((a, b) => a.name.localeCompare(b.name))
        case 'artist':
          return songs.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''))
        case 'album':
          return songs.sort((a, b) => (a.album || '').localeCompare(b.album || ''))
        case 'duration':
          return songs.sort((a, b) => a.duration - b.duration)
        case 'dateAdded':
          return songs.sort((a, b) => b.date_added - a.date_added)
        default:
          return songs
      }
    },
    
    // Recently played songs
    recentlyPlayed: (state) => {
      // In a real app, this would track play history
      return state.songs.slice(0, 10)
    },
    
    // Top artists (by song count)
    topArtists: (state) => {
      const artistCounts = {}
      
      state.songs.forEach(song => {
        if (song.artist_id) {
          artistCounts[song.artist_id] = (artistCounts[song.artist_id] || 0) + 1
        }
      })
      
      return state.artists
        .map(artist => ({
          ...artist,
          songCount: artistCounts[artist.id] || 0
        }))
        .sort((a, b) => b.songCount - a.songCount)
        .slice(0, 10)
    }
  }
})
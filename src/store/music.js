// src/store/music.js - Centralized Music Store
import { defineStore } from 'pinia'
import { shallowRef, computed, triggerRef, ref } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

export const useMusicStore = defineStore('music', () => {
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // State - Using shallowRef for large arrays to prevent deep reactivity
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const songs = shallowRef([])
  const artists = shallowRef([])
  const albums = shallowRef([])
  const playlists = shallowRef([])

  // Indexes for O(1) lookups
  const songIndex = shallowRef(new Map())
  const artistIndex = shallowRef(new Map())
  const albumIndex = shallowRef(new Map())
  const playlistIndex = shallowRef(new Map())

  // Loading states
  const isLoading = ref(false)
  const loadingProgress = ref(0)
  const loadingMessage = ref('')

  // Search and filter state
  const searchQuery = ref('')
  const sortBy = ref('title')
  const sortOrder = ref('asc')

  // Playback state
  const currentSong = ref(null)
  const playQueue = shallowRef([])
  const queueIndex = ref(0)
  const isPlaying = ref(false)
  const volume = ref(70)
  const isMuted = ref(false)
  const isRepeat = ref(false)
  const isShuffle = ref(false)

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Computed Properties with Memoization
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Songs by artist - memoized
  const songsByArtist = computed(() => {
    const map = new Map()
    songs.value.forEach(song => {
      if (song.artist_id) {
        if (!map.has(song.artist_id)) {
          map.set(song.artist_id, [])
        }
        map.get(song.artist_id).push(song)
      }
    })
    return map
  })

  // Songs by album - memoized
  const songsByAlbum = computed(() => {
    const map = new Map()
    songs.value.forEach(song => {
      if (song.album_id) {
        if (!map.has(song.album_id)) {
          map.set(song.album_id, [])
        }
        map.get(song.album_id).push(song)
      }
    })
    return map
  })

  // Filtered and sorted songs
  const filteredSongs = computed(() => {
    let filtered = songs.value

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(song =>
        song.name.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      let comparison = 0
      switch (sortBy.value) {
        case 'title':
          comparison = a.name.localeCompare(b.name)
          break
        case 'artist':
          comparison = a.artist.localeCompare(b.artist)
          break
        case 'album':
          comparison = a.album.localeCompare(b.album)
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'date_added':
          comparison = new Date(b.date_added) - new Date(a.date_added)
          break
      }
      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return sorted
  })

  // Stats
  const stats = computed(() => ({
    totalSongs: songs.value.length,
    totalArtists: artists.value.length,
    totalAlbums: albums.value.length,
    totalPlaylists: playlists.value.length,
    totalDuration: songs.value.reduce((sum, song) => sum + (song.duration || 0), 0),
    totalSize: songs.value.reduce((sum, song) => sum + (song.file_size || 0), 0)
  }))

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Helper Functions
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const rebuildIndexes = () => {
    // Song index
    const newSongIndex = new Map()
    songs.value.forEach(song => {
      newSongIndex.set(song.id, song)
    })
    songIndex.value = newSongIndex

    // Artist index
    const newArtistIndex = new Map()
    artists.value.forEach(artist => {
      newArtistIndex.set(artist.id, artist)
    })
    artistIndex.value = newArtistIndex

    // Album index
    const newAlbumIndex = new Map()
    albums.value.forEach(album => {
      newAlbumIndex.set(album.id, album)
    })
    albumIndex.value = newAlbumIndex

    // Playlist index
    const newPlaylistIndex = new Map()
    playlists.value.forEach(playlist => {
      newPlaylistIndex.set(playlist.id, playlist)
    })
    playlistIndex.value = newPlaylistIndex

    // Trigger reactivity for shallowRefs
    triggerRef(songIndex)
    triggerRef(artistIndex)
    triggerRef(albumIndex)
    triggerRef(playlistIndex)
  }

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Actions
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Refresh library with progress tracking
  const refreshLibrary = async () => {
    isLoading.value = true
    loadingProgress.value = 0
    try {
      // Load data in parallel for better performance
      loadingMessage.value = 'Loading music library...'
      const [dbSongs, dbArtists, dbAlbums, dbPlaylists] = await Promise.all([
        invoke('get_all_songs_with_covers'),
        invoke('get_all_artists'),
        invoke('get_all_albums'),
        invoke('get_all_playlists')
      ])

      loadingProgress.value = 50
      loadingMessage.value = 'Processing data...'

      // Batch update for better performance
      songs.value = dbSongs || []
      artists.value = dbArtists || []
      albums.value = dbAlbums || []
      playlists.value = dbPlaylists || []

      loadingProgress.value = 80
      loadingMessage.value = 'Building indexes...'

      // Rebuild all indexes
      rebuildIndexes()

      loadingProgress.value = 100
      loadingMessage.value = 'Complete!'

      // Trigger reactivity
      triggerRef(songs)
      triggerRef(artists)
      triggerRef(albums)
      triggerRef(playlists)

      console.log('✅ Library refreshed:', stats.value)
    } catch (error) {
      console.error('Failed to refresh library:', error)
      throw error
    } finally {
      isLoading.value = false
      loadingProgress.value = 0
      loadingMessage.value = ''
    }
  }

  // Import music files with progress
  const importMusicFiles = async (filePaths) => {
    try {
      const result = await invoke('import_music_files', { filePaths })
      if (result.success || result.imported_count > 0) {
        // Refresh library to get new songs
        await refreshLibrary()
        return result
      }
      throw new Error(result.errors?.join(', ') || 'Import failed')
    } catch (error) {
      console.error('Import failed:', error)
      throw error
    }
  }

  // Scan directory
  const scanMusicDirectory = async (directoryPath) => {
    isLoading.value = true
    loadingMessage.value = 'Scanning directory...'
    try {
      const result = await invoke('scan_music_directory', { directoryPath })
      if (result.success || result.imported_count > 0) {
        await refreshLibrary()
        return result
      }
      throw new Error(result.errors?.join(', ') || 'Scan failed')
    } catch (error) {
      console.error('Scan failed:', error)
      throw error
    } finally {
      isLoading.value = false
      loadingMessage.value = ''
    }
  }

  // Playlist operations
  const createPlaylist = async (name, description = '', color = null) => {
    const playlist = await invoke('create_playlist', { name, description, color })
    playlists.value = [...playlists.value, playlist]
    playlistIndex.value.set(playlist.id, playlist)
    triggerRef(playlists)
    return playlist
  }

  const addSongsToPlaylist = async (playlistId, songIds) => {
    await invoke('add_songs_to_playlist', {
      playlistId,
      songIds: Array.isArray(songIds) ? songIds : [songIds]
    })
    await refreshLibrary() // Refresh to get updated playlist
  }

  const removeSongFromPlaylist = async (playlistId, songId) => {
    await invoke('remove_song_from_playlist', { playlistId, songId })
    await refreshLibrary()
  }

  // Search with debouncing
  let searchTimeout = null
  const setSearchQuery = (query) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      searchQuery.value = query
    }, 300) // 300ms debounce
  }

  // Playback control
  const playSong = (song) => {
    currentSong.value = song
    isPlaying.value = true
    // Set up queue if not already in it
    if (!playQueue.value.find(s => s.id === song.id)) {
      playQueue.value = [song]
      queueIndex.value = 0
    }
  }

  const playArtist = (artistId) => {
    const artistSongs = songsByArtist.value.get(artistId) || []
    if (artistSongs.length > 0) {
      playQueue.value = isShuffle.value
        ? [...artistSongs].sort(() => Math.random() - 0.5)
        : [...artistSongs]
      queueIndex.value = 0
      currentSong.value = playQueue.value[0]
      isPlaying.value = true
      triggerRef(playQueue)
    }
  }

  const playPlaylist = (playlistId) => {
    const playlist = playlistIndex.value.get(playlistId)
    if (!playlist || !playlist.song_ids) return

    const playlistSongs = playlist.song_ids
      .map(id => songIndex.value.get(id))
      .filter(Boolean)

    if (playlistSongs.length > 0) {
      playQueue.value = isShuffle.value
        ? [...playlistSongs].sort(() => Math.random() - 0.5)
        : [...playlistSongs]
      queueIndex.value = 0
      currentSong.value = playQueue.value[0]
      isPlaying.value = true
      triggerRef(playQueue)
    }
  }

  const playNext = () => {
    if (playQueue.value.length === 0) return
    let nextIndex = queueIndex.value + 1
    if (nextIndex >= playQueue.value.length) {
      nextIndex = isRepeat.value ? 0 : queueIndex.value
    }
    queueIndex.value = nextIndex
    currentSong.value = playQueue.value[nextIndex]
  }

  const playPrevious = () => {
    if (playQueue.value.length === 0) return
    let prevIndex = queueIndex.value - 1
    if (prevIndex < 0) {
      prevIndex = isRepeat.value ? playQueue.value.length - 1 : 0
    }
    queueIndex.value = prevIndex
    currentSong.value = playQueue.value[prevIndex]
  }

  // Toggle functions
  const toggleShuffle = () => {
    isShuffle.value = !isShuffle.value
  }

  const toggleRepeat = () => {
    isRepeat.value = !isRepeat.value
  }

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Getters with O(1) performance
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const getSongById = (id) => songIndex.value.get(id)
  const getArtistById = (id) => artistIndex.value.get(id)
  const getAlbumById = (id) => albumIndex.value.get(id)
  const getPlaylistById = (id) => playlistIndex.value.get(id)
  const getSongsByArtist = (artistId) => songsByArtist.value.get(artistId) || []
  const getSongsByAlbum = (albumId) => songsByAlbum.value.get(albumId) || []
  const getPlaylistSongs = (playlistId) => {
    const playlist = playlistIndex.value.get(playlistId)
    if (!playlist || !playlist.song_ids) return []
    return playlist.song_ids
      .map(id => songIndex.value.get(id))
      .filter(Boolean)
  }

  return {
    // State
    songs,
    artists,
    albums,
    playlists,
    isLoading,
    loadingProgress,
    loadingMessage,
    searchQuery,
    sortBy,
    sortOrder,
    
    // Playback state
    currentSong,
    playQueue,
    queueIndex,
    isPlaying,
    volume,
    isMuted,
    isRepeat,
    isShuffle,
    
    // Computed
    filteredSongs,
    songsByArtist,
    songsByAlbum,
    stats,
    
    // Actions
    refreshLibrary,
    importMusicFiles,
    scanMusicDirectory,
    createPlaylist,
    addSongsToPlaylist,
    removeSongFromPlaylist,
    setSearchQuery,
    
    // Playback actions
    playSong,
    playArtist,
    playPlaylist,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    
    // Getters
    getSongById,
    getArtistById,
    getAlbumById,
    getPlaylistById,
    getSongsByArtist,
    getSongsByAlbum,
    getPlaylistSongs
  }
})
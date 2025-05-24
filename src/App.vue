<template>
  <div id="app">
    <!-- macOS-style Background -->
    <div class="app-background">
      <div class="gradient-orb gradient-orb-1"></div>
      <div class="gradient-orb gradient-orb-2"></div>
      <div class="gradient-orb gradient-orb-3"></div>
    </div>
    
    <!-- Main Container -->
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="traffic-lights">
            <span class="traffic-light close"></span>
            <span class="traffic-light minimize"></span>
            <span class="traffic-light maximize"></span>
          </div>
          <div class="app-title">
            <svg class="app-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="url(#icon-gradient)"/>
              <path d="M10 16.5v-9l6 4.5-6 4.5z" fill="white"/>
              <defs>
                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
            <span>Music</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <!-- Quick Access -->
          <div class="nav-section">
            <div 
              class="nav-item"
              :class="{ active: activeView === 'home' }"
              @click="activeView = 'home'"
            >
              <div class="nav-item-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                </svg>
              </div>
              <span>Home</span>
            </div>

            <div 
              class="nav-item"
              :class="{ active: activeView === 'search' }"
              @click="activeView = 'search'"
            >
              <div class="nav-item-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
              </div>
              <span>Search</span>
            </div>
          </div>

          <!-- Library -->
          <div class="nav-section">
            <div class="section-label">Library</div>
            
            <div 
              class="nav-item"
              :class="{ active: activeView === 'all-songs' }"
              @click="activeView = 'all-songs'"
            >
              <div class="nav-item-icon gradient-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
                </svg>
              </div>
              <span>Songs</span>
              <span class="nav-badge">{{ allSongs.length }}</span>
            </div>

            <div 
              class="nav-item"
              :class="{ active: activeView === 'artists' }"
              @click="activeView = 'artists'"
            >
              <div class="nav-item-icon gradient-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
                </svg>
              </div>
              <span>Artists</span>
              <span class="nav-badge">{{ artists.length }}</span>
            </div>

            <div 
              class="nav-item"
              :class="{ active: activeView === 'playlists' }"
              @click="activeView = 'playlists'"
            >
              <div class="nav-item-icon gradient-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" fill="currentColor"/>
                </svg>
              </div>
              <span>Playlists</span>
              <span class="nav-badge">{{ generalPlaylists.length }}</span>
            </div>
          </div>

          <!-- Playlists -->
          <div class="nav-section">
            <div class="section-label">
              Playlists
              <button class="add-playlist-btn" @click="showAddModal = true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
            
            <div 
              v-for="(element, index) in generalPlaylists"
              :key="element.id"
              class="nav-item playlist-item"
              :class="{ active: activeView === 'playlist' && activePlaylistId === element.id, 'drag-over': dragOverPlaylistId === element.id }"
              @click="setActiveView('playlist', element.id)"
              @dragenter.prevent="(e) => { console.log('🎯 Dragenter playlist:', element.name); dragOverPlaylistId = element.id }"
              @dragover.prevent="(e) => { e.dataTransfer.dropEffect = 'copy'; dragOverPlaylistId = element.id }"
              @dragleave="(e) => { console.log('👋 Dragleave playlist:', element.name); dragOverPlaylistId = null }"
              @drop.prevent="(e) => { console.log('💧 DROP on playlist:', element.name); handlePlaylistExternalDrop(e, element.id) }"
            >
              <div class="playlist-cover">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
              </div>
              <span>{{ element.name }}</span>
            </div>
          </div>
        </nav>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-btn" @click="scanMusicFolder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Scan Folder
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-wrapper">
          <!-- Dynamic content based on activeView -->
          <HomeView 
            v-if="activeView === 'home'" 
            :artists="artists" 
            :recentSongs="recentSongs"
            @view-artists="activeView = 'artists'"
            @select-artist="(id) => setActiveView('artist-songs', id)"
            @navigate="(view) => activeView = view"
          />
          <AllSongsView 
            v-else-if="activeView === 'all-songs'" 
            :songs="allSongs" 
            :onFileDrop="handleAllSongsFileDrop" 
          />
          <ArtistsView 
            v-else-if="activeView === 'artists'" 
            :artists="artists" 
            @add-artist="showAddModal = true" 
            @select-artist="(id) => setActiveView('artist-songs', id)" 
            :onFileDropToArtist="handleFileDropToArtist" 
          />
          <playlistsview v-else-if="activeView === 'playlists'" :playlists="generalPlaylists" @create-playlist="showAddModal = true" @select-playlist="(id) => setActiveView('playlist', id)" @add-song-to-playlist="({ playlistId, song }) => addSongToPlaylist(playlistId, song)" />
          <ArtistSongsView 
            v-else-if="activeView === 'artist-songs'" 
            :artist="currentArtist" 
            :songs="currentArtistSongs" 
            :onFileDropToArtist="handleFileDropToArtist" 
          />
          <PlaylistDetailView
            v-else-if="activeView === 'playlist'"
            :playlist="currentPlaylist"
            :songs="currentPlaylistSongs"
            @remove-song="removeSongFromPlaylist"
          />
        </div>
      </main>

      <!-- Now Playing Bar -->
      <NowPlayingBar v-if="currentSong" :song="currentSong" />
    </div>

    <!-- Add Content Modal -->
    <AddContentModal 
      v-if="showAddModal" 
      @close="showAddModal = false" 
      @add="handleAddContent" 
    />
    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { listen } from '@tauri-apps/api/event'
import HomeView from './components/HomeView.vue'
import AllSongsView from './components/AllSongsView.vue'
import ArtistsView from './components/ArtistsView.vue'
import playlistsview from './components/playlistsview.vue'
import ArtistSongsView from './components/ArtistSongsView.vue'
import PlaylistDetailView from './components/PlaylistDetailView.vue'
import NowPlayingBar from './components/NowPlayingBar.vue'
import AddContentModal from './components/AddContentModal.vue'
import Toast from './components/Toast.vue'
import { useAudioPlayer } from './services/audioPlayer'
import { importFiles } from '@/utils/importFiles'
import { useToastStore } from '@/store/toast'

export default {
  name: 'App',
  components: {
    HomeView,
    AllSongsView,
    ArtistsView,
    playlistsview,
    ArtistSongsView,
    PlaylistDetailView,
    NowPlayingBar,
    AddContentModal,
    Toast
  },
  setup() {
    // Navigation state
    const activeView = ref('home')
    const activeArtistId = ref(null)
    const activePlaylistId = ref(null)

    // UI state
    const showAddModal = ref(false)
    const currentSong = ref(null)
    const dragOverPlaylistId = ref(null)
    const showFileDropOverlay = ref(false)

    // Data
    const artists = ref([])
    const songs = ref([])
    const generalPlaylists = ref([])

    // Computed
    const allSongs = computed(() => songs.value)
    const recentSongs = computed(() => songs.value.slice(0, 4))

    const currentArtist = computed(() => 
      artists.value.find(a => a.id === activeArtistId.value)
    )

    const currentArtistSongs = computed(() => 
      songs.value.filter(s => s.artist_id === activeArtistId.value)
    )

    const currentPlaylist = computed(() => {
      const playlist = generalPlaylists.value.find(p => p.id === activePlaylistId.value)
      console.log('🎵 Current playlist:', playlist)
      return playlist
    })

    const currentPlaylistSongs = computed(() => {
      const playlist = currentPlaylist.value
      if (!playlist) return []
      
      // Check if playlist has songs array directly
      if (playlist.songs && Array.isArray(playlist.songs)) {
        return playlist.songs
      }
      
      // Otherwise check for song_ids
      if (playlist.song_ids && Array.isArray(playlist.song_ids)) {
        return songs.value.filter(s => playlist.song_ids.includes(s.id))
      }
      
      return []
    })

    const totalStorageUsed = computed(() => {
      return songs.value.reduce((total, song) => total + (song.file_size || 0), 0)
    })

    const storagePercent = computed(() => {
      const maxStorage = 100 * 1024 * 1024 * 1024 // 100GB in bytes
      return Math.min((totalStorageUsed.value / maxStorage) * 100, 100)
    })

    // Methods
    const setActiveView = (view, id = null) => {
      activeView.value = view
      if (view === 'artist-songs') {
        activeArtistId.value = id
      } else if (view === 'playlist') {
        activePlaylistId.value = id
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Refresh library data from database
    const refreshLibrary = async () => {
      try {
        const [dbSongs, dbArtists, dbPlaylists] = await Promise.all([
          invoke('get_all_songs'),
          invoke('get_all_artists'),
          invoke('get_all_playlists')
        ])
        
        console.log('📚 Refreshed library data:', {
          songs: dbSongs?.length || 0,
          artists: dbArtists?.length || 0,
          playlists: dbPlaylists?.length || 0
        })
        
        songs.value = dbSongs || []
        artists.value = dbArtists || []
        generalPlaylists.value = dbPlaylists || []
        
        // Log playlist details
        console.log('📋 Playlists detail:', dbPlaylists)
      } catch (error) {
        console.error('Error refreshing library:', error)
      }
    }

    // Import the toast store directly instead of using inject
    const toastStore = useToastStore()
    const showToast = (options) => toastStore.push(options)
    const audio = useAudioPlayer()

    const handleAddContent = async (data) => {
      console.log('Add content:', data)
      
      try {
        switch (data.type) {
          case 'import':
            // Handle music file imports with Tauri
            if (data.data.files && data.data.files.length > 0) {
              console.log(`Importing ${data.data.files.length} music files...`)
              
              // Extract file paths - handle both drag/drop and file picker
              const filePaths = data.data.files.map(f => {
                // If it's a File object from drag/drop, use the path property
                // If it's already a path string, use it directly
                return f.path || f
              })
              
              // Call Tauri command to import files
              const result = await invoke('import_music_files', { filePaths })
              
              if (result.success || result.imported_count > 0) {
                console.log(`Successfully imported ${result.imported_count} songs`)
                
                // Show any errors that occurred
                if (result.errors && result.errors.length > 0) {
                  console.error('Import errors:', result.errors)
                  showToast({ message: `Imported ${result.imported_count} songs successfully. ${result.failed_count} files failed: ${result.errors.join(', ')}`, type: 'info' })
                } else {
                  showToast({ message: `Successfully imported ${result.imported_count} songs!`, type: 'success' })
                }
              } else {
                console.error('Import failed:', result.errors)
                showToast({ message: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
              }
            }
            break
            
          case 'artist':
            // Handle artist creation with image
            const newArtist = await invoke('create_artist', {
              name: data.data.name,
              genre: data.data.genre || null
            })
            
            // Upload artist image if provided
            if (data.data.imagePath) {
              try {
                // Read the image file
                const imageData = await readBinaryFile(data.data.imagePath)
                const imageExt = data.data.imagePath.split('.').pop().toLowerCase()
                
                const imagePath = await invoke('save_artist_image', {
                  artistId: newArtist.id,
                  imageData: Array.from(imageData),
                  extension: imageExt
                })
                
                newArtist.image_path = imagePath
                console.log('Artist image saved:', imagePath)
              } catch (error) {
                console.error('Failed to save artist image:', error)
              }
            }
            
            console.log('Added new artist:', newArtist)
            showToast({ message: `Artist "${newArtist.name}" created successfully!`, type: 'success' })
            break
            
          case 'playlist':
            // Handle playlist creation with Tauri
            const newPlaylist = await invoke('create_playlist', {
              name: data.data.name,
              description: data.data.description || null,
              color: data.data.color || null
            })
            
            console.log('Created new playlist:', newPlaylist)
            showToast({ message: `Playlist "${newPlaylist.name}" created successfully!`, type: 'success' })
            break
        }
        
        // Refresh data from database
        await refreshLibrary()
        
      } catch (error) {
        console.error('Error handling content addition:', error)
        showToast({ message: `Error: ${error}`, type: 'error' })
      }
      
      showAddModal.value = false
    }

    // Scan music folder function
    const scanMusicFolder = async () => {
      try {
        // Open folder selection dialog
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Music Folder to Scan'
        })
        
        if (selected) {
          console.log('Scanning folder:', selected)
          const result = await invoke('scan_music_directory', {
            directoryPath: selected
          })
          
          if (result.success || result.imported_count > 0) {
            showToast({ message: `Scanned folder successfully! Imported ${result.imported_count} songs.`, type: 'success' })
            await refreshLibrary()
          } else {
            showToast({ message: `Scan failed: ${result.errors.join(', ')}`, type: 'error' })
          }
        }
      } catch (error) {
        console.error('Error scanning folder:', error)
        showToast({ message: `Error scanning folder: ${error}`, type: 'error' })
      }
    }

    // Add song to playlist
    const addSongToPlaylist = async (playlistId, song) => {
      console.log('➕ Adding song to playlist:', { playlistId, song });
      try {
        await invoke('add_songs_to_playlist', { playlistId, songIds: [song.id] })
        console.log('✅ Song added successfully');
        showToast({ message: `Added '${song.title}' to playlist!`, type: 'success' })
        await refreshLibrary()
      } catch (error) {
        console.error('❌ Failed to add song:', error);
        showToast({ message: `Failed to add song: ${error}`, type: 'error' })
      }
    }

    // Handle playlist reordering
    const onReorderPlaylists = async (evt) => {
      // No longer needed since we removed draggable
      showToast({ message: 'Playlist reordering disabled', type: 'info' })
    }

    // Add this handler
    const handleAllSongsFileDrop = async (filePaths) => {
      console.log('🎵 handleAllSongsFileDrop called with:', filePaths)
      if (!filePaths || filePaths.length === 0) {
        console.warn('🎵 No file paths provided')
        return
      }
      try {
        console.log('🎵 Calling import_music_files with paths:', filePaths)
        const result = await invoke('import_music_files', { filePaths })
        console.log('🎵 Import result:', result)
        
        if (result.success || result.imported_count > 0) {
          showToast({ message: `Imported ${result.imported_count} songs!`, type: 'success' })
          await refreshLibrary()
        } else {
          console.error('🎵 Import failed:', result)
          showToast({ message: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
        }
      } catch (error) {
        console.error('🎵 Import error:', error)
        showToast({ message: `Import failed: ${error}`, type: 'error' })
      }
    }

    // Add this handler
    const handleFileDropToArtist = async (artistId, filePaths) => {
      console.log('🎨 handleFileDropToArtist called with artistId:', artistId, 'paths:', filePaths)
      if (!filePaths || filePaths.length === 0) {
        console.warn('🎨 No file paths provided')
        return
      }
      try {
        console.log('🎨 Importing files...')
        // Import the files
        const result = await invoke('import_music_files', { filePaths })
        console.log('🎨 Import result:', result)
        
        if (result.success || result.imported_count > 0) {
          // Add imported song IDs to artist
          const songIds = (result.songs || []).map(s => s.id)
          console.log('🎨 Song IDs to add to artist:', songIds)
          
          if (songIds.length > 0) {
            console.log('🎨 Adding songs to artist...')
            await invoke('add_songs_to_artist', { artistId, songIds })
          }
          showToast({ message: `Imported ${result.imported_count} songs and attached to artist!`, type: 'success' })
          await refreshLibrary()
        } else {
          console.error('🎨 Import failed:', result)
          showToast({ message: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
        }
      } catch (error) {
        console.error('🎨 Import error:', error)
        showToast({ message: `Import failed: ${error}`, type: 'error' })
      }
    }

    // Remove song from playlist
    const removeSongFromPlaylist = async ({ playlistId, songId }) => {
      try {
        await invoke('remove_song_from_playlist', { playlistId, songId })
        showToast({ message: 'Song removed from playlist', type: 'success' })
        await refreshLibrary()
      } catch (error) {
        showToast({ message: `Failed to remove song: ${error}`, type: 'error' })
      }
    }

    // Add this handler for playlist external drop
    const handlePlaylistExternalDrop = async (e, playlistId) => {
      console.log('🎯 Playlist drop event triggered for playlist:', playlistId);
      dragOverPlaylistId.value = null;

      // Check for files first
      if (e.dataTransfer.files?.length) {
        console.log('📁 Files detected in drop:', e.dataTransfer.files);
        const paths = [...e.dataTransfer.files].map(f => f.path);
        await importFiles(paths, { playlistId });
        await refreshLibrary();
        return;
      }

      // Check for JSON data (dragged songs)
      const json = e.dataTransfer.getData('application/json');
      console.log('🎵 JSON data from drop:', json);

      if (json) {
        try {
          const song = JSON.parse(json);
          console.log('🎵 Parsed song data:', song);
          await addSongToPlaylist(playlistId, song);
        } catch (error) {
          console.error('❌ Error parsing dropped data:', error);
        }
      } else {
        console.warn('⚠️ No data found in drop event');
      }
    }

    // Initialize on mount
    onMounted(async () => {
      // Load library data
      await refreshLibrary()
      
      // Set demo current song after a delay
      setTimeout(() => {
        if (songs.value.length > 0) {
          // Convert file path to Tauri asset URL for audio playback
          const song = songs.value[0]
          currentSong.value = {
            id: song.id,
            title: song.title,
            artist: song.artist,
            album: song.album,
            duration: formatDuration(song.duration || 0),
            path: convertFileSrc(song.path) // Convert to playable URL
          }
        }
      })

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ignore if input, textarea, or contenteditable is focused
        const tag = document.activeElement?.tagName?.toLowerCase()
        const isEditable = document.activeElement?.isContentEditable
        if (['input', 'textarea', 'select'].includes(tag) || isEditable) return

        // --- Playback Controls ---
        if (e.code === 'Space') {
          e.preventDefault()
          audio.togglePlayPause()
        }
        if (e.code === 'ArrowLeft') {
          e.preventDefault()
          audio.skipBackward(10)
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault()
          audio.skipForward(10)
        }
        if (e.code === 'ArrowUp') {
          e.preventDefault()
          audio.setVolume(Math.min(audio.volume.value + 10, 100))
        }
        if (e.code === 'ArrowDown') {
          e.preventDefault()
          audio.setVolume(Math.max(audio.volume.value - 10, 0))
        }
        if (e.key.toLowerCase() === 'm') {
          audio.toggleMute()
        }
        if (e.key.toLowerCase() === 'n') {
          // Next track (not implemented, placeholder)
          showToast({ message: 'Next Track (not implemented)', type: 'info' })
        }
        if (e.key.toLowerCase() === 'p') {
          // Previous track (not implemented, placeholder)
          showToast({ message: 'Previous Track (not implemented)', type: 'info' })
        }

        // --- Navigation ---
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
        if (ctrlOrCmd && e.key === 'f') {
          e.preventDefault()
          // Focus search (not implemented, placeholder)
          showToast({ message: 'Focus Search (not implemented)', type: 'info' })
        }
        if (ctrlOrCmd && e.key === '1') {
          e.preventDefault()
          setActiveView('home')
        }
        if (ctrlOrCmd && e.key === '2') {
          e.preventDefault()
          setActiveView('all-songs')
        }
        if (ctrlOrCmd && e.key === '3') {
          e.preventDefault()
          setActiveView('artists')
        }
        if (ctrlOrCmd && e.key === '4') {
          e.preventDefault()
          setActiveView('playlists')
        }
        if (ctrlOrCmd && e.key.toLowerCase() === 'k') {
          e.preventDefault()
          showToast({ message: 'Quick Switcher (not implemented)', type: 'info' })
        }
        if (ctrlOrCmd && e.key === ',') {
          e.preventDefault()
          showToast({ message: 'Open Settings (not implemented)', type: 'info' })
        }

        // --- Quick Actions ---
        if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'n') {
          e.preventDefault()
          setActiveView('playlists')
          showAddModal.value = true
        }
        if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'a') {
          e.preventDefault()
          setActiveView('artists')
          showAddModal.value = true
        }
        if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'i') {
          e.preventDefault()
          setActiveView('all-songs')
          showAddModal.value = true
        }
      })

      // Global file drop listeners
      await listen('tauri://file-drop-hover', (event) => {
        // Don't show overlay, just log for debugging
        console.log('🎯 FILE DROP HOVER EVENT:', event)
      })
      
      await listen('tauri://file-drop-cancelled', (event) => {
        console.log('❌ FILE DROP CANCELLED EVENT:', event)
      })
      
      await listen('tauri://file-drop', async (event) => {
        // The global drop is now just for visual feedback
        // Actual file handling is done by the specific drop zones
        console.log('📁 Global file drop detected, handled by specific drop zones')
      })
    })

    // Format duration from seconds to "M:SS"
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    return {
      activeView,
      activeArtistId,
      activePlaylistId,
      showAddModal,
      currentSong,
      artists,
      songs,
      generalPlaylists,
      allSongs,
      recentSongs,
      currentArtist,
      currentArtistSongs,
      currentPlaylist,
      currentPlaylistSongs,
      totalStorageUsed,
      storagePercent,
      setActiveView,
      handleAddContent,
      formatFileSize,
      refreshLibrary,
      scanMusicFolder,
      convertFileSrc,
      dragOverPlaylistId,
      addSongToPlaylist,
      onReorderPlaylists,
      handleAllSongsFileDrop,
      handleFileDropToArtist,
      handlePlaylistExternalDrop,
      showFileDropOverlay,
      removeSongFromPlaylist
    }
  }
}
</script>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Colors */
  --bg-primary: #0A0A0B;
  --bg-secondary: rgba(255, 255, 255, 0.04);
  --bg-tertiary: rgba(255, 255, 255, 0.08);
  --bg-hover: rgba(255, 255, 255, 0.06);
  --bg-active: rgba(255, 255, 255, 0.1);
  
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary: rgba(255, 255, 255, 0.4);
  
  --border-color: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.12);
  
  /* Accent Colors */
  --accent-primary: #FF6B6B;
  --accent-secondary: #4ECDC4;
  --accent-tertiary: #45B7D1;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
  --gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-tertiary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 16px 64px rgba(0, 0, 0, 0.25);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
}

#app {
  width: 100vw;
  height: 100vh;
  position: relative;
}

/* Background */
.app-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.gradient-orb-1 {
  width: 600px;
  height: 600px;
  background: var(--gradient-primary);
  top: -200px;
  left: -200px;
}

.gradient-orb-2 {
  width: 400px;
  height: 400px;
  background: var(--gradient-secondary);
  bottom: -100px;
  right: -100px;
  animation-delay: -5s;
}

.gradient-orb-3 {
  width: 300px;
  height: 300px;
  background: var(--gradient-tertiary);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Main Container */
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  z-index: 1;
}

/* Sidebar */
.sidebar {
  width: 260px;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(100px) saturate(180%);
  -webkit-backdrop-filter: blur(100px) saturate(180%);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Traffic Lights */
.sidebar-header {
  padding: 24px 20px 20px;
  position: relative;
}

.traffic-lights {
  display: flex;
  gap: 8px;
  position: absolute;
  top: 24px;
  left: 20px;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
}

.traffic-light.close {
  background: #FF5F57;
}

.traffic-light.minimize {
  background: #FFBD2E;
}

.traffic-light.maximize {
  background: #28CA42;
}

/* App Title */
.app-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 32px;
  padding: 0 4px;
}

.app-icon {
  width: 28px;
  height: 28px;
}

.app-title span {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
  background: var(--gradient-primary);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 0;
}

.nav-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  padding: 0 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-playlist-btn {
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.add-playlist-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.add-playlist-btn svg {
  width: 14px;
  height: 14px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-active);
  color: var(--text-primary);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--accent-primary);
  border-radius: 0 2px 2px 0;
}

.nav-item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.nav-item-icon svg {
  width: 16px;
  height: 16px;
}

.gradient-icon {
  background: var(--gradient-primary);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gradient-icon svg {
  color: white;
}

.nav-badge {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
}

/* Playlist Items */
.playlist-item {
  font-size: 13px;
  transition: all 0.2s ease;
}

.playlist-item.drag-over {
  background: rgba(78, 205, 196, 0.2) !important;
  border: 1px solid rgba(78, 205, 196, 0.5);
  transform: scale(1.02);
}

.playlist-cover {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.playlist-cover svg {
  width: 14px;
  height: 14px;
  color: var(--text-tertiary);
}

/* Quick Actions */
.quick-actions {
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  width: 100%;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    left: -100%;
    z-index: 100;
    transition: left 0.3s ease;
  }
  
  .sidebar.open {
    left: 0;
  }
}
</style>
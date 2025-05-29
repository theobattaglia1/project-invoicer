<template>
  <div class="playlist-detail-view">
    <!-- Hero Section -->
    <div class="playlist-hero">
      <div class="hero-background">
        <img 
          v-if="playlist?.artwork_path" 
          :src="getArtworkUrl(playlist.artwork_path)" 
          :alt="playlist.name"
          class="hero-image"
        />
        <div v-else class="hero-placeholder">
          <svg viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" fill="rgba(255,255,255,0.05)"/>
            <path d="M30 35h40v4H30v-4zm0 8h40v4H30v-4zm0 8h24v4H30v-4z" fill="rgba(255,255,255,0.2)"/>
            <path d="M58 51v16.55c-1.18-.68-2.54-1.1-4-1.1-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8V56h8v-5h-12z" fill="rgba(255,255,255,0.2)"/>
          </svg>
        </div>
        <div class="hero-gradient"></div>
      </div>
      
      <div class="hero-content">
        <p class="playlist-label">PLAYLIST</p>
        <h1 class="playlist-name">{{ playlist?.name || 'Playlist' }}</h1>
        <p class="playlist-info">
          <span v-if="playlist?.description">{{ playlist.description }} • </span>
          <span>{{ songs.length }} songs</span>
          <span v-if="totalDuration"> • {{ totalDuration }}</span>
        </p>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="actions-section">
      <button class="play-button" @click="playAll">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      
      <button class="action-button" @click="shufflePlay">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
        </svg>
      </button>
      
      <button class="action-button" @click="showMoreOptions">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
      
      <button class="upload-image-button" @click="uploadPlaylistImage">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
        </svg>
        Upload Cover
      </button>

      <button class="edit-button" @click="editPlaylist">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        Edit Details
      </button>
    </div>

    <!-- Songs Table -->
    <div class="songs-container">
      <div v-if="filteredSongs.length === 0 && searchQuery" class="no-results">
        <p>No songs match your search</p>
      </div>
      
      <div v-else-if="songs.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
        </div>
        <h3>This playlist is empty</h3>
        <p>Add songs by dragging them here or using the add button</p>
      </div>

      <template v-else>
        <!-- Search and Sort Controls -->
        <div class="table-controls">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search in playlist..."
              class="search-input"
              @keydown.escape="searchQuery = ''"
            >
            <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <div class="view-options">
            <button class="sort-button" @click="showSortMenu = !showSortMenu">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
              </svg>
              <span>{{ sortOptions.find(o => o.value === sortBy)?.label }}</span>
            </button>
            
            <div v-if="showSortMenu" class="sort-menu">
              <div
                v-for="option in sortOptions"
                :key="option.value"
                class="sort-option"
                :class="{ active: sortBy === option.value }"
                @click="setSortBy(option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>

          <div v-if="selectedSongs.size > 0" class="selection-actions">
            <button class="action-btn ghost" @click="clearSelection">
              Cancel
            </button>
            <button class="action-btn ghost" @click="editSelectedSongs" v-if="selectedSongs.size > 0">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit Metadata
            </button>
            <button class="action-btn ghost danger" @click="removeSelectedSongs">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Remove from Playlist
            </button>
          </div>
        </div>

        <!-- Table Header -->
        <div class="table-header">
          <div class="col-number">#</div>
          <div class="col-title">Title</div>
          <div class="col-artist">Artist</div>
          <div class="col-album">Album</div>
          <div class="col-duration">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
          <div class="col-actions"></div>
        </div>

        <!-- Songs List -->
        <div class="songs-list">
          <div
            v-for="(song, index) in filteredSongs"
            :key="song.id"
            class="song-row"
            :class="{ 
              selected: selectedSongs.has(song.id),
              playing: currentSong?.id === song.id,
              highlighted: highlightedSong?.id === song.id
            }"
            @click="handleRowClick(song, index, $event)"
            @dblclick="playSong(song)"
            @mouseenter="highlightedSong = song"
            @mouseleave="highlightedSong = null"
            @contextmenu.prevent="showContextMenu(song, $event)"
          >
            <div class="col-number">
              <span v-if="currentSong?.id !== song.id" class="track-number">
                {{ index + 1 }}
              </span>
              <div v-else class="playing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            
            <div class="col-title">
              <div class="song-info">
                <div class="song-artwork">
                  <img 
                    v-if="song.artwork_path"
                    :src="getArtworkUrl(song.artwork_path)"
                    :alt="song.album"
                    loading="lazy"
                    @error="handleImageError"
                  >
                  <div v-else class="artwork-placeholder">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                </div>
                <span class="song-name">{{ song.name }}</span>
              </div>
            </div>
            
            <div class="col-artist">
              <span class="artist-link" @click.stop="$emit('navigate-to-artist', song.artist_id)">
                {{ song.artist }}
              </span>
            </div>
            <div class="col-album">{{ song.album || '—' }}</div>
            <div class="col-duration">{{ formatDuration(song.duration) }}</div>
            
            <div class="col-actions">
              <button 
                class="action-icon"
                @click.stop="showSongMenu(song, $event)"
                v-show="highlightedSong?.id === song.id || selectedSongs.has(song.id)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'
import { useContextMenu } from '@/composables/useContextMenu'
import { useToastStore } from '@/store/toast'

export default {
  name: 'PlaylistDetailView',
  props: {
    playlist: Object,
    songs: Array
  },
  emits: ['remove-song', 'reorder-songs', 'navigate-to-artist', 'refresh-library', 'edit-metadata', 'show-context-menu'],
  setup(props, { emit }) {
    const playback = usePlaybackIntegration()
    const { showContextMenu: openContextMenu } = useContextMenu()
    const toastStore = useToastStore()
    
    // Inject the global refs
    const contextMenuRef = inject('contextMenu', null)
    const metadataEditor = inject('metadataEditor', null)
    
    // State
    const searchQuery = ref('')
    const sortBy = ref('custom')
    const showSortMenu = ref(false)
    const selectedSongs = ref(new Set())
    const highlightedSong = ref(null)
    const lastSelectedIndex = ref(-1)
    
    // Sort options
    const sortOptions = [
      { value: 'custom', label: 'Custom Order' },
      { value: 'title', label: 'Title' },
      { value: 'artist', label: 'Artist' },
      { value: 'album', label: 'Album' },
      { value: 'duration', label: 'Duration' },
      { value: 'dateAdded', label: 'Date Added' }
    ]
    
    // Computed
    const currentSong = computed(() => playback.currentSong.value)
    
    const totalDuration = computed(() => {
      const totalSeconds = props.songs?.reduce((total, song) => total + (song.duration || 0), 0) || 0
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    })
    
    const filteredSongs = computed(() => {
      let filtered = props.songs || []
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(song => 
          song.name.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.album?.toLowerCase().includes(query)
        )
      }
      
      // Sort songs
      if (sortBy.value !== 'custom') {
        const sorted = [...filtered]
        switch (sortBy.value) {
          case 'title':
            sorted.sort((a, b) => a.name.localeCompare(b.name))
            break
          case 'artist':
            sorted.sort((a, b) => a.artist.localeCompare(b.artist))
            break
          case 'album':
            sorted.sort((a, b) => (a.album || '').localeCompare(b.album || ''))
            break
          case 'duration':
            sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0))
            break
          case 'dateAdded':
            sorted.sort((a, b) => (b.date_added || 0) - (a.date_added || 0))
            break
        }
        return sorted
      }
      
      return filtered
    })
    
    // Methods
    const formatDuration = (seconds) => {
      if (!seconds) return '0:00'
      const minutes = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
    
    const getArtworkUrl = (path) => {
      if (!path) return null
      const timestamp = new Date().getTime()
      return convertFileSrc(path) + '?t=' + timestamp
    }
    
    const handleImageError = (e) => {
      e.target.style.display = 'none'
    }
    
    const handleRowClick = (song, index, event) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCmd = isMac ? event.metaKey : event.ctrlKey
      const isShift = event.shiftKey
      
      if (isCmd) {
        if (selectedSongs.value.has(song.id)) {
          selectedSongs.value.delete(song.id)
        } else {
          selectedSongs.value.add(song.id)
        }
        lastSelectedIndex.value = index
      } else if (isShift && lastSelectedIndex.value !== -1) {
        const start = Math.min(lastSelectedIndex.value, index)
        const end = Math.max(lastSelectedIndex.value, index)
        
        if (!isCmd) {
          selectedSongs.value.clear()
        }
        
        for (let i = start; i <= end; i++) {
          selectedSongs.value.add(filteredSongs.value[i].id)
        }
      } else {
        if (selectedSongs.value.size > 0) {
          selectedSongs.value.clear()
        }
        highlightedSong.value = song
        lastSelectedIndex.value = index
      }
      
      selectedSongs.value = new Set(selectedSongs.value)
    }
    
    const clearSelection = () => {
      selectedSongs.value.clear()
      selectedSongs.value = new Set(selectedSongs.value)
    }
    
    const playSong = async (song) => {
      try {
        await playback.playSong(song, filteredSongs.value)
      } catch (error) {
        console.error('Failed to play song:', error)
      }
    }
    
    const playAll = async () => {
      if (filteredSongs.value.length === 0) return
      
      try {
        await playback.playSong(filteredSongs.value[0], filteredSongs.value)
      } catch (error) {
        console.error('Failed to play all:', error)
      }
    }
    
    const shufflePlay = async () => {
      if (filteredSongs.value.length === 0) return
      
      try {
        const shuffled = [...filteredSongs.value].sort(() => Math.random() - 0.5)
        await playback.playSong(shuffled[0], shuffled)
      } catch (error) {
        console.error('Failed to shuffle play:', error)
      }
    }
    
    const removeSelectedSongs = () => {
      const count = selectedSongs.value.size
      if (!confirm(`Remove ${count} songs from this playlist?`)) return
      
      selectedSongs.value.forEach(songId => {
        emit('remove-song', { playlistId: props.playlist.id, songId })
      })
      clearSelection()
    }
    
    const setSortBy = (value) => {
      sortBy.value = value
      showSortMenu.value = false
    }
    
    const showSongMenu = (song, event) => {
      openContextMenu(event, [song], 'song')
    }
    
    const showContextMenu = (song, event) => {
      emit('show-context-menu', event, [song], 'song')
    }
    
    const showMoreOptions = (event) => {
      contextMenuRef?.value?.show(event, [props.playlist], 'playlist')
    }
    
    // New method to edit the playlist using the unified modal
    const editPlaylist = () => {
      console.log('🎯 Editing playlist:', props.playlist)
      if (metadataEditor?.value) {
        metadataEditor.value.show({
          mode: 'edit',
          type: 'playlist',
          items: [props.playlist]
        })
      } else {
        // Fallback - emit to parent
        emit('edit-metadata', [props.playlist], 'playlist')
      }
    }
    
    // New method to edit selected songs using the unified modal
    const editSelectedSongs = () => {
      const songsToEdit = filteredSongs.value.filter(song => selectedSongs.value.has(song.id))
      console.log('🎯 Editing songs:', songsToEdit)
      
      if (metadataEditor?.value) {
        metadataEditor.value.show({
          mode: 'edit',
          type: 'song',
          items: songsToEdit
        })
      } else {
        // Fallback - emit to parent
        emit('edit-metadata', songsToEdit, 'song')
      }
    }
    
    const uploadPlaylistImage = async () => {
      try {
        const selected = await open({
          multiple: false,
          filters: [{
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
          }]
        })
        
        if (selected) {
          const imageData = await readBinaryFile(selected)
          const extension = selected.split('.').pop().toLowerCase()
          
          await invoke('save_playlist_artwork', {
            playlistId: props.playlist.id,
            imageData: Array.from(imageData),
            extension
          })
          
          toastStore.push({ message: 'Playlist cover updated!', type: 'success' })
          emit('refresh-library')
        }
      } catch (error) {
        console.error('Error uploading artwork:', error)
        toastStore.push({ message: `Error: ${error}`, type: 'error' })
      }
    }
    
    // Keyboard shortcuts
    const handleKeyboard = (e) => {
      if (e.target.tagName === 'INPUT') return
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        selectedSongs.value.clear()
        filteredSongs.value.forEach(song => selectedSongs.value.add(song.id))
        selectedSongs.value = new Set(selectedSongs.value)
      }
      if (e.key === 'Escape') {
        selectedSongs.value.clear()
        selectedSongs.value = new Set(selectedSongs.value)
        searchQuery.value = ''
      }
    }
    
    // Click outside to close menus
    const handleClickOutside = (e) => {
      if (!e.target.closest('.view-options')) {
        showSortMenu.value = false
      }
    }
    
    onMounted(() => {
      document.addEventListener('keydown', handleKeyboard)
      document.addEventListener('click', handleClickOutside)
    })
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboard)
      document.removeEventListener('click', handleClickOutside)
    })
    
    return {
      searchQuery,
      sortBy,
      showSortMenu,
      selectedSongs,
      highlightedSong,
      currentSong,
      filteredSongs,
      sortOptions,
      totalDuration,
      handleRowClick,
      clearSelection,
      playSong,
      playAll,
      shufflePlay,
      removeSelectedSongs,
      setSortBy,
      showSongMenu,
      showContextMenu,
      showMoreOptions,
      uploadPlaylistImage,
      editPlaylist,
      editSelectedSongs,
      formatDuration,
      getArtworkUrl,
      handleImageError
    }
  }
}
</script>

<style scoped>
.playlist-detail-view {
  height: 100%;
  overflow-y: auto;
  background: #000;
  color: white;
}

/* Hero Section */
.playlist-hero {
  position: relative;
  height: 30vh;
  min-height: 280px;
  max-height: 400px;
  display: flex;
  align-items: flex-end;
  padding: 0 32px 24px;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: brightness(0.4);
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent 0, rgba(0,0,0,0.5) 100%), 
              linear-gradient(rgba(0,0,0,0.1) 0, #000 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.playlist-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.7);
}

.playlist-name {
  font-size: clamp(32px, 5vw, 64px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  margin: 0 0 16px;
}

.playlist-info {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* Actions Section */
.actions-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 32px;
  background: linear-gradient(rgba(0,0,0,0.6) 0, #000 100%);
}

.play-button {
  width: 56px;
  height: 56px;
  background: #1db954;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.play-button:hover {
  transform: scale(1.04);
  background: #1ed760;
}

.play-button svg {
  width: 24px;
  height: 24px;
  color: #000;
  margin-left: 2px;
}

.action-button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-button:hover {
  color: white;
  transform: scale(1.04);
}

.action-button svg {
  width: 24px;
  height: 24px;
}

.upload-image-button,
.edit-button {
  margin-left: auto;
  padding: 11px 32px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 500px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-image-button:hover,
.edit-button:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.02);
}

.upload-image-button svg,
.edit-button svg {
  width: 20px;
  height: 20px;
}

.edit-button {
  margin-left: 12px;
}

/* Songs Container */
.songs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* Table Controls */
.table-controls {
  display: flex;
  gap: 16px;
  padding: 16px 32px;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.15s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.clear-search:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
}

/* View Options */
.view-options {
  position: relative;
}

.sort-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.sort-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.sort-button svg {
  width: 18px;
  height: 18px;
}

.sort-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 4px;
  min-width: 180px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.sort-option {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
}

.sort-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.sort-option.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 500;
}

/* Selection Actions */
.selection-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.ghost {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.action-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.action-btn.danger {
  color: #ff5555;
  border-color: rgba(255, 85, 85, 0.3);
}

.action-btn.danger:hover {
  background: rgba(255, 85, 85, 0.1);
  border-color: rgba(255, 85, 85, 0.5);
}

/* Empty States */
.empty-state,
.no-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state p,
.no-results p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

/* Table Header */
.table-header {
  display: grid;
  grid-template-columns: 50px 1fr 200px 200px 80px 50px;
  gap: 16px;
  padding: 12px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.02);
}

.col-duration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-duration svg {
  width: 16px;
  height: 16px;
}

/* Songs List */
.songs-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 32px;
}

/* Song Row */
.song-row {
  display: grid;
  grid-template-columns: 50px 1fr 200px 200px 80px 50px;
  gap: 16px;
  padding: 8px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  align-items: center;
  user-select: none;
}

.song-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.song-row.highlighted {
  background: rgba(255, 255, 255, 0.05);
}

.song-row.selected {
  background: rgba(255, 255, 255, 0.08);
}

.song-row.playing {
  color: #1db954;
}

/* Columns */
.col-number {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.track-number {
  opacity: 0.7;
}

.playing-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
}

.playing-indicator span {
  width: 3px;
  height: 12px;
  background: #1db954;
  border-radius: 3px;
  animation: playing 0.8s ease-in-out infinite;
}

.playing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.playing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes playing {
  0%, 100% { 
    height: 12px; 
    opacity: 0.8;
  }
  50% { 
    height: 4px; 
    opacity: 1;
  }
}

.col-title {
  overflow: hidden;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-artwork {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.song-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artwork-placeholder svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.song-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-artist,
.col-album {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-link {
  cursor: pointer;
  transition: all 0.15s ease;
}

.artist-link:hover {
  color: white;
  text-decoration: underline;
}

.col-duration {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
}

.col-actions {
  display: flex;
  justify-content: center;
}

.action-icon {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-icon:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.action-icon svg {
  width: 18px;
  height: 18px;
}

/* Scrollbar */
.songs-list::-webkit-scrollbar {
  width: 12px;
}

.songs-list::-webkit-scrollbar-track {
  background: transparent;
}

.songs-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.songs-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}

.playlist-detail-view::-webkit-scrollbar {
  width: 12px;
}

.playlist-detail-view::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-detail-view::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.playlist-detail-view::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}
</style>
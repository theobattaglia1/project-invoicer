<template>
  <div class="playlists-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Playlists</h1>
        <p v-if="selectedItems.length > 0" class="view-subtitle">
          {{ selectedItems.length }} selected
        </p>
      </div>
      
      <div class="header-controls">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search playlists..."
            class="search-input"
          >
        </div>
        
        <div class="header-actions">
          <button 
            v-if="selectedItems.length > 0" 
            class="action-btn ghost"
            @click="clearSelection"
          >
            Cancel
          </button>
          <button 
            v-if="selectedItems.length > 0" 
            class="action-btn ghost danger"
            @click="deleteSelectedPlaylists"
          >
            Delete
          </button>
          <button class="action-btn primary" @click="$emit('create-playlist')">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Playlist
          </button>
        </div>
      </div>
    </div>

    <!-- Playlists Grid -->
    <div class="playlists-grid" @click="handleBackgroundClick">
      <div 
        v-for="(playlist, index) in filteredPlaylists" 
        :key="playlist.id"
        class="playlist-card"
        :class="{ 
          selected: isSelected(playlist),
          highlighted: highlightedPlaylist?.id === playlist.id,
          'drag-over': dragOverPlaylistId === playlist.id
        }"
        @click="handlePlaylistClick(playlist, index, $event)"
        @mouseenter="highlightedPlaylist = playlist"
        @mouseleave="highlightedPlaylist = null"
        @contextmenu.prevent="showContextMenu($event, playlist)"
        @dragover.prevent="dragOverPlaylistId = playlist.id"
        @dragleave="dragOverPlaylistId = null"
        @drop.prevent="handleDrop(playlist.id, $event)"
      >
        <!-- Selection checkbox -->
        <div v-if="selectedItems.length > 0" class="selection-indicator">
          <input 
            type="checkbox" 
            :checked="isSelected(playlist)"
            @click.stop
            @change="toggleSelection(playlist, index, $event)"
          >
        </div>
        
        <!-- Playlist Cover -->
        <div class="playlist-cover">
          <div class="cover-content">
            <!-- Custom artwork -->
            <div v-if="playlist.artwork_path" class="cover-artwork">
              <img 
                :src="getArtworkUrl(playlist.artwork_path)" 
                :alt="playlist.name"
                @error="handleImageError"
              />
            </div>
            
            <!-- Song artwork collage -->
            <div v-else-if="getPlaylistArtworkCount(playlist) > 0" 
                 class="cover-collage" 
                 :data-count="getPlaylistArtworkCount(playlist)">
              <div 
                v-for="(artwork, i) in getPlaylistArtworksCached(playlist).slice(0, 4)" 
                :key="i"
                class="collage-item"
              >
                <img 
                  v-if="artwork" 
                  :src="getArtworkUrl(artwork)" 
                  :alt="`Cover ${i + 1}`"
                  @error="handleImageError"
                />
                <div v-else class="collage-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <!-- Default cover -->
            <div v-else class="cover-default">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
            </div>
            
            <!-- Play button -->
            <button 
              v-if="selectedItems.length === 0" 
              class="play-btn" 
              @click.stop="playPlaylist(playlist)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Playlist Info -->
        <div class="playlist-info">
          <h3 class="playlist-name">{{ playlist.name }}</h3>
          <p class="playlist-meta">{{ playlist.song_ids?.length || 0 }} songs</p>
        </div>
        
        <!-- Menu button -->
        <button 
          v-if="selectedItems.length === 0"
          class="playlist-menu" 
          @click.stop="showContextMenu($event, playlist)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>

      <!-- Create New Playlist Card -->
      <div class="playlist-card create-card" @click="$emit('create-playlist')">
        <div class="playlist-cover">
          <div class="cover-content create-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
        </div>
        <div class="playlist-info">
          <h3 class="playlist-name">Create New</h3>
          <p class="playlist-meta">Add a playlist</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useMusicStore } from '@/store/music'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'

const props = defineProps({
  playlists: Array,
  songs: Array,
  onFileDropToPlaylist: Function
})

const emit = defineEmits(['create-playlist', 'select-playlist', 'add-song-to-playlist', 'delete-playlists', 'update-playlist', 'play-playlist'])

const musicStore = useMusicStore()
const playback = usePlaybackIntegration()
const contextMenuRef = inject('contextMenu', null)

// State
const searchQuery = ref('')
const selectedIds = ref(new Set())
const lastSelectedIndex = ref(-1)
const highlightedPlaylist = ref(null)
const dragOverPlaylistId = ref(null)
const playlistArtworksCache = ref(new Map())

// Filtered playlists based on search
const filteredPlaylists = computed(() => {
  if (!searchQuery.value) return props.playlists
  
  const query = searchQuery.value.toLowerCase()
  return props.playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(query)
  )
})

// Selection logic
const selectedItems = computed(() => 
  filteredPlaylists.value.filter(playlist => selectedIds.value.has(playlist.id))
)

const isSelected = (playlist) => selectedIds.value.has(playlist.id)

const clearSelection = () => {
  selectedIds.value.clear()
  lastSelectedIndex.value = -1
  selectedIds.value = new Set(selectedIds.value)
}

const toggleSelection = (playlist, index, event) => {
  if (selectedIds.value.has(playlist.id)) {
    selectedIds.value.delete(playlist.id)
  } else {
    selectedIds.value.add(playlist.id)
  }
  lastSelectedIndex.value = index
  selectedIds.value = new Set(selectedIds.value)
}

// FIXED: Click handling with navigation
const handlePlaylistClick = (playlist, index, event) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const multiSelectKey = isMac ? event.metaKey : event.ctrlKey
  
  // If holding modifier keys, handle selection
  if (event.shiftKey && lastSelectedIndex.value !== -1) {
    // Range selection
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    
    if (!multiSelectKey) {
      selectedIds.value.clear()
    }
    
    for (let i = start; i <= end; i++) {
      selectedIds.value.add(filteredPlaylists.value[i].id)
    }
    selectedIds.value = new Set(selectedIds.value)
  } else if (multiSelectKey) {
    // Toggle selection with Cmd/Ctrl
    toggleSelection(playlist, index, event)
  } else {
    // Regular click - navigate to playlist
    // Only navigate if we're not in selection mode
    if (selectedItems.value.length === 0) {
      emit('navigate-to-playlist', playlist.id)
    } else {
      // If in selection mode, just clear selection
      clearSelection()
    }
  }
}

const handleBackgroundClick = (event) => {
  if (event.target.classList.contains('playlists-grid')) {
    clearSelection()
    highlightedPlaylist.value = null
  }
}

// Context menu
const showContextMenu = (event, playlist) => {
  if (!isSelected(playlist)) {
    clearSelection()
    selectedIds.value.add(playlist.id)
    selectedIds.value = new Set(selectedIds.value)
  }
  
  const items = selectedItems.value.length > 0 ? selectedItems.value : [playlist]
  contextMenuRef?.value?.show(event, items, 'playlist')
}

// Playlist actions
const playPlaylist = async (playlist) => {
  const playlistSongs = props.songs?.filter(s => 
    playlist.song_ids?.includes(s.id)
  ) || []
  
  if (playlistSongs.length > 0) {
    await playback.playSong(playlistSongs[0], playlistSongs)
  }
}

const deleteSelectedPlaylists = () => {
  if (confirm(`Delete ${selectedItems.value.length} playlists?`)) {
    emit('delete-playlists', selectedItems.value)
    clearSelection()
  }
}

// Artwork handling
const getArtworkUrl = (path) => {
  if (!path) return null
  
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('asset://')) {
    return path
  }
  
  try {
    const convertedUrl = convertFileSrc(path)
    return convertedUrl
  } catch (error) {
    console.error('Error converting path:', error)
    return null
  }
}

const handleImageError = (e) => {
  e.target.style.display = 'none'
}

// Get artwork from songs in playlist
const getPlaylistArtworks = (playlist) => {
  if (!playlist.song_ids || !props.songs) return []
  
  const artworks = []
  for (const songId of playlist.song_ids) {
    const song = props.songs.find(s => s.id === songId)
    if (song) {
      const artworkPath = song.artwork_path || song.cover_path || song.album_artwork
      if (artworkPath && !artworks.includes(artworkPath)) {
        artworks.push(artworkPath)
        if (artworks.length >= 4) break
      }
    }
  }
  
  return artworks
}

// Cached version to prevent multiple calculations
const getPlaylistArtworksCached = (playlist) => {
  if (!playlistArtworksCache.value.has(playlist.id)) {
    playlistArtworksCache.value.set(playlist.id, getPlaylistArtworks(playlist))
  }
  return playlistArtworksCache.value.get(playlist.id)
}

const getPlaylistArtworkCount = (playlist) => {
  return getPlaylistArtworksCached(playlist).length
}

// Drag and drop
const handleDrop = async (playlistId, e) => {
  dragOverPlaylistId.value = null
  
  // Check if it's files
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const files = [...e.dataTransfer.files].map(f => f.path)
    if (props.onFileDropToPlaylist) {
      props.onFileDropToPlaylist(playlistId, files)
    }
    return
  }
  
  // Check if it's songs from within the app
  try {
    const data = e.dataTransfer.getData('application/json')
    if (data) {
      const items = JSON.parse(data)
      if (items[0]?.type === 'song' || items[0]?.path) {
        const songIds = items.map(item => item.id).filter(Boolean)
        if (songIds.length > 0) {
          emit('add-songs-to-playlist', playlistId, songIds)
        }
      }
    }
  } catch (err) {
    console.error('Drop error:', err)
  }
}

// Keyboard shortcuts
const handleKeyboard = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
    e.preventDefault()
    filteredPlaylists.value.forEach(playlist => selectedIds.value.add(playlist.id))
    selectedIds.value = new Set(selectedIds.value)
  }
  if (e.key === 'Escape') {
    clearSelection()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboard)
})

// Clear cache when data changes
watch(() => [props.playlists, props.songs], () => {
  playlistArtworksCache.value.clear()
})
</script>

<style scoped>
/* Keep all the existing styles - they're perfect */
.playlists-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: white;
}

/* Header */
.view-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(18, 18, 18, 0.4);
  backdrop-filter: blur(20px);
}

.header-content {
  margin-bottom: 20px;
}

.view-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}

.view-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.header-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-box svg {
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
  padding: 10px 16px 10px 48px;
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

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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

.action-btn.primary {
  background: white;
  color: black;
}

.action-btn.primary:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
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

/* Playlists Grid */
.playlists-grid {
  padding: 32px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  overflow-y: auto;
  flex: 1;
}

.playlist-card {
  position: relative;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.playlist-card:hover {
  transform: translateY(-4px);
}

.playlist-card.selected {
  transform: scale(1.02);
}

.playlist-card.drag-over {
  transform: scale(1.02);
}

.selection-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

.selection-indicator input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: white;
}

/* Playlist Cover */
.playlist-cover {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
  margin-bottom: 16px;
}

.playlist-card.selected .playlist-cover {
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.playlist-card.drag-over .playlist-cover {
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
}

.cover-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Artwork styles */
.cover-artwork {
  width: 100%;
  height: 100%;
}

.cover-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Collage for playlists without custom artwork */
.cover-collage {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.collage-item {
  position: relative;
  overflow: hidden;
}

/* Collage layouts based on image count */
.cover-collage[data-count="1"] {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.cover-collage[data-count="2"] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

.cover-collage[data-count="3"] .collage-item:nth-child(1) {
  grid-column: 1 / -1;
}

.collage-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collage-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}

.collage-placeholder svg {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.2);
}

/* Default cover */
.cover-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
}

.cover-default svg {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.3);
}

/* Play button */
.play-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.15s ease;
}

.playlist-card:hover .play-btn {
  opacity: 1;
  transform: scale(1);
}

.play-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.06);
}

.play-btn svg {
  width: 20px;
  height: 20px;
  margin-left: 2px;
}

/* Playlist Info */
.playlist-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.playlist-name {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-meta {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* Menu button */
.playlist-menu {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
  z-index: 2;
}

.playlist-card:hover .playlist-menu {
  opacity: 1;
}

.playlist-menu:hover {
  background: rgba(0, 0, 0, 0.8);
}

.playlist-menu svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.8);
}

/* Create New Card */
.create-card {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.15s ease;
}

.create-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-4px);
}

.create-content {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.create-content svg {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.3);
}

.create-card .playlist-name {
  color: rgba(255, 255, 255, 0.8);
}

.create-card .playlist-meta {
  color: rgba(255, 255, 255, 0.5);
}

/* Scrollbar */
.playlists-grid::-webkit-scrollbar {
  width: 12px;
}

.playlists-grid::-webkit-scrollbar-track {
  background: transparent;
}

.playlists-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.playlists-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}
</style>
<!-- File: src/components/ArtistsView.vue -->
<template>
  <div class="artists-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Artists</h1>
        <p class="view-subtitle" v-if="selectedItems.length > 0">
          {{ selectedItems.length }} selected
        </p>
      </div>
      
      <div class="header-controls">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 
                     16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 
                     5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79
                     l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5
                     S7.01 5 9.5 5 14 7.01 14 9.5
                     11.99 14 9.5 14z"/>
          </svg>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search artists..."
            class="search-input"
          />
        </div>
        
        <div class="header-actions">
          <button 
            v-if="selectedItems.length > 0" 
            class="action-btn ghost"
            @click="clearSelection"
          >
            Cancel
          </button>
          <!-- EMIT the same event that App.vue is listening for: -->
          <button 
            class="action-btn primary" 
            @click="$emit('open-add-modal', 'artist')"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Artist
          </button>
        </div>
      </div>
    </div>

    <!-- Artists Grid -->
    <div class="artists-grid" @click="handleBackgroundClick">
      <div 
        v-for="(artist, index) in filteredArtists" 
        :key="artist.id"
        class="artist-card"
        :class="{ 
          selected: isSelected(artist),
          highlighted: highlightedArtist?.id === artist.id,
          'drag-over': dragOverArtistId === artist.id 
        }"
        :draggable="true"
        @dragstart="onDragStart(artist, index, $event)"
        @dragend="onDragEnd"
        @click="handleArtistClick(artist, index, $event)"
        @contextmenu.prevent="showContextMenu($event, artist)"
        @mouseenter="highlightedArtist = artist"
        @mouseleave="highlightedArtist = null"
        @dragover.prevent="dragOverArtistId = artist.id"
        @dragleave="dragOverArtistId = null"
        @drop.prevent="handleFileDropToArtist(artist, $event)"
      >
        <!-- Selection checkbox -->
        <div v-if="selectedItems.length > 0" class="selection-indicator">
          <input 
            type="checkbox" 
            :checked="isSelected(artist)"
            @click.stop
            @change="toggleSelection(artist, index, $event)"
          />
        </div>
        
        <!-- Artist image -->
        <div class="artist-image">
          <img 
            v-if="artist.image_path || artist.artwork_path" 
            :src="getArtworkUrl(artist.artwork_path || artist.image_path)" 
            :alt="artist.name"
            @error="handleImageError"
          />
          <div v-else class="image-placeholder">
            {{ artist.name.charAt(0).toUpperCase() }}
          </div>
          
          <!-- Play button -->
          <button class="play-btn" @click.stop="playArtist(artist)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
        
        <!-- Artist info -->
        <div class="artist-info">
          <h3 class="artist-name">{{ artist.name }}</h3>
          <p class="artist-meta">
            <span v-if="artist.genre">{{ artist.genre }}</span>
            <span v-else-if="getArtistSongCount(artist) > 0">
              {{ getArtistSongCount(artist) }} songs
            </span>
            <span v-else>No songs</span>
          </p>
        </div>
        
        <!-- Menu button -->
        <button 
          v-if="selectedItems.length === 0"
          class="artist-menu" 
          @click.stop="showContextMenu($event, artist)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2
                     -2 .9-2 2 .9 2 2 2zm0 2
                     c-1.1 0-2 .9-2 2s.9 2 2 2
                     2-.9 2-2-.9-2-2-2zm0 6
                     c-1.1 0-2 .9-2 2s.9 2 2 2
                     2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
      
      <!-- Add Artist Card -->
      <div 
        class="artist-card add-card" 
        @click="$emit('open-add-modal', 'artist')"
      >
        <div class="artist-image">
          <div class="add-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
        </div>
        <div class="artist-info">
          <h3 class="artist-name">Add New</h3>
          <p class="artist-meta">Create artist</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useSelection } from '@/composables/useSelection'
import { useDragDropStore } from '@/store/dragdrop'
import { useMusicStore } from '@/store/music'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'

const props = defineProps({
  artists: Array,
  songs: Array,
  onFileDropToArtist: Function
})

const emit = defineEmits([ 
  // We no longer need to emit 'add-artist'; 
  // instead, we emit 'open-add-modal' (caught by App.vue).
  'open-add-modal', 
  'select-artist', 
  'update-artist', 
  'delete-artists' 
])

const searchQuery = ref('')
const dragOverArtistId = ref(null)
const highlightedArtist = ref(null)
const dragStore = useDragDropStore()
const musicStore = useMusicStore()
const playback = usePlaybackIntegration()

// Inject the ContextMenu ref from App.vue
const contextMenuRef = inject('contextMenu', null)

const filteredArtists = computed(() => {
  if (!searchQuery.value) return props.artists
  const query = searchQuery.value.toLowerCase()
  return props.artists.filter(artist => 
    artist.name.toLowerCase().includes(query) ||
    (artist.genre && artist.genre.toLowerCase().includes(query))
  )
})

// Use selection composable
const {
  selectedIds,
  selectedItems,
  isSelected,
  clearSelection,
  toggleSelection,
  selectAll
} = useSelection(filteredArtists, artist => artist.id)

// Navigate (or multi‐select) on click
const handleArtistClick = (artist, index, event) => {
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const multiSelectKey = isMac ? event.metaKey : event.ctrlKey

  if (event.shiftKey || multiSelectKey) {
    toggleSelection(artist, index, event)
  } else {
    if (selectedItems.value.length === 0) {
      emit('navigate-to-artist', artist.id)
    } else {
      clearSelection()
    }
  }
}

const handleBackgroundClick = (event) => {
  if (event.target.classList.contains('artists-grid')) {
    clearSelection()
    highlightedArtist.value = null
  }
}

// Right‐click context menu
const showContextMenu = (event, artist) => {
  if (!isSelected(artist)) {
    clearSelection()
    toggleSelection(artist, 0, event)
  }
  const items = selectedItems.value.length > 0 
    ? selectedItems.value 
    : [artist]

  contextMenuRef?.value?.show(event, items, 'artist')
}

// Play all songs by that artist
const playArtist = async (artist) => {
  const artistSongs = props.songs
    ?.filter(song => song.artist?.toLowerCase() === artist.name.toLowerCase())
    || []

  if (artistSongs.length > 0) {
    await playback.playSong(artistSongs[0], artistSongs)
  }
}

const getArtistSongCount = (artist) => {
  if (!props.songs) return 0
  return props.songs.filter(song => 
    song.artist?.toLowerCase() === artist.name.toLowerCase()
  ).length
}

// Drag & Drop
const onDragStart = (artist, index, event) => {
  const itemsToDrag = isSelected(artist) 
    ? selectedItems.value 
    : [artist]

  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('text/plain', 'artists')
  event.dataTransfer.setData('application/json', JSON.stringify(itemsToDrag))

  dragStore.startDrag(itemsToDrag, 'artists')
}

const onDragEnd = () => {
  dragStore.endDrag()
}

const handleFileDropToArtist = (artist, e) => {
  dragOverArtistId.value = null
  const files = e.dataTransfer.files
  if (files && files.length > 0) {
    const filePaths = Array.from(files).map(f => f.path || f.name)
    if (props.onFileDropToArtist) {
      props.onFileDropToArtist(artist.id, filePaths)
    }
  }
}

// Resolve local file → `file://` URL for Tauri
const getArtworkUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  try {
    const url = convertFileSrc(path)
    const cacheBuster = new Date().getTime()
    return `${url}?t=${cacheBuster}`
  } catch (error) {
    console.error('Error converting artwork path:', error)
    return null
  }
}

const handleImageError = (e) => {
  e.target.style.display = 'none'
}

// Keyboard shortcuts: ⌘+A to select all, Esc to clear
const handleKeyboard = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    selectAll()
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
</script>

<style scoped>
/* (all existing styles unchanged) */
.artists-view {
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

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

.artist-card {
  position: relative;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.artist-card:hover {
  transform: translateY(-4px);
}

.artist-card.selected {
  transform: scale(1.02);
}

.artist-card.drag-over {
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

/* Artist Image */
.artist-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 16px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
}

.artist-card.selected .artist-image {
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.artist-card.drag-over .artist-image {
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  font-weight: 700;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  color: rgba(255, 255, 255, 0.4);
}

.artist-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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

.artist-card:hover .play-btn {
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

/* Artist Info */
.artist-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.artist-name {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-meta {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* Menu Button */
.artist-menu {
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

.artist-card:hover .artist-menu {
  opacity: 1;
}

.artist-menu:hover {
  background: rgba(0, 0, 0, 0.8);
}

.artist-menu svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.8);
}

/* Add Card */
.add-card {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.15s ease;
}

.add-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-4px);
}

.add-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.add-placeholder svg {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.3);
}

.add-card .artist-name {
  color: rgba(255, 255, 255, 0.8);
}

.add-card .artist-meta {
  color: rgba(255, 255, 255, 0.5);
}

/* Scrollbar */
.artists-grid::-webkit-scrollbar {
  width: 12px;
}

.artists-grid::-webkit-scrollbar-track {
  background: transparent;
}

.artists-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.artists-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}
</style>

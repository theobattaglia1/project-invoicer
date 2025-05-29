<!-- src/components/ContextMenu.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="context-menu-overlay"
      @contextmenu.prevent
      @click="hide"
    >
      <div
        class="context-menu"
        :style="menuStyle"
        @click.stop
      >
        <!-- Heading when multiple items are selected -->
        <div v-if="items.length > 1" class="context-menu-header">
          <span>{{ items.length }} {{ typeLabel }}s selected</span>
        </div>

        <!-- Universal options -->
        <button class="context-menu-item" @click="editMetadata">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Edit {{ typeLabel }} Metadata…
        </button>

        <template v-if="type === 'song'">
          <button class="context-menu-item" @click="play">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          </button>
          <button class="context-menu-item" @click="addToQueue">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
            Add to Queue
          </button>

          <!-- Playlist sub‑menu -->
          <div class="context-menu-item with-submenu" @mouseenter="showPlaylistSub = true" @mouseleave="showPlaylistSub = false">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add to Playlist
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-left: auto;">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
            <div v-if="showPlaylistSub" class="playlist-submenu" ref="playlistSub">
              <button
                v-for="p in playlists"
                :key="p.id"
                class="playlist-item"
                @click="addToExistingPlaylist(p.id)"
              >
                <span class="playlist-color" :style="{ backgroundColor: p.color || '#FF6B6B' }"></span>
                {{ p.name }}
              </button>
              <button class="playlist-item new" @click="createPlaylist">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                New Playlist
              </button>
            </div>
          </div>

          <div class="context-menu-separator"></div>

          <button class="context-menu-item" @click="copyPath">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy File Path
          </button>
          
          <div class="context-menu-separator"></div>
          
          <button class="context-menu-item destructive" @click="deleteItems">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>
        </template>

        <template v-if="type === 'playlist'">
          <button class="context-menu-item" @click="play">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          </button>
          <button class="context-menu-item" @click="shuffle">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
            Shuffle
          </button>
          <button class="context-menu-item" @click="uploadImage">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
            </svg>
            Upload Cover
          </button>
          
          <div class="context-menu-separator"></div>
          
          <button class="context-menu-item destructive" @click="deleteItems">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>
        </template>

        <template v-if="type === 'artist'">
          <button class="context-menu-item" @click="play">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          </button>
          <button class="context-menu-item" @click="shuffle">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
            Shuffle
          </button>
          <button class="context-menu-item" @click="uploadImage">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
            </svg>
            Upload Image
          </button>
          
          <div class="context-menu-separator"></div>
          
          <button class="context-menu-item destructive" @click="deleteItems">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, inject, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { writeText } from '@tauri-apps/api/clipboard'
import { useMusicStore } from '@/store/music'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'
import { useToastStore } from '@/store/toast'

// Inject the metadata editor
const metadataEditor = inject('metadataEditor', null)

// Stores
const musicStore = useMusicStore()
const toastStore = useToastStore()
const playback = usePlaybackIntegration()

// State
const isVisible = ref(false)
const position = ref({ x: 0, y: 0 })
const items = ref([])
const type = ref('song')
const showPlaylistSub = ref(false)

// Computed
const playlists = computed(() => musicStore.playlists || [])

const typeLabel = computed(() => {
  const map = { song: 'Song', playlist: 'Playlist', artist: 'Artist' }
  return map[type.value] || 'Item'
})

const menuStyle = computed(() => {
  const menuWidth = 240
  const menuHeight = 300 // Approximate
  
  let x = position.value.x
  let y = position.value.y
  
  // Prevent menu from going off-screen
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10
  }
  
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10
  }
  
  return {
    left: x + 'px',
    top: y + 'px'
  }
})

// Methods
function show(event, _items, _type = 'song') {
  event.preventDefault()
  items.value = Array.isArray(_items) ? _items : [_items]
  type.value = _type
  position.value = { x: event.clientX, y: event.clientY }
  isVisible.value = true
  
  // Add escape key listener
  document.addEventListener('keydown', onEscape)
  
  // Ensure menu is positioned correctly after render
  nextTick(() => {
    // Additional positioning logic if needed
  })
}

function hide() {
  isVisible.value = false
  showPlaylistSub.value = false
  document.removeEventListener('keydown', onEscape)
}

function onEscape(e) { 
  if (e.key === 'Escape') hide() 
}

// Action handlers
function editMetadata() { 
  hide()
  if (metadataEditor?.value) {
    metadataEditor.value.show({
      mode: 'edit',
      type: type.value,
      items: items.value
    })
  }
}

function play() {
  hide()
  if (type.value === 'song') {
    playback.playSong(items.value[0])
  } else if (type.value === 'playlist') {
    musicStore.playPlaylist(items.value[0].id)
  } else if (type.value === 'artist') {
    musicStore.playArtist(items.value[0].id)
  }
}

function shuffle() {
  hide()
  if (type.value === 'playlist') {
    musicStore.shufflePlaylist(items.value[0].id)
  } else if (type.value === 'artist') {
    musicStore.shuffleArtist(items.value[0].id)
  }
}

function addToQueue() { 
  hide()
  playback.addToQueue(items.value)
  toastStore.push({ 
    message: `Added ${items.value.length} song${items.value.length > 1 ? 's' : ''} to queue`, 
    type: 'success' 
  })
}

async function copyPath() { 
  hide()
  if (items.value[0]?.file_path) {
    try {
      await writeText(items.value[0].file_path)
      toastStore.push({ message: 'Path copied to clipboard', type: 'success' })
    } catch (error) {
      toastStore.push({ message: 'Failed to copy path', type: 'error' })
    }
  }
}

async function deleteItems() { 
  hide()
  
  const confirmMessage = items.value.length > 1 
    ? `Delete ${items.value.length} ${type.value}s?`
    : `Delete "${items.value[0].name}"?`
    
  if (!confirm(confirmMessage)) return
  
  try {
    if (type.value === 'song') {
      for (const song of items.value) {
        await invoke('delete_song', { songId: song.id })
      }
    } else if (type.value === 'playlist') {
      for (const playlist of items.value) {
        await invoke('delete_playlist', { playlistId: playlist.id })
      }
    } else if (type.value === 'artist') {
      for (const artist of items.value) {
        await invoke('delete_artist', { artistId: artist.id })
      }
    }
    
    toastStore.push({ 
      message: `Deleted ${items.value.length} ${type.value}${items.value.length > 1 ? 's' : ''}`, 
      type: 'success' 
    })
    
    // Refresh library
    window.dispatchEvent(new CustomEvent('library-updated'))
  } catch (error) {
    toastStore.push({ message: `Failed to delete: ${error}`, type: 'error' })
  }
}

async function addToExistingPlaylist(playlistId) { 
  hide()
  try {
    const songIds = items.value.map(s => s.id)
    await invoke('add_songs_to_playlist', { 
      playlistId: playlistId,
      songIds: songIds
    })
    
    toastStore.push({ 
      message: `Added ${items.value.length} song${items.value.length > 1 ? 's' : ''} to playlist`, 
      type: 'success' 
    })
    
    // Refresh library
    window.dispatchEvent(new CustomEvent('library-updated'))
  } catch (error) {
    toastStore.push({ message: `Failed to add to playlist: ${error}`, type: 'error' })
  }
}

function createPlaylist() { 
  hide()
  // Open the modal for creating a new playlist with these songs
  if (metadataEditor?.value) {
    metadataEditor.value.show({
      mode: 'create',
      type: 'playlist',
      tab: 'playlist',
      defaults: {
        songIds: items.value.map(s => s.id)
      }
    })
  }
}

async function uploadImage() {
  hide()
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
      
      if (type.value === 'playlist') {
        await invoke('save_playlist_artwork', {
          playlistId: items.value[0].id,
          imageData: Array.from(imageData),
          extension
        })
      } else if (type.value === 'artist') {
        await invoke('save_artist_image', {
          artistId: items.value[0].id,
          imageData: Array.from(imageData),
          extension
        })
      }
      
      toastStore.push({ message: 'Image uploaded successfully!', type: 'success' })
      window.dispatchEvent(new CustomEvent('library-updated'))
    }
  } catch (error) {
    toastStore.push({ message: `Failed to upload image: ${error}`, type: 'error' })
  }
}

// Expose the show method
defineExpose({ show })
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
}

.context-menu {
  position: absolute;
  min-width: 240px;
  background: rgba(20, 20, 23, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
  overflow: hidden;
}

.context-menu-header {
  padding: 8px 12px;
  font-weight: 600;
  opacity: 0.7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
}

.context-menu-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 8px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  gap: 12px;
  background: none;
  border: none;
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  position: relative;
}

.context-menu-item:hover { 
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.with-submenu:hover {
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.destructive { 
  color: #ff6b6b;
}

.context-menu-item.destructive:hover {
  background: rgba(255, 107, 107, 0.1);
}

/* Playlist submenu */
.playlist-submenu {
  position: absolute;
  top: -4px;
  left: calc(100% + 4px);
  background: rgba(20, 20, 23, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 10001;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: left;
  transition: all 0.15s ease;
}

.playlist-item:hover { 
  background: rgba(255, 255, 255, 0.08);
}

.playlist-item.new {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 4px;
  padding-top: 12px;
  color: #4ECDC4;
}

.playlist-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Scrollbar */
.playlist-submenu::-webkit-scrollbar {
  width: 6px;
}

.playlist-submenu::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-submenu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.playlist-submenu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
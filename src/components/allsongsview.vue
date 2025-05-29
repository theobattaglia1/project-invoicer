<template>
  <div class="songs-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Songs</h1>
        <p class="view-subtitle">
          {{ totalSongs }} songs
          <span v-if="selectedSongs.size > 0" class="selection-count">
            • {{ selectedSongs.size }} selected
          </span>
        </p>
      </div>

      <!-- Search and Actions -->
      <div class="header-controls">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search songs..."
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
      </div>

      <!-- Action Buttons -->
      <div class="header-actions">
        <div v-if="selectedSongs.size > 0" class="selection-actions">
          <button class="action-btn ghost" @click="clearSelection">
            Cancel
          </button>
          <button class="action-btn ghost" @click="editSelectedSongs">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit Metadata
          </button>
          <button class="action-btn ghost" @click="showAddToPlaylistModal">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
            </svg>
            Add to Playlist
          </button>
          <button class="action-btn ghost danger" @click="deleteSelectedSongs">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>
        </div>
        
        <div v-else class="playback-actions">
          <button class="action-btn primary" @click="playAll">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play All
          </button>
          <button class="action-btn ghost" @click="shufflePlay">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
            Shuffle
          </button>
        </div>
      </div>
    </div>

    <!-- Songs Table -->
    <div class="songs-container">
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
      <div 
        ref="scrollerRef" 
        class="songs-list"
        @scroll="handleScroll"
        @drop.prevent="handleDrop"
        @dragover.prevent="handleDragOver"
        @dragleave="isDraggingOver = false"
      >
        <div :style="{ height: totalHeight + 'px', position: 'relative' }">
          <div
            v-for="(song, index) in visibleSongs"
            :key="song.id"
            class="song-row"
            :style="{
              position: 'absolute',
              top: (song._index * rowHeight) + 'px',
              left: 0,
              right: 0,
              height: rowHeight + 'px'
            }"
            :class="{ 
              selected: selectedSongs.has(song.id),
              playing: currentSong?.id === song.id,
              highlighted: highlightedSong?.id === song.id
            }"
            :draggable="true"
            @click="handleRowClick(song, song._index, $event)"
            @dblclick="playSong(song)"
            @mouseenter="highlightedSong = song"
            @mouseleave="highlightedSong = null"
            @dragstart="handleDragStart(song, $event)"
            @dragend="handleDragEnd"
            @contextmenu.prevent="showContextMenu(song, $event)"
          >
            <div class="col-number">
              <span v-if="currentSong?.id !== song.id" class="track-number">
                {{ song._index + 1 }}
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
      </div>
    </div>

    <!-- Drop Zone Overlay -->
    <div v-if="isDraggingOver" class="drop-overlay">
      <div class="drop-content">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
        </svg>
        <p>Drop files to import</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import { useToastStore } from '@/store/toast'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { invoke } from '@tauri-apps/api/tauri'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'

function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

export default {
  name: 'AllSongsView',
  props: {
    songs: {
      type: Array,
      required: true
    },
    onFileDrop: Function
  },
  emits: ['navigate-to-artist'],
  setup(props, { emit }) {
    const toastStore = useToastStore()
    const playback = usePlaybackIntegration()
    
    // Inject the global refs
    const contextMenuRef = inject('contextMenu', null)
    const metadataEditor = inject('metadataEditor', null)

    // Refs
    const scrollerRef = ref(null)
    const searchQuery = ref('')
    const debouncedSearchQuery = ref('')
    const sortBy = ref('title')
    const showSortMenu = ref(false)
    const selectedSongs = ref(new Set())
    const highlightedSong = ref(null)
    const lastSelectedIndex = ref(-1)
    const isDraggingOver = ref(false)

    // Virtual scrolling
    const scrollTop = ref(0)
    const containerHeight = ref(600)
    const rowHeight = 56
    const buffer = 5

    // Sort options
    const sortOptions = [
      { value: 'title', label: 'Title' },
      { value: 'artist', label: 'Artist' },
      { value: 'album', label: 'Album' },
      { value: 'duration', label: 'Duration' },
      { value: 'dateAdded', label: 'Date Added' }
    ]

    // Computed
    const totalSongs = computed(() => props.songs.length)
    const currentSong = computed(() => playback.currentSong.value)

    // Debounced search
    const updateDebouncedSearch = debounce((value) => {
      debouncedSearchQuery.value = value.toLowerCase()
    }, 300)

    watch(searchQuery, (newValue) => {
      updateDebouncedSearch(newValue)
    })

    const filteredSongs = computed(() => {
      const query = debouncedSearchQuery.value
      let filtered = props.songs

      if (query) {
        filtered = filtered.filter(song => 
          song.name.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.album?.toLowerCase().includes(query)
        )
      }

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

      return sorted.map((song, index) => ({ ...song, _index: index }))
    })

    const totalHeight = computed(() => filteredSongs.value.length * rowHeight)

    const visibleSongs = computed(() => {
      const start = Math.max(0, Math.floor(scrollTop.value / rowHeight) - buffer)
      const end = Math.min(
        filteredSongs.value.length,
        Math.ceil((scrollTop.value + containerHeight.value) / rowHeight) + buffer
      )
      
      return filteredSongs.value.slice(start, end)
    })

    // Methods
    const handleScroll = (event) => {
      scrollTop.value = event.target.scrollTop
    }

    const updateContainerHeight = () => {
      if (scrollerRef.value) {
        containerHeight.value = scrollerRef.value.clientHeight
      }
    }

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
        toastStore.push({ 
          message: `Failed to play ${song.name}`, 
          type: 'error' 
        })
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

    const deleteSelectedSongs = async () => {
      const count = selectedSongs.value.size
      if (!confirm(`Delete ${count} songs? This cannot be undone.`)) return

      try {
        for (const songId of selectedSongs.value) {
          await invoke('delete_song', { songId })
        }
        selectedSongs.value.clear()
        toastStore.push({ 
          message: `Deleted ${count} songs`, 
          type: 'success' 
        })
        // Refresh library
        window.dispatchEvent(new CustomEvent('library-updated'))
      } catch (error) {
        toastStore.push({ 
          message: `Failed to delete songs: ${error}`, 
          type: 'error' 
        })
      }
    }

    const setSortBy = (value) => {
      sortBy.value = value
      showSortMenu.value = false
    }

    const showSongMenu = (song, event) => {
      if (contextMenuRef?.value) {
        contextMenuRef.value.show(event, [song], 'song')
      } else {
        console.warn('Context menu ref not available')
      }
    }

    const showContextMenu = (song, event) => {
      if (contextMenuRef?.value) {
        const items = selectedSongs.value.has(song.id) 
          ? Array.from(selectedSongs.value).map(id => 
              filteredSongs.value.find(s => s.id === id)
            ).filter(Boolean)
          : [song]
        contextMenuRef.value.show(event, items, 'song')
      } else {
        console.warn('Context menu ref not available')
      }
    }

    const editSelectedSongs = () => {
      const songs = Array.from(selectedSongs.value).map(id => 
        filteredSongs.value.find(s => s.id === id)
      ).filter(Boolean)
      
      if (metadataEditor?.value) {
        metadataEditor.value.show({
          mode: 'edit',
          type: 'song',
          items: songs
        })
      }
    }

    const showAddToPlaylistModal = () => {
      console.log('Show add to playlist modal')
      // You could implement this to show a playlist selection modal
      // or use the context menu approach
    }

    // Drag and drop
    const handleDragStart = (song, event) => {
      const items = selectedSongs.value.has(song.id) 
        ? Array.from(selectedSongs.value).map(id => 
            filteredSongs.value.find(s => s.id === id)
          ).filter(Boolean)
        : [song]

      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/plain', 'internal-drag:songs')
      event.dataTransfer.setData('application/x-music-player-songs', JSON.stringify({ items }))
    }

    const handleDragEnd = () => {
      // Clean up
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      isDraggingOver.value = true
    }

    const handleDrop = async (e) => {
      isDraggingOver.value = false

      if (e.dataTransfer.files?.length && props.onFileDrop) {
        const filePaths = Array.from(e.dataTransfer.files).map(f => f.path)
        await props.onFileDrop(filePaths)
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

    // Resize observer
    let resizeObserver = null

    onMounted(() => {
      document.addEventListener('keydown', handleKeyboard)
      document.addEventListener('click', handleClickOutside)
      
      updateContainerHeight()
      
      if (scrollerRef.value) {
        resizeObserver = new ResizeObserver(() => {
          updateContainerHeight()
        })
        resizeObserver.observe(scrollerRef.value)
      }
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboard)
      document.removeEventListener('click', handleClickOutside)
      
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    })

    return {
      scrollerRef,
      searchQuery,
      sortBy,
      showSortMenu,
      selectedSongs,
      highlightedSong,
      isDraggingOver,
      currentSong,
      totalSongs,
      filteredSongs,
      visibleSongs,
      totalHeight,
      sortOptions,
      rowHeight,
      handleScroll,
      formatDuration,
      getArtworkUrl,
      handleImageError,
      handleRowClick,
      clearSelection,
      playSong,
      playAll,
      shufflePlay,
      deleteSelectedSongs,
      editSelectedSongs,
      setSortBy,
      showSongMenu,
      showContextMenu,
      showAddToPlaylistModal,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDrop
    }
  }
}
</script>

<style scoped>
.songs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
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
  margin-bottom: 24px;
}

.view-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.view-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.selection-count {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* Header Controls */
.header-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
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

/* Action Buttons */
.header-actions {
  display: flex;
  gap: 12px;
}

.selection-actions,
.playback-actions {
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

/* Songs Container */
.songs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
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

/* Drop Overlay */
.drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.drop-content {
  text-align: center;
}

.drop-content svg {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
}

.drop-content p {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
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
</style>
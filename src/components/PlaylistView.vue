<template>
  <div class="playlist-view">
    <!-- Playlist Header -->
    <div class="playlist-header">
      <div class="playlist-cover">
        <div class="cover-grid">
          <div v-for="i in 4" :key="i" class="grid-item">
            <svg viewBox="0 0 100 100" class="artwork-placeholder">
              <rect width="100" height="100" :fill="`url(#grad${i})`"/>
              <path d="M50 30v20.55c-1.18-.68-2.54-1.1-4-1.1-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8V40h8V30H50z" fill="rgba(255,255,255,0.2)"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="playlist-info">
        <p class="playlist-label">Playlist{{ playlist?.artistName ? ' • ' + playlist.artistName : '' }}</p>
        <h1 class="playlist-name">{{ playlist?.name }}</h1>
        <p class="playlist-description" v-if="playlist?.description">{{ playlist.description }}</p>
        <div class="playlist-meta">
          <img v-if="creator?.image" :src="creator.image" :alt="creator.name" class="creator-avatar">
          <span class="creator-name">{{ creator?.name || 'Unknown' }}</span>
          <span class="meta-separator">•</span>
          <span>{{ songs.length }} songs, {{ totalDuration }}</span>
        </div>
        
        <div class="playlist-actions">
          <button class="play-button" @click="playPlaylist">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Play</span>
          </button>
          <button class="shuffle-button" @click="shufflePlaylist">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
            <span>Shuffle</span>
          </button>
          <button class="heart-button" :class="{ liked: isLiked }" @click="toggleLike">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <button class="download-button" v-if="canDownload">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
          <button class="edit-button" v-if="isOwner" @click="editPlaylist">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button class="more-button" @click="showPlaylistMenu">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Sort Bar -->
    <div class="controls-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="currentColor" class="search-icon">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Find in playlist"
          class="search-input"
        >
      </div>
      
      <div class="sort-controls">
        <button class="view-button" @click="toggleView">
          <svg v-if="viewMode === 'list'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/>
          </svg>
        </button>
        <button class="sort-button" @click="showSortMenu = !showSortMenu">
          <span>{{ currentSort.label }}</span>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Songs List/Grid -->
    <div class="songs-section">
      <div v-if="songs.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <p class="empty-text">It's a bit empty here</p>
        <p class="empty-subtext">Let's find something for your playlist</p>
        <button class="find-songs-button" @click="findSongs">Find Songs</button>
      </div>
      
      <div v-else-if="viewMode === 'list'" class="songs-list">
        <div class="list-header">
          <div class="col-index">#</div>
          <div class="col-title">Title</div>
          <div class="col-album">Album</div>
          <div class="col-date">Date added</div>
          <div class="col-duration">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
        </div>
        
        <div
          v-for="(song, index) in filteredSongs" 
          :key="song.id"
          class="song-item"
          :class="{ playing: currentSong?.id === song.id, dragging: draggingIndex === index }"
          draggable="true"
          @dragstart="startDrag(index)"
          @dragend="endDrag"
          @dragover.prevent
          @drop="dropSong(index)"
          @click="playSong(song, index)"
        >
          <div class="drag-handle">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </div>
          <div class="col-index">
            <span class="index-number">{{ index + 1 }}</span>
            <button class="play-pause-button">
              <svg v-if="currentSong?.id !== song.id || !isPlaying" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
          </div>
          <div class="col-title">
            <div class="song-artwork">
              <img v-if="song.cover" :src="song.cover" :alt="song.album">
              <svg v-else viewBox="0 0 40 40" class="artwork-placeholder">
                <rect width="40" height="40" fill="rgba(255,255,255,0.05)" rx="4"/>
                <path d="M20 12v8.22c-.47-.34-1.02-.55-1.6-.55-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2V16h3.2v-4H20z" fill="rgba(255,255,255,0.2)"/>
              </svg>
            </div>
            <div class="song-info">
              <p class="song-name">{{ song.title }}</p>
              <p class="song-artist">{{ song.artist }}</p>
            </div>
          </div>
          <div class="col-album">{{ song.album }}</div>
          <div class="col-date">{{ formatDate(song.dateAdded) }}</div>
          <div class="col-duration">
            <span>{{ song.duration }}</span>
            <button class="like-button" :class="{ liked: song.liked }" @click.stop="toggleSongLike(song)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            <button class="song-menu" @click.stop="showSongMenu(song)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Grid View -->
      <div v-else class="songs-grid">
        <div 
          v-for="(song, index) in filteredSongs" 
          :key="song.id"
          class="song-card"
          @click="playSong(song, index)"
        >
          <div class="card-artwork">
            <img v-if="song.cover" :src="song.cover" :alt="song.album">
            <svg v-else viewBox="0 0 200 200" class="artwork-placeholder">
              <rect width="200" height="200" fill="url(#card-gradient)" rx="8"/>
              <path d="M100 60v40.44c-2.36-1.36-5.08-2.2-8-2.2-8.84 0-16 7.16-16 16s7.16 16 16 16 16-7.16 16-16V80h16V60h-24z" fill="rgba(255,255,255,0.2)"/>
            </svg>
            <button class="card-play-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
          <p class="card-title">{{ song.title }}</p>
          <p class="card-artist">{{ song.artist }}</p>
        </div>
      </div>
    </div>

    <!-- Add Songs Button -->
    <button v-if="songs.length > 0 && isOwner" class="floating-add-button" @click="findSongs">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    </button>

    <!-- Sort Menu Dropdown -->
    <transition name="dropdown">
      <div v-if="showSortMenu" class="sort-dropdown">
        <button 
          v-for="option in sortOptions" 
          :key="option.value"
          class="sort-option"
          :class="{ active: currentSort.value === option.value }"
          @click="setSortBy(option)"
        >
          {{ option.label }}
        </button>
      </div>
    </transition>

    <!-- SVG Definitions -->
    <svg width="0" height="0">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#43e97b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#38f9d7;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'PlaylistView',
  props: {
    playlist: Object,
    songs: Array
  },
  setup(props) {
    const store = useStore()
    
    // State
    const searchQuery = ref('')
    const showSortMenu = ref(false)
    const viewMode = ref('list') // 'list' or 'grid'
    const draggingIndex = ref(null)
    const isLiked = ref(false)
    const currentSort = ref({ value: 'custom', label: 'Custom order' })
    
    const sortOptions = [
      { value: 'custom', label: 'Custom order' },
      { value: 'title', label: 'Title' },
      { value: 'artist', label: 'Artist' },
      { value: 'album', label: 'Album' },
      { value: 'dateAdded', label: 'Date added' }
    ]
    
    // Computed
    const creator = computed(() => {
      if (props.playlist?.artist_id) {
        return store.getters.artistById(props.playlist.artist_id)
      }
      return { name: 'You' } // Default for user-created playlists
    })
    
    const totalDuration = computed(() => {
      const totalMinutes = props.songs.length * 3.5
      const hours = Math.floor(totalMinutes / 60)
      const minutes = Math.floor(totalMinutes % 60)
      return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
    })
    
    const isOwner = computed(() => {
      // In a real app, check if current user owns this playlist
      return true
    })
    
    const canDownload = computed(() => {
      // Check if user has premium/download permissions
      return true
    })
    
    const currentSong = computed(() => store.state.currentSong)
    const isPlaying = computed(() => store.state.isPlaying)
    
    const filteredSongs = computed(() => {
      let filtered = [...props.songs]
      
      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(song => 
          song.title.toLowerCase().includes(query) ||
          song.artist?.toLowerCase().includes(query) ||
          song.album?.toLowerCase().includes(query)
        )
      }
      
      // Sort
      if (currentSort.value.value !== 'custom') {
        filtered.sort((a, b) => {
          switch (currentSort.value.value) {
            case 'title':
              return a.title.localeCompare(b.title)
            case 'artist':
              return (a.artist || '').localeCompare(b.artist || '')
            case 'album':
              return (a.album || '').localeCompare(b.album || '')
            case 'dateAdded':
              return new Date(b.dateAdded) - new Date(a.dateAdded)
            default:
              return 0
          }
        })
      }
      
      return filtered
    })
    
    // Methods
    const playPlaylist = () => {
      store.dispatch('playPlaylist', props.playlist.id)
    }
    
    const shufflePlaylist = () => {
      store.commit('TOGGLE_SHUFFLE')
      playPlaylist()
    }
    
    const toggleLike = () => {
      isLiked.value = !isLiked.value
      // Save to user's library
    }
    
    const editPlaylist = () => {
      console.log('Edit playlist')
      // Open edit modal
    }
    
    const showPlaylistMenu = () => {
      console.log('Show playlist menu')
      // Show context menu
    }
    
    const toggleView = () => {
      viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
    }
    
    const setSortBy = (option) => {
      currentSort.value = option
      showSortMenu.value = false
    }
    
    const playSong = (song, index) => {
      store.dispatch('playSong', song)
      // Set playlist as queue
      store.commit('SET_PLAY_QUEUE', filteredSongs.value)
    }
    
    const toggleSongLike = (song) => {
      song.liked = !song.liked
      // Save to database
    }
    
    const showSongMenu = (song) => {
      console.log('Show menu for:', song)
      // Show context menu
    }
    
    const findSongs = () => {
      console.log('Open song search modal')
      // Open modal to add songs
    }
    
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      const now = new Date()
      const diff = now - d
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) return 'Today'
      if (days === 1) return 'Yesterday'
      if (days < 7) return `${days} days ago`
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`
      if (days < 365) return `${Math.floor(days / 30)} months ago`
      
      return d.toLocaleDateString()
    }
    
    // Drag and drop
    const startDrag = (index) => {
      draggingIndex.value = index
    }
    
    const endDrag = () => {
      draggingIndex.value = null
    }
    
    const dropSong = (targetIndex) => {
      if (draggingIndex.value !== null && draggingIndex.value !== targetIndex) {
        console.log('Reorder song from', draggingIndex.value, 'to', targetIndex)
        // Implement reordering logic
      }
    }
    
    return {
      searchQuery,
      showSortMenu,
      viewMode,
      draggingIndex,
      isLiked,
      currentSort,
      sortOptions,
      creator,
      totalDuration,
      isOwner,
      canDownload,
      currentSong,
      isPlaying,
      filteredSongs,
      playPlaylist,
      shufflePlaylist,
      toggleLike,
      editPlaylist,
      showPlaylistMenu,
      toggleView,
      setSortBy,
      playSong,
      toggleSongLike,
      showSongMenu,
      findSongs,
      formatDate,
      startDrag,
      endDrag,
      dropSong
    }
  }
}
</script>

<style scoped>
.playlist-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
  background: linear-gradient(180deg, transparent 0%, rgba(18, 18, 18, 0.8) 100%);
}

/* Playlist Header */
.playlist-header {
  padding: 80px 32px 24px;
  background: linear-gradient(180deg, rgba(var(--playlist-color, 83, 83, 83), 0.8) 0%, transparent 100%);
  display: flex;
  gap: 32px;
  align-items: flex-end;
}

.playlist-cover {
  width: 232px;
  height: 232px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.cover-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  width: 100%;
  height: 100%;
}

.grid-item {
  overflow: hidden;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
}

.playlist-info {
  flex: 1;
  padding-bottom: 8px;
}

.playlist-label {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.playlist-name {
  font-size: clamp(32px, 5vw, 96px);
  font-weight: 900;
  letter-spacing: -0.04em;
  margin-bottom: 8px;
  line-height: 1;
}

.playlist-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
}

.playlist-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 24px;
}

.creator-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-name {
  font-weight: 700;
  cursor: pointer;
}

.creator-name:hover {
  text-decoration: underline;
}

.meta-separator {
  color: rgba(255, 255, 255, 0.7);
}

.playlist-actions {
  display: flex;
  gap: 24px;
  align-items: center;
}

.play-button,
.shuffle-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-button {
  background: #1db954;
  color: #000;
}

.shuffle-button {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.play-button:hover {
  transform: scale(1.04);
  background: #1ed760;
}

.shuffle-button:hover {
  transform: scale(1.04);
  border-color: #fff;
}

.heart-button,
.download-button,
.edit-button,
.more-button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.heart-button:hover,
.download-button:hover,
.edit-button:hover,
.more-button:hover {
  color: #fff;
}

.heart-button.liked {
  color: #1db954;
}

.heart-button svg,
.download-button svg,
.edit-button svg {
  width: 24px;
  height: 24px;
}

.more-button svg {
  width: 20px;
  height: 20px;
}

/* Controls Bar */
.controls-bar {
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.search-box {
  position: relative;
  width: 364px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.search-input {
  width: 100%;
  padding: 6px 12px 6px 36px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.2);
}

.sort-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
}

.view-button,
.sort-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-button:hover,
.sort-button:hover {
  color: #fff;
}

.view-button svg {
  width: 20px;
  height: 20px;
}

.sort-button svg {
  width: 16px;
  height: 16px;
}

.sort-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #282828;
  border-radius: 4px;
  padding: 4px;
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.sort-option {
  display: block;
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.1s ease;
}

.sort-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sort-option.active {
  color: #1db954;
}

/* Songs Section */
.songs-section {
  flex: 1;
  overflow-y: auto;
  padding: 0 32px 32px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
}

.find-songs-button {
  padding: 12px 32px;
  background: #fff;
  border: none;
  border-radius: 24px;
  color: #000;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.find-songs-button:hover {
  transform: scale(1.04);
}

/* List View */
.songs-list {
  display: flex;
  flex-direction: column;
}

.list-header {
  display: grid;
  grid-template-columns: 16px 48px 6fr 4fr 3fr 120px;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  position: sticky;
  top: 0;
  background: rgba(18, 18, 18, 0.95);
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

.song-item {
  display: grid;
  grid-template-columns: 16px 48px 6fr 4fr 3fr 120px;
  gap: 16px;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  position: relative;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.song-item.playing {
  color: #1db954;
}

.song-item.dragging {
  opacity: 0.5;
}

.drag-handle {
  opacity: 0;
  color: rgba(255, 255, 255, 0.7);
  cursor: grab;
}

.song-item:hover .drag-handle {
  opacity: 1;
}

.drag-handle svg {
  width: 16px;
  height: 16px;
}

.col-index {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.index-number {
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.play-pause-button {
  display: none;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
}

.song-item:hover .index-number {
  display: none;
}

.song-item:hover .play-pause-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-pause-button svg {
  width: 16px;
  height: 16px;
}

.col-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.song-artwork {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.song-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-info {
  min-width: 0;
}

.song-name {
  font-size: 16px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-item.playing .song-name {
  color: #1db954;
}

.song-artist {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-album,
.col-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-duration {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}

.like-button {
  opacity: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.song-item:hover .like-button {
  opacity: 1;
}

.like-button:hover {
  color: #fff;
}

.like-button.liked {
  opacity: 1;
  color: #1db954;
}

.like-button svg {
  width: 16px;
  height: 16px;
}

.song-menu {
  opacity: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.song-item:hover .song-menu {
  opacity: 1;
}

.song-menu:hover {
  color: #fff;
}

.song-menu svg {
  width: 16px;
  height: 16px;
}

/* Grid View */
.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
  padding-top: 16px;
}

.song-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.song-card:hover {
  transform: translateY(-4px);
}

.card-artwork {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-bottom: 12px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.card-artwork img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-artwork .artwork-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.card-play-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 48px;
  height: 48px;
  background: #1db954;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  box-shadow: 0 8px 8px rgba(0, 0, 0, 0.3);
}

.song-card:hover .card-play-button {
  opacity: 1;
  transform: translateY(0);
}

.card-play-button:hover {
  transform: scale(1.06);
  background: #1ed760;
}

.card-play-button svg {
  width: 20px;
  height: 20px;
  color: #000;
  margin-left: 2px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-artist {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Floating Add Button */
.floating-add-button {
  position: fixed;
  bottom: 120px;
  right: 32px;
  width: 56px;
  height: 56px;
  background: #1db954;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

.floating-add-button:hover {
  transform: scale(1.06);
  background: #1ed760;
}

.floating-add-button svg {
  width: 24px;
  height: 24px;
  color: #000;
}

/* Animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 1024px) {
  .playlist-header {
    padding: 60px 24px 24px;
  }
  
  .playlist-name {
    font-size: clamp(24px, 4vw, 72px);
  }
  
  .list-header,
  .song-item {
    grid-template-columns: 16px 40px 4fr 3fr 100px;
  }
  
  .col-album {
    display: none;
  }
}

@media (max-width: 768px) {
  .playlist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .playlist-cover {
    width: 200px;
    height: 200px;
  }
  
  .search-box {
    width: 100%;
  }
  
  .songs-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}</style>
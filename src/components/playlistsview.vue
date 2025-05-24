<template>
  <div class="playlists-view">
    <!-- Header -->
    <div class="view-header">
      <h1 class="view-title">Playlists</h1>
      <button class="create-btn" @click="$emit('create-playlist')">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Create Playlist
      </button>
    </div>

    <!-- Playlists Grid -->
    <div class="playlists-grid">
      <div 
        v-for="playlist in playlists" 
        :key="playlist.id"
        class="playlist-card"
        :class="{ 'drag-over': dragOverPlaylistId === playlist.id }"
        @click="$emit('select-playlist', playlist.id)"
        @dragover.prevent="dragOverPlaylistId = playlist.id"
        @dragleave="dragOverPlaylistId = null"
        @drop.prevent="handleFileDropToPlaylist(playlist, $event)"
      >
        <div class="playlist-cover" :style="{ '--playlist-color': playlist.color || '#FF6B6B' }">
          <div class="cover-gradient"></div>
          <div class="cover-content">
            <svg viewBox="0 0 100 100" fill="none">
              <path d="M30 35h40v4H30v-4zm0 8h40v4H30v-4zm0 8h24v4H30v-4z" fill="white" opacity="0.3"/>
              <path d="M58 51v16.55c-1.18-.68-2.54-1.1-4-1.1-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8V56h8v-5h-12z" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <button class="play-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
        <div class="playlist-info">
          <h3 class="playlist-name">{{ playlist.name }}</h3>
          <p class="playlist-meta">{{ playlist.songIds?.length || 0 }} songs</p>
        </div>
        <button class="playlist-menu" @click.stop="showPlaylistMenu(playlist)">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>

      <!-- Create New Playlist Card -->
      <div class="playlist-card create-card" @click="$emit('create-playlist')">
        <div class="create-cover">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
        <div class="playlist-info">
          <h3 class="playlist-name">Create New</h3>
          <p class="playlist-meta">Add a playlist</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
export default {
  name: 'playlistsview',
  props: {
    playlists: Array,
    onFileDropToPlaylist: Function
  },
  emits: ['create-playlist', 'select-playlist', 'add-song-to-playlist'],
  setup(props, { emit }) {
    const dragOverPlaylistId = ref(null)
    const showPlaylistMenu = (playlist) => {
      console.log('Show menu for:', playlist)
    }
    const onDrop = (playlist, e) => {
      dragOverPlaylistId.value = null
      const song = JSON.parse(e.dataTransfer.getData('application/json'))
      emit('add-song-to-playlist', { playlistId: playlist.id, song })
    }
    const handleFileDropToPlaylist = (playlist, e) => {
      dragOverPlaylistId.value = null
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        const filePaths = Array.from(files).map(f => f.path || f.name)
        if (props.onFileDropToPlaylist) props.onFileDropToPlaylist(playlist.id, filePaths)
      } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const filePaths = Array.from(e.dataTransfer.items)
          .filter(item => item.kind === 'file')
          .map(item => item.getAsFile()?.path || item.getAsFile()?.name)
        if (props.onFileDropToPlaylist) props.onFileDropToPlaylist(playlist.id, filePaths)
      }
    }
    return {
      showPlaylistMenu,
      dragOverPlaylistId,
      onDrop,
      handleFileDropToPlaylist
    }
  }
}
</script>

<style scoped>
.playlists-view {
  padding: 0;
}

/* Header */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.view-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--gradient-primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.create-btn svg {
  width: 20px;
  height: 20px;
}

/* Playlists Grid */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.playlist-card {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-card:hover {
  transform: translateY(-4px);
}

.playlist-cover {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  margin-bottom: 16px;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--playlist-color) 0%, transparent 100%);
  opacity: 0.8;
}

.cover-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-content svg {
  width: 80px;
  height: 80px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.playlist-card:hover .play-btn {
  opacity: 1;
  transform: translateY(0);
}

.play-btn:hover {
  transform: scale(1.1);
  background: rgba(0, 0, 0, 0.9);
}

.play-btn svg {
  width: 20px;
  height: 20px;
  color: white;
  margin-left: 2px;
}

.playlist-info {
  padding: 0 4px;
}

.playlist-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

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
  transition: all 0.2s ease;
}

.playlist-card:hover .playlist-menu {
  opacity: 1;
}

.playlist-menu:hover {
  background: rgba(0, 0, 0, 0.8);
}

.playlist-menu svg {
  width: 16px;
  height: 16px;
  color: white;
}

/* Create Card */
.create-card {
  opacity: 0.6;
  transition: all 0.2s ease;
}

.create-card:hover {
  opacity: 1;
}

.create-cover {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-cover svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
}

/* Responsive */
@media (max-width: 768px) {
  .playlists-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
}

.playlist-card.drag-over {
  outline: 2px solid #4ECDC4;
  background: rgba(78, 205, 196, 0.08);
}
</style>
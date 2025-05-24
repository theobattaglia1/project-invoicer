<!-- src/components/PlaylistDetailView.vue -->
<template>
  <div class="playlist-detail-view">
    <div class="view-header">
      <h1 class="view-title">{{ playlist?.name || 'Playlist' }}</h1>
      <p class="view-subtitle">
        {{ songs.length }} songs
        <span v-if="selectedItems.length > 0" class="selection-count">
          • {{ selectedItems.length }} selected
        </span>
      </p>
      
      <div class="header-actions">
        <button 
          v-if="selectedItems.length > 0" 
          class="remove-selected-button"
          @click="removeSelectedSongs"
        >
          Remove Selected
        </button>
        <button class="shuffle-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
          <span>Shuffle</span>
        </button>
        <button class="play-all-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>Play</span>
        </button>
      </div>
    </div>

    <div class="playlist-content">
      <div v-if="songs.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
        </svg>
        <p class="empty-text">No songs in this playlist yet</p>
        <p class="empty-subtext">Drag songs here to add them</p>
      </div>

      <SelectableList
        v-else
        :items="songs"
        :columns="columns"
        :drag-type="'playlist-songs'"
        :reorderable="true"
        :on-reorder="handleReorder"
        @selection-change="selectedItems = $event"
      >
        <template #item="{ item: song, index, isSelected, toggleSelection, handleClick, handleDragStart, handleDragEnd, handleDragOver, handleDrop, isDragOver }">
          <div 
            class="song-row"
            :class="{ 
              selected: isSelected, 
              'drag-over': isDragOver 
            }"
            :draggable="true"
            @dragstart="handleDragStart"
            @dragend="handleDragEnd"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
            @click="handleClick"
            @dblclick="playSong(song)"
          >
            <div class="col-check">
              <input 
                type="checkbox" 
                :checked="isSelected"
                @click.stop
                @change="toggleSelection"
              >
            </div>
            <div class="col-number">{{ index + 1 }}</div>
            <div class="col-title">
              <div class="song-info">
                <div class="song-artwork">
                  <svg viewBox="0 0 40 40" class="artwork-placeholder">
                    <rect width="40" height="40" fill="url(#song-gradient)" rx="4"/>
                    <path d="M20 12v8.22c-.47-.34-1.02-.55-1.6-.55-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2V16h3.2v-4H20z" fill="rgba(255,255,255,0.3)"/>
                  </svg>
                </div>
                <span class="song-name">{{ song.title }}</span>
              </div>
            </div>
            <div class="col-artist">{{ song.artist }}</div>
            <div class="col-album">{{ song.album }}</div>
            <div class="col-duration">{{ formatDuration(song.duration) }}</div>
            <div class="col-actions">
              <button class="action-button remove-button" @click.stop="removeSong(song)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        </template>
      </SelectableList>
    </div>

    <!-- SVG Definitions -->
    <svg width="0" height="0">
      <defs>
        <linearGradient id="song-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script>
import { ref } from 'vue'
import SelectableList from './SelectableList.vue'

export default {
  name: 'PlaylistDetailView',
  components: {
    SelectableList
  },
  props: {
    playlist: Object,
    songs: Array
  },
  emits: ['remove-song', 'reorder-songs'],
  setup(props, { emit }) {
    const selectedItems = ref([])
    
    const columns = [
      { key: 'number', label: '#', width: '50px' },
      { key: 'title', label: 'Title', width: '1fr' },
      { key: 'artist', label: 'Artist', width: '200px' },
      { key: 'album', label: 'Album', width: '200px' },
      { key: 'duration', label: 'Duration', width: '80px' },
      { key: 'actions', label: '', width: '50px' }
    ]
    
    const playSong = (song) => {
      console.log('Playing:', song)
    }

    const removeSong = (song) => {
      emit('remove-song', { playlistId: props.playlist.id, songId: song.id })
    }
    
    const removeSelectedSongs = () => {
      selectedItems.value.forEach(song => {
        emit('remove-song', { playlistId: props.playlist.id, songId: song.id })
      })
    }
    
    const handleReorder = (reorderedSongs) => {
      emit('reorder-songs', { playlistId: props.playlist.id, songs: reorderedSongs })
    }

    const formatDuration = (seconds) => {
      if (!seconds) return '0:00'
      const minutes = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    return {
      selectedItems,
      columns,
      playSong,
      removeSong,
      removeSelectedSongs,
      handleReorder,
      formatDuration
    }
  }
}
</script>

<style scoped>
.playlist-detail-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.view-header {
  padding: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.view-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.view-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}

.selection-count {
  color: #4ECDC4;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.remove-selected-button {
  padding: 10px 20px;
  background: rgba(255, 85, 85, 0.2);
  border: 1px solid #ff5555;
  border-radius: 12px;
  color: #ff5555;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-selected-button:hover {
  background: rgba(255, 85, 85, 0.3);
  transform: translateY(-1px);
}

.shuffle-button,
.play-all-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-all-button {
  background: #fff;
  color: #000;
}

.playlist-content {
  flex: 1;
  overflow: hidden;
  padding: 0 32px 32px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

/* Song Row Styles */
.song-row {
  display: grid;
  grid-template-columns: 40px 50px 1fr 200px 200px 80px 50px;
  gap: 16px;
  padding: 12px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  user-select: none;
}

.song-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.song-row.selected {
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid rgba(78, 205, 196, 0.3);
  margin: -1px 0;
}

.song-row.drag-over {
  border-top: 2px solid #4ECDC4;
}

.col-number {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
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
  flex-shrink: 0;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
}

.song-name {
  font-size: 14px;
  font-weight: 500;
}

.col-artist,
.col-album {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-duration {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.col-actions {
  display: flex;
  justify-content: center;
}

.action-button {
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
  transition: all 0.2s ease;
}

.remove-button:hover {
  background: rgba(255, 85, 85, 0.2);
  color: #ff5555;
}
</style>
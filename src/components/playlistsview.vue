<!-- src/components/PlaylistsView.vue -->
<template>
  <div class="playlists-view">
    <!-- Header -->
    <div class="view-header">
      <h1 class="view-title">Playlists</h1>
      <p class="view-subtitle" v-if="selectedItems.length > 0">
        {{ selectedItems.length }} selected
      </p>
      <div class="header-actions">
        <button 
          v-if="selectedItems.length > 0" 
          class="delete-selected-button"
          @click="deleteSelectedPlaylists"
        >
          Delete Selected
        </button>
        <button class="create-btn" @click="$emit('create-playlist')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create Playlist
        </button>
      </div>
    </div>

    <!-- Playlists Grid -->
    <div class="playlists-grid" @click="handleBackgroundClick">
      <div 
        v-for="(playlist, index) in playlists" 
        :key="playlist.id"
        class="playlist-card"
        :class="{ 
          selected: isSelected(playlist),
          'drag-over': dragOverPlaylistId === playlist.id,
          'drag-source': draggedPlaylist?.id === playlist.id
        }"
        :draggable="true"
        @dragstart="onDragStart(playlist, index, $event)"
        @dragend="onDragEnd"
        @dragover.prevent="handleDragOver(index, $event)"
        @drop.prevent="handleDrop(playlist, index, $event)"
        @dragleave="dragOverPlaylistId = null"
        @click="handlePlaylistClick(playlist, index, $event)"
        @dblclick="$emit('select-playlist', playlist.id)"
      >
        <div class="selection-indicator">
          <input 
            type="checkbox" 
            :checked="isSelected(playlist)"
            @click.stop
            @change="toggleSelection(playlist, index, $event)"
          >
        </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSelection } from '@/composables/useSelection'
import { useDragReorder } from '@/composables/useDragReorder'
import { useDragDropStore } from '@/store/dragddrop'

export default {
  name: 'PlaylistsView',
  props: {
    playlists: Array,
    onFileDropToPlaylist: Function
  },
  emits: ['create-playlist', 'select-playlist', 'add-song-to-playlist', 'reorder-playlists', 'delete-playlists'],
  setup(props, { emit }) {
    const dragOverPlaylistId = ref(null)
    const draggedPlaylist = ref(null)
    const dragStore = useDragDropStore()

    // Use selection composable
    const {
      selectedIds,
      selectedItems,
      isSelected,
      clearSelection,
      toggleSelection,
      selectAll
    } = useSelection(
      computed(() => props.playlists),
      playlist => playlist.id
    )

    // Use drag reorder composable
    const {
      draggedIndex,
      dragOverIndex,
      handleDragStart: reorderDragStart,
      handleDragOver: reorderDragOver,
      handleDrop: reorderDrop
    } = useDragReorder(
      computed(() => props.playlists),
      (reorderedPlaylists) => emit('reorder-playlists', reorderedPlaylists)
    )

    const handlePlaylistClick = (playlist, index, event) => {
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        toggleSelection(playlist, index, event)
      } else if (!isSelected(playlist)) {
        clearSelection()
        toggleSelection(playlist, index, event)
      }
    }

    const handleBackgroundClick = (event) => {
      if (event.target.classList.contains('playlists-grid')) {
        clearSelection()
      }
    }

    const showPlaylistMenu = (playlist) => {
      console.log('Show menu for:', playlist)
    }

    const deleteSelectedPlaylists = () => {
      if (confirm(`Delete ${selectedItems.value.length} playlists?`)) {
        emit('delete-playlists', selectedItems.value)
      }
    }

    const onDragStart = (playlist, index, event) => {
      draggedPlaylist.value = playlist
      
      const itemsToDrag = isSelected(playlist) ? selectedItems.value : [playlist]
      
      console.log(`📚 Dragging ${itemsToDrag.length} playlists`)
      
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', 'playlists')
      event.dataTransfer.setData('application/json', JSON.stringify(itemsToDrag))
      
      dragStore.startDrag(itemsToDrag, 'playlists')
      
      if (itemsToDrag.length > 1) {
        const dragImage = document.createElement('div')
        dragImage.className = 'custom-drag-image'
        dragImage.innerHTML = `
          <div class="drag-count">${itemsToDrag.length}</div>
          <div class="drag-label">playlists</div>
        `
        dragImage.style.position = 'absolute'
        dragImage.style.top = '-1000px'
        document.body.appendChild(dragImage)
        event.dataTransfer.setDragImage(dragImage, 50, 25)
        setTimeout(() => document.body.removeChild(dragImage), 0)
      }
      
      reorderDragStart(index, event, itemsToDrag)
    }

    const onDragEnd = () => {
      draggedPlaylist.value = null
      dragStore.endDrag()
    }

    const handleDragOver = (index, event) => {
      reorderDragOver(index, event)
      dragOverPlaylistId.value = props.playlists[index].id
    }

    const handleDrop = (playlist, index, event) => {
      const dragType = event.dataTransfer.getData('text/plain')
      
      // If dropping playlists (reordering)
      if (dragType === 'playlists') {
        reorderDrop(index, event, selectedItems.value)
        dragOverPlaylistId.value = null
        return
      }
      
      // Otherwise handle song drops
      dragOverPlaylistId.value = null
      
      // Handle file drops
      if (event.dataTransfer.files?.length) {
        const filePaths = Array.from(event.dataTransfer.files).map(f => f.path || f.name)
        if (props.onFileDropToPlaylist) props.onFileDropToPlaylist(playlist.id, filePaths)
        return
      }
      
      // Handle song drops
      if (dragType === 'song' || dragType === 'songs') {
        try {
          const jsonData = event.dataTransfer.getData('application/json')
          const songs = jsonData ? JSON.parse(jsonData) : dragStore.getDraggedItem()
          const songsArray = Array.isArray(songs) ? songs : [songs]
          
          songsArray.forEach(song => {
            if (song) emit('add-song-to-playlist', { playlistId: playlist.id, song })
          })
        } catch (error) {
          console.error('Drop error:', error)
        }
      }
    }

    // Keyboard shortcuts
    const handleKeyboard = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
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

    return {
      showPlaylistMenu,
      dragOverPlaylistId,
      draggedPlaylist,
      onDragStart,
      onDragEnd,
      handleDragOver,
      handleDrop,
      selectedItems,
      isSelected,
      clearSelection,
      toggleSelection,
      handlePlaylistClick,
      handleBackgroundClick,
      deleteSelectedPlaylists
    }
  }
}
</script>

<style scoped>
/* Keep existing styles and add these new ones */

.view-subtitle {
  font-size: 16px;
  color: #4ECDC4;
  font-weight: 600;
  margin-bottom: 16px;
}

.delete-selected-button {
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

.delete-selected-button:hover {
  background: rgba(255, 85, 85, 0.3);
  transform: translateY(-1px);
}

.playlist-card {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.playlist-card.selected {
  transform: scale(1.05);
}

.playlist-card.selected .playlist-cover {
  box-shadow: 0 8px 32px rgba(78, 205, 196, 0.4);
  border: 2px solid #4ECDC4;
}

.playlist-card.drag-source {
  opacity: 0.5;
}

.selection-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.playlist-card:hover .selection-indicator,
.playlist-card.selected .selection-indicator {
  opacity: 1;
}

.selection-indicator input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Rest of existing styles remain the same */
</style>
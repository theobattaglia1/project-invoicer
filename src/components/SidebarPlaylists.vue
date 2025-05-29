<!-- Enhanced Sidebar Component -->
<template>
  <aside class="sidebar glass">
    <header class="side-head">PLAYLISTS</header>

    <ul>
      <li
        v-for="pl in playlists"
        :key="pl.id"
        class="side-item"
        :class="{ 
          dragover: dragOn === pl.id,
          active: activePlaylistId === pl.id 
        }"
        @click="selectPlaylist(pl)"
        @contextmenu.prevent="showContextMenu($event, pl)"
        @dragover.prevent="dragOn = pl.id"
        @dragleave="dragOn = null"
        @drop="handleDrop(pl.id, $event)"
      >
        <span class="playlist-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
        </span>
        <span class="playlist-name">{{ pl.name }}</span>
        <span class="playlist-count">{{ pl.song_ids?.length || 0 }}</span>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useLibraryStore } from '@/store/library'
import { importFiles } from '@/utils/importFiles'

const props = defineProps({
  activePlaylistId: String
})

const emit = defineEmits([
  'select-playlist', 
  'update-playlist', 
  'delete-playlist',
  'play-playlist'
])

const lib = useLibraryStore()
const playlists = lib.state.playlists

// Inject context menu from parent
const contextMenuRef = inject('contextMenu', null)

const dragOn = ref(null)

// Playlist selection
function selectPlaylist(playlist) {
  emit('select-playlist', playlist.id)
}

// Context menu - use the shared one
function showContextMenu(event, playlist) {
  contextMenuRef?.value?.show(event, [playlist], 'playlist')
}

// Drag and drop
async function handleDrop(playlistId, e) {
  dragOn.value = null
  
  // Handle file drops
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const files = [...e.dataTransfer.files].map(f => f.path)
    await importFiles(files, { playlistId })
    return
  }
  
  // Handle internal drops (songs from the app)
  try {
    const data = e.dataTransfer.getData('application/json')
    if (data) {
      const items = JSON.parse(data)
      if (items[0]?.type === 'song' || items[0]?.id) {
        // Add songs to playlist
        const songIds = items.map(item => item.id).filter(Boolean)
        if (songIds.length > 0) {
          // Use your existing method to add songs to playlist
          lib.addSongsToPlaylist(playlistId, songIds)
        }
      }
    }
  } catch (err) {
    console.error('Drop error:', err)
  }
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  padding: 16px 0;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.side-head {
  padding: 0 20px 12px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.side-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.side-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.side-item.active {
  background: rgba(78, 205, 196, 0.15);
  color: #4ECDC4;
}

.side-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #4ECDC4;
}

.side-item.dragover {
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid #4ECDC4;
  margin: -1px;
}

.playlist-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
  flex-shrink: 0;
}

.playlist-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-count {
  font-size: 12px;
  opacity: 0.5;
  flex-shrink: 0;
}
</style>
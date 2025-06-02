<template>
  <div class="folder-page">
    <!-- Header -->
    <div class="folder-header">
      <div class="breadcrumb" v-if="parentPath && parentPath.length > 0">
        <button @click="navigateToRoot" class="breadcrumb-item">
          <svg viewBox="0 0 24 24" fill="currentColor" class="breadcrumb-icon">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          Home
        </button>
        
        <template v-for="(parent, index) in parentPath" :key="parent.id">
          <span class="breadcrumb-separator">/</span>
          <button @click="navigateToFolder(parent.id)" class="breadcrumb-item">
            {{ parent.name }}
          </button>
        </template>
        
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ title }}</span>
      </div>

      <div class="folder-title-row">
        <h1 class="folder-title">
          <svg class="folder-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
          {{ title }}
        </h1>
        
        <div class="folder-actions">
          <button @click="toggleViewMode" class="action-btn">
            <svg v-if="viewMode === 'grid'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/>
            </svg>
          </button>
          
          <button @click="createSubfolder" class="action-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/>
            </svg>
            New Folder
          </button>
          
          <button @click="importFiles" class="action-btn primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Files
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="folder-content" 
         @drop="handleDrop"
         @dragover.prevent="handleDragOver"
         @dragenter.prevent="handleDragEnter"
         @dragleave="handleDragLeave"
         :class="{ 'drag-over': isDragOver }">
      
      <!-- Empty state -->
      <div v-if="allItems.length === 0" class="empty-folder">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
        <p>This folder is empty</p>
        <p class="empty-hint">Drag files, songs, or other items here</p>
      </div>

      <!-- Grid view -->
      <div v-else-if="viewMode === 'grid'" class="folder-grid">
        <div v-for="item in allItems" 
             :key="item.id"
             class="grid-item"
             :class="{ selected: selectedItems.has(item.id) }"
             @click="handleItemClick(item, $event)"
             @dblclick="handleItemDoubleClick(item)"
             @contextmenu.prevent="showItemContextMenu($event, item)"
             draggable="true"
             @dragstart="handleItemDragStart(item, $event)">
          
          <div class="item-icon">
            <!-- Use the icon component returned by getIcon -->
            <component :is="getIcon(item.type, item.pageType)" />
          </div>
          
          <div class="item-name">{{ item.name }}</div>
          
          <div v-if="item.type === 'song'" class="item-meta">
            {{ item.artist }}
          </div>
          
          <div v-if="item.type === 'playlist'" class="item-meta">
            {{ item.songCount || 0 }} songs
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="folder-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in allItems" 
                :key="item.id"
                :class="{ selected: selectedItems.has(item.id) }"
                @click="handleItemClick(item, $event)"
                @dblclick="handleItemDoubleClick(item)"
                @contextmenu.prevent="showItemContextMenu($event, item)"
                draggable="true"
                @dragstart="handleItemDragStart(item, $event)">
              
              <td class="name-cell">
                <component :is="getIcon(item.type, item.pageType)" class="item-icon-small" />
                <span>{{ item.name }}</span>
              </td>
              
              <td>{{ getTypeLabel(item.type, item.pageType, item.songCount) }}</td>
              
              <td>{{ formatDate(item.addedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, h } from 'vue'

const props = defineProps({
  folderId: String,
  title: String,
  folderData: Object,
  parentPath: Array,
  customPages: Array,
  playlists: Array,
  config: Object
})

const emit = defineEmits(['navigate', 'action', 'update'])

// Inject stores
const showToast = inject('showToast')

// State
const viewMode = ref(props.config?.viewMode || 'grid')
const selectedItems = ref(new Set())
const isDragOver = ref(false)
let dragCounter = 0

// Icon definitions
const icons = {
  folder: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z' })
  ),
  song: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' })
  ),
  playlist: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z' })
  ),
  calendar: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z' })
  ),
  dashboard: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' })
  ),
  timeline: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.64 6.56l-3.54 3.54c-.78.78-2.05.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0l1.41 1.41 2.12-2.12c.78-.78 2.05-.78 2.83 0s.78 2.05 0 2.83z' })
  ),
  ideas: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z' })
  ),
  assets: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z' })
  ),
  moodboard: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.19 0 .34-.16.34-.34 0-.09-.03-.17-.09-.25-.27-.44-.64-1.41-.64-2.41 0-1.66 1.34-3 3-3h3.5c3.03 0 5.5-2.47 5.5-5.5C22 5.81 17.19 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' })
  ),
  file: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
    h('path', { d: 'M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z' })
  )
}

// Method to get icon based on item type
const getIcon = (type, pageType) => {
  if (type === 'page' && pageType && icons[pageType]) {
    return icons[pageType]()
  } else if (icons[type]) {
    return icons[type]()
  }
  return icons.file() // Default fallback
}

// Method to get type label
const getTypeLabel = (type, pageType, songCount) => {
  if (type === 'page') {
    const typeLabels = {
      folder: 'Folder',
      calendar: 'Calendar',
      dashboard: 'Dashboard',
      timeline: 'Timeline',
      ideas: 'Ideas & Notes',
      assets: 'Asset Library',
      moodboard: 'Mood Board'
    }
    return typeLabels[pageType] || pageType
  }
  if (type === 'playlist') return `Playlist (${songCount || 0} songs)`
  if (type === 'song') return 'Song'
  return type
}

// Computed - combine folder items with nested pages
const allItems = computed(() => {
  const items = []
  
  // Add regular items from folder data
  if (props.folderData?.items) {
    props.folderData.items.forEach(item => {
      // For playlists, we need to get the current data from the playlists array
      if (item.type === 'playlist') {
        // Find the current playlist data
        const currentPlaylist = props.playlists?.find(p => p.id === item.playlistId)
        if (currentPlaylist) {
          items.push({
            ...item,
            name: currentPlaylist.name, // Use current name
            songCount: currentPlaylist.song_count,
            color: currentPlaylist.color,
            playlistData: currentPlaylist // Store full playlist data
          })
        }
      } else if (item.type !== 'page') {
        items.push(item)
      }
    })
  }
  
  // Add nested pages (pages with this folder as parentId)
  if (props.customPages) {
    const nestedPages = props.customPages.filter(page => page.parentId === props.folderId)
    nestedPages.forEach(page => {
      items.push({
        id: page.id,
        type: 'page',
        pageType: page.type,
        name: page.title,
        addedAt: page.createdAt,
        pageData: page
      })
    })
  }
  
  console.log('📁 All items in folder:', items)
  return items
})

// Methods
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  emit('action', {
    type: 'update-config',
    folderId: props.folderId,
    config: { viewMode: viewMode.value }
  })
}

const createSubfolder = () => {
  emit('action', {
    type: 'create-folder',
    parentId: props.folderId,
    parentType: 'folder'
  })
}

const importFiles = () => {
  emit('action', {
    type: 'import-files',
    folderId: props.folderId
  })
}

const navigateToRoot = () => {
  emit('navigate', { type: 'root' })
}

const navigateToFolder = (folderId) => {
  emit('navigate', { type: 'folder', id: folderId })
}

const handleItemClick = (item, event) => {
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    // Multi-select
    if (selectedItems.value.has(item.id)) {
      selectedItems.value.delete(item.id)
    } else {
      selectedItems.value.add(item.id)
    }
  } else {
    // Single select
    selectedItems.value.clear()
    selectedItems.value.add(item.id)
  }
}

const handleItemDoubleClick = (item) => {
  if (item.type === 'page') {
    if (item.pageType === 'folder') {
      emit('navigate', { type: 'folder', id: item.id })
    } else {
      emit('navigate', { type: 'custom', id: item.id })
    }
  } else if (item.type === 'song') {
    emit('action', { type: 'play', item: item.songData || item })
  } else if (item.type === 'playlist') {
    emit('navigate', { type: 'playlist', id: item.playlistId })
  }
}

const showItemContextMenu = (event, item) => {
  emit('action', {
    type: 'contextMenu',
    event,
    item,
    itemType: item.type
  })
}

// Drag and drop handlers
const handleDragEnter = (e) => {
  e.preventDefault()
  dragCounter++
  isDragOver.value = true
}

const handleDragOver = (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (e) => {
  dragCounter--
  if (dragCounter === 0) {
    isDragOver.value = false
  }
}

const handleDrop = async (e) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
  dragCounter = 0
  
  // Handle file drops
  if (e.dataTransfer.files?.length > 0) {
    const files = Array.from(e.dataTransfer.files).map(f => f.path)
    emit('action', {
      type: 'import-files-direct',
      files,
      folderId: props.folderId
    })
    return
  }
  
  // Handle internal drags
  try {
    const songData = e.dataTransfer.getData('application/x-music-player-songs')
    if (songData) {
      const { items } = JSON.parse(songData)
      emit('action', {
        type: 'add-to-folder',
        items,
        folderId: props.folderId
      })
    }
  } catch (err) {
    console.warn('Failed to parse drop data:', err)
  }
}

const handleItemDragStart = (item, event) => {
  const items = selectedItems.value.has(item.id) 
    ? Array.from(selectedItems.value).map(id => allItems.value.find(i => i.id === id))
    : [item]
  
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'folder-items',
    items,
    sourceFolderId: props.folderId
  }))
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}
</script>

<style scoped>
/* Keep all the existing styles exactly as they were */
.folder-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
}

.folder-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.breadcrumb-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.breadcrumb-icon {
  width: 16px;
  height: 16px;
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.3);
}

.breadcrumb-current {
  color: white;
  font-weight: 500;
}

.folder-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.folder-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.folder-icon {
  width: 40px;
  height: 40px;
  opacity: 0.8;
}

.folder-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.action-btn.primary {
  background: #1db954;
  border-color: #1db954;
  color: white;
}

.action-btn.primary:hover {
  background: #1ed760;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.folder-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  position: relative;
  transition: background 0.2s ease;
}

.folder-content.drag-over {
  background: rgba(29, 185, 84, 0.05);
  outline: 2px dashed rgba(29, 185, 84, 0.5);
  outline-offset: -16px;
}

.empty-folder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-folder svg {
  width: 80px;
  height: 80px;
  opacity: 0.1;
  margin-bottom: 24px;
}

.empty-folder p {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.empty-hint {
  font-size: 14px !important;
  color: rgba(255, 255, 255, 0.3) !important;
  margin-top: 8px !important;
}

/* Grid view */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 24px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.grid-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.grid-item.selected {
  background: rgba(29, 185, 84, 0.1);
  border-color: #1db954;
}

.item-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.item-icon svg {
  width: 100%;
  height: 100%;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* List view */
.folder-list {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  overflow: hidden;
}

.folder-list table {
  width: 100%;
  border-collapse: collapse;
}

.folder-list th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.folder-list td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.folder-list tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}

.folder-list tr.selected td {
  background: rgba(29, 185, 84, 0.1);
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon-small {
  width: 24px;
  height: 24px;
  opacity: 0.8;
}
</style>
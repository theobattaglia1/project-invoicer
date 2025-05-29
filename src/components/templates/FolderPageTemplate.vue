<template>
    <div class="folder-page">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <div class="breadcrumb">
            <span 
              v-for="(crumb, index) in breadcrumbs" 
              :key="index"
              class="breadcrumb-item"
              @click="navigateToBreadcrumb(index)"
            >
              <svg v-if="index === 0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span v-else>{{ crumb.name }}</span>
              <svg v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </span>
          </div>
          
          <h1 class="view-title">{{ folderData?.name || 'Folder' }}</h1>
          <p class="view-subtitle">
            <span v-if="selectedItems.size > 0">{{ selectedItems.size }} selected • </span>
            {{ itemCount }}
          </p>
        </div>
        
        <div class="header-controls">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              v-model="searchQuery" 
              placeholder="Search in folder..."
              @keydown.escape="searchQuery = ''"
            />
          </div>
  
          <div class="view-switcher">
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/>
              </svg>
            </button>
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
              </svg>
            </button>
          </div>
  
          <div class="sort-control">
            <select v-model="sortBy" @change="sortItems">
              <option value="name">Name</option>
              <option value="date">Date Modified</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
            <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; sortItems()" class="sort-order-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path v-if="sortOrder === 'asc'" d="M7 14l5-5 5 5z"/>
                <path v-else d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
          </div>
  
          <button class="action-btn" @click="showCreateMenu = true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            New
          </button>
        </div>
      </div>
  
      <!-- Drop Zone -->
      <div 
        v-if="isDraggingOver" 
        class="drop-zone-overlay"
        @drop.prevent="handleFileDrop"
        @dragover.prevent
        @dragleave="isDraggingOver = false"
      >
        <div class="drop-zone-content">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <p>Drop files here to add to folder</p>
        </div>
      </div>
  
      <!-- Content Container -->
      <div 
        class="content-container"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        @contextmenu.prevent="showContextMenu"
      >
        <!-- List View -->
        <div v-if="viewMode === 'list'" class="list-view">
          <div class="list-header">
            <div class="list-column name-column" @click="setSortBy('name')">
              Name
              <svg v-if="sortBy === 'name'" viewBox="0 0 24 24" fill="currentColor">
                <path v-if="sortOrder === 'asc'" d="M7 14l5-5 5 5z"/>
                <path v-else d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            <div class="list-column date-column" @click="setSortBy('date')">
              Date Modified
              <svg v-if="sortBy === 'date'" viewBox="0 0 24 24" fill="currentColor">
                <path v-if="sortOrder === 'asc'" d="M7 14l5-5 5 5z"/>
                <path v-else d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            <div class="list-column size-column" @click="setSortBy('size')">
              Size
              <svg v-if="sortBy === 'size'" viewBox="0 0 24 24" fill="currentColor">
                <path v-if="sortOrder === 'asc'" d="M7 14l5-5 5 5z"/>
                <path v-else d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            <div class="list-column type-column" @click="setSortBy('type')">
              Type
              <svg v-if="sortBy === 'type'" viewBox="0 0 24 24" fill="currentColor">
                <path v-if="sortOrder === 'asc'" d="M7 14l5-5 5 5z"/>
                <path v-else d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
          </div>
  
          <div class="list-items">
            <div 
              v-for="item in filteredItems" 
              :key="item.id"
              class="list-item"
              :class="{ 
                selected: selectedItems.has(item.id),
                dragging: draggedItem?.id === item.id
              }"
              :draggable="true"
              @click="handleItemClick(item, $event)"
              @dblclick="openItem(item)"
              @contextmenu.prevent.stop="(e) => showItemContextMenu(e, item)"
              @dragstart="handleDragStart(item, $event)"
              @dragend="handleDragEnd"
              @dragover.prevent="handleDragOver"
              @drop.prevent="(e) => handleDropOnItem(e, item)"
            >
              <div class="item-icon">
                <component :is="getItemIcon(item)" />
              </div>
              <div class="item-name">{{ item.name }}</div>
              <div class="item-date">{{ formatDate(item.modifiedAt) }}</div>
              <div class="item-size">{{ formatSize(item.size) }}</div>
              <div class="item-type">{{ item.type }}</div>
            </div>
          </div>
        </div>
  
        <!-- Grid View -->
        <div v-else class="grid-view">
          <div class="folder-grid">
            <div 
              v-for="item in filteredItems" 
              :key="item.id"
              class="grid-item"
              :class="{ 
                selected: selectedItems.has(item.id),
                dragging: draggedItem?.id === item.id
              }"
              :draggable="true"
              @click="handleItemClick(item, $event)"
              @dblclick="openItem(item)"
              @contextmenu.prevent.stop="(e) => showItemContextMenu(e, item)"
              @dragstart="handleDragStart(item, $event)"
              @dragend="handleDragEnd"
              @dragover.prevent="handleDragOver"
              @drop.prevent="(e) => handleDropOnItem(e, item)"
            >
              <div class="grid-item-icon">
                <component :is="getItemIcon(item)" />
              </div>
              <div class="grid-item-name">{{ item.name }}</div>
              <div class="grid-item-meta">{{ formatItemMeta(item) }}</div>
            </div>
          </div>
        </div>
  
        <!-- Empty State -->
        <div v-if="filteredItems.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
          <h3>{{ searchQuery ? 'No results found' : 'Empty Folder' }}</h3>
          <p>{{ searchQuery ? 'Try a different search term' : 'Drop files here or click New to add content' }}</p>
        </div>
      </div>
  
      <!-- Create Menu -->
      <Teleport to="body">
        <div v-if="showCreateMenu" class="create-menu-overlay" @click="closeCreateMenu">
          <div 
            class="create-menu"
            :style="{ left: createMenuPosition.x + 'px', top: createMenuPosition.y + 'px' }"
            @click.stop
          >
            <div class="create-menu-item" @click="createNewFolder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
              New Folder
            </div>
            <div class="create-menu-item" @click="$emit('action', { type: 'create-playlist' })">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
              New Playlist
            </div>
            <div class="create-menu-item" @click="$emit('action', { type: 'import-files' })">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              Import Files
            </div>
          </div>
        </div>
      </Teleport>
  
      <!-- Context Menu -->
      <Teleport to="body">
        <div 
          v-if="contextMenuVisible" 
          class="context-menu-overlay" 
          @click="closeContextMenu"
          @contextmenu.prevent
        >
          <div 
            class="context-menu"
            :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
            @click.stop
          >
            <div 
              v-if="contextMenuItem"
              class="context-menu-item"
              @click="openItem(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
              Open
            </div>
            <div 
              v-if="contextMenuItem && contextMenuItem.type === 'folder'"
              class="context-menu-item"
              @click="openInNewTab(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              Open in New Tab
            </div>
            <div class="context-menu-separator"></div>
            <div 
              v-if="selectedItems.size > 1"
              class="context-menu-item"
              @click="duplicateSelected(); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Duplicate {{ selectedItems.size }} Items
            </div>
            <div 
              v-else-if="contextMenuItem"
              class="context-menu-item"
              @click="duplicateItem(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Duplicate
            </div>
            <div 
              v-if="contextMenuItem"
              class="context-menu-item"
              @click="renameItem(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Rename
            </div>
            <div class="context-menu-separator"></div>
            <div 
              v-if="selectedItems.size > 1"
              class="context-menu-item danger"
              @click="deleteSelected(); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete {{ selectedItems.size }} Items
            </div>
            <div 
              v-else-if="contextMenuItem"
              class="context-menu-item danger"
              @click="deleteItem(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </div>
          </div>
        </div>
      </Teleport>
  
      <!-- Rename Modal -->
      <Teleport to="body">
        <div v-if="renamingItem" class="modal-overlay" @click="cancelRename">
          <div class="modal-content rename-modal" @click.stop>
            <h3>Rename</h3>
            <input 
              ref="renameInput"
              v-model="newName" 
              @keydown.enter="confirmRename"
              @keydown.escape="cancelRename"
              placeholder="Enter new name..."
            />
            <div class="modal-actions">
              <button @click="confirmRename" class="save-btn">Rename</button>
              <button @click="cancelRename" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, onUnmounted, inject, watch, nextTick, h } from 'vue'
  import { invoke } from '@tauri-apps/api/tauri'
  
  export default {
    name: 'FolderPageTemplate',
    props: {
      folderId: String,
      folderData: Object,
      parentPath: {
        type: Array,
        default: () => []
      }
    },
    emits: ['navigate', 'action', 'update'],
    setup(props, { emit }) {
      // Inject services
      const toast = inject('toast')
      
      // State
      const viewMode = ref('grid')
      const searchQuery = ref('')
      const sortBy = ref('name')
      const sortOrder = ref('asc')
      const selectedItems = ref(new Set())
      const isDraggingOver = ref(false)
      const draggedItem = ref(null)
      const contextMenuVisible = ref(false)
      const contextMenuItem = ref(null)
      const contextMenuPosition = ref({ x: 0, y: 0 })
      const showCreateMenu = ref(false)
      const createMenuPosition = ref({ x: 0, y: 0 })
      const renamingItem = ref(null)
      const newName = ref('')
      const renameInput = ref(null)
      
      // Sample data - replace with actual data loading
      const items = ref([
        {
          id: 'folder-1',
          name: 'Press Photos',
          type: 'folder',
          modifiedAt: new Date('2024-12-15'),
          size: 0,
          itemCount: 42
        },
        {
          id: 'folder-2',
          name: 'Tour Documents',
          type: 'folder',
          modifiedAt: new Date('2024-12-10'),
          size: 0,
          itemCount: 18
        },
        {
          id: 'playlist-1',
          name: 'Summer Tour Setlist',
          type: 'playlist',
          modifiedAt: new Date('2024-12-20'),
          size: 0,
          songCount: 24
        },
        {
          id: 'file-1',
          name: 'Contract_2025.pdf',
          type: 'file',
          fileType: 'pdf',
          modifiedAt: new Date('2024-12-18'),
          size: 2457600
        },
        {
          id: 'file-2',
          name: 'promo_photo_01.jpg',
          type: 'file',
          fileType: 'image',
          modifiedAt: new Date('2024-12-22'),
          size: 4532000
        }
      ])
  
      // Computed
      const breadcrumbs = computed(() => {
        const crumbs = [{ id: 'root', name: 'Home' }]
        if (props.parentPath) {
          crumbs.push(...props.parentPath)
        }
        if (props.folderData) {
          crumbs.push({ id: props.folderId, name: props.folderData.name })
        }
        return crumbs
      })
  
      const filteredItems = computed(() => {
        let filtered = items.value
        
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(query)
          )
        }
        
        // Sort items
        filtered.sort((a, b) => {
          let aVal, bVal
          
          switch(sortBy.value) {
            case 'name':
              aVal = a.name.toLowerCase()
              bVal = b.name.toLowerCase()
              break
            case 'date':
              aVal = a.modifiedAt
              bVal = b.modifiedAt
              break
            case 'size':
              aVal = a.size
              bVal = b.size
              break
            case 'type':
              aVal = a.type
              bVal = b.type
              break
          }
          
          if (sortOrder.value === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
        
        return filtered
      })
  
      const itemCount = computed(() => {
        const folders = items.value.filter(i => i.type === 'folder').length
        const files = items.value.filter(i => i.type !== 'folder').length
        
        if (folders && files) {
          return `${folders} folders, ${files} files`
        } else if (folders) {
          return `${folders} folder${folders > 1 ? 's' : ''}`
        } else if (files) {
          return `${files} file${files > 1 ? 's' : ''}`
        }
        return '0 items'
      })
  
      // Methods
      const getItemIcon = (item) => {
        const icons = {
          folder: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
            h('path', { d: 'M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z' })
          ),
          playlist: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
            h('path', { d: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z' })
          ),
          file: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
            h('path', { d: 'M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z' })
          ),
          image: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
            h('path', { d: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' })
          ),
          pdf: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
            h('path', { d: 'M20,2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M11.5,9.5c0,0.83-0.67,1.5-1.5,1.5H9v2H7.5V7H10C10.83,7,11.5,7.67,11.5,9.5z M16.5,11.5c0,0.83-0.67,1.5-1.5,1.5h-2.5V7H15c0.83,0,1.5,0.67,1.5,1.5v3z M20.5,8.5H19v5h-1.5v-5H16V7h4.5V8.5z' })
          )
        }
        
        if (item.type === 'file' && item.fileType) {
          return icons[item.fileType] || icons.file
        }
        
        return icons[item.type] || icons.file
      }
  
      const formatDate = (date) => {
        const now = new Date()
        const diff = now - date
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        
        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
      }
  
      const formatSize = (bytes) => {
        if (bytes === 0) return '—'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
      }
  
      const formatItemMeta = (item) => {
        if (item.type === 'folder') {
          return `${item.itemCount || 0} items`
        } else if (item.type === 'playlist') {
          return `${item.songCount || 0} songs`
        }
        return formatSize(item.size)
      }
  
      const setSortBy = (field) => {
        if (sortBy.value === field) {
          sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
        } else {
          sortBy.value = field
          sortOrder.value = 'asc'
        }
      }
  
      const sortItems = () => {
        // Trigger re-sort through computed property
      }
  
      // Selection handling
      const handleItemClick = (item, event) => {
        if (event.metaKey || event.ctrlKey) {
          if (selectedItems.value.has(item.id)) {
            selectedItems.value.delete(item.id)
          } else {
            selectedItems.value.add(item.id)
          }
        } else if (event.shiftKey && selectedItems.value.size > 0) {
          // Range selection
          const lastSelected = Array.from(selectedItems.value).pop()
          const lastIndex = filteredItems.value.findIndex(i => i.id === lastSelected)
          const currentIndex = filteredItems.value.findIndex(i => i.id === item.id)
          
          const start = Math.min(lastIndex, currentIndex)
          const end = Math.max(lastIndex, currentIndex)
          
          for (let i = start; i <= end; i++) {
            selectedItems.value.add(filteredItems.value[i].id)
          }
        } else {
          selectedItems.value.clear()
          selectedItems.value.add(item.id)
        }
      }
  
      const openItem = (item) => {
        if (item.type === 'folder') {
          emit('navigate', { type: 'folder', id: item.id, data: item })
        } else if (item.type === 'playlist') {
          emit('navigate', { type: 'playlist', id: item.id })
        } else {
          // Open file
          emit('action', { type: 'open-file', item })
        }
      }
  
      const openInNewTab = (item) => {
        // Implement tab functionality
        emit('action', { type: 'open-in-tab', item })
      }
  
      // Context menu
      const showContextMenu = (event) => {
        contextMenuItem.value = null
        contextMenuPosition.value = { x: event.clientX, y: event.clientY }
        contextMenuVisible.value = true
      }
  
      const showItemContextMenu = (event, item) => {
        if (!selectedItems.value.has(item.id)) {
          selectedItems.value.clear()
          selectedItems.value.add(item.id)
        }
        contextMenuItem.value = item
        contextMenuPosition.value = { x: event.clientX, y: event.clientY }
        contextMenuVisible.value = true
      }
  
      const closeContextMenu = () => {
        contextMenuVisible.value = false
        contextMenuItem.value = null
      }
  
      // Create menu
      const closeCreateMenu = () => {
        showCreateMenu.value = false
      }
  
      const createNewFolder = async () => {
        const newFolder = {
          id: `folder-${Date.now()}`,
          name: 'New Folder',
          type: 'folder',
          modifiedAt: new Date(),
          size: 0,
          itemCount: 0
        }
        
        items.value.unshift(newFolder)
        closeCreateMenu()
        
        // Auto-rename
        await nextTick()
        renameItem(newFolder)
      }
  
      // Item operations
      const renameItem = (item) => {
        renamingItem.value = item
        newName.value = item.name
        nextTick(() => {
          renameInput.value?.select()
        })
      }
  
      const confirmRename = () => {
        if (newName.value && renamingItem.value) {
          renamingItem.value.name = newName.value
          emit('update', { type: 'rename', item: renamingItem.value })
          toast?.value?.show({ msg: 'Renamed successfully', type: 'success' })
        }
        cancelRename()
      }
  
      const cancelRename = () => {
        renamingItem.value = null
        newName.value = ''
      }
  
      const duplicateItem = (item) => {
        const duplicate = {
          ...item,
          id: `${item.type}-${Date.now()}`,
          name: `${item.name} copy`,
          modifiedAt: new Date()
        }
        
        const index = items.value.findIndex(i => i.id === item.id)
        items.value.splice(index + 1, 0, duplicate)
        
        toast?.value?.show({ msg: 'Duplicated successfully', type: 'success' })
      }
  
      const duplicateSelected = () => {
        const toDuplicate = items.value.filter(i => selectedItems.value.has(i.id))
        toDuplicate.forEach(item => duplicateItem(item))
        selectedItems.value.clear()
      }
  
      const deleteItem = (item) => {
        const index = items.value.findIndex(i => i.id === item.id)
        if (index > -1) {
          items.value.splice(index, 1)
          selectedItems.value.delete(item.id)
          toast?.value?.show({ msg: 'Deleted successfully', type: 'success' })
        }
      }
  
      const deleteSelected = () => {
        const count = selectedItems.value.size
        items.value = items.value.filter(i => !selectedItems.value.has(i.id))
        selectedItems.value.clear()
        toast?.value?.show({ msg: `Deleted ${count} items`, type: 'success' })
      }
  
      // Drag and drop
      const handleDragEnter = (e) => {
        if (e.dataTransfer.types.includes('Files')) {
          isDraggingOver.value = true
        }
      }
  
      const handleDragStart = (item, event) => {
        draggedItem.value = item
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', item.id)
        
        if (!selectedItems.value.has(item.id)) {
          selectedItems.value.clear()
          selectedItems.value.add(item.id)
        }
      }
  
      const handleDragEnd = () => {
        draggedItem.value = null
      }
  
      const handleDragOver = (event) => {
        event.dataTransfer.dropEffect = 'move'
      }
  
      const handleDropOnItem = (event, targetItem) => {
        if (!draggedItem.value || targetItem.type !== 'folder') return
        
        // Move item into folder
        emit('action', { 
          type: 'move-to-folder', 
          items: Array.from(selectedItems.value),
          target: targetItem.id 
        })
        
        selectedItems.value.clear()
        draggedItem.value = null
      }
  
      const handleFileDrop = (event) => {
        isDraggingOver.value = false
        const files = Array.from(event.dataTransfer.files)
        
        emit('action', { 
          type: 'import-files', 
          files,
          folderId: props.folderId 
        })
      }
  
      // Navigation
      const navigateToBreadcrumb = (index) => {
        const crumb = breadcrumbs.value[index]
        if (index === 0) {
          emit('navigate', { type: 'root' })
        } else {
          emit('navigate', { type: 'folder', id: crumb.id })
        }
      }
  
      // Keyboard shortcuts
      const handleKeyboard = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
          event.preventDefault()
          if (selectedItems.value.size === items.value.length) {
            selectedItems.value.clear()
          } else {
            items.value.forEach(item => selectedItems.value.add(item.id))
          }
        }
        
        if ((event.key === 'Delete' || event.key === 'Backspace') && selectedItems.value.size > 0) {
          event.preventDefault()
          deleteSelected()
        }
        
        if (event.key === 'Escape') {
          selectedItems.value.clear()
        }
      }
  
      // Mount/unmount
      onMounted(() => {
        document.addEventListener('keydown', handleKeyboard)
        
        // Set create menu position when button is clicked
        const btnRect = document.querySelector('.action-btn')?.getBoundingClientRect()
        if (btnRect) {
          createMenuPosition.value = {
            x: btnRect.left,
            y: btnRect.bottom + 8
          }
        }
      })
  
      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyboard)
      })
  
      return {
        // State
        viewMode,
        searchQuery,
        sortBy,
        sortOrder,
        selectedItems,
        isDraggingOver,
        draggedItem,
        contextMenuVisible,
        contextMenuItem,
        contextMenuPosition,
        showCreateMenu,
        createMenuPosition,
        renamingItem,
        newName,
        renameInput,
        
        // Data
        items,
        breadcrumbs,
        filteredItems,
        itemCount,
        
        // Methods
        getItemIcon,
        formatDate,
        formatSize,
        formatItemMeta,
        setSortBy,
        sortItems,
        handleItemClick,
        openItem,
        openInNewTab,
        showContextMenu,
        showItemContextMenu,
        closeContextMenu,
        closeCreateMenu,
        createNewFolder,
        renameItem,
        confirmRename,
        cancelRename,
        duplicateItem,
        duplicateSelected,
        deleteItem,
        deleteSelected,
        handleDragEnter,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDropOnItem,
        handleFileDrop,
        navigateToBreadcrumb
      }
    }
  }
  </script>
  
  <style scoped>
  .folder-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
    overflow: hidden;
  }
  
  /* Header */
  .view-header {
    padding: 20px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
  }
  
  .header-content {
    margin-bottom: 16px;
  }
  
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .breadcrumb-item:hover {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .breadcrumb-item svg {
    width: 16px;
    height: 16px;
  }
  
  .breadcrumb-separator {
    width: 16px;
    height: 16px;
    opacity: 0.4;
  }
  
  .view-title {
    font-size: 28px;
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
  
  /* Search Box */
  .search-box {
    position: relative;
    flex: 1;
    max-width: 300px;
  }
  
  .search-box svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .search-box input {
    width: 100%;
    padding: 8px 12px 8px 40px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    transition: all 0.15s ease;
  }
  
  .search-box input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  /* View Switcher */
  .view-switcher {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 4px;
  }
  
  .view-btn {
    padding: 6px 10px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
  }
  
  .view-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .view-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .view-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  /* Sort Control */
  .sort-control {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .sort-control select {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }
  
  .sort-control select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .sort-order-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .sort-order-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .sort-order-btn svg {
    width: 16px;
    height: 16px;
  }
  
  /* Action Button */
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    color: black;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  
  /* Drop Zone */
  .drop-zone-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .drop-zone-content {
    text-align: center;
    pointer-events: none;
  }
  
  .drop-zone-content svg {
    width: 64px;
    height: 64px;
    color: white;
    margin-bottom: 16px;
  }
  
  .drop-zone-content p {
    font-size: 18px;
    font-weight: 500;
    color: white;
  }
  
  /* Content Container */
  .content-container {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  
  /* List View */
  .list-view {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .list-header {
    display: flex;
    padding: 12px 32px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .list-column {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  
  .list-column:hover {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .list-column svg {
    width: 12px;
    height: 12px;
  }
  
  .name-column { flex: 1; }
  .date-column { width: 150px; }
  .size-column { width: 100px; }
  .type-column { width: 100px; }
  
  .list-items {
    flex: 1;
    overflow-y: auto;
  }
  
  .list-item {
    display: flex;
    align-items: center;
    padding: 12px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .list-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .list-item.selected {
    background: rgba(29, 185, 84, 0.1);
  }
  
  .list-item.dragging {
    opacity: 0.5;
  }
  
  .item-icon {
    width: 20px;
    height: 20px;
    margin-right: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .item-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .item-name {
    flex: 1;
    font-size: 14px;
  }
  
  .item-date,
  .item-size,
  .item-type {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .item-date { width: 150px; }
  .item-size { width: 100px; }
  .item-type { width: 100px; }
  
  /* Grid View */
  .grid-view {
    padding: 32px;
    overflow-y: auto;
  }
  
  .folder-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 24px;
  }
  
  .grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }
  
  .grid-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .grid-item.selected {
    background: rgba(29, 185, 84, 0.1);
    border-color: #1db954;
  }
  
  .grid-item.dragging {
    opacity: 0.5;
  }
  
  .grid-item-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .grid-item-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .grid-item-name {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: 4px;
    word-break: break-word;
  }
  
  .grid-item-meta {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  /* Empty State */
  .empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 32px;
  }
  
  .empty-state svg {
    width: 64px;
    height: 64px;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 24px;
  }
  
  .empty-state h3 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .empty-state p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Create Menu */
  .create-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
  }
  
  .create-menu {
    position: fixed;
    background: rgba(24, 24, 24, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 4px;
    min-width: 200px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    z-index: 1000;
  }
  
  .create-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .create-menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .create-menu-item svg {
    width: 16px;
    height: 16px;
    opacity: 0.8;
  }
  
  /* Context Menu */
  .context-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
  }
  
  .context-menu {
    position: fixed;
    background: rgba(24, 24, 24, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 4px;
    min-width: 180px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    z-index: 1000;
  }
  
  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .context-menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .context-menu-item.danger {
    color: #ff5555;
  }
  
  .context-menu-item.danger:hover {
    background: rgba(255, 85, 85, 0.1);
  }
  
  .context-menu-item svg {
    width: 16px;
    height: 16px;
    opacity: 0.8;
  }
  
  .context-menu-separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 4px 8px;
  }
  
  /* Rename Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
  }
  
  .modal-content {
    background-color: #181818;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 24px;
    min-width: 400px;
  }
  
  .rename-modal h3 {
    margin: 0 0 16px 0;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }
  
  .rename-modal input {
    width: 100%;
    padding: 12px 16px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    margin-bottom: 20px;
  }
  
  .rename-modal input:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .modal-actions button {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .save-btn {
    background-color: white;
    color: black;
  }
  
  .save-btn:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  .cancel-btn {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  
  .cancel-btn:hover {
    background-color: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  /* Scrollbar */
  .list-items::-webkit-scrollbar,
  .grid-view::-webkit-scrollbar {
    width: 12px;
  }
  
  .list-items::-webkit-scrollbar-track,
  .grid-view::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .list-items::-webkit-scrollbar-thumb,
  .grid-view::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  
  .list-items::-webkit-scrollbar-thumb:hover,
  .grid-view::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
    background-clip: padding-box;
  }
  </style>
<template>
    <aside class="sidebar">
      <div class="sidebar-content">
        <!-- App Header -->
        <div class="sidebar-header">
          <div class="app-logo">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <path d="M10 16.5v-9l6 4.5-6 4.5z" fill="white"/>
            </svg>
            <span class="logo-text">Music</span>
          </div>
          <button @click="toggleEditMode" class="edit-mode-btn header-edit-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
            </svg>
          </button>
        </div>
  
        <!-- Dynamic Navigation -->
        <nav class="sidebar-nav">
        <draggable
          v-model="sections"
          :group="{ name: 'sections', pull: true, put: true }"
          handle=".section-handle"
          :animation="200"
          @change="saveSidebarConfig"
          item-key="id"
        >
          <template #item="{ element: section }">
            <div class="nav-section" :key="section.id">
              <!-- Section Header (if it has a name) -->
              <div v-if="section.name" class="section-header">
                <span class="section-handle" v-if="isEditMode">⋮⋮</span>
                <span class="section-title">{{ section.name }}</span>
                <button 
                  v-if="isEditMode" 
                  @click="editSection(section)" 
                  class="edit-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <!-- Add buttons for different sections -->
                <button 
                  v-if="section.id === 'playlists-section'" 
                  @click="$emit('open-add-modal', 'playlist')"
                  class="add-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
                <button 
                  v-if="section.id === 'custom-pages-section'" 
                  @click="showPageCreator = true"
                  class="add-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
  
              <!-- Section Items -->
              <draggable
                v-model="section.items"
                :group="{ name: 'items', pull: true, put: true }"
                :animation="200"
                @change="saveSidebarConfig"
                item-key="id"
              >
                <template #item="{ element: item }">
                  <div
                    :key="item.id"
                    class="nav-item"
                    :class="{ 
                      active: isItemActive(item),
                      'drag-over': item.type === 'playlist' && dragOverPlaylistId === item.playlistId
                    }"
                    @click="handleItemClick(item)"
                    @contextmenu.prevent="(e) => handleContextMenu(e, item)"
                    @dragenter.prevent="item.type === 'playlist' && $emit('drag-enter', item.playlistId)"
                    @dragover.prevent="item.type === 'playlist' && $emit('drag-over', $event)"
                    @dragleave="item.type === 'playlist' && $emit('drag-leave', $event)"
                    @drop.prevent="(e) => item.type === 'playlist' && $emit('playlist-drop', e, item.playlistId)"
                  >
                    <component :is="getItemIcon(item)" class="nav-icon" />
                    <span>{{ item.label }}</span>
                    <button 
                      v-if="isEditMode" 
                      @click.stop="editingItem = { ...item }"
                      class="item-edit-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                    <button 
                      v-if="item.type === 'custom-page'" 
                      @click.stop="showDeleteConfirm(item)"
                      class="item-delete-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                    <span v-if="item.count !== undefined" class="item-count">{{ item.count }}</span>
                  </div>
                </template>
              </draggable>
            </div>
          </template>
        </draggable>
  
        <!-- Add Section Button (Edit Mode) -->
        <button 
          v-if="isEditMode" 
          @click="addSection" 
          class="add-section-btn"
        >
          + Add Section
        </button>
            </nav>
      </div>
  
      <!-- Page Creator Modal -->
      <Teleport to="body">
        <div v-if="showPageCreator" class="modal-overlay" @click="closePageCreator">
          <div class="modal-content page-creator" @click.stop>
            <h3>Create New Page</h3>
            
            <div class="page-types">
              <div 
                v-for="type in pageTypes" 
                :key="type.id"
                class="page-type-card"
                :class="{ selected: selectedPageType === type.id }"
                @click="selectedPageType = type.id"
              >
                <div class="page-type-icon">
                  <component :is="type.icon" />
                </div>
                <h4>{{ type.name }}</h4>
                <p>{{ type.description }}</p>
              </div>
            </div>
  
            <input 
              v-model="newPageTitle" 
              placeholder="Page Title"
              class="page-title-input"
              @keydown.enter="createPage"
            />
  
            <div class="modal-actions">
              <button @click="createPage" class="save-btn" :disabled="!selectedPageType || !newPageTitle">
                Create Page
              </button>
              <button @click="closePageCreator" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </Teleport>
  
      <!-- Section Editor Modal -->
      <Teleport to="body">
        <div v-if="editingSection" class="modal-overlay" @click="closeEditor">
          <div class="modal-content" @click.stop>
            <h3>Edit Section</h3>
            <input 
              v-model="editingSection.name" 
              placeholder="Section Name"
              class="section-name-input"
            />
            <div class="modal-actions">
              <button @click="saveSection" class="save-btn">Save</button>
              <button @click="deleteSection" class="delete-btn">Delete</button>
              <button @click="closeEditor" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </Teleport>
  
      <!-- Item Editor Modal -->
      <Teleport to="body">
        <div v-if="editingItem" class="modal-overlay" @click="closeItemEditor">
          <div class="modal-content" @click.stop>
            <h3>Edit Item</h3>
            <input 
              v-model="editingItem.label" 
              placeholder="Item Name"
              class="section-name-input"
            />
            <p class="edit-note">Note: This only changes the display name, not the functionality.</p>
            <div class="modal-actions">
              <button @click="saveItem" class="save-btn">Save</button>
              <button @click="resetItem" class="reset-btn">Reset to Default</button>
              <button @click="closeItemEditor" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </Teleport>
  
      <!-- Delete Page Confirmation Modal -->
      <Teleport to="body">
        <div v-if="deletingPage" class="modal-overlay" @click="cancelDeletePage">
          <div class="modal-content" @click.stop>
            <h3>Delete Page</h3>
            <p class="delete-warning">
              Are you sure you want to delete "{{ deletingPage.label }}"? This action cannot be undone.
            </p>
            <div class="modal-actions">
              <button @click="confirmDeletePage" class="delete-btn">Delete</button>
              <button @click="cancelDeletePage" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </Teleport>
  
      <!-- Custom Context Menu for Pages -->
      <Teleport to="body">
        <div 
          v-if="contextMenuItem" 
          class="context-menu-overlay" 
          @click="closeContextMenu"
          @contextmenu.prevent
        >
          <div 
            class="context-menu"
            :style="{ 
              left: contextMenuPosition.x + 'px', 
              top: contextMenuPosition.y + 'px' 
            }"
            @click.stop
          >
            <div 
              class="context-menu-item"
              @click="editingItem = { ...contextMenuItem }; closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit Name
            </div>
            <div 
              class="context-menu-item danger"
              @click="showDeleteConfirm(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete Page
            </div>
          </div>
        </div>
      </Teleport>
    </aside>
  </template>
  
  <script setup>
  import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue'
  import { invoke } from '@tauri-apps/api/tauri'
  import draggable from 'vuedraggable'
  
  // Props
  const props = defineProps({
    activeView: String,
    activeArtistId: String,
    activePlaylistId: String,
    activeCustomPageId: String,
    songs: Array,
    artists: Array,
    playlists: Array,
    customPages: Array,
    dragOverPlaylistId: String
  })
  
  // Emits
  const emit = defineEmits([
    'set-active-view',
    'open-add-modal',
    'show-context-menu',
    'drag-enter',
    'drag-over',
    'drag-leave',
    'playlist-drop',
    'create-custom-page',
    'delete-custom-page',
    'create-folder'
  ])
  
  // State
  const isEditMode = ref(false)
  const editingSection = ref(null)
  const editingItem = ref(null)
  const showPageCreator = ref(false)
  const selectedPageType = ref('')
  const newPageTitle = ref('')
  const deletingPage = ref(null)
  const contextMenuItem = ref(null)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  
  // Page types configuration - Added folder
  const pageTypes = [
    {
      id: 'folder',
      name: 'Folder',
      description: 'Organize content in hierarchical folders',
      icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z' })
      )
    },
    {
      id: 'calendar',
      name: 'Calendar',
      description: 'Track tour dates, sessions, and deadlines',
      icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z' })
      )
    },
    {
      id: 'timeline',
      name: 'Timeline',
      description: 'Visualize project milestones and career progression',
      icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.64 6.56l-3.54 3.54c-.78.78-2.05.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0l1.41 1.41 2.12-2.12c.78-.78 2.05-.78 2.83 0s.78 2.05 0 2.83z' })
      )
    },
    {
      id: 'assets',
      name: 'Asset Library',
      description: 'Organize press photos, artwork, and documents',
      icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z' })
      )
    },
    {
      id: 'moodboard',
      name: 'Mood Board',
      description: 'Create visual boards for creative planning',
      icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.19 0 .34-.16.34-.34 0-.09-.03-.17-.09-.25-.27-.44-.64-1.41-.64-2.41 0-1.66 1.34-3 3-3h3.5c3.03 0 5.5-2.47 5.5-5.5C22 5.81 17.19 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' })
      )
    },
    {
      id: 'ideas',
      name: 'Ideas & Notes',
      description: 'Capture song concepts, strategies, and notes',
      icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z' })
      )
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Custom overview with stats and widgets',
      icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' })
      )
    }
  ]
  
  // Store original labels for reset functionality
  const originalLabels = {
    home: 'Home',
    search: 'Search',
    songs: 'Songs',
    artists: 'Artists',
    playlists: 'Playlists'
  }
  
  // Default sidebar configuration
  const defaultSections = [
    {
      id: 'primary-nav',
      name: null, // No header for primary navigation
      items: [
        { id: 'home', type: 'route', label: 'Home', icon: 'home', view: 'home' },
        { id: 'search', type: 'route', label: 'Search', icon: 'search', view: 'search' }
      ]
    },
    {
      id: 'library-section',
      name: 'LIBRARY',
      items: [
        { id: 'songs', type: 'route', label: 'Songs', icon: 'music', view: 'all-songs' },
        { id: 'artists', type: 'route', label: 'Artists', icon: 'artist', view: 'artists' },
        { id: 'playlists', type: 'route', label: 'Playlists', icon: 'playlist', view: 'playlists' }
      ]
    },
    {
      id: 'playlists-section',
      name: 'PLAYLISTS',
      items: []
    },
    {
      id: 'custom-pages-section',
      name: 'PAGES',
      items: []
    }
  ]
  
  // Reactive sections
  const sections = ref(JSON.parse(JSON.stringify(defaultSections)))
  
  // Load saved configuration
  const loadSidebarConfig = async () => {
    try {
      const saved = localStorage.getItem('sidebarConfig')
      if (saved) {
        sections.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load sidebar config:', error)
    }
  }
  
  // Save configuration
  const saveSidebarConfig = () => {
    try {
      localStorage.setItem('sidebarConfig', JSON.stringify(sections.value))
    } catch (error) {
      console.error('Failed to save sidebar config:', error)
    }
  }
  
  // Update counts when props change
  watch(() => props.songs, () => updateCounts(), { deep: true })
  watch(() => props.artists, () => updateCounts(), { deep: true })
  watch(() => props.playlists, () => {
    updateCounts()
    updatePlaylistItems()
  }, { deep: true })
  watch(() => props.customPages, () => {
    updateCustomPageItems()
  }, { deep: true })
  
  // Update item counts
  const updateCounts = () => {
    sections.value.forEach(section => {
      section.items.forEach(item => {
        if (item.id === 'songs') {
          item.count = props.songs?.length || 0
        } else if (item.id === 'artists') {
          item.count = props.artists?.length || 0
        } else if (item.id === 'playlists') {
          item.count = props.playlists?.length || 0
        }
      })
    })
  }
  
  // Update playlist items
  const updatePlaylistItems = () => {
    const playlistSection = sections.value.find(s => s.id === 'playlists-section')
    if (playlistSection && props.playlists) {
      // Keep existing order but update with new playlists
      const existingIds = new Set(playlistSection.items.map(item => item.playlistId))
      const newPlaylists = props.playlists.filter(p => !existingIds.has(p.id))
      
      // Add new playlists
      newPlaylists.forEach(playlist => {
        playlistSection.items.push({
          id: `playlist-${playlist.id}`,
          type: 'playlist',
          label: playlist.name,
          playlistId: playlist.id,
          view: 'playlist'
        })
      })
      
      // Remove deleted playlists
      const currentIds = new Set(props.playlists.map(p => p.id))
      playlistSection.items = playlistSection.items.filter(
        item => currentIds.has(item.playlistId)
      )
      
      // Update names if changed
      playlistSection.items.forEach(item => {
        const playlist = props.playlists.find(p => p.id === item.playlistId)
        if (playlist) {
          item.label = playlist.name
        }
      })
    }
  }
  
  // Update custom page items - simplified without hierarchy for now
  const updateCustomPageItems = () => {
    const pagesSection = sections.value.find(s => s.id === 'custom-pages-section')
    if (pagesSection && props.customPages) {
      // Clear and rebuild custom page items
      pagesSection.items = props.customPages.map(page => ({
        id: `custom-${page.id}`,
        type: 'custom-page',
        label: page.title,
        icon: getPageTypeIcon(page.type),
        customPageId: page.id,
        view: `custom-${page.id}`,
        pageType: page.type
      }))
    }
  }
  
  // Get icon for page type
  const getPageTypeIcon = (type) => {
    const typeMap = {
      calendar: 'calendar',
      timeline: 'timeline',
      assets: 'folder',
      moodboard: 'palette',
      ideas: 'lightbulb',
      dashboard: 'dashboard',
      folder: 'folder'
    }
    return typeMap[type] || 'document'
  }
  
  // Check if item is active
  const isItemActive = (item) => {
    if (item.view === props.activeView) {
      if (item.type === 'playlist') {
        return item.playlistId === props.activePlaylistId
      } else if (item.type === 'custom-page') {
        return item.customPageId === props.activeCustomPageId
      }
      return true
    }
    return false
  }
  
  // Handle item click
  const handleItemClick = (item) => {
    if (item.type === 'playlist') {
      emit('set-active-view', 'playlist', item.playlistId)
    } else if (item.type === 'custom-page') {
      emit('set-active-view', `custom-${item.customPageId}`)
    } else if (item.view) {
      emit('set-active-view', item.view)
    }
  }
  
  // Handle context menu
  const handleContextMenu = (event, item) => {
    // In edit mode, show edit option for all items
    if (isEditMode.value) {
      event.preventDefault()
      editingItem.value = { ...item }
      return
    }
    
    // Normal mode - show context menu for playlists and custom pages
    if (item.type === 'playlist') {
      const playlist = props.playlists.find(p => p.id === item.playlistId)
      if (playlist) {
        emit('show-context-menu', event, [playlist], 'playlist')
      }
    } else if (item.type === 'custom-page') {
      event.preventDefault()
      contextMenuItem.value = item
      contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    }
  }
  
  // Close context menu when clicking outside
  const closeContextMenu = () => {
    contextMenuItem.value = null
  }
  
  // Toggle edit mode
  const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value
    if (!isEditMode.value) {
      saveSidebarConfig()
    }
  }
  
  // Section management
  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      items: []
    }
    sections.value.push(newSection)
    editingSection.value = { ...newSection }
  }
  
  const editSection = (section) => {
    editingSection.value = { ...section }
  }
  
  const saveSection = () => {
    const index = sections.value.findIndex(s => s.id === editingSection.value.id)
    if (index !== -1) {
      sections.value[index].name = editingSection.value.name
      saveSidebarConfig()
    }
    closeEditor()
  }
  
  const deleteSection = () => {
    const index = sections.value.findIndex(s => s.id === editingSection.value.id)
    if (index !== -1) {
      sections.value.splice(index, 1)
      saveSidebarConfig()
    }
    closeEditor()
  }
  
  const closeEditor = () => {
    editingSection.value = null
  }
  
  // Item editing functions
  const saveItem = () => {
    const sectionIndex = sections.value.findIndex(section => 
      section.items.some(item => item.id === editingItem.value.id)
    )
    
    if (sectionIndex !== -1) {
      const itemIndex = sections.value[sectionIndex].items.findIndex(
        item => item.id === editingItem.value.id
      )
      
      if (itemIndex !== -1) {
        sections.value[sectionIndex].items[itemIndex].label = editingItem.value.label
        saveSidebarConfig()
      }
    }
    
    closeItemEditor()
  }
  
  const resetItem = () => {
    if (editingItem.value && originalLabels[editingItem.value.id]) {
      editingItem.value.label = originalLabels[editingItem.value.id]
      saveItem()
    }
  }
  
  const closeItemEditor = () => {
    editingItem.value = null
  }
  
  // Delete page functions
  const showDeleteConfirm = (item) => {
    deletingPage.value = item
  }
  
  const confirmDeletePage = () => {
    if (deletingPage.value) {
      emit('delete-custom-page', deletingPage.value.customPageId)
      deletingPage.value = null
    }
  }
  
  const cancelDeletePage = () => {
    deletingPage.value = null
  }
  
  // Page creator functions
  const createPage = () => {
    if (!selectedPageType.value || !newPageTitle.value.trim()) return
    
    const pageConfig = {
      type: selectedPageType.value,
      title: newPageTitle.value.trim(),
      icon: getPageTypeIcon(selectedPageType.value),
      data: getDefaultPageData(selectedPageType.value),
      config: getDefaultPageConfig(selectedPageType.value)
    }
    
    emit('create-custom-page', pageConfig)
    closePageCreator()
  }
  
  const closePageCreator = () => {
    showPageCreator.value = false
    selectedPageType.value = ''
    newPageTitle.value = ''
  }
  
  // Get default data for page types - Added folder
  const getDefaultPageData = (type) => {
    switch (type) {
      case 'folder':
        return { 
          items: [],
          name: 'New Folder'
        }
      case 'calendar':
        return { events: [] }
      case 'timeline':
        return { items: [] }
      case 'assets':
        return { assets: [] }
      case 'moodboard':
        return { elements: [] }
      case 'ideas':
        return { 
          boards: [
            { id: 'ideas', name: 'Ideas', color: '#667eea' },
            { id: 'todo', name: 'To Do', color: '#f59e0b' },
            { id: 'in-progress', name: 'In Progress', color: '#3b82f6' },
            { id: 'done', name: 'Done', color: '#10b981' }
          ],
          notes: []
        }
      case 'dashboard':
        return {
          sections: [
            {
              id: 'quick-access',
              type: 'quick-access',
              title: 'Quick access',
              items: []
            },
            {
              id: 'recent',
              type: 'recent',
              title: 'Recently played',
              items: [],
              limit: 8
            },
            {
              id: 'stats',
              type: 'stats',
              title: 'Overview',
              stats: []
            }
          ]
        }
      default:
        return {}
    }
  }
  
  // Get default config for page types - Added folder
  const getDefaultPageConfig = (type) => {
    switch (type) {
      case 'folder':
        return { 
          viewMode: 'grid',
          sortBy: 'name',
          sortOrder: 'asc'
        }
      case 'calendar':
        return { defaultView: 'month' }
      case 'timeline':
        return { viewMode: 'stack' }
      case 'assets':
        return { itemsPerPage: 24 }
      case 'moodboard':
        return { canvasSize: 2000, gridSize: 20 }
      case 'ideas':
        return { itemsPerPage: 20 }
      default:
        return {}
    }
  }
  
  // Icon components
  const getItemIcon = (item) => {
    const icons = {
      home: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' })
      ),
      search: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' })
      ),
      music: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' })
      ),
      artist: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' })
      ),
      playlist: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z' })
      ),
      calendar: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z' })
      ),
      timeline: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.64 6.56l-3.54 3.54c-.78.78-2.05.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0l1.41 1.41 2.12-2.12c.78-.78 2.05-.78 2.83 0s.78 2.05 0 2.83z' })
      ),
      folder: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' })
      ),
      palette: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.19 0 .34-.16.34-.34 0-.09-.03-.17-.09-.25-.27-.44-.64-1.41-.64-2.41 0-1.66 1.34-3 3-3h3.5c3.03 0 5.5-2.47 5.5-5.5C22 5.81 17.19 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' })
      ),
      lightbulb: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z' })
      ),
      dashboard: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' })
      ),
      document: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, 
        h('path', { d: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' })
      )
    }
    
    return icons[item.icon] || icons.playlist
  }
  
  // Initialize
  onMounted(() => {
    loadSidebarConfig()
    updateCounts()
    updatePlaylistItems()
    updateCustomPageItems()
    
    // Add global click handler for context menu
    document.addEventListener('click', closeContextMenu)
  })
  
  // Cleanup
  onUnmounted(() => {
    document.removeEventListener('click', closeContextMenu)
  })
  </script>

<style scoped>
/* Keep all your existing sidebar styles */
.sidebar {
  width: var(--sidebar-width);
  background: rgba(18, 18, 18, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  height: 100%;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.header-edit-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-edit-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.15);
}

.header-edit-btn svg {
  width: 18px;
  height: 18px;
}

.logo-icon {
  width: 30px;
  height: 30px;
  color: #1db954;
}

.logo-text {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.05) transparent;
}

.nav-section {
  margin-bottom: 16px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
}

.nav-section:not(:last-child)::after {
  content: '';
  display: block;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 16px 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 8px;
  height: 32px;
}

.section-handle {
  cursor: move;
  opacity: 0.5;
  font-size: 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  height: 36px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav-item.drag-over {
  background: rgba(255, 255, 255, 0.08) !important;
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

/* Nested folder styles */
.nav-item.nested-1 { padding-left: 40px; }
.nav-item.nested-2 { padding-left: 56px; }
.nav-item.nested-3 { padding-left: 72px; }

.folder-arrow {
  width: 16px;
  height: 16px;
  margin-left: -4px;
  margin-right: -4px;
  transition: transform 0.15s ease;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.6;
}

.folder-arrow:hover {
  opacity: 1;
}

.folder-arrow.expanded {
  transform: rotate(90deg);
}

.folder-children {
  overflow: hidden;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.8;
}

.item-count {
  margin-left: auto;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.add-btn, .edit-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.add-btn:hover, .edit-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.add-btn svg, .edit-btn svg {
  width: 16px;
  height: 16px;
}

.add-section-btn {
  width: 100%;
  padding: 12px;
  margin: 16px 0;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.add-section-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.8);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #282828;
  padding: 24px;
  border-radius: 8px;
  min-width: 300px;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #fff;
}

.section-name-input,
.page-title-input {
  width: 100%;
  padding: 8px 12px;
  background-color: #3e3e3e;
  border: 1px solid #535353;
  color: #fff;
  border-radius: 4px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn {
  background-color: #1db954;
  color: #fff;
}

.save-btn:disabled {
  background-color: #535353;
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #b91c1c;
  color: #fff;
}

.cancel-btn {
  background-color: #3e3e3e;
  color: #fff;
}

.item-edit-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
  margin-left: auto;
  margin-right: 4px;
  opacity: 0;
}

.nav-item:hover .item-edit-btn {
  opacity: 1;
}

.item-edit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.item-edit-btn svg {
  width: 12px;
  height: 12px;
}

.item-delete-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
  margin-right: 4px;
  opacity: 0;
}

.nav-item:hover .item-delete-btn {
  opacity: 1;
}

.item-delete-btn:hover {
  background: rgba(255, 85, 85, 0.1);
  color: rgba(255, 85, 85, 0.8);
}

.item-delete-btn svg {
  width: 12px;
  height: 12px;
}

.delete-warning {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  line-height: 1.4;
}

/* Context Menu */
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.context-menu {
  position: fixed;
  background: rgba(40, 40, 40, 0.98);
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

.edit-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 8px 0 16px 0;
}

.reset-btn {
  background-color: #535353;
  color: #fff;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

/* Page Creator Modal */
.page-creator {
  max-width: 600px;
  width: 90vw;
}

.page-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.page-type-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.page-type-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.page-type-card.selected {
  background: rgba(29, 185, 84, 0.1);
  border-color: #1db954;
}

.page-type-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: rgba(255, 255, 255, 0.6);
}

.page-type-icon svg {
  width: 100%;
  height: 100%;
}

.page-type-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #fff;
}

.page-type-card p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

/* Drag styles */
.sortable-ghost {
  opacity: 0.5;
}

.sortable-drag {
  background-color: #282828;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 8px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
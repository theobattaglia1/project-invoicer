<template>
  <div id="app">
    <!-- Main Container with fixed layout -->
    <div class="app-container">
      <!-- Dynamic Sidebar Component -->
      <DynamicSidebar
        :active-view="activeView"
        :active-artist-id="activeArtistId"
        :active-playlist-id="activePlaylistId"
        :active-custom-page-id="activeCustomPageId"
        :songs="songs"
        :artists="artists"
        :playlists="generalPlaylists"
        :custom-pages="customPages"
        :drag-over-playlist-id="dragOverPlaylistId"
        @set-active-view="setActiveView"
        @open-add-modal="openAddModal"
        @show-context-menu="showContextMenu"
        @drag-enter="handleDragEnter"
        @drag-over="handleDragOver"
        @drag-leave="handleDragLeave"
        @playlist-drop="handlePlaylistExternalDrop"
        @create-custom-page="handleCreateCustomPage"
        @delete-custom-page="handleDeleteCustomPage"
        @create-folder="handleCreateFolder"
      />

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Dynamic Content -->
        <div class="content-scroll">
          <component :is="currentViewComponent" 
                     v-bind="currentViewProps"
                     @play-song="handlePlaySong"
                     @add-to-queue="handleAddToQueue"
                     @show-context-menu="showContextMenu"
                     @navigate-to-artist="navigateToArtist"
                     @navigate-to-playlist="navigateToPlaylist"
                     @navigate="handleNavigation"
                     @action="handlePageAction"
                     @update="handlePageUpdate"
                     @edit-metadata="handleEditMetadata"
                     @open-add-modal="openAddModal"
                     @select-songs="handleSelectSongs" />
        </div>
      </main>
    </div>

    <!-- Fixed Now Playing Bar -->
    <NowPlayingBar 
      v-if="currentSong"
      :current-song="currentSong"
      :is-playing="isPlaying"
      :current-time="currentTime"
      :duration="duration"
      :volume="volume"
      :is-shuffled="isShuffled"
      :repeat-mode="repeatMode"
      @toggle-playback="togglePlayback"
      @seek="handleSeek"
      @previous="playPrevious"
      @next="playNext"
      @toggle-shuffle="toggleShuffle"
      @toggle-repeat="toggleRepeat"
      @volume-change="handleVolumeChange"
      @navigate-to-artist="navigateToArtist"
    />

    <!-- Unified Content Modal -->
    <UnifiedContentModal 
      ref="unifiedModalRef"
      @add="handleAddContent" 
    />
    
    <!-- Global UI Components -->
    <Toast ref="toastRef" />
    <ContextMenu ref="contextMenuRef" />
  </div>
</template>

<script>
// Keep all the existing script content exactly as is
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { listen } from '@tauri-apps/api/event'
import HomeView from './components/HomeView.vue'
import AllSongsView from './components/AllSongsView.vue'
import ArtistsView from './components/ArtistsView.vue'
import PlaylistsView from './components/PlaylistsView.vue'
import ArtistProfileView from './components/ArtistProfileView.vue'
import ArtistSongsView from './components/ArtistSongsView.vue'
import PlaylistDetailView from './components/PlaylistDetailView.vue'
import NowPlayingBar from './components/NowPlayingBar.vue'
import UnifiedContentModal from './components/UnifiedContentModal.vue'
import Toast from './components/Toast.vue'
import ContextMenu from './components/ContextMenu.vue'
import DynamicSidebar from './components/DynamicSidebar.vue'
// Import the new DynamicPage component
import DynamicPage from './components/DynamicPage.vue'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'
import { importFiles } from '@/utils/importFiles'
import { useToastStore } from '@/store/toast'
import { useDragDropStore } from '@/store/dragdrop'
import { useMusicStore } from '@/store/music'

export default {
  name: 'App',
  components: {
    HomeView,
    AllSongsView,
    ArtistsView,
    PlaylistsView,
    ArtistProfileView,
    ArtistSongsView,
    PlaylistDetailView,
    NowPlayingBar,
    UnifiedContentModal,
    Toast,
    ContextMenu,
    DynamicSidebar,
    DynamicPage // Add the new component
  },
  setup() {
    // Global component refs
    const contextMenuRef = ref(null)
    const unifiedModalRef = ref(null)
    const toastRef = ref(null)

    // Provide these refs so child components can inject and use them
    provide('contextMenu', contextMenuRef)
    provide('metadataEditor', unifiedModalRef) // Keep the same name for backward compatibility
    provide('toast', toastRef)

    // Navigation state
    const activeView = ref('home')
    const activeArtistId = ref(null)
    const activePlaylistId = ref(null)
    const activeCustomPageId = ref(null) // Add custom page ID

    // UI state
    const dragOverPlaylistId = ref(null)
    const showFileDropOverlay = ref(false)

    // Data
    const artists = ref([])
    const songs = ref([])
    const albums = ref([])
    const generalPlaylists = ref([])
    const customPages = ref([]) // Add custom pages array

    // Store instances
    const toastStore = useToastStore()
    const dragStore = useDragDropStore()
    const musicStore = useMusicStore()
    const showToast = (options) => toastStore.push(options)
    
    // Audio integration
    const playback = usePlaybackIntegration()

    // Computed
    const allSongs = computed(() => songs.value)
    const recentSongs = computed(() => songs.value.slice(0, 4))

    const currentArtist = computed(() => 
      artists.value.find(a => a.id === activeArtistId.value)
    )

    const currentArtistSongs = computed(() => 
      songs.value.filter(s => s.artist_id === activeArtistId.value)
    )

    const currentArtistAlbums = computed(() => 
      albums.value.filter(a => a.artist_id === activeArtistId.value)
    )

    const currentPlaylist = computed(() => {
      const playlist = generalPlaylists.value.find(p => p.id === activePlaylistId.value)
      console.log('🎵 Current playlist:', playlist)
      return playlist
    })

    const currentPlaylistSongs = computed(() => {
      const playlist = currentPlaylist.value
      console.log('🔍 Computing playlist songs for:', playlist)
      
      if (!playlist) return []
      
      if (playlist.songs && Array.isArray(playlist.songs)) {
        console.log('🔍 Found playlist.songs:', playlist.songs)
        return playlist.songs
      }
      
      if (playlist.song_ids && Array.isArray(playlist.song_ids)) {
        console.log('🔍 Found playlist.song_ids:', playlist.song_ids)
        console.log('🔍 All songs:', songs.value)
        const filtered = songs.value.filter(s => playlist.song_ids.includes(s.id))
        console.log('🔍 Filtered songs:', filtered)
        return filtered
      }
      
      return []
    })

    // Add current custom page computed
    const currentCustomPage = computed(() => {
      if (!activeCustomPageId.value) return null
      const page = customPages.value.find(p => p.id === activeCustomPageId.value)
      
      // If it's a folder, add parent path for breadcrumbs
      if (page && page.type === 'folder') {
        page.parentPath = getParentPath(page.id)
      }
      
      return page
    })

    const totalStorageUsed = computed(() => {
      return songs.value.reduce((total, song) => total + (song.file_size || 0), 0)
    })

    const storagePercent = computed(() => {
      const maxStorage = 100 * 1024 * 1024 * 1024
      return Math.min((totalStorageUsed.value / maxStorage) * 100, 100)
    })

    // Keep all existing computed properties from playback
    const currentSong = computed(() => playback.currentSong.value)
    const isPlaying = computed(() => playback.isPlaying.value)
    const currentTime = computed(() => playback.currentTime.value)
    const duration = computed(() => playback.duration.value)
    const volume = computed(() => playback.volume.value)
    const isShuffled = computed(() => playback.isShuffled.value)
    const repeatMode = computed(() => playback.repeatMode.value)

    // Updated dynamic component resolution to support custom pages
    const currentViewComponent = computed(() => {
      // Check if it's a custom page
      if (activeView.value.startsWith('custom-')) {
        return 'DynamicPage'
      }
      
      // Otherwise use existing components
      switch (activeView.value) {
        case 'home': return 'HomeView'
        case 'all-songs': return 'AllSongsView'
        case 'artists': return 'ArtistsView'
        case 'playlists': return 'PlaylistsView'
        case 'artist-profile': return 'ArtistProfileView'
        case 'artist-songs': return 'ArtistSongsView'
        case 'playlist': return 'PlaylistDetailView'
        default: return 'HomeView'
      }
    })

    // Updated view props to support custom pages
    const currentViewProps = computed(() => {
      // Handle custom pages
      if (activeView.value.startsWith('custom-')) {
        return {
          pageConfig: currentCustomPage.value
        }
      }
      
      // Existing view props logic
      switch (activeView.value) {
        case 'home':
          return {
            artists: artists.value,
            recentSongs: recentSongs.value,
            playlists: generalPlaylists.value,
            allSongs: allSongs.value
          }
        case 'all-songs':
          return {
            songs: allSongs.value,
            onFileDrop: handleAllSongsFileDrop
          }
        case 'artists':
          return {
            artists: artists.value,
            songs: allSongs.value,
            onFileDropToArtist: handleFileDropToArtist
          }
        case 'playlists':
          return {
            playlists: generalPlaylists.value,
            songs: allSongs.value,
            onFileDropToPlaylist: handleFileDropToPlaylist
          }
        case 'artist-profile':
          return {
            artist: currentArtist.value,
            songs: currentArtistSongs.value,
            playlists: generalPlaylists.value
          }
        case 'artist-songs':
          return {
            artist: currentArtist.value,
            songs: currentArtistSongs.value,
            onFileDropToArtist: handleFileDropToArtist
          }
        case 'playlist':
          return {
            playlist: currentPlaylist.value,
            songs: currentPlaylistSongs.value
          }
        default:
          return {}
      }
    })

    // Playback control methods
    const togglePlayback = () => playback.togglePlayPause()
    const handleSeek = (time) => playback.seek(time)
    const playNext = () => playback.playNext()
    const playPrevious = () => playback.playPrevious()
    const toggleShuffle = () => playback.toggleShuffle()
    const toggleRepeat = () => playback.toggleRepeat()
    const handleVolumeChange = (vol) => playback.setVolume(vol)

    // Updated setActiveView to support custom pages
    const setActiveView = (view, id = null) => {
      activeView.value = view
      
      // Reset all IDs first
      activeArtistId.value = null
      activePlaylistId.value = null
      activeCustomPageId.value = null
      
      // Set the appropriate ID based on view type
      if (view === 'artist-songs' || view === 'artist-profile') {
        activeArtistId.value = id
      } else if (view === 'playlist') {
        activePlaylistId.value = id
      } else if (view.startsWith('custom-')) {
        activeCustomPageId.value = view.replace('custom-', '')
      }
    }

    // Helper to get all folders for hierarchy
    const getAllFolders = () => {
      return customPages.value.filter(p => p.type === 'folder')
    }

    // Helper to build parent path for breadcrumbs
    const getParentPath = (folderId) => {
      const path = []
      let currentId = folderId
      
      while (currentId) {
        const folder = customPages.value.find(p => p.id === currentId)
        if (folder && folder.parentId) {
          const parent = customPages.value.find(p => p.id === folder.parentId)
          if (parent) {
            path.unshift({ id: parent.id, name: parent.title })
            currentId = parent.parentId
          } else {
            break
          }
        } else {
          break
        }
      }
      
      return path
    }

    // Custom page management methods
    const loadCustomPages = () => {
      try {
        const saved = localStorage.getItem('customPages')
        if (saved) {
          customPages.value = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading custom pages:', error)
      }
    }

    const saveCustomPages = () => {
      try {
        localStorage.setItem('customPages', JSON.stringify(customPages.value))
      } catch (error) {
        console.error('Error saving custom pages:', error)
      }
    }

    const handleCreateCustomPage = (pageConfig) => {
      const newPage = {
        id: `page-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...pageConfig
      }
      
      customPages.value.push(newPage)
      saveCustomPages()
      
      // Navigate to the new page
      setActiveView(`custom-${newPage.id}`)
      
      showToast({ msg: `Created new ${pageConfig.type} page: ${pageConfig.title}`, type: 'success' })
    }

    const handleDeleteCustomPage = (pageId) => {
      const index = customPages.value.findIndex(p => p.id === pageId)
      if (index > -1) {
        const page = customPages.value[index]
        
        // If deleting a folder, also delete all children
        if (page.type === 'folder') {
          deleteChildrenOfFolder(pageId)
        }
        
        customPages.value.splice(index, 1)
        saveCustomPages()
        
        // If we're viewing this page, go back to home
        if (activeCustomPageId.value === pageId) {
          setActiveView('home')
        }
        
        showToast({ msg: `Deleted page: ${page.title}`, type: 'success' })
      }
    }

    const deleteChildrenOfFolder = (folderId) => {
      const children = customPages.value.filter(p => p.parentId === folderId)
      children.forEach(child => {
        if (child.type === 'folder') {
          deleteChildrenOfFolder(child.id)
        }
        const index = customPages.value.findIndex(p => p.id === child.id)
        if (index > -1) {
          customPages.value.splice(index, 1)
        }
      })
    }

    const handleUpdateCustomPage = (pageId, updates) => {
      const page = customPages.value.find(p => p.id === pageId)
      if (page) {
        Object.assign(page, updates)
        saveCustomPages()
        showToast({ msg: 'Page updated', type: 'success' })
      }
    }

    // Handle navigation from custom pages
    const handleNavigation = (target) => {
      if (target.type === 'artist') {
        navigateToArtist(target.id)
      } else if (target.type === 'playlist') {
        navigateToPlaylist(target.id)
      } else if (target.type === 'folder') {
        // Navigate to folder
        const folder = customPages.value.find(p => p.id === target.id)
        if (folder) {
          // Add parent path for breadcrumbs
          folder.parentPath = getParentPath(folder.id)
          setActiveView(`custom-${target.id}`)
        }
      } else if (target.type === 'custom') {
        setActiveView(`custom-${target.id}`)
      } else if (target.type === 'root') {
        // Navigate to root/home
        setActiveView('home')
      }
    }

    // Updated handle page actions to support all new features
    const handlePageAction = (action) => {
      switch (action.type) {
        case 'update-data':
          // Update page data when timeline or other pages modify their content
          if (activeCustomPageId.value) {
            const page = customPages.value.find(p => p.id === activeCustomPageId.value)
            if (page) {
              page.data = { ...page.data, ...action.data }
              saveCustomPages()
            }
          }
          break
        case 'create-playlist':
          openAddModal('playlist')
          break
        case 'import-files':
          if (action.folderId) {
            // Import files into a specific folder
            handleImportToFolder(action.files, action.folderId)
          } else {
            openAddModal('import')
          }
          break
        case 'open-file':
          // Handle file opening
          console.log('Open file:', action.item)
          showToast({ msg: 'File opening not implemented yet', type: 'info' })
          break
        case 'create-folder':
          handleCreateFolder(action.parentId, action.parentType)
          break
        case 'move-to-folder':
          // Move items to folder
          if (action.items && action.target) {
            moveItemsToFolder(action.items, action.target)
          }
          break
        case 'open-in-tab':
          // Handle opening in new tab
          console.log('Open in tab:', action.item)
          showToast({ msg: 'Tabs not implemented yet', type: 'info' })
          break
        case 'rename':
          // Handle rename
          if (activeCustomPageId.value && action.item) {
            handleUpdateCustomPage(activeCustomPageId.value, {
              data: page.data
            })
          }
          break
        case 'create-event':
          openAddModal('event')
          break
        case 'view-event':
          console.log('View event:', action.event)
          break
        case 'play':
          if (action.item) {
            handlePlaySong(action.item)
          }
          break
        case 'contextMenu':
          showContextMenu(action.event, action.items || [action.item], action.itemType || 'generic')
          break
        case 'create':
          openAddModal(action.itemType || 'generic')
          break
        default:
          console.log('Unhandled page action:', action)
      }
    }

    // Handle page updates (from folder rename, etc)
    const handlePageUpdate = (update) => {
      if (activeCustomPageId.value) {
        const page = customPages.value.find(p => p.id === activeCustomPageId.value)
        if (page) {
          if (update.type === 'rename' && update.item) {
            // Update the item in the page data
            const itemIndex = page.data.items?.findIndex(i => i.id === update.item.id)
            if (itemIndex > -1) {
              page.data.items[itemIndex] = update.item
              saveCustomPages()
            }
          }
        }
      }
    }

    // Add method to create folder with parent
    const handleCreateFolder = (config = {}) => {
      const folderConfig = {
        type: 'folder',
        title: 'New Folder',
        icon: 'folder',
        parentId: config.parentId || null,
        parentType: config.parentType || null, // 'artist', 'playlist', 'folder', or null
        data: getDefaultPageData('folder'),
        config: getDefaultPageConfig('folder')
      }
      
      handleCreateCustomPage(folderConfig)
    }

    // Add method to move items to folder
    const moveItemsToFolder = (itemIds, targetFolderId) => {
      const targetFolder = customPages.value.find(p => p.id === targetFolderId && p.type === 'folder')
      if (targetFolder) {
        // Add items to target folder
        if (!targetFolder.data.items) {
          targetFolder.data.items = []
        }
        
        // Move items (this is simplified - you'd want to handle different item types)
        itemIds.forEach(itemId => {
          if (!targetFolder.data.items.some(i => i.id === itemId)) {
            targetFolder.data.items.push({ id: itemId, type: 'reference' })
          }
        })
        
        saveCustomPages()
        showToast({ msg: `Moved ${itemIds.length} items to ${targetFolder.title}`, type: 'success' })
      }
    }

    // Handle importing files to a specific folder
    const handleImportToFolder = async (files, folderId) => {
      // This would handle importing files and adding them to the folder
      console.log('Import files to folder:', { files, folderId })
      // Implementation would depend on your file handling logic
      showToast({ msg: 'File import to folder not implemented yet', type: 'info' })
    }

    // Updated openAddModal to support more types
    const openAddModal = (type = 'import', preselectedArtist = null) => {
      console.log('🎯 [App.vue] openAddModal called with:', { 
        type, 
        preselectedArtist,
        artistId: preselectedArtist?.id,
        artistName: preselectedArtist?.name
      })
      
      // Handle custom page types
      if (['event', 'task', 'note', 'asset'].includes(type)) {
        // For now, show a toast - you can implement these modals later
        showToast({ msg: `Create ${type} modal not implemented yet`, type: 'info' })
        return
      }
      
      if (type === 'playlist' && preselectedArtist) {
        // Creating playlist from artist profile
        const modalOptions = {
          mode: 'create',
          type: 'playlist',
          defaults: {
            artistId: preselectedArtist.id,
            artistName: preselectedArtist.name
          }
        }
        console.log('🎯 [App.vue] Calling unifiedModalRef.show with:', modalOptions)
        unifiedModalRef.value?.show(modalOptions)
      } else {
        // Normal create mode
        unifiedModalRef.value?.show({
          mode: 'create',
          type: type,
          tab: type === 'import' ? 'import' : type
        })
      }
    }

    const closeAddModal = () => {
      unifiedModalRef.value?.close()
    }

    const handleCreateArtistPlaylist = (artist) => {
      console.log('🎨 [App.vue] handleCreateArtistPlaylist called with artist:', {
        id: artist?.id,
        name: artist?.name,
        fullArtistObject: artist
      })
      openAddModal('playlist', artist)
    }

    const openEditModal = (items, type) => {
      unifiedModalRef.value?.show({
        mode: 'edit',
        type: type,
        items: items
      })
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Get default data for page types
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

    // Get default config for page types
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

    // Refresh library data from database
    const refreshLibrary = async () => {
      try {
        // Use the music store's refresh method instead
        await musicStore.refreshLibrary()
        
        // Get the data from the store
        songs.value = musicStore.songs
        artists.value = musicStore.artists
        albums.value = musicStore.albums
        generalPlaylists.value = musicStore.playlists
        
        console.log('📚 Refreshed library data:', {
          songs: songs.value?.length || 0,
          artists: artists.value?.length || 0,
          albums: albums.value?.length || 0,
          playlists: generalPlaylists.value?.length || 0
        })
        
        console.log('📋 Sample song with artwork:', songs.value?.[0])
      } catch (error) {
        console.error('Error refreshing library:', error)
      }
    }

    // Context menu for playlists in sidebar
    const showPlaylistContextMenu = (event, playlist) => {
      contextMenuRef.value?.show(event, [playlist], 'playlist')
    }

    // Handle album navigation
    const handleShowAlbum = (album) => {
      console.log('Show album:', album)
      // You can implement album view later
      showToast({ msg: 'Album view not implemented yet', type: 'info' })
    }

    // Handle playlist actions
    const handlePlayPlaylist = (playlist) => {
      musicStore.playPlaylist(playlist.id)
    }

    const handleUpdatePlaylist = async (playlistId, updatedData) => {
      try {
        // Update basic metadata - use camelCase for this command
        await invoke('update_playlist', {
          playlistId: playlistId,
          name: updatedData.name,
          description: updatedData.description,
          color: updatedData.color,
          artistId: updatedData.artistId || null
        })
        
        // Handle artwork if provided
        if (updatedData.artwork && updatedData.artwork.startsWith('data:')) {
          // Extract base64 data from data URL
          const base64Data = updatedData.artwork.split(',')[1]
          const binaryData = atob(base64Data)
          const bytes = new Uint8Array(binaryData.length)
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i)
          }
          
          await invoke('save_playlist_artwork', {
            playlistId: playlistId,
            imageData: Array.from(bytes),
            extension: 'jpg'
          })
        }
        
        showToast({ msg: 'Playlist updated successfully!', type: 'success' })
        await refreshLibrary()
      } catch (error) {
        console.error('Error updating playlist:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    const handleDeletePlaylists = async (playlists) => {
      try {
        for (const playlist of playlists) {
          // Use camelCase 'playlistId' as the backend expects
          await invoke('delete_playlist', { playlistId: playlist.id })
        }
        showToast({ msg: `Deleted ${playlists.length} playlist(s)`, type: 'success' })
        await refreshLibrary()
      } catch (error) {
        console.error('Error deleting playlists:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    const handleUploadPlaylistArtwork = async (playlistId) => {
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
          
          await invoke('save_playlist_artwork', {
            playlistId: playlistId,
            imageData: Array.from(imageData),
            extension
          })
          
          showToast({ msg: 'Artwork updated!', type: 'success' })
          await refreshLibrary()
        }
      } catch (error) {
        console.error('Error uploading artwork:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    const handleAddSongsToPlaylist = async (playlistId, songIds) => {
      try {
        await invoke('add_songs_to_playlist', { 
          playlistId: playlistId,  // Changed to camelCase
          songIds: songIds         // Changed to camelCase
        })
        showToast({ msg: `Added ${songIds.length} songs to playlist!`, type: 'success' })
        await refreshLibrary()
      } catch (error) {
        console.error('Error adding songs to playlist:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    const handleFileDropToPlaylist = async (playlistId, filePaths) => {
      try {
        await importFiles(filePaths, { playlistId })
        await refreshLibrary()
      } catch (error) {
        console.error('Error importing files to playlist:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    // Handle artist actions
    const handleUpdateArtist = async (artistId, updatedData) => {
      try {
        // Update basic metadata - use camelCase
        await invoke('update_artist', {
          artistId: artistId,
          name: updatedData.name,
          genre: updatedData.genre,
          bio: updatedData.bio
        })
        
        // Handle artwork if provided
        if (updatedData.artwork && updatedData.artwork.startsWith('data:')) {
          // Extract base64 data from data URL
          const base64Data = updatedData.artwork.split(',')[1]
          const binaryData = atob(base64Data)
          const bytes = new Uint8Array(binaryData.length)
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i)
          }
          
          await invoke('save_artist_image', {
            artistId: artistId,
            imageData: Array.from(bytes),
            extension: 'jpg'
          })
        }
        
        showToast({ msg: 'Artist updated successfully!', type: 'success' })
        await refreshLibrary()
      } catch (error) {
        console.error('Error updating artist:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    const handleDeleteArtists = async (artists) => {
      try {
        for (const artist of artists) {
          // Try both parameter styles to handle potential inconsistency
          try {
            await invoke('delete_artist', { artist_id: artist.id })
          } catch (error) {
            // If snake_case fails, try camelCase
            await invoke('delete_artist', { artistId: artist.id })
          }
        }
        showToast({ msg: `Deleted ${artists.length} artist(s)`, type: 'success' })
        await refreshLibrary()
      } catch (error) {
        console.error('Error deleting artists:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    // Add this debugging code to your App.vue handleAddContent method:
    const handleAddContent = async (data) => {
      console.log('🔍 [App.vue] handleAddContent received:', JSON.stringify(data, null, 2))
      
      try {
        switch (data.type) {
          case 'import':
            // Handle file import
            if (data.data.files && data.data.files.length > 0) {
              const filePaths = data.data.files.map(f => f.path)
              const result = await invoke('import_music_files', { file_paths: filePaths })
              
              if (result.success || result.imported_count > 0) {
                showToast({ msg: `Imported ${result.imported_count} songs!`, type: 'success' })
                await refreshLibrary()
              } else {
                showToast({ msg: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
              }
            }
            break
            
          case 'artist':
            // Create new artist
            const newArtist = await invoke('create_artist', {
              name: data.data.name,
              genre: data.data.genre || null,
              bio: data.data.bio || null
            })
            
            showToast({ msg: `Artist "${newArtist.name}" created successfully!`, type: 'success' })
            await refreshLibrary()
            break
            
          case 'playlist':
            console.log('🎯 Creating playlist with data:', {
              name: data.data.name,
              artistId: data.data.artistId,
              fullData: data.data
            })
            
            const newPlaylist = await invoke('create_playlist', {
              name: data.data.name,
              description: data.data.description || null,
              color: data.data.color || null,
              artistId: data.data.artistId || null  // Use camelCase to match Rust parameter
            })
            
            console.log('✅ Created new playlist:', newPlaylist)
            showToast({ msg: `Playlist "${newPlaylist.name}" created successfully!`, type: 'success' })
            break
        }
        
        await refreshLibrary()
        
      } catch (error) {
        console.error('Error handling content addition:', error)
        showToast({ msg: `Error: ${error}`, type: 'error' })
      }
    }

    const scanMusicFolder = async () => {
      try {
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Music Folder to Scan'
        })
        
        if (selected) {
          console.log('Scanning folder:', selected)
          const result = await invoke('scan_music_directory', {
            directory_path: selected
          })
          
          if (result.success || result.imported_count > 0) {
            showToast({ msg: `Scanned folder successfully! Imported ${result.imported_count} songs.`, type: 'success' })
            await refreshLibrary()
          } else {
            showToast({ msg: `Scan failed: ${result.errors.join(', ')}`, type: 'error' })
          }
        }
      } catch (error) {
        console.error('Error scanning folder:', error)
        showToast({ msg: `Error scanning folder: ${error}`, type: 'error' })
      }
    }

    const addSongToPlaylist = async (playlistId, song) => {
      console.log('➕ Adding song to playlist:', { playlistId, song });
      try {
        await invoke('add_songs_to_playlist', { 
          playlistId: playlistId,      // Changed to camelCase
          songIds: [song.id]           // Changed to camelCase
        })
        console.log('✅ Song added successfully');
        showToast({ msg: `Added '${song.name}' to playlist!`, type: 'success' })
        await refreshLibrary()
      } catch (error) {
        console.error('❌ Failed to add song:', error);
        showToast({ msg: `Failed to add song: ${error}`, type: 'error' })
      }
    }

    const onReorderPlaylists = async (evt) => {
      showToast({ msg: 'Playlist reordering disabled', type: 'info' })
    }

    const handleAllSongsFileDrop = async (filePaths) => {
      console.log('🎵 handleAllSongsFileDrop called with:', filePaths)
      if (!filePaths || filePaths.length === 0) {
        console.warn('🎵 No file paths provided')
        return
      }
      try {
        console.log('🎵 Calling import_music_files with paths:', filePaths)
        const result = await invoke('import_music_files', { file_paths: filePaths })
        console.log('🎵 Import result:', result)
        
        if (result.success || result.imported_count > 0) {
          showToast({ msg: `Imported ${result.imported_count} songs!`, type: 'success' })
          await refreshLibrary()
        } else {
          console.error('🎵 Import failed:', result)
          showToast({ msg: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
        }
      } catch (error) {
        console.error('🎵 Import error:', error)
        showToast({ msg: `Import failed: ${error}`, type: 'error' })
      }
    }

    const handleFileDropToArtist = async (artistId, filePaths) => {
      console.log('🎨 handleFileDropToArtist called with artistId:', artistId, 'paths:', filePaths)
      if (!filePaths || filePaths.length === 0) {
        console.warn('🎨 No file paths provided')
        return
      }
      try {
        console.log('🎨 Importing files...')
        const result = await invoke('import_music_files', { file_paths: filePaths })
        console.log('🎨 Import result:', result)
        
        if (result.success || result.imported_count > 0) {
          const songIds = (result.songs || []).map(s => s.id)
          console.log('🎨 Song IDs to add to artist:', songIds)
          
          if (songIds.length > 0) {
            console.log('🎨 Adding songs to artist...')
            await invoke('add_songs_to_artist', { 
              artist_id: artistId,
              song_ids: songIds 
            })
          }
          showToast({ msg: `Imported ${result.imported_count} songs and attached to artist!`, type: 'success' })
          await refreshLibrary()
        } else {
          console.error('🎨 Import failed:', result)
          showToast({ msg: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
        }
      } catch (error) {
        console.error('🎨 Import error:', error)
        showToast({ msg: `Import failed: ${error}`, type: 'error' })
      }
    }

    const removeSongFromPlaylist = async ({ playlistId, songId }) => {
      try {
        await invoke('remove_song_from_playlist', { 
          playlistId: playlistId,  // Changed to camelCase
          songId: songId          // Changed to camelCase
        })
        showToast({ msg: 'Song removed from playlist', type: 'success' })
        await refreshLibrary()
      } catch (error) {
        showToast({ msg: `Failed to remove song: ${error}`, type: 'error' })
      }
    }

    // Add these missing methods that components are expecting
    const handlePlaySong = (song) => {
      playback.playSong(song)
    }

    const handleAddToQueue = (songs) => {
      playback.addToQueue(songs)
    }

    const showContextMenu = (event, items, type) => {
      contextMenuRef.value?.show(event, items, type)
    }

    const navigateToArtist = (artistId) => {
      setActiveView('artist-profile', artistId)
    }

    const navigateToPlaylist = (playlistId) => {
      setActiveView('playlist', playlistId)
    }

    const handleEditMetadata = (items, type) => {
      openEditModal(items, type)
    }

    const handleSelectSongs = (songs) => {
      // Handle song selection for bulk operations
      console.log('Selected songs:', songs)
    }

    // Drag and drop handlers
    const handleDragEnter = (playlistId) => {
      dragOverPlaylistId.value = playlistId
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = (e) => {
      // Only clear if we're leaving the playlist entirely
      if (!e.currentTarget.contains(e.relatedTarget)) {
        dragOverPlaylistId.value = null
      }
    }

    const handlePlaylistExternalDrop = async (e, playlistId) => {
      console.log('🎯 Drop event for playlist:', playlistId)
      console.log('🎯 DataTransfer types:', Array.from(e.dataTransfer.types))
      console.log('🎯 DataTransfer items:', e.dataTransfer.items.length)
      console.log('🎯 DataTransfer files:', e.dataTransfer.files.length)
      
      // Check all possible data
      for (const type of e.dataTransfer.types) {
        console.log(`🎯 Data for type "${type}":`, e.dataTransfer.getData(type))
      }
      
      // Check store state
      console.log('🎯 Store state:', {
        draggedItem: dragStore.draggedItem,
        dragType: dragStore.dragType
      })
      
      dragOverPlaylistId.value = null

      // Check for files first
      if (e.dataTransfer.files?.length) {
        console.log('📁 Files detected in drop:', e.dataTransfer.files)
        const paths = [...e.dataTransfer.files].map(f => f.path)
        await importFiles(paths, { playlistId })
        await refreshLibrary()
        return
      }

      // Check for internal drag
      const textData = e.dataTransfer.getData('text/plain')
      console.log('🎯 Text data:', textData)
      
      if (textData && textData.startsWith('internal-drag:')) {
        try {
          // Try to get our custom data
          const customData = e.dataTransfer.getData('application/x-music-player-songs')
          console.log('🎯 Custom data:', customData)
          
          if (customData) {
            const { items } = JSON.parse(customData)
            console.log('🎯 Parsed items:', items)
            
            for (const song of items) {
              await addSongToPlaylist(playlistId, song)
            }
            
            showToast({ 
              msg: items.length === 1 
                ? `Added "${items[0].name}" to playlist!` 
                : `Added ${items.length} songs to playlist!`, 
              type: 'success' 
            })
          } else {
            // Fallback to store
            const storeItems = dragStore.getDraggedItem()
            if (storeItems) {
              const items = Array.isArray(storeItems) ? storeItems : [storeItems]
              for (const song of items) {
                await addSongToPlaylist(playlistId, song)
              }
            }
          }
        } catch (error) {
          console.error('Drop error:', error)
        } finally {
          dragStore.endDrag()
        }
      }
    }

    // Initialize on mount
    onMounted(async () => {
      await refreshLibrary()
      loadCustomPages() // Load custom pages

      // Listen for library updates from metadata editor
      window.addEventListener('library-updated', refreshLibrary)

      // Keyboard shortcuts now use playback integration
      document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName?.toLowerCase()
        const isEditable = document.activeElement?.isContentEditable
        if (['input', 'textarea', 'select'].includes(tag) || isEditable) return

        if (e.code === 'Space') {
          e.preventDefault()
          playback.togglePlayPause()
        }
        if (e.code === 'ArrowLeft') {
          e.preventDefault()
          playback.seek(Math.max(0, playback.currentTime.value - 10))
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault()
          playback.seek(playback.currentTime.value + 10)
        }
        if (e.code === 'ArrowUp') {
          e.preventDefault()
          playback.setVolume(Math.min(playback.volume.value + 10, 100))
        }
        if (e.code === 'ArrowDown') {
          e.preventDefault()
          playback.setVolume(Math.max(playback.volume.value - 10, 0))
        }
        if (e.key.toLowerCase() === 'm') {
          playback.toggleMute()
        }
        if (e.key.toLowerCase() === 'n') {
          playback.playNext()
        }
        if (e.key.toLowerCase() === 'p') {
          playback.playPrevious()
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
        if (ctrlOrCmd && e.key === 'f') {
          e.preventDefault()
          showToast({ msg: 'Focus Search (not implemented)', type: 'info' })
        }
        if (ctrlOrCmd && e.key === '1') {
          e.preventDefault()
          setActiveView('home')
        }
        if (ctrlOrCmd && e.key === '2') {
          e.preventDefault()
          setActiveView('all-songs')
        }
        if (ctrlOrCmd && e.key === '3') {
          e.preventDefault()
          setActiveView('artists')
        }
        if (ctrlOrCmd && e.key === '4') {
          e.preventDefault()
          setActiveView('playlists')
        }
        if (ctrlOrCmd && e.key.toLowerCase() === 'k') {
          e.preventDefault()
          showToast({ msg: 'Quick Switcher (not implemented)', type: 'info' })
        }
        if (ctrlOrCmd && e.key === ',') {
          e.preventDefault()
          showToast({ msg: 'Open Settings (not implemented)', type: 'info' })
        }

        if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'n') {
          e.preventDefault()
          setActiveView('playlists')
          openAddModal('playlist')
        }
        if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'a') {
          e.preventDefault()
          setActiveView('artists')
          openAddModal('artist')
        }
        if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'i') {
          e.preventDefault()
          setActiveView('all-songs')
          openAddModal('import')
        }
      })

      await listen('tauri://file-drop-hover', (event) => {
        console.log('🎯 FILE DROP HOVER EVENT:', event)
      })
      
      await listen('tauri://file-drop-cancelled', (event) => {
        console.log('❌ FILE DROP CANCELLED EVENT:', event)
      })
      
      await listen('tauri://file-drop', async (event) => {
        console.log('📁 Global file drop detected, handled by specific drop zones')
      })
    })

    // Clean up on unmount
    onUnmounted(() => {
      window.removeEventListener('library-updated', refreshLibrary)
    })

    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    return {
      // Refs
      contextMenuRef,
      unifiedModalRef,
      toastRef,
      
      // Core state
      activeView,
      activeArtistId,
      activePlaylistId,
      activeCustomPageId,
      artists,
      songs,
      albums,
      generalPlaylists,
      customPages,
      
      // Computed
      allSongs,
      recentSongs,
      currentArtist,
      currentArtistSongs,
      currentArtistAlbums,
      currentPlaylist,
      currentPlaylistSongs,
      currentCustomPage,
      totalStorageUsed,
      storagePercent,
      currentViewComponent,
      currentViewProps,
      
      // Playback computed
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isShuffled,
      repeatMode,
      
      // Methods
      setActiveView,
      handleAddContent,
      formatFileSize,
      refreshLibrary,
      scanMusicFolder,
      convertFileSrc,
      dragOverPlaylistId,
      addSongToPlaylist,
      onReorderPlaylists,
      handleAllSongsFileDrop,
      handleFileDropToArtist,
      handleFileDropToPlaylist,
      handlePlaylistExternalDrop,
      showFileDropOverlay,
      removeSongFromPlaylist,
      handleDragEnter,
      handleDragOver,
      handleDragLeave,
      showPlaylistContextMenu,
      handlePlayPlaylist,
      handleUpdatePlaylist,
      handleDeletePlaylists,
      handleUploadPlaylistArtwork,
      handleAddSongsToPlaylist,
      handleUpdateArtist,
      handleDeleteArtists,
      handleShowAlbum,
      openAddModal,
      closeAddModal,
      openEditModal,
      handleCreateArtistPlaylist,
      
      // Custom page methods
      handleCreateCustomPage,
      handleDeleteCustomPage,
      handleUpdateCustomPage,
      handleNavigation,
      handlePageAction,
      handlePageUpdate,
      
      // Folder methods
      handleCreateFolder,
      moveItemsToFolder,
      getAllFolders,
      getParentPath,
      
      // New methods for components
      handlePlaySong,
      handleAddToQueue,
      showContextMenu,
      navigateToArtist,
      navigateToPlaylist,
      handleEditMetadata,
      handleSelectSongs,
      
      // Playback methods
      togglePlayback,
      handleSeek,
      playNext,
      playPrevious,
      toggleShuffle,
      toggleRepeat,
      handleVolumeChange,
      
      // Audio integration
      playback
    }
  }
}
</script>

<style>
/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Colors */
  --bg-primary: #121212;
  --bg-secondary: #181818;
  --bg-tertiary: #282828;
  --bg-hover: #333333;
  --bg-active: #404040;
  
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-tertiary: #a7a7a7;
  
  --border-color: #282828;
  
  --accent-primary: #1db954;
  --accent-hover: #1ed760;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Layout */
  --sidebar-width: 232px;
  --now-playing-height: 90px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main Container */
.app-container {
  display: flex;
  flex: 1;
  height: calc(100vh - var(--now-playing-height));
  background: #0a0a0a;
}

/* Main Content */
.main-content {
  flex: 1;
  background: #000;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
  background-clip: padding-box;
}

/* Utility Classes */
.drag-over {
  background: rgba(255, 255, 255, 0.08) !important;
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}
</style>
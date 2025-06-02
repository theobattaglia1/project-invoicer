<template>
  <div id="app">
    <!-- ── WRAP SIDEBAR + MAIN in .app-container ── -->
    <div class="app-container">
      <!-- Sidebar -->
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
        @action="handlePageAction"

        @open-prefs="prefsVisible = true"
      />

      <!-- Main Content Area -->
        <main class="main-content" :style="currentCssVars">
            <div class="content-scroll">

          <!-- Dynamic View -->
          <component
            :is="currentViewComponent"
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
            @select-songs="handleSelectSongs"
          />
        </div>
      </main>
    </div>

    <!-- Now Playing Bar -->
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
    <UnifiedContentModal ref="unifiedModalRef" @add="handleAddContent" />

    <!-- Preferences Modal (only when prefsVisible is true) -->
    <PreferencesModal
      v-if="prefsVisible"
      :viewName="currentViewName"
      :visible="prefsVisible"
      @update:visible="val => (prefsVisible = val)"
    />

    <!-- Global UI Components -->
    <Toast ref="toastRef" />
    <ContextMenu ref="contextMenuRef" />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { listen } from '@tauri-apps/api/event'

import HomeView from './components/HomeView.vue'
import AllSongsView from './components/AllSongsView.vue'
import ArtistsView from './components/artistsview.vue'
import PlaylistsView from './components/PlaylistsView.vue'
import ArtistProfileView from './components/ArtistProfileView.vue'
import ArtistSongsView from './components/ArtistSongsView.vue'
import PlaylistDetailView from './components/playlistdetailview.vue'
import NowPlayingBar from './components/NowPlayingBar.vue'
import UnifiedContentModal from './components/UnifiedContentModal.vue'
import Toast from './components/Toast.vue'
import ContextMenu from './components/ContextMenu.vue'
import DynamicSidebar from './components/DynamicSidebar.vue'
import DynamicPage from './components/DynamicPage.vue'

import PreferencesModal from '@/components/PreferencesModal.vue'

import { usePreferences } from '@/composables/usePreferences'
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
    DynamicPage,
    PreferencesModal
  },
  setup() {
    // ─── 1) PREFERENCES SETUP ────────────────────────────────────────────────────
    const {
      preferences,
      getForView,
      setPagePreferences,
      setGlobalPreferences,
      addCustomFont
    } = usePreferences()

    // Provide the preferences API for child components
    provide('preferencesApi', {
      preferences,
      getForView,
      setPagePreferences,
      setGlobalPreferences,
      addCustomFont
    })

    // ─── 2) NAVIGATION STATE ────────────────────────────────────────────────────
    const activeView = ref('home')
    const activeArtistId = ref(null)
    const activePlaylistId = ref(null)
    const activeCustomPageId = ref(null)

    // Computed “viewName” for PreferencesModal
    const currentViewName = computed(() => activeView.value)

    // ─── 3) PREFERENCES MODAL VISIBILITY ────────────────────────────────────────
    const prefsVisible = ref(false)

    // ─── 4) COMPUTE CSS VARIABLES BASED ON PAGE PREFERENCES ────────────────────
    const pagePrefs = computed(() => getForView(currentViewName.value).value)
    const currentCssVars = computed(() => {
      const p = pagePrefs.value
      return {
        '--header-font-family':      p.headerFont.family,
        '--header-font-size':        p.headerFont.size,
        '--header-font-weight':      p.headerFont.weight,
        '--header-font-line-height': p.headerFont.lineHeight,
        '--body-font-family':        p.bodyFont.family,
        '--body-font-size':          p.bodyFont.size,
        '--body-font-weight':        p.bodyFont.weight,
        '--body-font-line-height':   p.bodyFont.lineHeight,
        '--hide-images':             p.hideImages ? 'none' : 'initial',
        '--bg-color':                p.bgColor,
        '--accent-color':            p.accentColor,
        '--compact-mode':            p.compactMode ? '1' : '0'
      }
    })

    // ─── 5) GLOBAL REFS & STORES ────────────────────────────────────────────────
    const contextMenuRef = ref(null)
    const unifiedModalRef = ref(null)
    const toastRef = ref(null)

    const dragOverPlaylistId = ref(null)

    const artists = ref([])
    const songs = ref([])
    const albums = ref([])
    const generalPlaylists = ref([])
    const customPages = ref([])

    const toastStore = useToastStore()
    const dragStore = useDragDropStore()
    const musicStore = useMusicStore()
    const showToast = (opts) => toastStore.push(opts)

    // ─── 6) PLAYBACK INTEGRATION ─────────────────────────────────────────────────
    const playback = usePlaybackIntegration()

    provide('contextMenu', contextMenuRef)
    provide('metadataEditor', unifiedModalRef)
    provide('toast', toastRef)
    provide('customPages', customPages)
    provide('showToast', showToast)
    provide('playlists', generalPlaylists)
    provide('musicStore', musicStore)
    provide('playback', playback)
    provide('activeView', activeView)
    provide('activeArtistId', activeArtistId)
    provide('activePlaylistId', activePlaylistId)

    // ─── 7) HELPERS ──────────────────────────────────────────────────────────────
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B','KB','MB','GB','TB']
      const i = Math.floor(Math.log(bytes)/Math.log(k))
      return parseFloat((bytes/Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Persist custom pages to localStorage
    const saveCustomPages = () => {
      try {
        localStorage.setItem('customPages', JSON.stringify(customPages.value))
      } catch (err) {
        console.error('Error saving custom pages:', err)
      }
    }
    let saveTimeout = null
    const saveCustomPagesDebounced = () => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem(
            'customPages',
            JSON.stringify(customPages.value)
          )
          console.log('✅ Custom pages saved')
        } catch (err) {
          console.error('Failed to save custom pages:', err)
          showToast({ msg: 'Failed to save changes', type: 'error' })
        }
      }, 500)
    }

    // Default data/config templates for each page type
    const getDefaultPageData = (type) => {
      switch (type) {
        case 'folder':    return { items: [], name: 'New Folder' }
        case 'calendar':  return { events: [] }
        case 'timeline':  return { items: [] }
        case 'assets':    return { assets: [] }
        case 'moodboard': return { elements: [] }
        case 'ideas':
          return {
            boards: [
              { id: 'ideas',       name: 'Ideas',       color: '#667eea' },
              { id: 'todo',        name: 'To Do',       color: '#f59e0b' },
              { id: 'in-progress', name: 'In Progress', color: '#3b82f6' },
              { id: 'done',        name: 'Done',        color: '#10b981' }
            ],
            notes: []
          }
        case 'dashboard':
          return {
            sections: [
              {
                id:    'quick-access',
                type:  'quick-access',
                title: 'Quick access',
                items: []
              },
              {
                id:    'recent',
                type:  'recent',
                title: 'Recently played',
                items: [],
                limit: 8
              },
              {
                id:    'stats',
                type:  'stats',
                title: 'Overview',
                stats: []
              }
            ]
          }
        default:
          return {}
      }
    }

    const getDefaultPageConfig = (type) => {
      switch (type) {
        case 'folder':    return { viewMode: 'grid', sortBy: 'name', sortOrder: 'asc' }
        case 'calendar':  return { defaultView: 'month' }
        case 'timeline':  return { viewMode: 'stack' }
        case 'assets':    return { itemsPerPage: 24 }
        case 'moodboard': return { canvasSize: 2000, gridSize: 20 }
        case 'ideas':     return { itemsPerPage: 20 }
        default:          return {}
      }
    }

    // Stubs
    const renameItem = (item, newName) => {
      showToast({ msg: 'Rename not implemented yet', type: 'info' })
    }
    const deleteItems = (items) => {
      showToast({ msg: 'Delete not implemented yet', type: 'info' })
    }

    // ─── 8) REFRESH LIBRARY ──────────────────────────────────────────────────────
    const refreshLibrary = async () => {
      try {
        await musicStore.refreshLibrary()
        songs.value = musicStore.songs
        artists.value = musicStore.artists
        albums.value = musicStore.albums
        generalPlaylists.value = musicStore.playlists

        console.log('📚 Refreshed library data:', {
          songs:      songs.value.length,
          artists:    artists.value.length,
          albums:     albums.value.length,
          playlists:  generalPlaylists.value.length
        })
      } catch (err) {
        console.error('Error refreshing library:', err)
      }
    }

    // ─── 9) MODAL FUNCTIONS FOR UnifiedContentModal ─────────────────────────────
    const openAddModal = (type = 'import', preselectedArtist = null) => {
      console.log('🎯 [App.vue] openAddModal called with:', {
        type,
        preselectedArtist,
        artistId:   preselectedArtist?.id,
        artistName: preselectedArtist?.name
      })

      if (['event','task','note','asset'].includes(type)) {
        showToast({ msg: `Create ${type} modal not implemented yet`, type: 'info' })
        return
      }

      if (type === 'playlist' && preselectedArtist) {
        const modalOptions = {
          mode: 'create',
          type: 'playlist',
          defaults: {
            artistId:   preselectedArtist.id,
            artistName: preselectedArtist.name
          }
        }
        console.log('🎯 [App.vue] Calling unifiedModalRef.show with:', modalOptions)
        unifiedModalRef.value?.show(modalOptions)
      } else {
        unifiedModalRef.value?.show({
          mode: 'create',
          type,
          tab: type === 'import' ? 'import' : type
        })
      }
    }
    const closeAddModal = () => {
      unifiedModalRef.value?.close()
    }
    const openEditModal = (items, type) => {
      unifiedModalRef.value?.show({ mode: 'edit', type, items })
    }

    // ─── 10) COMPUTED PROPERTIES ─────────────────────────────────────────────────
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

    const currentPlaylist = computed(() =>
      generalPlaylists.value.find(p => p.id === activePlaylistId.value) || null
    )
    const currentPlaylistSongs = computed(() => {
      const pl = currentPlaylist.value
      if (!pl) return []
      if (pl.songs && Array.isArray(pl.songs)) {
        return pl.songs
      }
      if (pl.song_ids && Array.isArray(pl.song_ids)) {
        return songs.value.filter(s => pl.song_ids.includes(s.id))
      }
      return []
    })

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
            continue
          }
        }
        break
      }
      return path
    }

    const currentCustomPage = computed(() => {
      if (!activeCustomPageId.value) return null
      const page = customPages.value.find(p => p.id === activeCustomPageId.value)
      if (page && page.type === 'folder') {
        page.parentPath = getParentPath(page.id)
      }
      return page || null
    })

    const totalStorageUsed = computed(() =>
      songs.value.reduce((sum, s) => sum + (s.file_size || 0), 0)
    )
    const storagePercent = computed(() => {
      const maxStorage = 100 * 1024 * 1024 * 1024
      return Math.min((totalStorageUsed.value / maxStorage) * 100, 100)
    })

    // Playback‐related computed from usePlaybackIntegration
    const currentSong = computed(() => playback.currentSong.value)
    const isPlaying   = computed(() => playback.isPlaying.value)
    const currentTime = computed(() => playback.currentTime.value)
    const duration    = computed(() => playback.duration.value)
    const volume      = computed(() => playback.volume.value)
    const isShuffled  = computed(() => playback.isShuffled.value)
    const repeatMode  = computed(() => playback.repeatMode.value)

    // Determine which component to render based on activeView
    const currentViewComponent = computed(() => {
      if (activeView.value.startsWith('custom-')) {
        return DynamicPage
      }
      switch (activeView.value) {
        case 'home':            return HomeView
        case 'all-songs':       return AllSongsView
        case 'artists':         return ArtistsView
        case 'playlists':       return PlaylistsView
        case 'artist-profile':  return ArtistProfileView
        case 'artist-songs':    return ArtistSongsView
        case 'playlist':        return PlaylistDetailView
        default:                return HomeView
      }
    })

    // Provide the correct props to each view component
    const currentViewProps = computed(() => {
      if (activeView.value.startsWith('custom-')) {
        return { pageConfig: currentCustomPage.value }
      }
      switch (activeView.value) {
        case 'home':
          return {
            artists:     artists.value,
            recentSongs: recentSongs.value,
            playlists:   generalPlaylists.value,
            allSongs:    allSongs.value
          }
        case 'all-songs':
          return {
            songs:      allSongs.value,
            onFileDrop: handleAllSongsFileDrop
          }
        case 'artists':
          return {
            artists:             artists.value,
            songs:               allSongs.value,
            onFileDropToArtist:  handleFileDropToArtist
          }
        case 'playlists':
          return {
            playlists:            generalPlaylists.value,
            songs:                allSongs.value,
            onFileDropToPlaylist: handleFileDropToPlaylist
          }
        case 'artist-profile':
          return {
            artist:    currentArtist.value,
            songs:     currentArtistSongs.value,
            playlists: generalPlaylists.value
          }
        case 'artist-songs':
          return {
            artist:            currentArtist.value,
            songs:             currentArtistSongs.value,
            onFileDropToArtist: handleFileDropToArtist
          }
        case 'playlist':
          return {
            playlist: currentPlaylist.value,
            songs:    currentPlaylistSongs.value
          }
        default:
          return {}
      }
    })

    // ─── 11) CORE FUNCTIONS ─────────────────────────────────────────────────────
    const togglePlayback    = () => playback.togglePlayPause()
    const handleSeek        = (t) => playback.seek(t)
    const playNext          = () => playback.playNext()
    const playPrevious      = () => playback.playPrevious()
    const toggleShuffle     = () => playback.toggleShuffle()
    const toggleRepeat      = () => playback.toggleRepeat()
    const handleVolumeChange = (vol) => playback.setVolume(vol)

    const setActiveView = (view, id = null) => {
      activeView.value = view
      activeArtistId.value = null
      activePlaylistId.value = null
      activeCustomPageId.value = null

      if (view === 'artist-songs' || view === 'artist-profile') {
        activeArtistId.value = id
      } else if (view === 'playlist') {
        activePlaylistId.value = id
      } else if (view.startsWith('custom-')) {
        activeCustomPageId.value = view.replace('custom-', '')
      }
    }

    const getAllFolders = () =>
      customPages.value.filter(p => p.type === 'folder')

    // ─── 12) CUSTOM PAGE HANDLERS ───────────────────────────────────────────────
    const loadCustomPages = () => {
      try {
        const saved = localStorage.getItem('customPages')
        if (saved) {
          let pages = JSON.parse(saved)

          // Migrate/validate structure
          pages = pages.map(page => {
            if (page.type === 'folder') {
              if (!page.data) page.data = {}
              if (!page.data.items) page.data.items = []

              page.data.items = page.data.items
                .map(item => ({
                  id:       item.id,
                  type:     item.type || 'song',
                  name:     item.name || 'Untitled',
                  artist:   item.artist || '',
                  album:    item.album || '',
                  duration: item.duration || 0,
                  songData: item.songData || null,
                  addedAt:  item.addedAt || new Date().toISOString()
                }))
                .filter(item => item.id)
            }
            return page
          })

          customPages.value = pages
          saveCustomPages()
        }
      } catch (err) {
        console.error('Error loading custom pages:', err)
        showToast({ msg: 'Failed to load saved pages', type: 'error' })
      }
    }

    const handleCreateCustomPage = (pageConfig) => {
      const newPage = {
        id:        `page-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...pageConfig
      }
      customPages.value.push(newPage)
      saveCustomPages()

      setActiveView(`custom-${newPage.id}`)
      showToast({
        msg: `Created new ${pageConfig.type} page: ${pageConfig.title}`,
        type: 'success'
      })
    }

    const handleDeleteCustomPage = (pageId) => {
      const index = customPages.value.findIndex(p => p.id === pageId)
      if (index > -1) {
        const page = customPages.value[index]
        if (page.type === 'folder') {
          deleteChildrenOfFolder(pageId)
        }
        customPages.value.splice(index, 1)
        saveCustomPages()

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
        const idx = customPages.value.findIndex(p => p.id === child.id)
        if (idx > -1) {
          customPages.value.splice(idx, 1)
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

    // Navigation between various item types
    const handleNavigation = (target) => {
      if (target.type === 'artist') {
        navigateToArtist(target.id)
      } else if (target.type === 'playlist') {
        navigateToPlaylist(target.id)
      } else if (target.type === 'folder') {
        const folder = customPages.value.find(p => p.id === target.id)
        if (folder) {
          folder.parentPath = getParentPath(folder.id)
          setActiveView(`custom-${target.id}`)
        }
      } else if (target.type === 'custom') {
        setActiveView(`custom-${target.id}`)
      } else if (target.type === 'root') {
        setActiveView('home')
      } else if (target.type === 'song') {
        handlePlaySong(target.item)
      } else if (target.type === 'file') {
        showToast({ msg: 'File preview not implemented yet', type: 'info' })
      }
    }

    const handleCreateFolder = (config = {}) => {
      const folderConfig = {
        type:       'folder',
        title:      'New Folder',
        icon:       'folder',
        parentId:   config.parentId || null,
        parentType: config.parentType || null,
        data:       getDefaultPageData('folder'),
        config:     getDefaultPageConfig('folder')
      }
      handleCreateCustomPage(folderConfig)
    }

    const addItemsToFolder = async (items, folderId) => {
      const folder = customPages.value.find(
        p => p.id === folderId && p.type === 'folder'
      )
      if (!folder) {
        showToast({ msg: 'Folder not found', type: 'error' })
        return false
      }
      if (!folder.data.items) folder.data.items = []

      const addedItems = []
      for (const item of items) {
        const exists = folder.data.items.some(
          i => i.type === item.type && i.id === item.id
        )
        if (!exists) {
          const newItem = {
            id:       item.id,
            type:     item.type || 'song',
            name:     item.name || item.title || 'Untitled',
            addedAt:  new Date().toISOString()
          }

          if (item.type === 'song' || !item.type) {
            newItem.artist   = item.artist || item.artist_name || ''
            newItem.album    = item.album || item.album_name || ''
            newItem.duration = item.duration || 0
            newItem.songData = item
          } else if (item.type === 'folder') {
            const movedFolder = customPages.value.find(p => p.id === item.id)
            if (movedFolder) {
              movedFolder.parentId = folderId
            }
          }
          folder.data.items.push(newItem)
          addedItems.push(newItem)
        }
      }
      if (addedItems.length > 0) {
        saveCustomPages()
        showToast({
          msg: `Added ${addedItems.length} item${addedItems.length > 1 ? 's' : ''} to ${folder.title}`,
          type: 'success'
        })
        return true
      }
      return false
    }

    const removeItemsFromFolder = async (itemIds, folderId) => {
      const folder = customPages.value.find(
        p => p.id === folderId && p.type === 'folder'
      )
      if (!folder || !folder.data.items) return false
      const originalLength = folder.data.items.length
      folder.data.items = folder.data.items.filter(i => !itemIds.includes(i.id))
      if (folder.data.items.length < originalLength) {
        saveCustomPages()
        return true
      }
      return false
    }

    const moveItemsToFolder = async (itemIds, targetFolderId, sourceFolderId = null) => {
      const targetFolder = customPages.value.find(
        p => p.id === targetFolderId && p.type === 'folder'
      )
      if (!targetFolder) {
        showToast({ msg: 'Target folder not found', type: 'error' })
        return false
      }
      if (sourceFolderId) {
        await removeItemsFromFolder(itemIds, sourceFolderId)
      }
      const items = itemIds
        .map(id => {
          const song = songs.value.find(s => s.id === id)
          if (song) return song
          const page = customPages.value.find(p => p.id === id)
          if (page) return page
          return null
        })
        .filter(Boolean)

      return await addItemsToFolder(items, targetFolderId)
    }

    const handleImportToFolder = async (folderId) => {
      try {
        const selected = await open({
          multiple: true,
          filters: [
            {
              name:       'Music Files',
              extensions: ['mp3','wav','flac','aac','m4a','ogg','wma','aiff','alac']
            }
          ]
        })
        if (selected && selected.length > 0) {
          console.log('📁 Importing files to folder:', { files: selected, folderId })
          const result = await invoke('import_music_files', {
            file_paths: Array.isArray(selected) ? selected : [ selected ]
          })
          if (result.success || result.imported_count > 0) {
            const importedSongs = result.songs || []
            if (importedSongs.length > 0) {
              await addItemsToFolder(importedSongs, folderId)
              showToast({
                msg: `Imported ${result.imported_count} songs to folder!`,
                type: 'success'
              })
            } else {
              showToast({
                msg: `Songs imported but could not be added to folder`,
                type: 'warning'
              })
            }
            await refreshLibrary()
          } else {
            showToast({
              msg: `Import failed: ${result.errors?.join(', ') || 'Unknown error'}`,
              type: 'error'
            })
          }
        }
      } catch (err) {
        console.error('Error importing files to folder:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    // ─── 13) PAGE ACTION SWITCH ─────────────────────────────────────────────────
    const handlePageAction = async (action) => {
      switch (action.type) {
        case 'update-data':
          if (activeCustomPageId.value) {
            const page = customPages.value.find(
              p => p.id === activeCustomPageId.value
            )
            if (page) {
              page.data = { ...page.data, ...action.data }
              saveCustomPages()
            }
          }
          break

        case 'add-playlist-to-folder':
          if (action.playlist && action.folderId) {
            console.log('📋 Adding playlist to folder:', {
              playlist: action.playlist,
              folderId: action.folderId
            })
            const targetFolder = customPages.value.find(
              p => p.id === action.folderId && p.type === 'folder'
            )
            if (targetFolder) {
              if (!targetFolder.data) targetFolder.data = {}
              if (!targetFolder.data.items) targetFolder.data.items = []
              const existingIndex = targetFolder.data.items.findIndex(item =>
                item.type === 'playlist' && item.playlistId === action.playlist.id
              )
              if (existingIndex === -1) {
                targetFolder.data.items.push({
                  id:         `playlist-ref-${action.playlist.id}-${Date.now()}`,
                  type:       'playlist',
                  playlistId: action.playlist.id,
                  name:       action.playlist.name,
                  artist:     action.playlist.artist_name || '',
                  songCount:  action.playlist.song_count || 0,
                  color:      action.playlist.color,
                  addedAt:    new Date().toISOString()
                })
                saveCustomPages()
                showToast({
                  msg: `Added playlist "${action.playlist.name}" to folder`,
                  type: 'success'
                })
              } else {
                showToast({ msg: 'Playlist already in folder', type: 'info' })
              }
            }
          }
          break

        case 'create-playlist':
          openAddModal('playlist')
          break

        case 'import-files':
          if (action.folderId) {
            handleImportToFolder(action.folderId)
          } else {
            openAddModal('import')
          }
          break

        case 'open-file':
          console.log('Open file:', action.item)
          if (action.item.type === 'song' && action.item.songData) {
            handlePlaySong(action.item.songData)
          } else {
            showToast({ msg: 'File opening not implemented yet', type: 'info' })
          }
          break

        case 'create-folder':
          handleCreateFolder(action)
          break

        case 'move-to-folder':
          if (action.items && action.target) {
            moveItemsToFolder(action.items, action.target)
          }
          break

        case 'remove-from-folder':
          if (action.items && action.folderId) {
            removeItemsFromFolder(action.items, action.folderId)
          }
          break

        case 'open-in-tab':
          console.log('Open in tab:', action.item)
          showToast({ msg: 'Tabs not implemented yet', type: 'info' })
          break

        case 'rename':
          if (action.item && action.newName) {
            renameItem(action.item, action.newName)
          }
          break

        case 'delete':
          if (action.items) {
            deleteItems(action.items)
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

        case 'play-all':
          if (action.items) {
            const songsToPlay = action.items
              .filter(i => i.type === 'song')
              .map(i => i.songData)
            if (songsToPlay.length > 0) {
              playback.playSong(songsToPlay[0], songsToPlay)
            }
          }
          break

        case 'contextMenu':
          showContextMenu(
            action.event,
            action.items || [action.item],
            action.itemType || 'generic'
          )
          break

        case 'create':
          openAddModal(action.itemType || 'generic')
          break

        case 'add-to-folder':
          if (action.items && action.folderId) {
            addItemsToFolder(action.items, action.folderId)
          }
          break

        case 'move-between-folders':
          if (action.items && action.targetFolderId) {
            const itemIds = action.items.map(it => it.id)
            moveItemsToFolder(
              itemIds,
              action.targetFolderId,
              action.sourceFolderId
            )
          }
          break

        case 'import-files-direct':
          if (action.files && action.folderId) {
            try {
              const result = await invoke('import_music_files', {
                file_paths: action.files
              })
              if (result.success && result.songs) {
                await addItemsToFolder(result.songs, action.folderId)
              }
              await refreshLibrary()
            } catch (err) {
              console.error('Error importing files:', err)
              showToast({ msg: `Import failed: ${err}`, type: 'error' })
            }
          }
          break

        case 'move-page-to-folder':
          if (action.pageId && action.folderId) {
            console.log('🎯 Moving page to folder:', {
              pageId:   action.pageId,
              folderId: action.folderId
            })
            const page = customPages.value.find(
              p => p.id === action.pageId
            )
            const targetFolder = customPages.value.find(
              p => p.id === action.folderId
            )
            if (page && targetFolder && targetFolder.type === 'folder') {
              page.parentId = action.folderId
              if (!targetFolder.data) targetFolder.data = {}
              if (!targetFolder.data.items) targetFolder.data.items = []
              const existingIndex = targetFolder.data.items.findIndex(
                it => it.type === 'page' && it.pageId === action.pageId
              )
              if (existingIndex === -1) {
                targetFolder.data.items.push({
                  id:      `ref-${action.pageId}`,
                  type:    'page',
                  pageId:  action.pageId,
                  name:    page.title,
                  pageType: page.type,
                  addedAt: new Date().toISOString()
                })
              }
              saveCustomPages()
              console.log(
                '✅ Page moved, folder now contains:',
                targetFolder.data.items
              )
              showToast({
                msg: `Moved ${page.title} to ${targetFolder.title}`,
                type: 'success'
              })
            } else {
              console.error('❌ Page or folder not found')
            }
          }
          break

        case 'remove-from-folder':
          if (action.items && action.folderId) {
            removeItemsFromFolder(action.items, action.folderId)
          }
          break

        case 'show-toast':
          showToast({
            msg: action.message,
            type: action.type || 'info'
          })
          break

        case 'refresh-library':
          refreshLibrary()
          break

        case 'show-error':
          showToast({
            msg: action.message,
            type: 'error'
          })
          break

        default:
          console.log('Unhandled page action:', action)
      }
    }

    // ─── 14) HANDLE PAGE UPDATES ───────────────────────────────────────────────
    const handlePageUpdate = (update) => {
      if (activeCustomPageId.value) {
        const page = customPages.value.find(
          p => p.id === activeCustomPageId.value
        )
        if (page && update.type === 'rename' && update.item) {
          const idx = page.data.items?.findIndex(i => i.id === update.item.id)
          if (idx > -1) {
            page.data.items[idx] = update.item
            saveCustomPages()
          }
        }
      }
    }

    // ─── 15) CONTEXT MENU FOR SIDEBAR PLAYLIST ─────────────────────────────────
    const showPlaylistContextMenu = (event, playlist) => {
      contextMenuRef.value?.show(event, [playlist], 'playlist')
    }

    // ─── 16) ALBUM NAVIGATION ───────────────────────────────────────────────────
    const handleShowAlbum = (album) => {
      console.log('Show album:', album)
      showToast({ msg: 'Album view not implemented yet', type: 'info' })
    }

    // ─── 17) PLAYLIST ACTIONS ───────────────────────────────────────────────────
    const handlePlayPlaylist = (playlist) => {
      musicStore.playPlaylist(playlist.id)
    }

    const handleUpdatePlaylist = async (playlistId, updatedData) => {
      try {
        await invoke('update_playlist', {
          playlistId,
          name:        updatedData.name,
          description: updatedData.description,
          color:       updatedData.color,
          artistId:    updatedData.artistId || null
        })
        if (
          updatedData.artwork &&
          updatedData.artwork.startsWith('data:')
        ) {
          const base64Data = updatedData.artwork.split(',')[1]
          const binaryData = atob(base64Data)
          const bytes = new Uint8Array(binaryData.length)
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i)
          }
          await invoke('save_playlist_artwork', {
            playlistId,
            imageData: Array.from(bytes),
            extension: 'jpg'
          })
        }
        showToast({ msg: 'Playlist updated successfully!', type: 'success' })
        await refreshLibrary()
      } catch (err) {
        console.error('Error updating playlist:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    const handleDeletePlaylists = async (playlistsToDelete) => {
      try {
        for (const pl of playlistsToDelete) {
          await invoke('delete_playlist', { playlistId: pl.id })
        }
        showToast({
          msg: `Deleted ${playlistsToDelete.length} playlist(s)`,
          type: 'success'
        })
        await refreshLibrary()
      } catch (err) {
        console.error('Error deleting playlists:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    const handleUploadPlaylistArtwork = async (playlistId) => {
      try {
        const selected = await open({
          multiple: false,
          filters: [
            {
              name: 'Images',
              extensions: ['png','jpg','jpeg','gif','webp']
            }
          ]
        })
        if (selected) {
          const imageData = await readBinaryFile(selected)
          const extension = selected.split('.').pop().toLowerCase()
          await invoke('save_playlist_artwork', {
            playlistId,
            imageData: Array.from(imageData),
            extension
          })
          showToast({ msg: 'Artwork updated!', type: 'success' })
          await refreshLibrary()
        }
      } catch (err) {
        console.error('Error uploading artwork:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    const handleAddSongsToPlaylist = async (playlistId, songIds) => {
      try {
        await invoke('add_songs_to_playlist', {
          playlistId,
          songIds
        })
        showToast({
          msg: `Added ${songIds.length} songs to playlist!`,
          type: 'success'
        })
        await refreshLibrary()
      } catch (err) {
        console.error('Error adding songs:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    const handleFileDropToPlaylist = async (playlistId, filePaths) => {
      try {
        await importFiles(filePaths, { playlistId })
        await refreshLibrary()
      } catch (err) {
        console.error('Error importing files to playlist:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    // ─── 18) ARTIST ACTIONS ───────────────────────────────────────────────────────
    const handleUpdateArtist = async (artistId, updatedData) => {
      try {
        await invoke('update_artist', {
          artistId,
          name:  updatedData.name,
          genre: updatedData.genre,
          bio:   updatedData.bio
        })
        if (
          updatedData.artwork &&
          updatedData.artwork.startsWith('data:')
        ) {
          const base64Data = updatedData.artwork.split(',')[1]
          const binaryData = atob(base64Data)
          const bytes = new Uint8Array(binaryData.length)
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i)
          }
          await invoke('save_artist_image', {
            artistId,
            imageData: Array.from(bytes),
            extension: 'jpg'
          })
        }
        showToast({ msg: 'Artist updated successfully!', type: 'success' })
        await refreshLibrary()
      } catch (err) {
        console.error('Error updating artist:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    const handleDeleteArtists = async (artistsArray) => {
      try {
        for (const artist of artistsArray) {
          try {
            await invoke('delete_artist', { artist_id: artist.id })
          } catch {
            await invoke('delete_artist', { artistId: artist.id })
          }
        }
        showToast({ msg: `Deleted ${artistsArray.length} artist(s)`, type: 'success' })
        await refreshLibrary()
      } catch (err) {
        console.error('Error deleting artists:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    // ─── 19) HANDLE ADD CONTENT FROM UnifiedContentModal ───────────────────────
    const handleAddContent = async (data) => {
      console.log(
        '🔍 [App.vue] handleAddContent received:',
        JSON.stringify(data, null, 2)
      )
      try {
        switch (data.type) {
          case 'import':
            if (data.data.files && data.data.files.length > 0) {
              const filePaths = data.data.files.map(f => f.path)
              const result = await invoke('import_music_files', {
                file_paths: filePaths
              })
              if (result.success || result.imported_count > 0) {
                showToast({ msg: `Imported ${result.imported_count} songs!`, type: 'success' })
                await refreshLibrary()
              } else {
                showToast({ msg: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
              }
            }
            break

          case 'artist':
            const newArtist = await invoke('create_artist', {
              name:  data.data.name,
              genre: data.data.genre || null,
              bio:   data.data.bio || null
            })
            showToast({ msg: `Artist "${newArtist.name}" created successfully!`, type: 'success' })
            await refreshLibrary()
            break

          case 'playlist':
            console.log('🎯 Creating playlist with data:', {
              name:     data.data.name,
              artistId: data.data.artistId,
              fullData: data.data
            })
            const newPlaylist = await invoke('create_playlist', {
              name:        data.data.name,
              description: data.data.description || null,
              color:       data.data.color || null,
              artistId:    data.data.artistId || null
            })
            console.log('✅ Created new playlist:', newPlaylist)
            showToast({ msg: `Playlist "${newPlaylist.name}" created successfully!`, type: 'success' })
            break
        }
        await refreshLibrary()
      } catch (err) {
        console.error('Error handling content addition:', err)
        showToast({ msg: `Error: ${err}`, type: 'error' })
      }
    }

    // ─── 20) CREATE ARTIST’S PLAYLIST FROM PROFILE ─────────────────────────────
    const handleCreateArtistPlaylist = (artist) => {
      console.log(
        '🎨 [App.vue] handleCreateArtistPlaylist called with artist:',
        { id: artist?.id, name: artist?.name, fullArtistObject: artist }
      )
      openAddModal('playlist', artist)
    }

    // ─── 21) SCAN A DIRECTORY FOR MUSIC ─────────────────────────────────────────
    const scanMusicFolder = async () => {
      try {
        const selected = await open({
          directory: true,
          multiple:  false,
          title:     'Select Music Folder to Scan'
        })
        if (selected) {
          console.log('Scanning folder:', selected)
          const result = await invoke('scan_music_directory', {
            directory_path: selected
          })
          if (result.success || result.imported_count > 0) {
            showToast({
              msg: `Scanned folder successfully! Imported ${result.imported_count} songs.`,
              type: 'success'
            })
            await refreshLibrary()
          } else {
            showToast({ msg: `Scan failed: ${result.errors.join(', ')}`, type: 'error' })
          }
        }
      } catch (err) {
        console.error('Error scanning folder:', err)
        showToast({ msg: `Error scanning folder: ${err}`, type: 'error' })
      }
    }

    // ─── 22) ADD SONG TO A PLAYLIST ─────────────────────────────────────────────
    const addSongToPlaylist = async (playlistId, song) => {
      console.log('➕ Adding song to playlist:', { playlistId, song })
      try {
        await invoke('add_songs_to_playlist', {
          playlistId,
          songIds: [song.id]
        })
        console.log('✅ Song added successfully')
        showToast({ msg: `Added '${song.name}' to playlist!`, type: 'success' })
        await refreshLibrary()
      } catch (err) {
        console.error('❌ Failed to add song:', err)
        showToast({ msg: `Failed to add song: ${err}`, type: 'error' })
      }
    }

    const onReorderPlaylists = async (evt) => {
      showToast({ msg: 'Playlist reordering disabled', type: 'info' })
    }

    // ─── 23) ALL SONGS DROP HANDLER ─────────────────────────────────────────────
    const handleAllSongsFileDrop = async (filePaths) => {
      console.log('🎵 handleAllSongsFileDrop called with:', filePaths)
      if (!filePaths || filePaths.length === 0) {
        console.warn('🎵 No file paths provided')
        return
      }
      try {
        console.log('🎵 Calling import_music_files with paths:', filePaths)
        const result = await invoke('import_music_files', {
          file_paths: filePaths
        })
        console.log('🎵 Import result:', result)
        if (result.success || result.imported_count > 0) {
          showToast({ msg: `Imported ${result.imported_count} songs!`, type: 'success' })
          await refreshLibrary()
        } else {
          console.error('🎵 Import failed:', result)
          showToast({ msg: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
        }
      } catch (err) {
        console.error('🎵 Import error:', err)
        showToast({ msg: `Import failed: ${err}`, type: 'error' })
      }
    }

    // ─── 24) FILE DROP TO ARTIST ─────────────────────────────────────────────────
    const handleFileDropToArtist = async (artistId, filePaths) => {
      console.log('🎨 handleFileDropToArtist called with artistId:', artistId, 'paths:', filePaths)
      if (!filePaths || filePaths.length === 0) {
        console.warn('🎨 No file paths provided')
        return
      }
      try {
        console.log('🎨 Importing files...')
        const result = await invoke('import_music_files', {
          file_paths: filePaths
        })
        console.log('🎨 Import result:', result)
        if (result.success || result.imported_count > 0) {
          const songIds = (result.songs || []).map(s => s.id)
          console.log('🎨 Song IDs to add to artist:', songIds)
          if (songIds.length > 0) {
            console.log('🎨 Adding songs to artist...')
            await invoke('add_songs_to_artist', {
              artist_id: artistId,
              song_ids:  songIds
            })
          }
          showToast({ msg: `Imported ${result.imported_count} songs and attached to artist!`, type: 'success' })
          await refreshLibrary()
        } else {
          console.error('🎨 Import failed:', result)
          showToast({ msg: `Import failed: ${result.errors.join(', ')}`, type: 'error' })
        }
      } catch (err) {
        console.error('🎨 Import error:', err)
        showToast({ msg: `Import failed: ${err}`, type: 'error' })
      }
    }

    // ─── 25) REMOVE SONG FROM PLAYLIST ──────────────────────────────────────────
    const removeSongFromPlaylist = async ({ playlistId, songId }) => {
      try {
        await invoke('remove_song_from_playlist', { playlistId, songId })
        showToast({ msg: 'Song removed from playlist', type: 'success' })
        await refreshLibrary()
      } catch (err) {
        showToast({ msg: `Failed to remove song: ${err}`, type: 'error' })
      }
    }

    // ─── 26) MISSING METHODS FOR COMPONENTS ────────────────────────────────────
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
      console.log('Selected songs:', songs)
    }

    // ─── 27) DRAG & DROP HANDLERS ───────────────────────────────────────────────
    const handleDragEnter = (playlistId) => {
      dragOverPlaylistId.value = playlistId
    }
    const handleDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
    const handleDragLeave = (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        dragOverPlaylistId.value = null
      }
    }
    const handlePlaylistExternalDrop = async (e, playlistId) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎯 Drop event for playlist:', playlistId)
      dragOverPlaylistId.value = null
      try {
        // Handle system file drops
        if (e.dataTransfer.files?.length) {
          const paths = Array.from(e.dataTransfer.files).map(f => f.path)
          await importFiles(paths, { playlistId })
          await refreshLibrary()
          return
        }

        // Try multiple data formats (internal drag/drop)
        const formats = [
          'application/x-music-player-songs',
          'application/json',
          'text/plain'
        ]
        let handled = false
        for (const format of formats) {
          try {
            const data = e.dataTransfer.getData(format)
            if (!data) continue
            let parsedData
            if (
              format === 'text/plain' &&
              data.startsWith('internal-drag:')
            ) {
              const customData = e.dataTransfer.getData('application/x-music-player-songs')
              if (customData) parsedData = JSON.parse(customData)
            } else if (
              format === 'application/json' ||
              format === 'application/x-music-player-songs'
            ) {
              parsedData = JSON.parse(data)
            }
            if (parsedData && parsedData.items) {
              for (const song of parsedData.items) {
                await addSongToPlaylist(playlistId, song)
              }
              handled = true
              break
            }
          } catch (err) {
            console.warn(`Failed to parse ${format}:`, err)
          }
        }
        if (!handled) {
          const storeItems = dragStore.getDraggedItem()
          if (storeItems) {
            const items = Array.isArray(storeItems) ? storeItems : [storeItems]
            for (const song of items) {
              await addSongToPlaylist(playlistId, song)
            }
          }
        }
      } catch (err) {
        console.error('Drop error:', err)
        showToast({ msg: 'Failed to add items', type: 'error' })
      } finally {
        dragStore.endDrag()
      }
    }

    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    // ─── 28) ON MOUNT & CLEANUP ─────────────────────────────────────────────────
    onMounted(async () => {
      await refreshLibrary()
      loadCustomPages()

      window.addEventListener('library-updated', refreshLibrary)
      document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName?.toLowerCase()
        const isEditable = document.activeElement?.isContentEditable
        if (['input','textarea','select'].includes(tag) || isEditable) return

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

        const isMac = navigator.platform.toUpperCase().includes('MAC')
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

      await listen('tauri://file-drop-hover', (ev) => {
        console.log('🎯 FILE DROP HOVER EVENT:', ev)
      })
      await listen('tauri://file-drop-cancelled', (ev) => {
        console.log('❌ FILE DROP CANCELLED EVENT:', ev)
      })
      await listen('tauri://file-drop', async (ev) => {
        console.log('📁 Global file drop detected, handled by specific drop zones')
      })
    })

    onUnmounted(() => {
      window.removeEventListener('library-updated', refreshLibrary)
      document.removeEventListener('click', showContextMenu)
    })

    // ─── 29) RETURN EVERYTHING TO TEMPLATE ─────────────────────────────────────
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

      // Preferences
      currentCssVars,
      currentViewName,
      prefsVisible,

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
      openAddModal,
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
      handleDragEnter,
      handleDragOver,
      handleDragLeave,
      handlePlaySong,
      handleAddToQueue,
      showContextMenu,
      navigateToArtist,
      navigateToPlaylist,
      handleEditMetadata,
      handleSelectSongs,
      handleCreateCustomPage,
      handleDeleteCustomPage,
      handleUpdateCustomPage,
      handleNavigation,
      handlePageAction,
      handlePageUpdate,
      closeAddModal,
      openEditModal,

      // Folder methods
      handleCreateFolder,
      moveItemsToFolder,
      addItemsToFolder,
      removeItemsFromFolder,
      saveCustomPages,
      saveCustomPagesDebounced,
      loadCustomPages,
      getAllFolders,
      getParentPath,

      // Playlist/Artist methods
      handleShowAlbum,
      handlePlayPlaylist,
      handleUpdatePlaylist,
      handleDeletePlaylists,
      handleUploadPlaylistArtwork,
      handleAddSongsToPlaylist,
      handleFileDropToPlaylist,
      handleUpdateArtist,
      handleDeleteArtists,

      // Add-Content handlers
      handleCreateArtistPlaylist,

      // Playback methods
      togglePlayback,
      handleSeek,
      playNext,
      playPrevious,
      toggleShuffle,
      toggleRepeat,
      handleVolumeChange,

      // Expose preferences API setter if needed
      setGlobalPreferences
    }
  }
}
</script>

<style>
/* ─── 30) GLOBAL STYLES & CSS VARIABLES ──────────────────────────────────────── */

/* These variables get injected into .content-scroll by :style="currentCssVars" */
.content-scroll {
  /* Base body text uses these variables */
  font-family: var(--body-font-family);
  font-size:   var(--body-font-size);
  font-weight: var(--body-font-weight);
  line-height: var(--body-font-line-height);
  background-color: var(--bg-color);
  color: #FFF;

  /* When --compact-mode is 1 → padding = 8px; when 0 → padding = 16px */
  padding: calc(
    var(--compact-mode) * 8px +
    (1 - var(--compact-mode)) * 16px
  );
}

.content-scroll h1,
.content-scroll h2,
.content-scroll h3,
.content-scroll .view-title,
.content-scroll .page-header {
  font-family: var(--header-font-family);
  font-size:   var(--header-font-size);
  font-weight: var(--header-font-weight);
  line-height: var(--header-font-line-height);

  margin-bottom: calc(
    var(--compact-mode) * 8px +
    (1 - var(--compact-mode)) * 16px
  );
}

.content-scroll img {
  display: var(--hide-images);
}

a {
  color: var(--accent-color);
}

button.primary {
  background-color: var(--accent-color);
}



/* Dark‐themed scrollbars */
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

/* Utility: compact vs. spacious mode */
:root {
  --compact-mode: 0; /* overwritten at runtime */
}

/* Global resets and palette */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
:root {
  --bg-primary:        #121212;
  --bg-secondary:      #181818;
  --bg-tertiary:       #282828;
  --bg-hover:          #333333;
  --bg-active:         #404040;
  --text-primary:      #ffffff;
  --text-secondary:    #b3b3b3;
  --text-tertiary:     #a7a7a7;
  --border-color:      #282828;
  --accent-primary:    #1db954;
  --accent-hover:      #1ed760;
  --spacing-xs:        4px;
  --spacing-sm:        8px;
  --spacing-md:        16px;
  --spacing-lg:        24px;
  --spacing-xl:        32px;
  --sidebar-width:     232px;
  --now-playing-height: 90px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
    'Helvetica Neue', sans-serif;
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

/* ── NEW: .app-container wraps Sidebar + Main ── */
.app-container {
  display: flex;
  flex: 1;
  background: #0a0a0a;
  /* Sidebar is exactly var(--sidebar-width) wide; */
  /* .main-content will grow to fill the rest. */
  height: calc(100vh - var(--now-playing-height));
}

.main-content {
  flex: 1;
  background: #000;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

/* (Everything else—Sidebar, Playlists, etc.—stays the same) */
</style>

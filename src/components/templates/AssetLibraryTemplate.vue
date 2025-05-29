<template>
    <div class="assets-page">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <h1 class="view-title">{{ title || 'Asset Library' }}</h1>
          <p class="view-subtitle">{{ filteredAssets.length }} files • {{ formatSize(totalSize) }}</p>
        </div>
        
        <div class="header-controls">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search assets..."
              class="search-input"
            >
          </div>
  
          <div class="filter-controls">
            <select v-model="filterType" class="filter-select">
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>
  
            <select v-model="sortBy" class="filter-select">
              <option value="date">Date Added</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
  
            <div class="view-toggles">
              <button 
                class="view-toggle"
                :class="{ active: viewMode === 'grid' }"
                @click="viewMode = 'grid'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
                </svg>
              </button>
              <button 
                class="view-toggle"
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/>
                </svg>
              </button>
            </div>
          </div>
  
          <div class="header-actions">
            <button 
              v-if="selectedAssets.size > 0" 
              class="action-btn ghost"
              @click="clearSelection"
            >
              Cancel
            </button>
            <button 
              v-if="selectedAssets.size > 0" 
              class="action-btn ghost"
              @click="downloadSelected"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Download
            </button>
            <button 
              v-if="selectedAssets.size > 0" 
              class="action-btn ghost danger"
              @click="deleteSelected"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </button>
            <button 
              class="action-btn primary" 
              @click="$emit('action', { type: 'upload-assets' })"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              Upload
            </button>
          </div>
        </div>
      </div>
  
      <!-- Assets Container -->
      <div 
        class="assets-container"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleDrop"
        :class="{ 'drag-over': isDragOver }"
      >
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="assets-grid">
          <div 
            v-for="asset in paginatedAssets" 
            :key="asset.id"
            class="asset-card"
            :class="{ selected: selectedAssets.has(asset.id) }"
            @click="handleAssetClick(asset, $event)"
            @dblclick="openAsset(asset)"
          >
            <div class="asset-preview">
              <!-- Image -->
              <img 
                v-if="asset.type === 'image'" 
                :src="asset.thumbnail || asset.url" 
                :alt="asset.name"
                loading="lazy"
              />
              
              <!-- Video -->
              <div v-else-if="asset.type === 'video'" class="video-preview">
                <video :src="asset.url" muted></video>
                <div class="video-duration">{{ formatDuration(asset.duration) }}</div>
                <svg class="video-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              
              <!-- Audio -->
              <div v-else-if="asset.type === 'audio'" class="audio-preview">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <div class="audio-waveform"></div>
              </div>
              
              <!-- Document -->
              <div v-else class="document-preview">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span class="file-extension">{{ getFileExtension(asset.name) }}</span>
              </div>
  
              <!-- Selection checkbox -->
              <div v-if="selectedAssets.size > 0 || hoveredAsset === asset.id" class="selection-overlay">
                <input 
                  type="checkbox" 
                  :checked="selectedAssets.has(asset.id)"
                  @click.stop
                  @change="toggleSelection(asset)"
                >
              </div>
  
              <!-- Asset actions -->
              <div class="asset-actions">
                <button @click.stop="downloadAsset(asset)" class="asset-action">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </button>
                <button @click.stop="showAssetMenu(asset, $event)" class="asset-action">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="asset-info">
              <p class="asset-name">{{ asset.name }}</p>
              <p class="asset-meta">
                {{ formatSize(asset.size) }} • {{ formatDate(asset.date) }}
              </p>
            </div>
          </div>
        </div>
  
        <!-- List View -->
        <div v-else class="assets-list">
          <table class="assets-table">
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="selectedAssets.size === filteredAssets.length && filteredAssets.length > 0"
                    @change="selectedAssets.size === filteredAssets.length ? clearSelection() : selectAll()"
                  >
                </th>
                <th class="col-preview"></th>
                <th class="col-name">Name</th>
                <th class="col-type">Type</th>
                <th class="col-size">Size</th>
                <th class="col-date">Date Added</th>
                <th class="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="asset in paginatedAssets" 
                :key="asset.id"
                class="asset-row"
                :class="{ selected: selectedAssets.has(asset.id) }"
                @click="handleAssetClick(asset, $event)"
                @dblclick="openAsset(asset)"
              >
                <td class="col-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="selectedAssets.has(asset.id)"
                    @click.stop
                    @change="toggleSelection(asset)"
                  >
                </td>
                <td class="col-preview">
                  <div class="list-preview">
                    <img v-if="asset.type === 'image'" :src="asset.thumbnail || asset.url" :alt="asset.name">
                    <svg v-else-if="asset.type === 'video'" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                    </svg>
                    <svg v-else-if="asset.type === 'audio'" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                </td>
                <td class="col-name">{{ asset.name }}</td>
                <td class="col-type">{{ asset.type }}</td>
                <td class="col-size">{{ formatSize(asset.size) }}</td>
                <td class="col-date">{{ formatDate(asset.date) }}</td>
                <td class="col-actions">
                  <button @click.stop="showAssetMenu(asset, $event)" class="list-action">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Drop Zone Overlay -->
        <div v-if="isDragOver" class="drop-overlay">
          <div class="drop-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <p>Drop files to upload</p>
          </div>
        </div>
  
        <!-- Empty State -->
        <div v-if="filteredAssets.length === 0 && !searchQuery" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l-5.5 9h11z M12 22l5.5-9h-11z M3.5 9l5.5 9 5.5-9z M20.5 9l-5.5 9-5.5-9z"/>
            </svg>
          </div>
          <h3>No assets yet</h3>
          <p>Upload images, videos, audio files, and documents</p>
          <button class="upload-btn" @click="$emit('action', { type: 'upload-assets' })">
            Upload Files
          </button>
        </div>
      </div>
  
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, watch } from 'vue'
  
  export default {
    name: 'AssetLibraryTemplate',
    props: {
      title: String,
      assets: {
        type: Array,
        default: () => []
      },
      config: {
        type: Object,
        default: () => ({
          itemsPerPage: 24
        })
      }
    },
    emits: ['action'],
    setup(props, { emit }) {
      const searchQuery = ref('')
      const filterType = ref('all')
      const sortBy = ref('date')
      const viewMode = ref('grid')
      const selectedAssets = ref(new Set())
      const hoveredAsset = ref(null)
      const isDragOver = ref(false)
      const currentPage = ref(1)
  
      const filteredAssets = computed(() => {
        let filtered = props.assets
  
        // Search filter
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          filtered = filtered.filter(asset => 
            asset.name.toLowerCase().includes(query) ||
            asset.tags?.some(tag => tag.toLowerCase().includes(query))
          )
        }
  
        // Type filter
        if (filterType.value !== 'all') {
          filtered = filtered.filter(asset => asset.type === filterType.value)
        }
  
        // Sort
        const sorted = [...filtered]
        switch (sortBy.value) {
          case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name))
            break
          case 'size':
            sorted.sort((a, b) => b.size - a.size)
            break
          case 'type':
            sorted.sort((a, b) => a.type.localeCompare(b.type))
            break
          case 'date':
          default:
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date))
        }
  
        return sorted
      })
  
      const totalPages = computed(() => 
        Math.ceil(filteredAssets.value.length / props.config.itemsPerPage)
      )
  
      const paginatedAssets = computed(() => {
        const start = (currentPage.value - 1) * props.config.itemsPerPage
        const end = start + props.config.itemsPerPage
        return filteredAssets.value.slice(start, end)
      })
  
      const totalSize = computed(() => 
        filteredAssets.value.reduce((sum, asset) => sum + asset.size, 0)
      )
  
      // Reset page when filters change
      watch([searchQuery, filterType, sortBy], () => {
        currentPage.value = 1
      })
  
      const formatSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }
  
      const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      }
  
      const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
  
      const getFileExtension = (filename) => {
        return filename.split('.').pop().toUpperCase()
      }
  
      const handleAssetClick = (asset, event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const multiSelectKey = isMac ? event.metaKey : event.ctrlKey
        
        if (multiSelectKey) {
          toggleSelection(asset)
        } else if (!selectedAssets.value.has(asset.id)) {
          clearSelection()
          toggleSelection(asset)
        }
      }
  
      const toggleSelection = (asset) => {
        if (selectedAssets.value.has(asset.id)) {
          selectedAssets.value.delete(asset.id)
        } else {
          selectedAssets.value.add(asset.id)
        }
        selectedAssets.value = new Set(selectedAssets.value)
      }
  
      const clearSelection = () => {
        selectedAssets.value.clear()
        selectedAssets.value = new Set(selectedAssets.value)
      }
  
      const selectAll = () => {
        filteredAssets.value.forEach(asset => selectedAssets.value.add(asset.id))
        selectedAssets.value = new Set(selectedAssets.value)
      }
  
      const openAsset = (asset) => {
        emit('action', { type: 'open-asset', asset })
      }
  
      const downloadAsset = (asset) => {
        emit('action', { type: 'download-asset', asset })
      }
  
      const downloadSelected = () => {
        const assets = filteredAssets.value.filter(a => selectedAssets.value.has(a.id))
        emit('action', { type: 'download-assets', assets })
      }
  
      const deleteSelected = () => {
        if (confirm(`Delete ${selectedAssets.value.size} assets?`)) {
          const assets = filteredAssets.value.filter(a => selectedAssets.value.has(a.id))
          emit('action', { type: 'delete-assets', assets })
          clearSelection()
        }
      }
  
      const showAssetMenu = (asset, event) => {
        emit('action', { type: 'context-menu', asset, event })
      }
  
      const handleDrop = (event) => {
        isDragOver.value = false
        const files = Array.from(event.dataTransfer.files)
        emit('action', { type: 'upload-files', files })
      }
  
      return {
        searchQuery,
        filterType,
        sortBy,
        viewMode,
        selectedAssets,
        hoveredAsset,
        isDragOver,
        currentPage,
        filteredAssets,
        paginatedAssets,
        totalPages,
        totalSize,
        formatSize,
        formatDate,
        formatDuration,
        getFileExtension,
        handleAssetClick,
        toggleSelection,
        clearSelection,
        selectAll,
        openAsset,
        downloadAsset,
        downloadSelected,
        deleteSelected,
        showAssetMenu,
        handleDrop
      }
    }
  }
  </script>
  
  <style scoped>
  .assets-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
  }
  
  /* Header */
  .view-header {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
  }
  
  .header-content {
    margin-bottom: 20px;
  }
  
  .view-title {
    font-size: 32px;
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
  
  .search-box {
    flex: 1;
    max-width: 400px;
    position: relative;
  }
  
  .search-box svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 10px 16px 10px 48px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    transition: all 0.15s ease;
  }
  
  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .search-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  /* Filter Controls */
  .filter-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .filter-select {
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .filter-select:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .filter-select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  /* View Toggles */
  .view-toggles {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 4px;
  }
  
  .view-toggle {
    padding: 6px 10px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .view-toggle:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .view-toggle.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .view-toggle svg {
    width: 18px;
    height: 18px;
  }
  
  /* Header Actions */
  .header-actions {
    display: flex;
    gap: 12px;
    margin-left: auto;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .action-btn.primary {
    background: white;
    color: black;
  }
  
  .action-btn.primary:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  .action-btn.ghost {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .action-btn.ghost:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .action-btn.danger {
    color: #ff5555;
    border-color: rgba(255, 85, 85, 0.3);
  }
  
  .action-btn.danger:hover {
    background: rgba(255, 85, 85, 0.1);
    border-color: rgba(255, 85, 85, 0.5);
  }
  
  /* Assets Container */
  .assets-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    position: relative;
  }
  
  .assets-container.drag-over {
    background: rgba(255, 255, 255, 0.02);
    outline: 2px dashed rgba(255, 255, 255, 0.2);
    outline-offset: -8px;
  }
  
  /* Grid View */
  .assets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 24px;
  }
  
  .asset-card {
    position: relative;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }
  
  .asset-card:hover {
    transform: translateY(-4px);
  }
  
  .asset-card.selected {
    transform: scale(0.95);
  }
  
  .asset-preview {
    position: relative;
    width: 100%;
    padding-bottom: 75%; /* 4:3 aspect ratio */
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.15s ease;
  }
  
  .asset-card:hover .asset-preview {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .asset-card.selected .asset-preview {
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }
  
  .asset-preview img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  /* Video Preview */
  .video-preview {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .video-preview video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .video-duration {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .video-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    padding: 12px;
    padding-left: 14px;
    color: white;
  }
  
  /* Audio Preview */
  .audio-preview {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  }
  
  .audio-preview svg {
    width: 48px;
    height: 48px;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 16px;
  }
  
  .audio-waveform {
    width: 80%;
    height: 40px;
    background: repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0.2) 2px,
      transparent 2px,
      transparent 4px
    );
    border-radius: 2px;
  }
  
  /* Document Preview */
  .document-preview {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  }
  
  .document-preview svg {
    width: 48px;
    height: 48px;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 8px;
  }
  
  .file-extension {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
  }
  
  /* Selection Overlay */
  .selection-overlay {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
  }
  
  .selection-overlay input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: white;
  }
  
  /* Asset Actions */
  .asset-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  
  .asset-card:hover .asset-actions {
    opacity: 1;
  }
  
  .asset-action {
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .asset-action:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
  
  .asset-action svg {
    width: 16px;
    height: 16px;
  }
  
  /* Asset Info */
  .asset-info {
    margin-top: 12px;
    padding: 0 4px;
  }
  
  .asset-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .asset-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  /* List View */
  .assets-list {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .assets-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .assets-table thead {
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .assets-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .col-checkbox {
    width: 40px;
  }
  
  .col-preview {
    width: 60px;
  }
  
  .col-type {
    width: 100px;
  }
  
  .col-size {
    width: 100px;
  }
  
  .col-date {
    width: 140px;
  }
  
  .col-actions {
    width: 50px;
  }
  
  .asset-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    transition: all 0.15s ease;
    cursor: pointer;
  }
  
  .asset-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .asset-row.selected {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .assets-table td {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .list-preview {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .list-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .list-preview svg {
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.3);
  }
  
  .list-action {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .list-action:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .list-action svg {
    width: 18px;
    height: 18px;
  }
  
  /* Drop Overlay */
  .drop-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .drop-content {
    text-align: center;
  }
  
  .drop-content svg {
    width: 64px;
    height: 64px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 16px;
  }
  
  .drop-content p {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }
  
  /* Empty State */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    text-align: center;
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .empty-icon svg {
    width: 40px;
    height: 40px;
    color: rgba(255, 255, 255, 0.3);
  }
  
  .empty-state h3 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .empty-state p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 24px;
  }
  
  .upload-btn {
    padding: 12px 32px;
    background: white;
    border: none;
    border-radius: 24px;
    color: black;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .upload-btn:hover {
    transform: scale(1.04);
    background: rgba(255, 255, 255, 0.9);
  }
  
  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .page-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .page-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .page-info {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Scrollbar */
  .assets-container::-webkit-scrollbar {
    width: 12px;
  }
  
  .assets-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .assets-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  
  .assets-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
    background-clip: padding-box;
  }
  </style>
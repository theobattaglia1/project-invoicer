<template>
    <div class="list-page">
      <!-- Hero Section (optional) -->
      <div v-if="showHero && heroData" class="hero-section">
        <div class="hero-background">
          <img 
            v-if="heroData.image" 
            :src="heroData.image" 
            :alt="heroData.title"
            class="hero-image"
          />
          <div v-else class="hero-placeholder">
            <svg viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" fill="rgba(255,255,255,0.05)"/>
              <path d="M30 35h40v4H30v-4zm0 8h40v4H30v-4zm0 8h24v4H30v-4z" fill="rgba(255,255,255,0.2)"/>
            </svg>
          </div>
          <div class="hero-gradient"></div>
        </div>
        
        <div class="hero-content">
          <p class="hero-label">{{ heroData.label || 'COLLECTION' }}</p>
          <h1 class="hero-title">{{ heroData.title || title }}</h1>
          <p class="hero-info">
            <span v-if="heroData.description">{{ heroData.description }} • </span>
            <span>{{ totalItems }} items</span>
            <span v-if="heroData.meta"> • {{ heroData.meta }}</span>
          </p>
        </div>
      </div>
  
      <!-- Header (when no hero) -->
      <div v-else class="view-header">
        <div class="header-content">
          <h1 class="view-title">{{ title }}</h1>
          <p class="view-subtitle">
            {{ totalItems }} items
            <span v-if="selectedItems.size > 0" class="selection-count">
              • {{ selectedItems.size }} selected
            </span>
          </p>
        </div>
  
        <div class="header-controls">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="search-input"
              @keydown.escape="searchQuery = ''"
            >
          </div>
  
          <div class="view-options">
            <button class="sort-button" @click="showSortMenu = !showSortMenu">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
              </svg>
              <span>{{ currentSort.label }}</span>
            </button>
            
            <div v-if="showSortMenu" class="sort-menu">
              <div
                v-for="option in sortOptions"
                :key="option.value"
                class="sort-option"
                :class="{ active: sortBy === option.value }"
                @click="setSortBy(option.value)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
  
        <div class="header-actions">
          <slot name="actions" :selectedItems="Array.from(selectedItems.values())">
            <button class="action-btn primary" @click="$emit('action', { type: 'create' })">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Item
            </button>
          </slot>
        </div>
      </div>
  
      <!-- Actions Section (when hero is shown) -->
      <div v-if="showHero" class="actions-section">
        <button class="play-button" @click="$emit('action', { type: 'play-all' })">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        
        <button class="action-button" @click="$emit('action', { type: 'shuffle' })">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
        </button>
        
        <slot name="hero-actions" />
      </div>
  
      <!-- List Container -->
      <div class="list-container">
        <!-- Table Header -->
        <div class="table-header">
          <div class="col-checkbox" v-if="selectable">
            <input 
              type="checkbox"
              :checked="selectedItems.size === filteredItems.length && filteredItems.length > 0"
              :indeterminate="selectedItems.size > 0 && selectedItems.size < filteredItems.length"
              @change="toggleSelectAll"
            >
          </div>
          <div 
            v-for="column in columns" 
            :key="column.key"
            :class="`col-${column.key}`"
            :style="{ width: column.width, flex: column.flex }"
          >
            {{ column.label }}
          </div>
        </div>
  
        <!-- Virtual Scroll Container -->
        <div 
          ref="scrollerRef" 
          class="list-scroll"
          @scroll="handleScroll"
        >
          <div :style="{ height: totalHeight + 'px', position: 'relative' }">
            <div
              v-for="(item, index) in visibleItems"
              :key="item.id"
              class="list-row"
              :style="{
                position: 'absolute',
                top: (item._index * rowHeight) + 'px',
                left: 0,
                right: 0,
                height: rowHeight + 'px'
              }"
              :class="{ 
                selected: selectedItems.has(item.id),
                highlighted: highlightedItem?.id === item.id
              }"
              @click="handleRowClick(item, item._index, $event)"
              @dblclick="$emit('action', { type: 'open', item })"
              @mouseenter="highlightedItem = item"
              @mouseleave="highlightedItem = null"
              @contextmenu.prevent="$emit('action', { type: 'context-menu', event: $event, item })"
            >
              <div class="col-checkbox" v-if="selectable">
                <input 
                  type="checkbox"
                  :checked="selectedItems.has(item.id)"
                  @click.stop
                  @change="toggleSelection(item)"
                >
              </div>
              
              <slot name="row" :item="item" :index="index">
                <div 
                  v-for="column in columns" 
                  :key="column.key"
                  :class="`col-${column.key}`"
                  :style="{ width: column.width, flex: column.flex }"
                >
                  {{ getColumnValue(item, column) }}
                </div>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  
  export default {
    name: 'ListPageTemplate',
    props: {
      title: String,
      items: Array,
      columns: {
        type: Array,
        default: () => [
          { key: 'name', label: 'Name', flex: 1 },
          { key: 'type', label: 'Type', width: '200px' },
          { key: 'modified', label: 'Modified', width: '200px' },
          { key: 'size', label: 'Size', width: '100px' }
        ]
      },
      showHero: Boolean,
      heroData: Object,
      selectable: {
        type: Boolean,
        default: true
      },
      sortOptions: {
        type: Array,
        default: () => [
          { value: 'name', label: 'Name' },
          { value: 'date', label: 'Date' },
          { value: 'type', label: 'Type' }
        ]
      },
      virtualScroll: {
        type: Boolean,
        default: true
      },
      rowHeight: {
        type: Number,
        default: 56
      }
    },
    emits: ['action'],
    setup(props, { emit }) {
      // State
      const scrollerRef = ref(null)
      const searchQuery = ref('')
      const sortBy = ref('name')
      const showSortMenu = ref(false)
      const selectedItems = ref(new Set())
      const highlightedItem = ref(null)
      const lastSelectedIndex = ref(-1)
      
      // Virtual scrolling
      const scrollTop = ref(0)
      const containerHeight = ref(600)
      const buffer = 5
  
      // Computed
      const totalItems = computed(() => props.items?.length || 0)
      
      const currentSort = computed(() => 
        props.sortOptions.find(opt => opt.value === sortBy.value) || props.sortOptions[0]
      )
  
      const filteredItems = computed(() => {
        let filtered = props.items || []
        
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          filtered = filtered.filter(item => {
            return Object.values(item).some(value => 
              String(value).toLowerCase().includes(query)
            )
          })
        }
        
        // Sort items
        const sorted = [...filtered]
        sorted.sort((a, b) => {
          const aVal = a[sortBy.value] || ''
          const bVal = b[sortBy.value] || ''
          return String(aVal).localeCompare(String(bVal))
        })
        
        return sorted.map((item, index) => ({ ...item, _index: index }))
      })
  
      const totalHeight = computed(() => 
        props.virtualScroll ? filteredItems.value.length * props.rowHeight : 'auto'
      )
  
      const visibleItems = computed(() => {
        if (!props.virtualScroll) return filteredItems.value
        
        const start = Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - buffer)
        const end = Math.min(
          filteredItems.value.length,
          Math.ceil((scrollTop.value + containerHeight.value) / props.rowHeight) + buffer
        )
        
        return filteredItems.value.slice(start, end)
      })
  
      // Methods
      const handleScroll = (event) => {
        if (props.virtualScroll) {
          scrollTop.value = event.target.scrollTop
        }
      }
  
      const updateContainerHeight = () => {
        if (scrollerRef.value && props.virtualScroll) {
          containerHeight.value = scrollerRef.value.clientHeight
        }
      }
  
      const getColumnValue = (item, column) => {
        const value = item[column.key]
        if (column.formatter) {
          return column.formatter(value, item)
        }
        return value || '—'
      }
  
      const handleRowClick = (item, index, event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const isCmd = isMac ? event.metaKey : event.ctrlKey
        const isShift = event.shiftKey
  
        if (isCmd) {
          toggleSelection(item)
          lastSelectedIndex.value = index
        } else if (isShift && lastSelectedIndex.value !== -1) {
          const start = Math.min(lastSelectedIndex.value, index)
          const end = Math.max(lastSelectedIndex.value, index)
          
          if (!isCmd) {
            selectedItems.value.clear()
          }
          
          for (let i = start; i <= end; i++) {
            selectedItems.value.add(filteredItems.value[i].id)
          }
          selectedItems.value = new Set(selectedItems.value)
        } else {
          if (selectedItems.value.size > 0) {
            selectedItems.value.clear()
            selectedItems.value = new Set(selectedItems.value)
          }
          lastSelectedIndex.value = index
        }
      }
  
      const toggleSelection = (item) => {
        if (selectedItems.value.has(item.id)) {
          selectedItems.value.delete(item.id)
        } else {
          selectedItems.value.add(item.id)
        }
        selectedItems.value = new Set(selectedItems.value)
      }
  
      const toggleSelectAll = () => {
        if (selectedItems.value.size === filteredItems.value.length) {
          selectedItems.value.clear()
        } else {
          filteredItems.value.forEach(item => selectedItems.value.add(item.id))
        }
        selectedItems.value = new Set(selectedItems.value)
      }
  
      const setSortBy = (value) => {
        sortBy.value = value
        showSortMenu.value = false
      }
  
      // Keyboard shortcuts
      const handleKeyboard = (e) => {
        if (e.target.tagName === 'INPUT') return
  
        if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
          e.preventDefault()
          toggleSelectAll()
        }
        if (e.key === 'Escape') {
          selectedItems.value.clear()
          selectedItems.value = new Set(selectedItems.value)
          searchQuery.value = ''
        }
      }
  
      // Click outside to close menus
      const handleClickOutside = (e) => {
        if (!e.target.closest('.view-options')) {
          showSortMenu.value = false
        }
      }
  
      // Resize observer
      let resizeObserver = null
  
      onMounted(() => {
        document.addEventListener('keydown', handleKeyboard)
        document.addEventListener('click', handleClickOutside)
        
        updateContainerHeight()
        
        if (scrollerRef.value && props.virtualScroll) {
          resizeObserver = new ResizeObserver(() => {
            updateContainerHeight()
          })
          resizeObserver.observe(scrollerRef.value)
        }
      })
  
      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyboard)
        document.removeEventListener('click', handleClickOutside)
        
        if (resizeObserver) {
          resizeObserver.disconnect()
        }
      })
  
      return {
        scrollerRef,
        searchQuery,
        sortBy,
        showSortMenu,
        selectedItems,
        highlightedItem,
        totalItems,
        currentSort,
        filteredItems,
        visibleItems,
        totalHeight,
        handleScroll,
        getColumnValue,
        handleRowClick,
        toggleSelection,
        toggleSelectAll,
        setSortBy
      }
    }
  }
  </script>
  
  <style scoped>
  .list-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
  }
  
  /* Hero Section */
  .hero-section {
    position: relative;
    height: 30vh;
    min-height: 280px;
    max-height: 400px;
    display: flex;
    align-items: flex-end;
    padding: 0 32px 24px;
  }
  
  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    filter: brightness(0.4);
  }
  
  .hero-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(transparent 0, rgba(0,0,0,0.5) 100%), 
                linear-gradient(rgba(0,0,0,0.1) 0, #000 100%);
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    width: 100%;
  }
  
  .hero-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .hero-title {
    font-size: clamp(32px, 5vw, 64px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.04em;
    margin: 0 0 16px;
  }
  
  .hero-info {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* Actions Section */
  .actions-section {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 24px 32px;
    background: linear-gradient(rgba(0,0,0,0.6) 0, #000 100%);
  }
  
  .play-button {
    width: 56px;
    height: 56px;
    background: #1db954;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .play-button:hover {
    transform: scale(1.04);
    background: #1ed760;
  }
  
  .play-button svg {
    width: 24px;
    height: 24px;
    color: #000;
    margin-left: 2px;
  }
  
  .action-button {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .action-button:hover {
    color: white;
    transform: scale(1.04);
  }
  
  .action-button svg {
    width: 24px;
    height: 24px;
  }
  
  /* Header */
  .view-header {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
  }
  
  .header-content {
    margin-bottom: 24px;
  }
  
  .view-title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  
  .view-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .selection-count {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }
  
  /* Header Controls */
  .header-controls {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .search-box {
    flex: 1;
    max-width: 400px;
    position: relative;
  }
  
  .search-icon {
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
    padding: 10px 44px;
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
  
  /* View Options */
  .view-options {
    position: relative;
  }
  
  .sort-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  
  .sort-button:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .sort-button svg {
    width: 18px;
    height: 18px;
  }
  
  .sort-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: rgba(18, 18, 18, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 4px;
    min-width: 180px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 100;
  }
  
  .sort-option {
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
  }
  
  .sort-option:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .sort-option.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 500;
  }
  
  /* Action Buttons */
  .header-actions {
    display: flex;
    gap: 12px;
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
  
  /* List Container */
  .list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
  
  /* Table Header */
  .table-header {
    display: flex;
    align-items: center;
    padding: 12px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.02);
  }
  
  .col-checkbox {
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* List Scroll */
  .list-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 32px;
  }
  
  /* List Row */
  .list-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }
  
  .list-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .list-row.highlighted {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .list-row.selected {
    background: rgba(255, 255, 255, 0.08);
  }
  
  /* Scrollbar */
  .list-scroll::-webkit-scrollbar {
    width: 12px;
  }
  
  .list-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .list-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  
  .list-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
    background-clip: padding-box;
  }
  </style>
<template>
    <div class="timeline-page">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <div class="header-date-time">
            <div>{{ currentDate }}</div>
            <div>{{ currentTime }}</div>
          </div>
          <h1 class="view-title">{{ title || 'Timeline' }}</h1>
          <p class="view-subtitle">
            <span v-if="selectedItems.size > 0">{{ selectedItems.size }} selected • </span>
            {{ subtitle || `${items.length} moments` }}
          </p>
        </div>
        
        <div class="header-controls">
          <div class="view-switcher">
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'stack' }"
              @click="viewMode = 'stack'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3z"/>
              </svg>
              Stack
            </button>
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'linear' }"
              @click="viewMode = 'linear'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v2H4zm0 6h16v2H4zm0 6h16v2H4z"/>
              </svg>
              Linear
            </button>
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
              </svg>
              Grid
            </button>
          </div>
  
          <div class="timeline-controls">
            <button class="control-btn" @click="resetView">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Reset View
            </button>
            
            <button class="control-btn" @click="toggleAutoPlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path v-if="!autoPlay" d="M8 5v14l11-7z"/>
                <path v-else d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
              {{ autoPlay ? 'Pause' : 'Play' }}
            </button>
          </div>
  
          <button class="action-btn primary" @click="showAddMomentModal = true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Moment
          </button>
        </div>
      </div>
  
      <!-- Drop Zone Overlay -->
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
          <p>Drop images here to create a moment</p>
        </div>
      </div>
  
      <!-- Timeline Container -->
      <div 
        class="timeline-container" 
        ref="containerRef"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
        @contextmenu.prevent="showContextMenu"
      >
        <!-- Stack View (3D Fan Layout) -->
        <div v-if="viewMode === 'stack'" class="stack-view" @click="handleBackgroundClick">
          <div class="timeline-fan-container">
            <div 
              v-for="(item, index) in sortedItems" 
              :key="item.id"
              class="timeline-card"
              :class="{ 
                'showcase-expanded': isShowcaseExpanded && currentIndex === index
              }"
              :style="getFanCardStyle(index)"
              @click.stop="handleCardClick(index)"
              @contextmenu.prevent.stop="(e) => showItemContextMenu(e, item)"
            >
              <img 
                v-if="item.image" 
                :src="convertImageSrc(item.image)" 
                :alt="item.title"
                @error="handleImageError"
              />
              <div v-else class="card-placeholder" @click.stop="selectImageForMoment(item)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <p>Click to add image</p>
              </div>
              
              <!-- Caption for expanded showcase -->
              <div v-if="isShowcaseExpanded && currentIndex === index" class="card-caption">
                <div class="caption-title">{{ item.title }}</div>
                <div class="caption-date">{{ formatDate(item.date, true) }}</div>
                <div class="caption-description">{{ item.description || 'No description' }}</div>
              </div>
            </div>
          </div>
  
          <!-- Tag Filters (positioned like original) -->
          <div class="stack-filters">
            <ul>
              <li 
                :class="{ active: activeFilter === 'all' }"
                @click="setFilter('all')"
              >all<sup v-if="sortedItems.length">{{ sortedItems.length }}</sup></li>
              <li 
                v-for="tag in uniqueTags" 
                :key="tag"
                :class="{ active: activeFilter === tag }"
                @click="setFilter(tag)"
              >{{ tag }}<sup>{{ getTagCount(tag) }}</sup></li>
            </ul>
          </div>
  
          <!-- Navigation -->
          <div class="stack-navigation">
            <button @click="navigatePrev" :disabled="currentIndex === 0">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <span class="nav-indicator">{{ currentIndex + 1 }} / {{ filteredItems.length }}</span>
            <button @click="navigateNext" :disabled="currentIndex === filteredItems.length - 1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>
  
        <!-- Linear View -->
        <div v-else-if="viewMode === 'linear'" class="linear-view">
          <div class="timeline-line"></div>
          
          <div 
            v-for="(item, index) in sortedItems" 
            :key="item.id"
            class="timeline-item"
            :class="{ 'item-left': index % 2 === 0, 'item-right': index % 2 === 1 }"
            @contextmenu.prevent.stop="(e) => showItemContextMenu(e, item)"
          >
            <div class="item-marker"></div>
            
                        <div class="item-card" 
                   :class="{ 'selected': selectedItems.has(item.id) }"
                   @click="handleItemClick(item, $event)">
              <div class="item-date">{{ formatDate(item.date) }}</div>
              
              <div class="item-content">
                <img 
                  v-if="item.image" 
                  :src="convertImageSrc(item.image)" 
                  :alt="item.title"
                  class="item-image"
                />
                
                <div class="item-info">
                  <h3 class="item-title">{{ item.title }}</h3>
                  <p class="item-description">{{ item.description }}</p>
                  
                  <div v-if="item.tags && item.tags.length > 0" class="item-tags">
                    <span v-for="tag in item.tags" :key="tag" class="tag">
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Grid View -->
        <div v-else class="grid-view">
          <div class="timeline-grid">
            <div 
              v-for="item in sortedItems" 
              :key="item.id"
              class="grid-item"
              :class="{ 'selected': selectedItems.has(item.id) }"
              @click="handleItemClick(item, $event)"
              @contextmenu.prevent.stop="(e) => showItemContextMenu(e, item)"
            >
              <div class="grid-item-image">
                <img 
                  v-if="item.image" 
                  :src="convertImageSrc(item.image)" 
                  :alt="item.title"
                />
                <div v-else class="image-placeholder" @click.stop="selectImageForMoment(item)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <p>Add image</p>
                </div>
                
                <div class="grid-item-date">{{ formatDate(item.date) }}</div>
              </div>
              
              <div class="grid-item-info">
                <h3 class="grid-item-title">{{ item.title }}</h3>
                <p class="grid-item-description">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Empty State -->
        <div v-if="items.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.64 6.56l-3.54 3.54c-.78.78-2.05.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0l1.41 1.41 2.12-2.12c.78-.78 2.05-.78 2.83 0s.78 2.05 0 2.83z"/>
          </svg>
          <h3>Start Your Timeline</h3>
          <p>Click "Add Moment" or drag images here to begin</p>
        </div>
      </div>
  
      <!-- Detail Sidebar -->
      <div v-if="currentItem && viewMode === 'stack'" class="detail-sidebar">
        <h2>{{ currentItem.title }}</h2>
        <p class="detail-date">{{ formatDate(currentItem.date, true) }}</p>
        <p class="detail-description">{{ currentItem.description }}</p>
        
        <div v-if="currentItem.notes" class="detail-notes">
          <h3>Notes</h3>
          <p>{{ currentItem.notes }}</p>
        </div>
        
        <div v-if="currentItem.tags && currentItem.tags.length > 0" class="detail-tags">
          <h3>Tags</h3>
          <div class="tags-list">
            <span v-for="tag in currentItem.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
        
        <div class="detail-actions">
          <button class="detail-btn" @click="editMoment(currentItem)">
            Edit
          </button>
          <button class="detail-btn" @click="deleteMoment(currentItem)">
            Delete
          </button>
        </div>
      </div>
  
      <!-- Add/Edit Moment Modal -->
      <Teleport to="body">
        <div v-if="showAddMomentModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content moment-modal" @click.stop>
            <h3>{{ editingMoment ? 'Edit Moment' : 'Add New Moment' }}</h3>
            
            <div class="moment-form">
              <!-- Image Upload -->
              <div class="image-upload-section">
                <div v-if="momentForm.image" class="image-preview">
                  <img :src="convertImageSrc(momentForm.image)" />
                  <button class="remove-image" @click="momentForm.image = null">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
                <div v-else class="image-upload-zone" @click="selectImage">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                  </svg>
                  <p>Click to upload image or drag & drop</p>
                </div>
              </div>
  
              <!-- Form Fields -->
              <div class="form-fields">
                <div class="form-group">
                  <label>Title</label>
                  <input 
                    v-model="momentForm.title" 
                    placeholder="Moment title..."
                    @keydown.enter="saveMoment"
                  />
                </div>
  
                <div class="form-group">
                  <label>Date</label>
                  <input 
                    v-model="momentForm.date" 
                    type="date"
                  />
                </div>
  
                <div class="form-group">
                  <label>Description</label>
                  <textarea 
                    v-model="momentForm.description" 
                    placeholder="What happened..."
                    rows="3"
                  />
                </div>
  
                <div class="form-group">
                  <label>Notes</label>
                  <textarea 
                    v-model="momentForm.notes" 
                    placeholder="Additional notes or context..."
                    rows="2"
                  />
                </div>
  
                <div class="form-group">
                  <label>Tags</label>
                  <div class="tags-input">
                    <span 
                      v-for="(tag, index) in momentForm.tags" 
                      :key="index"
                      class="tag"
                      @click="removeTag(index)"
                    >
                      {{ tag }}
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </span>
                    <input 
                      v-model="newTag"
                      @keydown.enter.prevent="addTag"
                      @keydown.comma.prevent="addTag"
                      placeholder="Add tag..."
                    />
                  </div>
                </div>
              </div>
            </div>
  
            <div class="modal-actions">
              <button @click="saveMoment" class="save-btn" :disabled="!momentForm.title">
                {{ editingMoment ? 'Update' : 'Create' }} Moment
              </button>
              <button @click="closeModal" class="cancel-btn">Cancel</button>
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
              v-if="selectedItems.size > 1"
              class="context-menu-item danger"
              @click="deleteSelectedItems(); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete {{ selectedItems.size }} Items
            </div>
            <div 
              v-if="contextMenuItem"
              class="context-menu-item"
              @click="editMoment(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit Moment
            </div>
            <div 
              v-if="contextMenuItem"
              class="context-menu-item danger"
              @click="deleteMoment(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete Moment
            </div>
            <div 
              v-if="!contextMenuItem"
              class="context-menu-item"
              @click="showAddMomentModal = true; closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Moment Here
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
  import { open } from '@tauri-apps/api/dialog'
  import { readBinaryFile } from '@tauri-apps/api/fs'
  import { convertFileSrc } from '@tauri-apps/api/tauri'
  
  export default {
    name: 'TimelinePageTemplate',
    props: {
      title: String,
      subtitle: String,
      data: {
        type: Object,
        default: () => ({ items: [] })
      },
      config: {
        type: Object,
        default: () => ({})
      }
    },
    emits: ['action'],
    setup(props, { emit }) {
      // Inject global services
      const toast = inject('toast')
      
      // Refs
      const containerRef = ref(null)
      const viewMode = ref(props.config.defaultView || 'stack')
      const currentIndex = ref(0)
      const zoom = ref(0)
      const autoPlay = ref(false)
      const isDraggingOver = ref(false)
      const showAddMomentModal = ref(false)
      const editingMoment = ref(null)
      const contextMenuVisible = ref(false)
      const contextMenuItem = ref(null)
      const contextMenuPosition = ref({ x: 0, y: 0 })
      const isShowcaseExpanded = ref(false)
      const activeFilter = ref('all')
      
      // Form data
      const momentForm = ref({
        title: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        image: null,
        tags: []
      })
      const newTag = ref('')
      const selectedItems = ref(new Set())
      const isDragging = ref(false)
      const draggedItem = ref(null)
      
      // Data
      const items = ref(props.data.items || [])
      
      const currentDate = ref('')
      const currentTime = ref('')
      
      // Update date/time
      const updateDateTime = () => {
        const now = new Date()
        currentDate.value = now.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
        currentTime.value = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      }
      
      let autoPlayInterval = null
      let dateTimeInterval = null
  
      // Computed
      const sortedItems = computed(() => {
        return [...items.value].sort((a, b) => new Date(a.date) - new Date(b.date))
      })
  
      const filteredItems = computed(() => {
        if (activeFilter.value === 'all') {
          return sortedItems.value
        }
        return sortedItems.value.filter(item => 
          item.tags && item.tags.includes(activeFilter.value)
        )
      })
  
      const currentItem = computed(() => filteredItems.value[currentIndex.value])
  
      const uniqueTags = computed(() => {
        const tags = new Set()
        items.value.forEach(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => tags.add(tag))
          }
        })
        return Array.from(tags)
      })
  
      const getTagCount = (tag) => {
        return items.value.filter(item => 
          item.tags && item.tags.includes(tag)
        ).length
      }
  
      // Fan Layout Card Positioning
      const getFanCardStyle = (index) => {
        const offset = index - currentIndex.value
        const showcaseSpacing = 600
        const tightSpacing = 15
        const verticalShift = -5
        const leftStackOffsetY = 80
        const rightStackOffsetY = -80
        const depthShift = -20
        const maxAngle = -130
        
        let x = 0
        let y = offset * verticalShift
  
        if (offset === 0) {
          x = 0
        } else if (offset < 0) {
          x = offset * tightSpacing - showcaseSpacing / 2
          y += leftStackOffsetY
        } else {
          x = (offset - 1) * tightSpacing + showcaseSpacing / 2
          y += rightStackOffsetY
        }
  
        const z = offset * depthShift
        const angle = offset * -1.5
        const rotateY = offset === 0
          ? (isShowcaseExpanded.value ? 0 : -50)
          : Math.max(-maxAngle, angle)
        const scale = offset === 0 ? (isShowcaseExpanded.value ? 1.6 : 1.3) : 1.0
        
        return {
          transform: `
            translate3d(${x}px, ${y}px, ${z}px)
            rotateY(${rotateY}deg)
            scale(${scale})
          `,
          zIndex: isShowcaseExpanded.value && offset === 0 ? 999 : 10 - Math.abs(offset),
          boxShadow: offset === 0 
            ? '0 25px 80px rgba(0, 0, 0, 0.4)'
            : '0 10px 30px rgba(0, 0, 0, 0.1)'
        }
      }
  
      // Date formatting
      const formatDate = (date, detailed = false) => {
        const d = new Date(date)
        if (detailed) {
          return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      }
  
      // Navigation
      const setCurrentIndex = (index) => {
        currentIndex.value = Math.max(0, Math.min(index, filteredItems.value.length - 1))
      }
  
      const navigatePrev = () => {
        if (currentIndex.value > 0) {
          currentIndex.value--
          isShowcaseExpanded.value = false
        }
      }
  
      const navigateNext = () => {
        if (currentIndex.value < filteredItems.value.length - 1) {
          currentIndex.value++
          isShowcaseExpanded.value = false
        }
      }
  
      const handleWheel = (event) => {
        event.preventDefault()
        if (event.deltaY > 0) {
          navigateNext()
        } else {
          navigatePrev()
        }
      }
  
      const handleKeyboard = (event) => {
        // Select All (Cmd/Ctrl + A)
        if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
          event.preventDefault()
          if (selectedItems.value.size === items.value.length) {
            selectedItems.value.clear()
          } else {
            items.value.forEach(item => selectedItems.value.add(item.id))
          }
        }
        
        // Delete selected items
        if ((event.key === 'Delete' || event.key === 'Backspace') && selectedItems.value.size > 0) {
          event.preventDefault()
          deleteSelectedItems()
          return
        }
        
        // Escape to clear selection
        if (event.key === 'Escape') {
          if (selectedItems.value.size > 0) {
            selectedItems.value.clear()
          } else if (isShowcaseExpanded.value) {
            isShowcaseExpanded.value = false
          }
          return
        }
        
        if (viewMode.value !== 'stack') return
        
        switch(event.key) {
          case 'ArrowLeft':
            navigatePrev()
            break
          case 'ArrowRight':
            navigateNext()
            break
          case 'Home':
            currentIndex.value = 0
            isShowcaseExpanded.value = false
            break
          case 'End':
            currentIndex.value = filteredItems.value.length - 1
            isShowcaseExpanded.value = false
            break
        }
      }
  
      const handleCardClick = (index, event) => {
        // Handle multi-select with Cmd/Ctrl
        if (event.metaKey || event.ctrlKey) {
          event.stopPropagation()
          const item = filteredItems.value[index]
          if (selectedItems.value.has(item.id)) {
            selectedItems.value.delete(item.id)
          } else {
            selectedItems.value.add(item.id)
          }
          return
        }
        
        // Clear selection on regular click
        if (selectedItems.value.size > 0) {
          selectedItems.value.clear()
        }
        
        // Handle showcase expansion
        if (index === currentIndex.value && !isShowcaseExpanded.value) {
          isShowcaseExpanded.value = true
        } else {
          isShowcaseExpanded.value = false
          currentIndex.value = index
        }
      }
  
      const handleItemClick = (item, event) => {
        if (event.metaKey || event.ctrlKey) {
          event.stopPropagation()
          if (selectedItems.value.has(item.id)) {
            selectedItems.value.delete(item.id)
          } else {
            selectedItems.value.add(item.id)
          }
        } else {
          if (selectedItems.value.size > 0) {
            selectedItems.value.clear()
          }
          editMoment(item)
        }
      }
  
      const deleteSelectedItems = () => {
        if (selectedItems.value.size === 0) return
        
        const count = selectedItems.value.size
        const itemsToDelete = Array.from(selectedItems.value)
        
        // Remove items
        items.value = items.value.filter(item => !selectedItems.value.has(item.id))
        selectedItems.value.clear()
        
        // Update data
        updateItems()
        
        toast?.value?.show({ 
          msg: `Deleted ${count} moment${count > 1 ? 's' : ''}`, 
          type: 'success' 
        })
      }
  
      // Drag and Drop for reordering
      const handleDragStart = (item, event) => {
        draggedItem.value = item
        isDragging.value = true
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', item.id)
        
        // If dragging a selected item, we'll move all selected items
        if (!selectedItems.value.has(item.id)) {
          selectedItems.value.clear()
          selectedItems.value.add(item.id)
        }
      }
  
      const handleDragEnd = () => {
        isDragging.value = false
        draggedItem.value = null
      }
  
      const handleDragOver = (index, event) => {
        if (!draggedItem.value) return
        event.dataTransfer.dropEffect = 'move'
      }
  
      const handleDrop = (dropIndex) => {
        if (!draggedItem.value) return
        
        const draggedIndex = items.value.findIndex(item => item.id === draggedItem.value.id)
        if (draggedIndex === -1 || draggedIndex === dropIndex) return
        
        // Reorder items
        const newItems = [...items.value]
        const [removed] = newItems.splice(draggedIndex, 1)
        newItems.splice(dropIndex, 0, removed)
        
        items.value = newItems
        updateItems()
        
        toast?.value?.show({ msg: 'Timeline reordered', type: 'success' })
      }
  
      const handleBackgroundClick = () => {
        if (isShowcaseExpanded.value) {
          isShowcaseExpanded.value = false
        }
      }
  
      const setFilter = (filter) => {
        activeFilter.value = filter
        // Reset to first item when filter changes
        currentIndex.value = 0
        isShowcaseExpanded.value = false
      }
  
      const resetView = () => {
        currentIndex.value = 0
        zoom.value = 0
        isShowcaseExpanded.value = false
        activeFilter.value = 'all'
      }
  
      const toggleAutoPlay = () => {
        autoPlay.value = !autoPlay.value
        
        if (autoPlay.value) {
          autoPlayInterval = setInterval(() => {
            if (currentIndex.value < sortedItems.value.length - 1) {
              navigateNext()
            } else {
              currentIndex.value = 0
            }
          }, 3000)
        } else {
          clearInterval(autoPlayInterval)
        }
      }
  
      // Image handling
      const convertImageSrc = (src) => {
        if (!src) return null
        if (src.startsWith('data:')) return src
        if (src.startsWith('http')) return src
        return convertFileSrc(src)
      }
  
      const handleImageError = (e) => {
        e.target.style.display = 'none'
      }
  
      const selectImage = async () => {
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
            const blob = new Blob([imageData])
            const reader = new FileReader()
            
            reader.onloadend = () => {
              momentForm.value.image = reader.result
            }
            
            reader.readAsDataURL(blob)
          }
        } catch (error) {
          console.error('Error selecting image:', error)
          toast?.value?.show({ msg: 'Failed to select image', type: 'error' })
        }
      }
  
      const selectImageForMoment = async (item) => {
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
            const blob = new Blob([imageData])
            const reader = new FileReader()
            
            reader.onloadend = () => {
              item.image = reader.result
              updateItems()
            }
            
            reader.readAsDataURL(blob)
          }
        } catch (error) {
          console.error('Error selecting image:', error)
        }
      }
  
      // Drag and Drop
      const handleDragEnter = (e) => {
        if (e.dataTransfer.types.includes('Files')) {
          isDraggingOver.value = true
        }
      }
  
      const handleFileDrop = async (e) => {
        isDraggingOver.value = false
        
        const files = Array.from(e.dataTransfer.files)
        const imageFiles = files.filter(f => f.type.startsWith('image/'))
        
        if (imageFiles.length === 0) {
          toast?.value?.show({ msg: 'Please drop image files', type: 'error' })
          return
        }
  
        for (const file of imageFiles) {
          const reader = new FileReader()
          
          reader.onloadend = () => {
            const newMoment = {
              id: `moment-${Date.now()}-${Math.random()}`,
              title: file.name.replace(/\.[^/.]+$/, ''),
              date: new Date().toISOString().split('T')[0],
              description: '',
              image: reader.result,
              tags: []
            }
            
            items.value.push(newMoment)
            updateItems()
          }
          
          reader.readAsDataURL(file)
        }
        
        toast?.value?.show({ 
          msg: `Added ${imageFiles.length} moment${imageFiles.length > 1 ? 's' : ''}`, 
          type: 'success' 
        })
      }
  
      // Context Menu
      const showContextMenu = (e) => {
        contextMenuItem.value = null
        contextMenuPosition.value = { x: e.clientX, y: e.clientY }
        contextMenuVisible.value = true
      }
  
      const showItemContextMenu = (e, item) => {
        contextMenuItem.value = item
        contextMenuPosition.value = { x: e.clientX, y: e.clientY }
        contextMenuVisible.value = true
      }
  
      const closeContextMenu = () => {
        contextMenuVisible.value = false
        contextMenuItem.value = null
      }
  
      // Moment CRUD
      const editMoment = (moment) => {
        editingMoment.value = moment
        momentForm.value = {
          title: moment.title,
          date: moment.date,
          description: moment.description || '',
          notes: moment.notes || '',
          image: moment.image,
          tags: [...(moment.tags || [])]
        }
        showAddMomentModal.value = true
      }
  
      const saveMoment = () => {
        if (!momentForm.value.title) return
        
        if (editingMoment.value) {
          // Update existing moment
          const index = items.value.findIndex(m => m.id === editingMoment.value.id)
          if (index !== -1) {
            items.value[index] = {
              ...editingMoment.value,
              ...momentForm.value
            }
          }
        } else {
          // Create new moment
          const newMoment = {
            id: `moment-${Date.now()}`,
            ...momentForm.value
          }
          items.value.push(newMoment)
        }
        
        updateItems()
        closeModal()
        
        toast?.value?.show({ 
          msg: editingMoment.value ? 'Moment updated' : 'Moment created', 
          type: 'success' 
        })
      }
  
      const deleteMoment = (moment) => {
        const index = items.value.findIndex(m => m.id === moment.id)
        if (index !== -1) {
          items.value.splice(index, 1)
          updateItems()
          toast?.value?.show({ msg: 'Moment deleted', type: 'success' })
        }
      }
  
      const updateItems = () => {
        emit('action', { 
          type: 'update-data', 
          data: { items: items.value } 
        })
      }
  
      // Tag management
      const addTag = () => {
        const tag = newTag.value.trim()
        if (tag && !momentForm.value.tags.includes(tag)) {
          momentForm.value.tags.push(tag)
          newTag.value = ''
        }
      }
  
      const removeTag = (index) => {
        momentForm.value.tags.splice(index, 1)
      }
  
      // Modal
      const closeModal = () => {
        showAddMomentModal.value = false
        editingMoment.value = null
        momentForm.value = {
          title: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          notes: '',
          image: null,
          tags: []
        }
        newTag.value = ''
      }
  
      // Update items reference when filter changes
      watch(activeFilter, () => {
        // Update current index to stay on a valid item
        const currentItemId = currentItem.value?.id
        if (currentItemId) {
          const newIndex = filteredItems.value.findIndex(item => item.id === currentItemId)
          currentIndex.value = newIndex >= 0 ? newIndex : 0
        }
      })
  
      // Lifecycle
      onMounted(() => {
        document.addEventListener('keydown', handleKeyboard)
        updateDateTime()
        dateTimeInterval = setInterval(updateDateTime, 1000)
      })
  
      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyboard)
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval)
        }
        if (dateTimeInterval) {
          clearInterval(dateTimeInterval)
        }
      })
  
      return {
        // Refs
        containerRef,
        viewMode,
        currentIndex,
        currentItem,
        zoom,
        autoPlay,
        isDraggingOver,
        showAddMomentModal,
        editingMoment,
        momentForm,
        newTag,
        contextMenuVisible,
        contextMenuItem,
        contextMenuPosition,
        isShowcaseExpanded,
        activeFilter,
        selectedItems,
        isDragging,
        draggedItem,
        
        // Date/Time
        currentDate,
        currentTime,
        updateDateTime,
        
        // Data
        items,
        sortedItems,
        filteredItems,
        uniqueTags,
        getTagCount,
        
        // Methods
        getFanCardStyle,
        formatDate,
        setCurrentIndex,
        navigatePrev,
        navigateNext,
        handleWheel,
        resetView,
        toggleAutoPlay,
        handleImageError,
        convertImageSrc,
        selectImage,
        selectImageForMoment,
        handleDragEnter,
        handleFileDrop,
        showContextMenu,
        showItemContextMenu,
        closeContextMenu,
        editMoment,
        saveMoment,
        deleteMoment,
        addTag,
        removeTag,
        closeModal,
        handleCardClick,
        handleBackgroundClick,
        setFilter,
        handleItemClick,
        deleteSelectedItems,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDrop
      }
    }
  }
  </script>
  
  <style scoped>
  .timeline-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
    overflow: hidden;
  }
  
  /* Header */
  .view-header {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
    z-index: 100;
    position: relative;
  }
  
  .header-content {
    margin-bottom: 20px;
  }
  
  .header-date-time {
    position: absolute;
    top: 24px;
    left: 32px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .view-title {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
    text-align: center;
  }
  
  .view-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
  }
  
  .header-controls {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  
  /* View Switcher */
  .view-switcher {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 4px;
  }
  
  .view-btn {
    padding: 8px 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
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
  
  /* Timeline Controls */
  .timeline-controls {
    display: flex;
    gap: 12px;
    margin-left: auto;
  }
  
  .control-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .control-btn svg {
    width: 18px;
    height: 18px;
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
  
  .action-btn.primary {
    background: white;
    color: black;
  }
  
  .action-btn.primary:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  
  /* Drop Zone Overlay */
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
  
  /* Timeline Container */
  .timeline-container {
    flex: 1;
    overflow: hidden;
    position: relative;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%);
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
  
  /* Stack View (3D Fan Layout) */
  .stack-view {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1000vw;
    transform-style: preserve-3d;
    position: relative;
    overflow: hidden;
  }
  
  .timeline-fan-container {
    position: relative;
    width: 100%;
    height: 70vh;
    transform-style: preserve-3d;
  }
  
  .timeline-card {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-style: preserve-3d;
    transition: transform 0.4s ease, z-index 0.3s ease, box-shadow 0.4s ease;
    cursor: pointer;
    transform-origin: center;
  }
  
  .timeline-card img {
    width: 200px;
    height: 120px;
    object-fit: cover;
    border-radius: 2px;
    display: block;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .timeline-card:hover img {
    transform: scale(1.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  }
  
  .timeline-card.showcase-expanded {
    z-index: 999 !important;
  }
  
  /* Card Placeholder for empty images */
  .timeline-card .card-placeholder {
    width: 200px;
    height: 120px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 2px;
  }
  
  .timeline-card .card-placeholder:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .timeline-card .card-placeholder svg {
    width: 32px;
    height: 32px;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 4px;
  }
  
  .timeline-card .card-placeholder p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }
  
  /* Caption for expanded card */
  .card-caption {
    position: absolute;
    top: calc(100% + 20px);
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    max-width: 300px;
    opacity: 0;
    animation: fadeIn 0.3s ease-out 0.2s forwards;
  }
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
  
  .caption-title {
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  
  .caption-date {
    font-style: italic;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }
  
  .caption-description {
    font-size: 13px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.8);
  }
  
  /* Stack Filters */
  .stack-filters {
    position: fixed;  /* Use fixed positioning */
    right: 20px;
    top: 100px;  /* Position below the header */
    z-index: 100;
    pointer-events: auto;
  }
  
  .stack-filters ul {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 12px;
    line-height: 1.8;
    font-family: 'Courier New', monospace;
    text-align: right;
  }
  
  .stack-filters li {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.15s ease;
    position: relative;
  }
  
  .stack-filters li:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .stack-filters li.active {
    color: white;
    font-weight: 600;
  }
  
  .stack-filters li sup {
    font-size: 10px;
    margin-left: 4px;
    opacity: 0.5;
  }
  
  /* Stack Navigation */
  .stack-navigation {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 24px;
    z-index: 100;
  }
  
  .stack-navigation button {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stack-navigation button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .stack-navigation button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .stack-navigation button svg {
    width: 20px;
    height: 20px;
  }
  
  .nav-indicator {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .timeline-card.selected {
    outline: 2px solid #1db954;
    outline-offset: 2px;
  }
  
  .timeline-card.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }
  
  /* Linear View */
  .linear-view {
    padding: 60px 32px;
    position: relative;
    overflow-y: auto;
  }
  
  .timeline-line {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-50%);
  }
  
  .timeline-item {
    position: relative;
    margin-bottom: 60px;
    display: flex;
    align-items: flex-start;
  }
  
  .item-left {
    justify-content: flex-end;
    padding-right: calc(50% + 40px);
  }
  
  .item-right {
    padding-left: calc(50% + 40px);
  }
  
  .item-marker {
    position: absolute;
    left: 50%;
    top: 20px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 0 4px #000, 0 0 0 6px rgba(255, 255, 255, 0.2);
  }
  
  .item-card {
    max-width: 400px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .item-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  .item-card.selected {
    outline: 2px solid #1db954;
    outline-offset: 2px;
  }
  
  .item-date {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    font-size: 12px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .item-content {
    padding: 16px;
  }
  
  .item-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .item-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .item-title {
    font-size: 18px;
    font-weight: 600;
  }
  
  .item-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
  }
  
  .item-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  
  /* Grid View */
  .grid-view {
    padding: 32px;
    overflow-y: auto;
  }
  
  .timeline-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
  
  .grid-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .grid-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
  }
  
  .grid-item.selected {
    outline: 2px solid #1db954;
    outline-offset: 2px;
  }
  
  .grid-item-image {
    position: relative;
    width: 100%;
    padding-bottom: 60%;
    background: rgba(255, 255, 255, 0.02);
  }
  
  .grid-item-image img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .image-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .image-placeholder:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .image-placeholder svg {
    width: 40px;
    height: 40px;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 8px;
  }
  
  .image-placeholder p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .grid-item-date {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .grid-item-info {
    padding: 20px;
  }
  
  .grid-item-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .grid-item-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }
  
  /* Detail Sidebar */
  .detail-sidebar {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 320px;
    background: rgba(18, 18, 18, 0.95);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    padding: 32px;
    overflow-y: auto;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }
  
  .detail-sidebar h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .detail-sidebar h3 {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 12px;
  }
  
  .detail-date {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 20px;
  }
  
  .detail-description {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 24px;
  }
  
  .detail-notes {
    margin-bottom: 24px;
  }
  
  .detail-notes p {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .detail-tags {
    margin-bottom: 24px;
  }
  
  .tags-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .detail-actions {
    display: flex;
    gap: 12px;
  }
  
  .detail-btn {
    flex: 1;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .detail-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
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
    backdrop-filter: blur(10px);
  }
  
  .modal-content {
    background-color: #181818;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    max-width: 600px;
    width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .moment-modal {
    padding: 32px;
  }
  
  .modal-content h3 {
    margin: 0 0 24px 0;
    color: #fff;
    font-size: 24px;
    font-weight: 700;
  }
  
  .moment-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  /* Image Upload */
  .image-upload-section {
    width: 100%;
  }
  
  .image-preview {
    position: relative;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .image-preview img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .remove-image {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .remove-image:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .remove-image svg {
    width: 16px;
    height: 16px;
  }
  
  .image-upload-zone {
    width: 100%;
    height: 200px;
    background: rgba(255, 255, 255, 0.02);
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .image-upload-zone:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .image-upload-zone svg {
    width: 48px;
    height: 48px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 12px;
  }
  
  .image-upload-zone p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Form Fields */
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-group label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 12px 16px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    transition: all 0.15s ease;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 60px;
  }
  
  /* Tags Input */
  .tags-input {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    min-height: 44px;
    align-items: center;
  }
  
  .tags-input .tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  }
  
  .tags-input .tag svg {
    width: 12px;
    height: 12px;
    opacity: 0.6;
  }
  
  .tags-input .tag:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .tags-input input {
    flex: 1;
    min-width: 100px;
    padding: 4px 8px;
    background: none;
    border: none;
    color: #fff;
    font-size: 14px;
  }
  
  .tags-input input:focus {
    outline: none;
  }
  
  /* Modal Actions */
  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 32px;
  }
  
  .modal-actions button {
    padding: 10px 20px;
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
  
  .save-btn:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  
  /* Scrollbar */
  .linear-view::-webkit-scrollbar,
  .grid-view::-webkit-scrollbar,
  .detail-sidebar::-webkit-scrollbar,
  .modal-content::-webkit-scrollbar {
    width: 12px;
  }
  
  .linear-view::-webkit-scrollbar-track,
  .grid-view::-webkit-scrollbar-track,
  .detail-sidebar::-webkit-scrollbar-track,
  .modal-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .linear-view::-webkit-scrollbar-thumb,
  .grid-view::-webkit-scrollbar-thumb,
  .detail-sidebar::-webkit-scrollbar-thumb,
  .modal-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  
  .linear-view::-webkit-scrollbar-thumb:hover,
  .grid-view::-webkit-scrollbar-thumb:hover,
  .detail-sidebar::-webkit-scrollbar-thumb:hover,
  .modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
    background-clip: padding-box;
  }
  </style>
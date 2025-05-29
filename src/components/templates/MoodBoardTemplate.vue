<template>
    <div class="moodboard-page">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <h1 class="view-title">{{ title || 'Mood Board' }}</h1>
          <p class="view-subtitle">{{ elements.length }} elements</p>
        </div>
        
        <div class="header-controls">
          <div class="zoom-controls">
            <button @click="zoomOut" class="zoom-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H5v-2h14v2z"/>
              </svg>
            </button>
            <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
            <button @click="zoomIn" class="zoom-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
            <button @click="resetView" class="zoom-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
            </button>
          </div>
  
          <div class="tool-controls">
            <button 
              class="tool-btn"
              :class="{ active: currentTool === 'select' }"
              @click="currentTool = 'select'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 17L2 12l1.41-1.41L7 14.17 17.59 3.59 19 5 7 17z"/>
              </svg>
              Select
            </button>
            <button 
              class="tool-btn"
              :class="{ active: currentTool === 'text' }"
              @click="currentTool = 'text'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4v3h5.5v12h3V7H19V4z"/>
              </svg>
              Text
            </button>
            <button 
              class="tool-btn"
              :class="{ active: currentTool === 'draw' }"
              @click="currentTool = 'draw'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Draw
            </button>
          </div>
  
          <div class="header-actions">
            <button 
              v-if="selectedElements.size > 0" 
              class="action-btn ghost"
              @click="deleteSelected"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </button>
            <button 
              class="action-btn ghost"
              @click="saveBoard"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
              </svg>
              Save
            </button>
            <button 
              class="action-btn primary" 
              @click="$emit('action', { type: 'add-element' })"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Element
            </button>
          </div>
        </div>
      </div>
  
      <!-- Canvas Container -->
      <div 
        class="canvas-container"
        ref="containerRef"
        @wheel.prevent="handleWheel"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
      >
        <div 
          class="canvas"
          :style="canvasStyle"
        >
          <!-- Grid -->
          <svg v-if="showGrid" class="canvas-grid" :width="canvasSize" :height="canvasSize">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
  
          <!-- Elements -->
          <div 
            v-for="element in elements" 
            :key="element.id"
            class="board-element"
            :class="{ 
              selected: selectedElements.has(element.id),
              locked: element.locked
            }"
            :style="getElementStyle(element)"
            @mousedown="handleElementMouseDown(element, $event)"
            @click="handleElementClick(element, $event)"
          >
            <!-- Image Element -->
            <img 
              v-if="element.type === 'image'" 
              :src="element.content"
              :alt="element.name"
              :style="{ filter: element.filter }"
            />
            
            <!-- Text Element -->
            <div 
              v-else-if="element.type === 'text'"
              class="text-element"
              :contenteditable="editingElement === element.id"
              @blur="saveTextEdit(element, $event)"
              @keydown.enter.prevent="finishTextEdit"
            >
              {{ element.content }}
            </div>
            
            <!-- Color Element -->
            <div 
              v-else-if="element.type === 'color'"
              class="color-element"
              :style="{ background: element.content }"
            >
              <span class="color-value">{{ element.content }}</span>
            </div>
            
            <!-- Note Element -->
            <div 
              v-else-if="element.type === 'note'"
              class="note-element"
            >
              <div class="note-header">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18v-6c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1zM4 13h16v4H4v-4zm0-7h16v4H4V6z"/>
                </svg>
                {{ element.name }}
              </div>
              <div 
                class="note-content"
                :contenteditable="editingElement === element.id"
                @blur="saveTextEdit(element, $event)"
              >
                {{ element.content }}
              </div>
            </div>
  
            <!-- Resize handles -->
            <div v-if="selectedElements.has(element.id) && !element.locked" class="resize-handles">
              <div 
                v-for="handle in resizeHandles" 
                :key="handle"
                :class="`resize-handle handle-${handle}`"
                @mousedown.stop="startResize(element, handle, $event)"
              ></div>
            </div>
          </div>
  
          <!-- Selection box -->
          <div 
            v-if="isSelecting"
            class="selection-box"
            :style="selectionBoxStyle"
          ></div>
        </div>
  
        <!-- Drop overlay -->
        <div v-if="isDragOver" class="drop-overlay">
          <div class="drop-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <p>Drop images to add to board</p>
          </div>
        </div>
      </div>
  
      <!-- Toolbar -->
      <div class="toolbar">
        <button 
          @click="toggleGrid" 
          class="toolbar-btn"
          :class="{ active: showGrid }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 4v6H2V4h6m8 0v6h-6V4h6m8 0v6h-6V4h6M2 20v-6h6v6H2m8 0v-6h6v6h-6m8 0v-6h6v6h-6M4 6v2h2V6H4m8 0v2h2V6h-2m8 0v2h2V6h-2M4 16v2h2v-2H4m8 0v2h2v-2h-2m8 0v2h2v-2h-2"/>
          </svg>
          Grid
        </button>
        
        <button 
          @click="alignSelected('left')" 
          class="toolbar-btn"
          :disabled="selectedElements.size < 2"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h2v18H3zm4 4h10v2H7zm0 4h14v2H7zm0 4h10v2H7z"/>
          </svg>
          Align Left
        </button>
        
        <button 
          @click="distributeSelected('horizontal')" 
          class="toolbar-btn"
          :disabled="selectedElements.size < 3"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4v16h4V4H4m6 0v16h4V4h-4m6 0v16h4V4h-4z"/>
          </svg>
          Distribute
        </button>
        
        <div class="toolbar-separator"></div>
        
        <input 
          type="color" 
          v-model="backgroundColor"
          class="color-picker"
          @change="updateBackgroundColor"
        >
        
        <button 
          @click="exportBoard" 
          class="toolbar-btn"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-14 9v2h14v-2H5z"/>
          </svg>
          Export
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
  
  export default {
    name: 'MoodBoardTemplate',
    props: {
      title: String,
      initialElements: {
        type: Array,
        default: () => []
      },
      config: {
        type: Object,
        default: () => ({
          canvasSize: 2000,
          gridSize: 20
        })
      }
    },
    emits: ['action'],
    setup(props, { emit }) {
      const containerRef = ref(null)
      const elements = reactive([...props.initialElements])
      const selectedElements = ref(new Set())
      const currentTool = ref('select')
      const editingElement = ref(null)
      const showGrid = ref(true)
      const isDragOver = ref(false)
      const backgroundColor = ref('#000000')
      
      // Canvas state
      const zoom = ref(1)
      const pan = reactive({ x: 0, y: 0 })
      const canvasSize = props.config.canvasSize
      
      // Interaction state
      const isDragging = ref(false)
      const isResizing = ref(false)
      const isPanning = ref(false)
      const isSelecting = ref(false)
      const dragStart = reactive({ x: 0, y: 0 })
      const selectionStart = reactive({ x: 0, y: 0 })
      const selectionEnd = reactive({ x: 0, y: 0 })
      const resizeElement = ref(null)
      const resizeHandle = ref('')
      
      const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
  
      // Computed styles
      const canvasStyle = computed(() => ({
        width: `${canvasSize}px`,
        height: `${canvasSize}px`,
        transform: `scale(${zoom.value}) translate(${pan.x}px, ${pan.y}px)`,
        backgroundColor: backgroundColor.value
      }))
  
      const selectionBoxStyle = computed(() => {
        const x = Math.min(selectionStart.x, selectionEnd.x)
        const y = Math.min(selectionStart.y, selectionEnd.y)
        const width = Math.abs(selectionEnd.x - selectionStart.x)
        const height = Math.abs(selectionEnd.y - selectionStart.y)
        
        return {
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`
        }
      })
  
      // Element styling
      const getElementStyle = (element) => ({
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation || 0}deg)`,
        zIndex: element.zIndex || 1,
        opacity: element.opacity || 1
      })
  
      // Zoom controls
      const zoomIn = () => {
        zoom.value = Math.min(zoom.value * 1.2, 3)
      }
  
      const zoomOut = () => {
        zoom.value = Math.max(zoom.value / 1.2, 0.1)
      }
  
      const resetView = () => {
        zoom.value = 1
        pan.x = 0
        pan.y = 0
      }
  
      const handleWheel = (event) => {
        const delta = event.deltaY > 0 ? 0.9 : 1.1
        zoom.value = Math.max(0.1, Math.min(3, zoom.value * delta))
      }
  
      // Canvas interactions
      const handleCanvasMouseDown = (event) => {
        if (event.target === containerRef.value || event.target.classList.contains('canvas')) {
          if (event.shiftKey) {
            // Start panning
            isPanning.value = true
            dragStart.x = event.clientX - pan.x
            dragStart.y = event.clientY - pan.y
          } else if (currentTool.value === 'select') {
            // Start selection box
            isSelecting.value = true
            const rect = containerRef.value.getBoundingClientRect()
            selectionStart.x = (event.clientX - rect.left) / zoom.value
            selectionStart.y = (event.clientY - rect.top) / zoom.value
            selectionEnd.x = selectionStart.x
            selectionEnd.y = selectionStart.y
          }
        }
      }
  
      const handleCanvasMouseMove = (event) => {
        if (isPanning.value) {
          pan.x = event.clientX - dragStart.x
          pan.y = event.clientY - dragStart.y
        } else if (isSelecting.value) {
          const rect = containerRef.value.getBoundingClientRect()
          selectionEnd.x = (event.clientX - rect.left) / zoom.value
          selectionEnd.y = (event.clientY - rect.top) / zoom.value
          updateSelection()
        } else if (isDragging.value) {
          handleElementDrag(event)
        } else if (isResizing.value) {
          handleElementResize(event)
        }
      }
  
      const handleCanvasMouseUp = () => {
        isPanning.value = false
        isSelecting.value = false
        isDragging.value = false
        isResizing.value = false
        resizeElement.value = null
      }
  
      // Element interactions
      const handleElementClick = (element, event) => {
        if (currentTool.value === 'text' && element.type === 'text') {
          editingElement.value = element.id
          event.target.focus()
        }
      }
  
      const handleElementMouseDown = (element, event) => {
        event.stopPropagation()
        
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const multiSelectKey = isMac ? event.metaKey : event.ctrlKey
        
        if (!multiSelectKey && !selectedElements.value.has(element.id)) {
          selectedElements.value.clear()
        }
        
        if (!selectedElements.value.has(element.id)) {
          selectedElements.value.add(element.id)
        }
        
        isDragging.value = true
        const rect = containerRef.value.getBoundingClientRect()
        dragStart.x = (event.clientX - rect.left) / zoom.value - element.x
        dragStart.y = (event.clientY - rect.top) / zoom.value - element.y
        
        selectedElements.value = new Set(selectedElements.value)
      }
  
      const handleElementDrag = (event) => {
        const rect = containerRef.value.getBoundingClientRect()
        const x = (event.clientX - rect.left) / zoom.value - dragStart.x
        const y = (event.clientY - rect.top) / zoom.value - dragStart.y
        
        selectedElements.value.forEach(id => {
          const element = elements.find(e => e.id === id)
          if (element && !element.locked) {
            element.x = x
            element.y = y
          }
        })
      }
  
      // Resize handling
      const startResize = (element, handle, event) => {
        event.stopPropagation()
        isResizing.value = true
        resizeElement.value = element
        resizeHandle.value = handle
        
        const rect = containerRef.value.getBoundingClientRect()
        dragStart.x = (event.clientX - rect.left) / zoom.value
        dragStart.y = (event.clientY - rect.top) / zoom.value
      }
  
      const handleElementResize = (event) => {
        if (!resizeElement.value) return
        
        const rect = containerRef.value.getBoundingClientRect()
        const currentX = (event.clientX - rect.left) / zoom.value
        const currentY = (event.clientY - rect.top) / zoom.value
        const deltaX = currentX - dragStart.x
        const deltaY = currentY - dragStart.y
        
        const element = resizeElement.value
        const handle = resizeHandle.value
        
        // Update dimensions based on handle
        if (handle.includes('e')) {
          element.width = Math.max(50, element.width + deltaX)
        }
        if (handle.includes('s')) {
          element.height = Math.max(50, element.height + deltaY)
        }
        if (handle.includes('w')) {
          element.width = Math.max(50, element.width - deltaX)
          element.x += deltaX
        }
        if (handle.includes('n')) {
          element.height = Math.max(50, element.height - deltaY)
          element.y += deltaY
        }
        
        dragStart.x = currentX
        dragStart.y = currentY
      }
  
      // Selection box
      const updateSelection = () => {
        const x1 = Math.min(selectionStart.x, selectionEnd.x)
        const y1 = Math.min(selectionStart.y, selectionEnd.y)
        const x2 = Math.max(selectionStart.x, selectionEnd.x)
        const y2 = Math.max(selectionStart.y, selectionEnd.y)
        
        selectedElements.value.clear()
        
        elements.forEach(element => {
          if (element.x >= x1 && element.x + element.width <= x2 &&
              element.y >= y1 && element.y + element.height <= y2) {
            selectedElements.value.add(element.id)
          }
        })
        
        selectedElements.value = new Set(selectedElements.value)
      }
  
      // Text editing
      const saveTextEdit = (element, event) => {
        element.content = event.target.textContent
        editingElement.value = null
      }
  
      const finishTextEdit = () => {
        editingElement.value = null
      }
  
      // Toolbar actions
      const toggleGrid = () => {
        showGrid.value = !showGrid.value
      }
  
      const alignSelected = (direction) => {
        const selected = elements.filter(e => selectedElements.value.has(e.id))
        if (selected.length < 2) return
        
        if (direction === 'left') {
          const minX = Math.min(...selected.map(e => e.x))
          selected.forEach(e => { e.x = minX })
        }
        // Add more alignment options as needed
      }
  
      const distributeSelected = (direction) => {
        const selected = elements.filter(e => selectedElements.value.has(e.id))
        if (selected.length < 3) return
        
        if (direction === 'horizontal') {
          selected.sort((a, b) => a.x - b.x)
          const startX = selected[0].x
          const endX = selected[selected.length - 1].x
          const spacing = (endX - startX) / (selected.length - 1)
          
          selected.forEach((e, i) => {
            e.x = startX + spacing * i
          })
        }
      }
  
      const deleteSelected = () => {
        elements.splice(0, elements.length, 
          ...elements.filter(e => !selectedElements.value.has(e.id))
        )
        selectedElements.value.clear()
      }
  
      const updateBackgroundColor = () => {
        // Background color is reactive
      }
  
      const saveBoard = () => {
        emit('action', { 
          type: 'save-board', 
          data: {
            elements: [...elements],
            backgroundColor: backgroundColor.value,
            zoom: zoom.value,
            pan: { ...pan }
          }
        })
      }
  
      const exportBoard = () => {
        emit('action', { type: 'export-board' })
      }
  
      const handleDrop = (event) => {
        isDragOver.value = false
        const files = Array.from(event.dataTransfer.files)
        
        files.forEach((file, index) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => {
              const element = {
                id: Date.now() + index,
                type: 'image',
                content: e.target.result,
                name: file.name,
                x: 100 + index * 50,
                y: 100 + index * 50,
                width: 300,
                height: 200,
                rotation: 0,
                opacity: 1,
                locked: false
              }
              elements.push(element)
            }
            reader.readAsDataURL(file)
          }
        })
      }
  
      // Keyboard shortcuts
      const handleKeyboard = (event) => {
        if (event.key === 'Delete' && selectedElements.value.size > 0) {
          deleteSelected()
        }
        if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
          event.preventDefault()
          elements.forEach(e => selectedElements.value.add(e.id))
          selectedElements.value = new Set(selectedElements.value)
        }
      }
  
      onMounted(() => {
        document.addEventListener('keydown', handleKeyboard)
      })
  
      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyboard)
      })
  
      return {
        containerRef,
        elements,
        selectedElements,
        currentTool,
        editingElement,
        showGrid,
        isDragOver,
        backgroundColor,
        zoom,
        pan,
        canvasSize,
        isDragging,
        isResizing,
        isPanning,
        isSelecting,
        resizeHandles,
        canvasStyle,
        selectionBoxStyle,
        getElementStyle,
        zoomIn,
        zoomOut,
        resetView,
        handleWheel,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleElementClick,
        handleElementMouseDown,
        startResize,
        saveTextEdit,
        finishTextEdit,
        toggleGrid,
        alignSelected,
        distributeSelected,
        deleteSelected,
        updateBackgroundColor,
        saveBoard,
        exportBoard,
        handleDrop
      }
    }
  }
  </script>
  
  <style scoped>
  .moodboard-page {
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
    gap: 24px;
    align-items: center;
  }
  
  /* Zoom Controls */
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 4px 12px;
  }
  
  .zoom-btn {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .zoom-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
  
  .zoom-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .zoom-level {
    font-size: 14px;
    font-weight: 500;
    min-width: 50px;
    text-align: center;
  }
  
  /* Tool Controls */
  .tool-controls {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 4px;
  }
  
  .tool-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
  }
  
  .tool-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .tool-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .tool-btn svg {
    width: 16px;
    height: 16px;
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
  
  /* Canvas Container */
  .canvas-container {
    flex: 1;
    overflow: hidden;
    position: relative;
    cursor: grab;
    user-select: none;
  }
  
  .canvas-container:active {
    cursor: grabbing;
  }
  
  .canvas {
    position: absolute;
    transform-origin: 0 0;
    transition: background-color 0.3s ease;
  }
  
  /* Canvas Grid */
  .canvas-grid {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
  
  /* Board Elements */
  .board-element {
    position: absolute;
    cursor: move;
    transition: box-shadow 0.15s ease, opacity 0.15s ease;
    user-select: none;
  }
  
  .board-element:hover {
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
  }
  
  .board-element.selected {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
  
  .board-element.locked {
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .board-element img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
  
  /* Text Element */
  .text-element {
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    font-size: 16px;
    line-height: 1.5;
    min-height: 100%;
    white-space: pre-wrap;
  }
  
  .text-element[contenteditable="true"] {
    outline: 2px solid rgba(255, 255, 255, 0.3);
    outline-offset: 2px;
  }
  
  /* Color Element */
  .color-element {
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .color-value {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  /* Note Element */
  .note-element {
    background: rgba(255, 204, 0, 0.1);
    border: 1px solid rgba(255, 204, 0, 0.3);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .note-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 204, 0, 0.1);
    border-bottom: 1px solid rgba(255, 204, 0, 0.2);
    font-size: 14px;
    font-weight: 600;
  }
  
  .note-header svg {
    width: 16px;
    height: 16px;
    color: rgba(255, 204, 0, 0.8);
  }
  
  .note-content {
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
    min-height: 60px;
  }
  
  .note-content[contenteditable="true"] {
    outline: none;
    background: rgba(255, 255, 255, 0.05);
  }
  
  /* Resize Handles */
  .resize-handles {
    position: absolute;
    inset: -4px;
    pointer-events: none;
  }
  
  .resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    pointer-events: all;
    cursor: pointer;
  }
  
  .handle-nw { top: 0; left: 0; cursor: nw-resize; }
  .handle-n { top: 0; left: 50%; transform: translateX(-50%); cursor: n-resize; }
  .handle-ne { top: 0; right: 0; cursor: ne-resize; }
  .handle-e { top: 50%; right: 0; transform: translateY(-50%); cursor: e-resize; }
  .handle-se { bottom: 0; right: 0; cursor: se-resize; }
  .handle-s { bottom: 0; left: 50%; transform: translateX(-50%); cursor: s-resize; }
  .handle-sw { bottom: 0; left: 0; cursor: sw-resize; }
  .handle-w { top: 50%; left: 0; transform: translateY(-50%); cursor: w-resize; }
  
  /* Selection Box */
  .selection-box {
    position: absolute;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
    pointer-events: none;
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
  
  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 32px;
    background: rgba(18, 18, 18, 0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 6px;
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
  
  .toolbar-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .toolbar-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .toolbar-btn.active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .toolbar-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .toolbar-separator {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .color-picker {
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    background: none;
  }
  
  .color-picker::-webkit-color-swatch-wrapper {
    padding: 4px;
  }
  
  .color-picker::-webkit-color-swatch {
    border-radius: 4px;
    border: none;
  }
  </style>
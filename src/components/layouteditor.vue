<template>
    <div v-if="isEnabled" class="layout-editor-overlay">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-section">
          <button @click="toggleEditMode" class="toolbar-button" :class="{ active: editMode }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit Layout
          </button>
          
          <button @click="toggleGrid" class="toolbar-button" :class="{ active: showGrid }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/>
            </svg>
            Grid
          </button>
          
          <button @click="toggleGuides" class="toolbar-button" :class="{ active: showGuides }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,6H3C1.9,6,1,6.9,1,8v8c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V8C23,6.9,22.1,6,21,6z M21,16H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2V16z"/>
            </svg>
            Guides
          </button>
        </div>
        
        <div class="toolbar-section">
          <select v-model="currentView" class="view-selector">
            <option value="home">Home View</option>
            <option value="all">All Elements</option>
          </select>
        </div>
        
        <div class="toolbar-section">
          <button @click="saveLayout" class="toolbar-button primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
            </svg>
            Save
          </button>
          
          <button @click="resetLayout" class="toolbar-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9a9 9 0 0 0-9 9H0l4 4 4-4H5a7 7 0 1 1 7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.896 8.896 0 0 0 12 21a9 9 0 1 0 0-18z"/>
            </svg>
            Reset
          </button>
          
          <button @click="closeEditor" class="toolbar-button danger">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Grid Overlay -->
      <div v-if="showGrid" class="grid-overlay"></div>
      
      <!-- Property Panel -->
      <div v-if="selectedElement" class="property-panel">
        <div class="panel-header">
          <h3>{{ selectedElement.type }}</h3>
          <button @click="selectedElement = null" class="close-panel">×</button>
        </div>
        
        <div class="panel-content">
          <!-- Size Controls -->
          <div class="property-group">
            <h4>Size</h4>
            <div class="property-row">
              <label>
                Width
                <input type="number" v-model.number="selectedElement.styles.width" @input="updateElement">
                <select v-model="selectedElement.styles.widthUnit" @change="updateElement">
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="auto">auto</option>
                </select>
              </label>
              <label>
                Height
                <input type="number" v-model.number="selectedElement.styles.height" @input="updateElement">
                <select v-model="selectedElement.styles.heightUnit" @change="updateElement">
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="auto">auto</option>
                </select>
              </label>
            </div>
          </div>
          
          <!-- Spacing Controls -->
          <div class="property-group">
            <h4>Spacing</h4>
            <div class="spacing-controls">
              <div class="spacing-input">
                <label>Margin</label>
                <div class="spacing-values">
                  <input type="number" v-model.number="selectedElement.styles.marginTop" @input="updateElement" placeholder="T">
                  <input type="number" v-model.number="selectedElement.styles.marginRight" @input="updateElement" placeholder="R">
                  <input type="number" v-model.number="selectedElement.styles.marginBottom" @input="updateElement" placeholder="B">
                  <input type="number" v-model.number="selectedElement.styles.marginLeft" @input="updateElement" placeholder="L">
                </div>
              </div>
              <div class="spacing-input">
                <label>Padding</label>
                <div class="spacing-values">
                  <input type="number" v-model.number="selectedElement.styles.paddingTop" @input="updateElement" placeholder="T">
                  <input type="number" v-model.number="selectedElement.styles.paddingRight" @input="updateElement" placeholder="R">
                  <input type="number" v-model.number="selectedElement.styles.paddingBottom" @input="updateElement" placeholder="B">
                  <input type="number" v-model.number="selectedElement.styles.paddingLeft" @input="updateElement" placeholder="L">
                </div>
              </div>
            </div>
            <label>
              Gap (for flex/grid)
              <input type="range" min="0" max="48" v-model.number="selectedElement.styles.gap" @input="updateElement">
              <span>{{ selectedElement.styles.gap }}px</span>
            </label>
          </div>
          
          <!-- Layout Controls -->
          <div class="property-group">
            <h4>Layout</h4>
            <label>
              Display
              <select v-model="selectedElement.styles.display" @change="updateElement">
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="grid">Grid</option>
                <option value="inline-block">Inline Block</option>
              </select>
            </label>
            
            <div v-if="selectedElement.styles.display === 'flex'">
              <label>
                Direction
                <select v-model="selectedElement.styles.flexDirection" @change="updateElement">
                  <option value="row">Row</option>
                  <option value="column">Column</option>
                  <option value="row-reverse">Row Reverse</option>
                  <option value="column-reverse">Column Reverse</option>
                </select>
              </label>
              <label>
                Justify
                <select v-model="selectedElement.styles.justifyContent" @change="updateElement">
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                </select>
              </label>
              <label>
                Align
                <select v-model="selectedElement.styles.alignItems" @change="updateElement">
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="stretch">Stretch</option>
                </select>
              </label>
            </div>
            
            <div v-if="selectedElement.styles.display === 'grid'">
              <label>
                Columns
                <input type="text" v-model="selectedElement.styles.gridTemplateColumns" @input="updateElement" placeholder="1fr 1fr">
              </label>
              <label>
                Rows
                <input type="text" v-model="selectedElement.styles.gridTemplateRows" @input="updateElement" placeholder="auto">
              </label>
            </div>
          </div>
          
          <!-- Typography (for text elements) -->
          <div v-if="selectedElement.type.includes('text') || selectedElement.type.includes('title')" class="property-group">
            <h4>Typography</h4>
            <label>
              Font Size
              <input type="range" min="10" max="96" v-model.number="selectedElement.styles.fontSize" @input="updateElement">
              <span>{{ selectedElement.styles.fontSize }}px</span>
            </label>
            <label>
              Font Weight
              <select v-model="selectedElement.styles.fontWeight" @change="updateElement">
                <option value="300">Light</option>
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
                <option value="900">Black</option>
              </select>
            </label>
            <label>
              Text Align
              <select v-model="selectedElement.styles.textAlign" @change="updateElement">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Enable Button -->
    <button v-else @click="enableEditor" class="enable-editor-button">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      Layout Editor
    </button>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted, nextTick, inject } from 'vue'
  
  export default {
    name: 'LayoutEditor',
    setup() {
      const isEnabled = ref(false)
      const editMode = ref(false)
      const showGrid = ref(false)
      const showGuides = ref(true)
      const currentView = ref('home')
      const selectedElement = ref(null)
      const elements = ref([])
      const draggedElement = ref(null)
      const resizing = ref(null)
      const showToast = inject('showToast')
      
      // Enable editor overlay on page elements
      const enableEditor = () => {
        isEnabled.value = true
        nextTick(() => {
          makeElementsEditable()
        })
      }
      
      const closeEditor = () => {
        isEnabled.value = false
        removeEditableElements()
      }
      
      const toggleEditMode = () => {
        editMode.value = !editMode.value
        if (editMode.value) {
          makeElementsEditable()
        } else {
          removeEditableElements()
        }
      }
      
      const toggleGrid = () => {
        showGrid.value = !showGrid.value
      }
      
      const toggleGuides = () => {
        showGuides.value = !showGuides.value
      }
      
      const makeElementsEditable = () => {
        // Select all major content sections
        const editableSelectors = [
          '.home-section',
          '.recent-grid',
          '.artists-grid',
          '.actions-grid',
          '.view-header',
          '.section-header',
          '.recent-card',
          '.artist-card',
          '.action-card',
          '.view-title',
          '.view-subtitle',
          '.section-title'
        ]
        
        editableSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            makeElementEditable(el)
          })
        })
      }
      
      const makeElementEditable = (element) => {
        // Add visual indicators
        element.classList.add('editable-element')
        element.style.position = 'relative'
        
        // Create resize handles
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']
        handles.forEach(pos => {
          const handle = document.createElement('div')
          handle.className = `resize-handle resize-${pos}`
          handle.addEventListener('mousedown', (e) => startResize(e, element, pos))
          element.appendChild(handle)
        })
        
        // Add drag functionality
        element.addEventListener('mousedown', startDrag)
        
        // Add click to select
        element.addEventListener('click', (e) => {
          e.stopPropagation()
          selectElement(element)
        })
        
        // Store original styles
        element.dataset.originalStyles = element.getAttribute('style') || ''
      }
      
      const removeEditableElements = () => {
        document.querySelectorAll('.editable-element').forEach(el => {
          el.classList.remove('editable-element')
          
          // Remove resize handles
          el.querySelectorAll('.resize-handle').forEach(handle => handle.remove())
          
          // Remove event listeners
          el.removeEventListener('mousedown', startDrag)
        })
      }
      
      const selectElement = (element) => {
        // Remove previous selection
        document.querySelectorAll('.selected-element').forEach(el => {
          el.classList.remove('selected-element')
        })
        
        // Add selection
        element.classList.add('selected-element')
        
        // Get computed styles
        const computed = window.getComputedStyle(element)
        
        selectedElement.value = {
          element: element,
          type: element.className.split(' ')[0],
          styles: {
            width: parseInt(computed.width),
            height: parseInt(computed.height),
            widthUnit: 'px',
            heightUnit: 'px',
            
            marginTop: parseInt(computed.marginTop) || 0,
            marginRight: parseInt(computed.marginRight) || 0,
            marginBottom: parseInt(computed.marginBottom) || 0,
            marginLeft: parseInt(computed.marginLeft) || 0,
            
            paddingTop: parseInt(computed.paddingTop) || 0,
            paddingRight: parseInt(computed.paddingRight) || 0,
            paddingBottom: parseInt(computed.paddingBottom) || 0,
            paddingLeft: parseInt(computed.paddingLeft) || 0,
            
            gap: parseInt(computed.gap) || 0,
            
            display: computed.display,
            flexDirection: computed.flexDirection,
            justifyContent: computed.justifyContent,
            alignItems: computed.alignItems,
            gridTemplateColumns: computed.gridTemplateColumns,
            gridTemplateRows: computed.gridTemplateRows,
            
            fontSize: parseInt(computed.fontSize) || 16,
            fontWeight: computed.fontWeight,
            textAlign: computed.textAlign
          }
        }
      }
      
      const updateElement = () => {
        if (!selectedElement.value) return
        
        const el = selectedElement.value.element
        const styles = selectedElement.value.styles
        
        // Apply size
        if (styles.widthUnit !== 'auto') {
          el.style.width = styles.width + styles.widthUnit
        }
        if (styles.heightUnit !== 'auto') {
          el.style.height = styles.height + styles.heightUnit
        }
        
        // Apply spacing
        el.style.margin = `${styles.marginTop}px ${styles.marginRight}px ${styles.marginBottom}px ${styles.marginLeft}px`
        el.style.padding = `${styles.paddingTop}px ${styles.paddingRight}px ${styles.paddingBottom}px ${styles.paddingLeft}px`
        
        if (styles.gap) {
          el.style.gap = styles.gap + 'px'
        }
        
        // Apply layout
        el.style.display = styles.display
        if (styles.display === 'flex') {
          el.style.flexDirection = styles.flexDirection
          el.style.justifyContent = styles.justifyContent
          el.style.alignItems = styles.alignItems
        } else if (styles.display === 'grid') {
          el.style.gridTemplateColumns = styles.gridTemplateColumns
          el.style.gridTemplateRows = styles.gridTemplateRows
        }
        
        // Apply typography
        if (styles.fontSize) el.style.fontSize = styles.fontSize + 'px'
        if (styles.fontWeight) el.style.fontWeight = styles.fontWeight
        if (styles.textAlign) el.style.textAlign = styles.textAlign
      }
      
      // Drag functionality
      let dragStartX = 0
      let dragStartY = 0
      let elementStartX = 0
      let elementStartY = 0
      
      const startDrag = (e) => {
        if (e.target.classList.contains('resize-handle')) return
        if (!editMode.value) return
        
        const element = e.currentTarget
        draggedElement.value = element
        
        dragStartX = e.clientX
        dragStartY = e.clientY
        
        const rect = element.getBoundingClientRect()
        elementStartX = rect.left
        elementStartY = rect.top
        
        document.addEventListener('mousemove', drag)
        document.addEventListener('mouseup', stopDrag)
        
        e.preventDefault()
      }
      
      const drag = (e) => {
        if (!draggedElement.value) return
        
        const deltaX = e.clientX - dragStartX
        const deltaY = e.clientY - dragStartY
        
        draggedElement.value.style.transform = `translate(${deltaX}px, ${deltaY}px)`
        
        // Show guides
        if (showGuides.value) {
          showAlignmentGuides(draggedElement.value)
        }
      }
      
      const stopDrag = () => {
        if (draggedElement.value) {
          // Apply the transform to actual position
          const transform = draggedElement.value.style.transform
          draggedElement.value.style.transform = ''
          
          // Convert to margin/position change
          // This is simplified - in production you'd want more sophisticated positioning
        }
        
        draggedElement.value = null
        document.removeEventListener('mousemove', drag)
        document.removeEventListener('mouseup', stopDrag)
      }
      
      // Resize functionality
      const startResize = (e, element, handle) => {
        e.stopPropagation()
        resizing.value = { element, handle }
        
        const rect = element.getBoundingClientRect()
        const startWidth = rect.width
        const startHeight = rect.height
        const startX = e.clientX
        const startY = e.clientY
        
        const resize = (e) => {
          if (!resizing.value) return
          
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY
          
          if (handle.includes('e')) {
            element.style.width = (startWidth + deltaX) + 'px'
          }
          if (handle.includes('w')) {
            element.style.width = (startWidth - deltaX) + 'px'
          }
          if (handle.includes('s')) {
            element.style.height = (startHeight + deltaY) + 'px'
          }
          if (handle.includes('n')) {
            element.style.height = (startHeight - deltaY) + 'px'
          }
          
          // Update selected element styles
          if (selectedElement.value && selectedElement.value.element === element) {
            selectElement(element)
          }
        }
        
        const stopResize = () => {
          resizing.value = null
          document.removeEventListener('mousemove', resize)
          document.removeEventListener('mouseup', stopResize)
        }
        
        document.addEventListener('mousemove', resize)
        document.addEventListener('mouseup', stopResize)
      }
      
      const showAlignmentGuides = (element) => {
        // Simple alignment guides - in production, this would snap to other elements
        const rect = element.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        // You could show visual guide lines here
      }
      
      const saveLayout = async () => {
        const layoutData = {}
        
        document.querySelectorAll('.editable-element').forEach(el => {
          const selector = '.' + el.className.split(' ')[0]
          layoutData[selector] = el.getAttribute('style')
        })
        
        localStorage.setItem('customLayout', JSON.stringify(layoutData))
        showToast({ message: 'Layout saved!', type: 'success' })
      }
      
      const resetLayout = () => {
        if (confirm('Reset all layout changes?')) {
          document.querySelectorAll('.editable-element').forEach(el => {
            el.setAttribute('style', el.dataset.originalStyles || '')
          })
          localStorage.removeItem('customLayout')
        }
      }
      
      // Load saved layout
      onMounted(() => {
        const savedLayout = localStorage.getItem('customLayout')
        if (savedLayout) {
          const layoutData = JSON.parse(savedLayout)
          Object.entries(layoutData).forEach(([selector, styles]) => {
            document.querySelectorAll(selector).forEach(el => {
              el.setAttribute('style', styles)
            })
          })
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
          if (e.metaKey && e.shiftKey && e.key === 'L') {
            isEnabled.value = !isEnabled.value
          }
          
          if (isEnabled.value && selectedElement.value) {
            // Arrow keys for nudging
            if (e.key.startsWith('Arrow')) {
              e.preventDefault()
              const el = selectedElement.value.element
              const step = e.shiftKey ? 10 : 1
              
              switch(e.key) {
                case 'ArrowUp':
                  el.style.marginTop = (parseInt(el.style.marginTop) || 0) - step + 'px'
                  break
                case 'ArrowDown':
                  el.style.marginTop = (parseInt(el.style.marginTop) || 0) + step + 'px'
                  break
                case 'ArrowLeft':
                  el.style.marginLeft = (parseInt(el.style.marginLeft) || 0) - step + 'px'
                  break
                case 'ArrowRight':
                  el.style.marginLeft = (parseInt(el.style.marginLeft) || 0) + step + 'px'
                  break
              }
            }
          }
        })
      })
      
      return {
        isEnabled,
        editMode,
        showGrid,
        showGuides,
        currentView,
        selectedElement,
        enableEditor,
        closeEditor,
        toggleEditMode,
        toggleGrid,
        toggleGuides,
        updateElement,
        saveLayout,
        resetLayout
      }
    }
  }
  </script>
  
  <style>
  /* Global styles for editable elements */
  .editable-element {
    outline: 1px dashed rgba(100, 200, 255, 0.5) !important;
    cursor: move;
    transition: outline 0.2s;
  }
  
  .editable-element:hover {
    outline: 2px solid rgba(100, 200, 255, 0.8) !important;
  }
  
  .selected-element {
    outline: 2px solid #4CAF50 !important;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }
  
  /* Resize handles */
  .resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #4CAF50;
    border: 1px solid #fff;
    border-radius: 2px;
    opacity: 0;
    transition: opacity 0.2s;
    cursor: pointer;
    z-index: 1000;
  }
  
  .editable-element:hover .resize-handle,
  .selected-element .resize-handle {
    opacity: 1;
  }
  
  .resize-nw { top: -5px; left: -5px; cursor: nw-resize; }
  .resize-ne { top: -5px; right: -5px; cursor: ne-resize; }
  .resize-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
  .resize-se { bottom: -5px; right: -5px; cursor: se-resize; }
  .resize-n { top: -5px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
  .resize-s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
  .resize-e { right: -5px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
  .resize-w { left: -5px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
  </style>
  
  <style scoped>
  /* Layout Editor Overlay */
  .layout-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9990;
  }
  
  /* Toolbar */
  .editor-toolbar {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 8px;
    display: flex;
    gap: 16px;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
  }
  
  .toolbar-section {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0 8px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .toolbar-section:last-child {
    border-right: none;
  }
  
  .toolbar-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .toolbar-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .toolbar-button.active {
    background: rgba(76, 175, 80, 0.2);
    border-color: rgba(76, 175, 80, 0.5);
    color: #4CAF50;
  }
  
  .toolbar-button.primary {
    background: #4CAF50;
    color: #fff;
  }
  
  .toolbar-button.primary:hover {
    background: #5CBF60;
  }
  
  .toolbar-button.danger {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }
  
  .toolbar-button.danger:hover {
    background: rgba(244, 67, 54, 0.3);
  }
  
  .toolbar-button svg {
    width: 18px;
    height: 18px;
  }
  
  .view-selector {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    outline: none;
  }
  
  /* Grid Overlay */
  .grid-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255, 255, 255, 0.05) 32px),
      repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255, 255, 255, 0.05) 32px);
    pointer-events: none;
  }
  
  /* Property Panel */
  .property-panel {
    position: fixed;
    top: 100px;
    right: 20px;
    width: 300px;
    max-height: calc(100vh - 120px);
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    pointer-events: auto;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    text-transform: capitalize;
  }
  
  .close-panel {
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .close-panel:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .property-group {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .property-group:last-child {
    border-bottom: none;
  }
  
  .property-group h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .property-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  input[type="number"],
  input[type="text"],
  select {
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    outline: none;
  }
  
  input[type="range"] {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: #4CAF50;
    border-radius: 50%;
    cursor: pointer;
  }
  
  /* Spacing Controls */
  .spacing-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .spacing-input label {
    font-size: 11px;
    margin-bottom: 4px;
  }
  
  .spacing-values {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }
  
  .spacing-values input {
    padding: 4px;
    text-align: center;
    font-size: 11px;
  }
  
  /* Enable Button */
  .enable-editor-button {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    z-index: 9998;
  }
  
  .enable-editor-button:hover {
    background: rgba(40, 40, 40, 0.9);
    transform: translateY(-2px);
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .enable-editor-button svg {
    width: 20px;
    height: 20px;
  }
  
  /* Dark scrollbar for panel */
  .panel-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .panel-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .panel-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  </style>
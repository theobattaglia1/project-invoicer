<!-- src/components/SelectableList.vue -->
<template>
    <div 
      class="selectable-list"
      @click="handleBackgroundClick"
    >
      <div v-if="showHeader" class="list-header">
        <div class="col-check">
          <input 
            type="checkbox" 
            class="select-all-checkbox"
            :checked="selectedItems.length === items.length && items.length > 0"
            :indeterminate="selectedItems.length > 0 && selectedItems.length < items.length"
            @change="selectedItems.length === items.length ? clearSelection() : selectAll()"
          >
        </div>
        <div 
          v-for="column in columns" 
          :key="column.key"
          :class="`col-${column.key}`"
          :style="{ width: column.width }"
        >
          {{ column.label }}
        </div>
      </div>
      
      <div class="list-body">
        <slot 
          v-for="(item, index) in items"
          :key="getItemId(item)"
          name="item"
          :item="item"
          :index="index"
          :isSelected="isSelected(item)"
          :toggleSelection="(event) => toggleSelection(item, index, event)"
          :handleClick="(event) => handleItemClick(item, index, event)"
          :handleDragStart="(event) => handleDragStart(item, index, event)"
          :handleDragEnd="handleDragEnd"
          :handleDragOver="(event) => handleDragOver(index, event)"
          :handleDrop="(event) => handleDrop(index, event)"
          :isDragOver="dragOverIndex === index"
        />
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  import { useSelection } from '@/composables/useSelection'
  import { useDragReorder } from '@/composables/useDragReorder'
  import { useDragDropStore } from '@/store/dragddrop'
  
  export default {
    name: 'SelectableList',
    props: {
      items: {
        type: Array,
        required: true
      },
      getItemId: {
        type: Function,
        default: (item) => item.id
      },
      columns: {
        type: Array,
        default: () => []
      },
      showHeader: {
        type: Boolean,
        default: true
      },
      dragType: {
        type: String,
        default: 'items'
      },
      reorderable: {
        type: Boolean,
        default: false
      },
      onReorder: {
        type: Function,
        default: null
      }
    },
    emits: ['selection-change', 'item-click', 'drag-start', 'drag-end'],
    setup(props, { emit }) {
      const dragStore = useDragDropStore()
      const draggedItem = ref(null)
      
      // Selection composable
      const {
        selectedIds,
        selectedItems,
        isSelected,
        clearSelection,
        toggleSelection,
        selectAll
      } = useSelection(
        computed(() => props.items),
        props.getItemId
      )
      
      // Drag reorder composable
      const {
        draggedIndex,
        dragOverIndex,
        handleDragStart: reorderDragStart,
        handleDragOver: reorderDragOver,
        handleDrop: reorderDrop
      } = useDragReorder(
        computed(() => props.items),
        props.onReorder
      )
      
      const handleItemClick = (item, index, event) => {
        if (event.shiftKey || event.metaKey || event.ctrlKey) {
          toggleSelection(item, index, event)
        } else if (!isSelected(item)) {
          clearSelection()
          toggleSelection(item, index, event)
        }
        emit('item-click', { item, index, event })
      }
      
      const handleBackgroundClick = (event) => {
        if (event.target.classList.contains('selectable-list') || 
            event.target.classList.contains('list-body')) {
          clearSelection()
        }
      }
      
      const handleDragStart = (item, index, event) => {
        draggedItem.value = item
        
        // Check if dragging a selected item
        const itemsToDrag = isSelected(item) ? selectedItems.value : [item]
        
        console.log(`🎯 Dragging ${itemsToDrag.length} ${props.dragType}`)
        
        event.dataTransfer.effectAllowed = props.reorderable ? 'move' : 'copy'
        event.dataTransfer.setData('text/plain', props.dragType)
        event.dataTransfer.setData('application/json', JSON.stringify(itemsToDrag))
        
        dragStore.startDrag(itemsToDrag, props.dragType)
        
        // Custom drag image for multiple items
        if (itemsToDrag.length > 1) {
          const dragImage = document.createElement('div')
          dragImage.className = 'custom-drag-image'
          dragImage.innerHTML = `
            <div class="drag-count">${itemsToDrag.length}</div>
            <div class="drag-label">${props.dragType}</div>
          `
          dragImage.style.position = 'absolute'
          dragImage.style.top = '-1000px'
          document.body.appendChild(dragImage)
          event.dataTransfer.setDragImage(dragImage, 50, 25)
          setTimeout(() => document.body.removeChild(dragImage), 0)
        }
        
        if (props.reorderable) {
          reorderDragStart(index, event, itemsToDrag)
        }
        
        emit('drag-start', { items: itemsToDrag, event })
      }
      
      const handleDragEnd = (event) => {
        draggedItem.value = null
        dragStore.endDrag()
        emit('drag-end', event)
      }
      
      const handleDragOver = (index, event) => {
        if (props.reorderable) {
          reorderDragOver(index, event)
        }
      }
      
      const handleDrop = (index, event) => {
        if (props.reorderable) {
          reorderDrop(index, event, selectedItems.value)
        }
      }
      
      // Keyboard shortcuts
      const handleKeyboard = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
          e.preventDefault()
          selectAll()
        }
        if (e.key === 'Escape') {
          clearSelection()
        }
      }
      
      onMounted(() => {
        document.addEventListener('keydown', handleKeyboard)
      })
      
      onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyboard)
      })
      
      // Watch selection changes
      watch(selectedItems, (newItems) => {
        emit('selection-change', newItems)
      }, { deep: true })
      
      return {
        selectedItems,
        isSelected,
        clearSelection,
        toggleSelection,
        selectAll,
        handleItemClick,
        handleBackgroundClick,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDrop,
        dragOverIndex
      }
    }
  }
  </script>
  
  <style scoped>
  .selectable-list {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .list-header {
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .col-check {
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .select-all-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  .list-body {
    flex: 1;
    overflow-y: auto;
    padding-top: 8px;
  }
  </style>
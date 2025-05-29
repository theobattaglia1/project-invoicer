<template>
  <div class="grid-page">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">{{ title }}</h1>
        <p class="view-subtitle" v-if="subtitle || selectedItems.length > 0">
          {{ selectedItems.length > 0 ? `${selectedItems.length} selected` : subtitle }}
        </p>
      </div>
      
      <div class="header-controls">
        <div v-if="showSearch" class="search-box">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search..."
            class="search-input"
          >
        </div>
        
        <div class="header-actions">
          <button 
            v-if="selectedItems.length > 0" 
            class="action-btn ghost"
            @click="clearSelection"
          >
            Cancel
          </button>
          <slot name="actions" :selectedItems="selectedItems">
            <button class="action-btn primary" @click="$emit('action', { type: 'create' })">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add New
            </button>
          </slot>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div class="items-grid" :style="gridStyle">
      <component
        v-for="(item, index) in filteredItems" 
        :key="item.id || index"
        :is="getCardComponent()"
        :item="item"
        :selected="isSelected(item)"
        :highlighted="highlightedItem?.id === item.id"
        @click="handleItemClick(item, index, $event)"
        @contextmenu.prevent="showContextMenu($event, item)"
        @select="toggleSelection(item, index, $event)"
        @play="$emit('action', { type: 'play', item })"
      />
      
      <!-- Add New Card -->
      <div class="grid-card add-card" @click="$emit('action', { type: 'create' })">
        <div class="card-image">
          <div class="add-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
        </div>
        <div class="card-info">
          <h3 class="card-title">Add New</h3>
          <p class="card-subtitle">Create new {{ cardType || 'item' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue'
// We'll use inline components for now since we don't have the card components yet

export default {
  name: 'GridPageTemplate',
  props: {
    title: String,
    subtitle: String,
    items: Array,
    cardType: String,
    columns: {
      type: String,
      default: 'auto-fill'
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    showSort: {
      type: Boolean,
      default: true
    },
    selectable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['action', 'navigate'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    const selectedIds = ref(new Set())
    const highlightedItem = ref(null)

    const contextMenuRef = inject('contextMenu', null)

    const getCardComponent = () => {
      // For now, return a string that will use the default slot
      return 'div'
    }

    const gridStyle = computed(() => {
      if (props.columns === 'auto-fill') {
        return {
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
        }
      }
      return {
        gridTemplateColumns: `repeat(${props.columns}, 1fr)`
      }
    })

    const filteredItems = computed(() => {
      if (!searchQuery.value) return props.items || []
      
      const query = searchQuery.value.toLowerCase()
      return props.items.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query)
      )
    })

    const selectedItems = computed(() => 
      filteredItems.value.filter(item => selectedIds.value.has(item.id))
    )

    const isSelected = (item) => selectedIds.value.has(item.id)

    const clearSelection = () => {
      selectedIds.value.clear()
      selectedIds.value = new Set(selectedIds.value)
    }

    const toggleSelection = (item, index, event) => {
      if (selectedIds.value.has(item.id)) {
        selectedIds.value.delete(item.id)
      } else {
        selectedIds.value.add(item.id)
      }
      selectedIds.value = new Set(selectedIds.value)
    }

    const handleItemClick = (item, index, event) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const multiSelectKey = isMac ? event.metaKey : event.ctrlKey
      
      if (event.shiftKey || multiSelectKey) {
        toggleSelection(item, index, event)
      } else {
        if (selectedItems.value.length === 0) {
          emit('navigate', { type: props.cardType, id: item.id })
        } else {
          clearSelection()
        }
      }
    }

    const showContextMenu = (event, item) => {
      // Context menu logic
      emit('action', { type: 'contextMenu', event, item })
    }

    return {
      searchQuery,
      selectedIds,
      selectedItems,
      highlightedItem,
      filteredItems,
      gridStyle,
      getCardComponent,
      isSelected,
      clearSelection,
      toggleSelection,
      handleItemClick,
      showContextMenu
    }
  }
}
</script>

<style scoped>
.grid-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: white;
}

/* Header - reused from existing components */
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

.action-btn.ghost {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.action-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Grid */
.items-grid {
  display: grid;
  gap: 24px;
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

/* Add Card */
.add-card {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.15s ease;
  cursor: pointer;
}

.add-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-4px);
}

.add-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.add-placeholder svg {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.3);
}

/* Card styles would be in the individual card components */
.grid-card {
  position: relative;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 16px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* Scrollbar */
.items-grid::-webkit-scrollbar {
  width: 12px;
}

.items-grid::-webkit-scrollbar-track {
  background: transparent;
}

.items-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.items-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}
</style>
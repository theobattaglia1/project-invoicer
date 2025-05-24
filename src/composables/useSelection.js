// src/composables/useSelection.js
import { ref, computed } from 'vue'

export function useSelection(items, getItemId) {
  const selectedIds = ref(new Set())
  const lastSelectedIndex = ref(-1)
  const isSelecting = ref(false)

  const selectedItems = computed(() => 
    items.value.filter(item => selectedIds.value.has(getItemId(item)))
  )

  const isSelected = (item) => selectedIds.value.has(getItemId(item))

  const clearSelection = () => {
    selectedIds.value.clear()
    lastSelectedIndex.value = -1
  }

  const toggleSelection = (item, index, event) => {
    const id = getItemId(item)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const multiSelectKey = isMac ? event.metaKey : event.ctrlKey

    if (event.shiftKey && lastSelectedIndex.value !== -1) {
      // Range select
      const start = Math.min(lastSelectedIndex.value, index)
      const end = Math.max(lastSelectedIndex.value, index)
      
      if (!multiSelectKey) {
        selectedIds.value.clear()
      }
      
      for (let i = start; i <= end; i++) {
        selectedIds.value.add(getItemId(items.value[i]))
      }
    } else if (multiSelectKey) {
      // Toggle single selection
      if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id)
      } else {
        selectedIds.value.add(id)
      }
      lastSelectedIndex.value = index
    } else {
      // Single selection
      selectedIds.value.clear()
      selectedIds.value.add(id)
      lastSelectedIndex.value = index
    }

    // Force reactivity
    selectedIds.value = new Set(selectedIds.value)
  }

  const selectAll = () => {
    items.value.forEach(item => selectedIds.value.add(getItemId(item)))
    selectedIds.value = new Set(selectedIds.value)
  }

  return {
    selectedIds,
    selectedItems,
    isSelected,
    clearSelection,
    toggleSelection,
    selectAll,
    isSelecting
  }
}
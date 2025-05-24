// src/composables/useDragReorder.js
import { ref } from 'vue'

export function useDragReorder(items, onReorder) {
  const draggedIndex = ref(-1)
  const dragOverIndex = ref(-1)
  const isDraggingMultiple = ref(false)

  const handleDragStart = (index, event, selectedItems = null) => {
    draggedIndex.value = index
    isDraggingMultiple.value = selectedItems && selectedItems.length > 1
    
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', 'reorder')
    
    // Add drag image for multiple items
    if (isDraggingMultiple.value) {
      const dragImage = document.createElement('div')
      dragImage.className = 'drag-image-multiple'
      dragImage.textContent = `${selectedItems.length} items`
      dragImage.style.position = 'absolute'
      dragImage.style.top = '-1000px'
      document.body.appendChild(dragImage)
      event.dataTransfer.setDragImage(dragImage, 0, 0)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
  }

  const handleDragOver = (index, event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    dragOverIndex.value = index
  }

  const handleDrop = (index, event, selectedItems = null) => {
    event.preventDefault()
    
    if (draggedIndex.value === -1) return
    
    const newItems = [...items.value]
    
    if (isDraggingMultiple.value && selectedItems) {
      // Handle multiple items reorder
      const itemsToMove = selectedItems.map(item => {
        const idx = newItems.findIndex(i => i.id === item.id)
        return { item, index: idx }
      }).sort((a, b) => b.index - a.index)
      
      // Remove items from their original positions
      itemsToMove.forEach(({ index }) => {
        newItems.splice(index, 1)
      })
      
      // Insert at new position
      const insertIndex = index > draggedIndex.value ? index - itemsToMove.length : index
      itemsToMove.reverse().forEach(({ item }) => {
        newItems.splice(insertIndex, 0, item)
      })
    } else {
      // Single item reorder
      const [movedItem] = newItems.splice(draggedIndex.value, 1)
      newItems.splice(index, 0, movedItem)
    }
    
    onReorder(newItems)
    resetDrag()
  }

  const resetDrag = () => {
    draggedIndex.value = -1
    dragOverIndex.value = -1
    isDraggingMultiple.value = false
  }

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragLeave: resetDrag
  }
}
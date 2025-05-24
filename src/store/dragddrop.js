import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDragDropStore = defineStore('dragdrop', () => {
  const draggedItem = ref(null)
  const dragType = ref(null) // 'song', 'file', etc.
  
  const startDrag = (item, type) => {
    draggedItem.value = item
    dragType.value = type
  }
  
  const endDrag = () => {
    draggedItem.value = null
    dragType.value = null
  }
  
  const getDraggedItem = () => draggedItem.value
  
  return {
    draggedItem,
    dragType,
    startDrag,
    endDrag,
    getDraggedItem
  }
})
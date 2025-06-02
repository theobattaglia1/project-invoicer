// src/store/dragdrop.js

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * This store holds transient drag state.
 * It’s currently still available, but we primarily rely on dataTransfer payloads now.
 * You can safely leave as-is or remove/rename methods when you fully migrate off it.
 */
export const useDragDropStore = defineStore('dragdrop', () => {
  // The item that is currently being dragged (e.g. a song object, a page object, etc.)
  const draggedItem = ref(null)

  // A string indicating the type of drag (e.g. 'song', 'file', etc.)
  const dragType = ref(null)

  /**
   * Optionally set the dragged item and its type.
   * In new flow, we prefer using dataTransfer instead of storing payload here.
   */
  const startDrag = (item, type) => {
    draggedItem.value = item
    dragType.value = type
  }

  /**
   * Clear out any stored draggedItem/dragType.
   */
  const endDrag = () => {
    draggedItem.value = null
    dragType.value = null
  }

  /**
   * Getter for whatever was set via startDrag().
   * In the new code path, you likely won’t call this anymore.
   */
  const getDraggedItem = () => draggedItem.value

  return {
    draggedItem,
    dragType,
    startDrag,
    endDrag,
    getDraggedItem
  }
})

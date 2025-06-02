// File: src/composables/useFolderDragDrop.js
import { ref, computed, reactive } from 'vue'
import { useDragDropStore } from '@/store/dragdrop'
import { useToastStore } from '@/store/toast'

export function useFolderDragDrop() {
  const dragStore = useDragDropStore()
  const toastStore = useToastStore()

  const draggedItems = ref([])
  const draggedType = ref(null)
  const dragSource = ref(null)
  const dropZones = reactive(new Map())
  const isDragging = ref(false)

  // ────────────────
  // Register drop zone
  // ────────────────
  const registerDropZone = (id, element, type, data = {}) => {
    dropZones.set(id, { element, type, data })

    element.setAttribute('data-drop-zone', id)
    element.setAttribute('data-drop-type', type)

    return () => {
      dropZones.delete(id)
      element.removeAttribute('data-drop-zone')
      element.removeAttribute('data-drop-type')
    }
  }

  // ────────────────
  // Drag Start
  // ────────────────
  const startDrag = (event) => {
    const payload = event.target.__vueParentComponent?.props?.node
    if (!payload) return

    draggedItems.value = [payload]
    draggedType.value = payload.type
    dragSource.value = payload
    isDragging.value = true

    dragStore.startDrag(payload, payload.type)

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${payload.type}:${payload.id}`)

    createDragImage(event, payload)
    document.body.classList.add('is-dragging')
  }

  const createDragImage = (event, item) => {
    const ghost = document.createElement('div')
    ghost.className = 'custom-drag-image'
    ghost.innerHTML = `
      <div class="drag-count">1</div>
      <div class="drag-label">${item.title || item.name}</div>
    `
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, 20, 20)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  // ────────────────
  // Drop Handler
  // ────────────────
  const handleDrop = async (event, targetId) => {
    event.preventDefault()
    const zone = dropZones.get(targetId)
    if (!zone) return

    // Basic guardrails
    const target = zone.data
    const source = draggedItems.value[0]
    if (!source || !target || source.id === target.id) return

    // Prevent folder→descendant drops (circular)
    if (draggedType.value === 'folder' && isDescendant(target.id, source.id)) {
      toastStore.push({ msg: 'Cannot drop folder into its own child', type: 'error' })
      endDrag()
      return
    }

    // Emit global move event
    window.dispatchEvent(new CustomEvent('move-items', {
      detail: {
        items: draggedItems.value,
        itemType: draggedType.value,
        source,
        target
      }
    }))

    toastStore.push({ msg: `Moved to ${target.title}`, type: 'success' })
    endDrag()
  }

  const isDescendant = (targetId, sourceId) => {
    // Replace with actual recursive check using your unified tree if needed
    return false
  }

  const endDrag = () => {
    draggedItems.value = []
    draggedType.value = null
    dragSource.value = null
    isDragging.value = false
    document.body.classList.remove('is-dragging')
    dragStore.endDrag()
  }

  return {
    isDragging: computed(() => isDragging.value),
    registerDropZone,
    startDrag,
    handleDrop,
    endDrag
  }
}

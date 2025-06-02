<!-- File: src/components/ContextMenu.vue -->
<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="absolute bg-zinc-900 text-white text-sm rounded shadow-xl z-50 border border-white/10 w-48 overflow-hidden"
      :style="{ top: `${position.y}px`, left: `${position.x}px` }"
      role="menu"
      ref="menuEl"
      @keydown.esc="close"
    >
      <div
        v-for="(action, index) in visibleActions"
        :key="index"
        class="px-3 py-2 hover:bg-white/10 cursor-pointer select-none transition"
        role="menuitem"
        @click="handleAction(action)"
      >
        {{ action.label }}
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { useTreeStore } from '@/store/tree'

// These are pulled in by the composable; you might or might not actually use all of them.
const {
  handleEditMetadata,
  handleDelete,
  handleDuplicate,
  handleEditSmartFolder,
  handleEditTags,
  handleCopyPath,
  handleTogglePin
} = useContextMenu()

const tree = useTreeStore()

const visible = ref(false)
const position = ref({ x: 0, y: 0 })
const currentItem = ref(null)
const menuEl = ref(null)

const protectedIds = new Set([
  'section-songs',
  'section-artists',
  'section-playlists'
])

const baseActionMap = {
  song: [
    { label: 'Edit Metadata', action: 'edit' },
    { label: 'Delete', action: 'delete' },
    { label: 'Copy Path', action: 'copyPath' }
  ],
  playlist: [
    { label: 'Edit Metadata', action: 'edit' },
    { label: 'Delete', action: 'delete' }
  ],
  artist: [
    { label: 'Edit Metadata', action: 'edit' },
    { label: 'Delete', action: 'delete' }
  ],
  folder: [
    { label: 'Rename', action: 'rename' },
    { label: 'Duplicate', action: 'duplicate' },
    { label: '🏷 Edit Tags', action: 'tags' },
    { label: '📌 Pin/Unpin', action: 'pin-toggle' },
    { label: 'Delete', action: 'delete' }
  ],
  page: [
    { label: 'Rename', action: 'rename' },
    { label: 'Duplicate', action: 'duplicate' },
    { label: '🏷 Edit Tags', action: 'tags' },
    { label: '📌 Pin/Unpin', action: 'pin-toggle' },
    { label: 'Delete', action: 'delete' }
  ],
  'smart-folder': [
    { label: '✏️ Edit Smart Query', action: 'editSmart' },
    { label: 'Delete', action: 'delete' }
  ]
}

const visibleActions = computed(() => {
  const item = currentItem.value
  if (!item || protectedIds.has(item.id)) return []
  const actions = baseActionMap[item.type] || []

  return actions.map(action => {
    if (action.action === 'pin-toggle') {
      return {
        label: item.pinned ? '📍 Unpin' : '📌 Pin',
        action: 'pin-toggle'
      }
    }
    return action
  })
})

/** 
 * Publicly-callable “show” function. 
 *  - Expects payload: { node, position }
 *    where node is the tree-node we right-clicked on, 
 *    and position is {x, y} screen-coordinates.
 */
const open = (payload) => {
  if (!payload?.node) return
  currentItem.value = payload.node
  position.value = payload.position || { x: 0, y: 0 }
  visible.value = true
}

const close = () => {
  visible.value = false
  currentItem.value = null
}

const handleAction = (action) => {
  const item = currentItem.value
  const type = item.type
  close()

  switch (action.action) {
    case 'edit':
      handleEditMetadata([item], type)
      break
    case 'delete':
      handleDelete([item], type)
      break
    case 'duplicate':
      handleDuplicate(item)
      break
    case 'rename':
      {
        const newName = prompt('Rename to:', item.title || item.name)
        if (newName && newName !== item.title) {
          tree.updateNode(item.id, { title: newName })
        }
      }
      break
    case 'copyPath':
      handleCopyPath(item)
      break
    case 'editSmart':
      handleEditSmartFolder(item)
      break
    case 'tags':
      handleEditTags(item)
      break
    case 'pin-toggle':
      handleTogglePin(item)
      break
  }
}

onMounted(() => {
  window.addEventListener('open-context-menu', (e) => open(e.detail))
  document.addEventListener('click', close)
})

onUnmounted(() => {
  window.removeEventListener('open-context-menu', open)
  document.removeEventListener('click', close)
})

// ⚠️ The critical piece: make sure “open” (and “close”) are exposed, so
//    `contextMenuRef.value.show(...)` actually resolves to this “open” function:
defineExpose({ show: open, close })
</script>


<style scoped>
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
}

.context-menu {
  position: absolute;
  min-width: 240px;
  background: rgba(20, 20, 23, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
  overflow: hidden;
}

.context-menu-header {
  padding: 8px 12px;
  font-weight: 600;
  opacity: 0.7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
}

.context-menu-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 8px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  gap: 12px;
  background: none;
  border: none;
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  position: relative;
}

.context-menu-item:hover { 
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.with-submenu:hover {
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.destructive { 
  color: #ff6b6b;
}

.context-menu-item.destructive:hover {
  background: rgba(255, 107, 107, 0.1);
}

/* Playlist submenu */
.playlist-submenu {
  position: absolute;
  top: -4px;
  left: calc(100% + 4px);
  background: rgba(20, 20, 23, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 10001;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: left;
  transition: all 0.15s ease;
}

.playlist-item:hover { 
  background: rgba(255, 255, 255, 0.08);
}

.playlist-item.new {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 4px;
  padding-top: 12px;
  color: #4ECDC4;
}

.playlist-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Scrollbar */
.playlist-submenu::-webkit-scrollbar {
  width: 6px;
}

.playlist-submenu::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-submenu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.playlist-submenu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
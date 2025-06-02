// File: src/composables/useContextMenu.js
import { inject } from 'vue'
import { useToastStore } from '@/store/toast'
import { useMusicStore } from '@/store/music'
import { useTreeStore } from '@/store/tree'
import { invoke } from '@tauri-apps/api/tauri'
import { writeText } from '@tauri-apps/api/clipboard'

let contextMenuInstance = null
let metadataEditorInstance = null

export function registerContextMenu(instance) {
  contextMenuInstance = instance
}

export function registerMetadataEditor(instance) {
  metadataEditorInstance = instance
}

export function useContextMenu() {
  const toast = useToastStore()
  const musicStore = useMusicStore()
  const treeStore = useTreeStore()
  const metadataEditor = inject('metadataEditor', null)

  const handleEditMetadata = (items, type) => {
    const editor = metadataEditor?.value || metadataEditor || metadataEditorInstance
    if (editor?.show) {
      editor.show({
        mode: 'edit',
        type,
        items: Array.isArray(items) ? items : [items]
      })
    } else {
      toast.push({ msg: 'Metadata editor not available', type: 'error' })
    }
  }

  const handleDelete = async (items, type) => {
    const count = items.length
    const plural = count > 1 ? 's' : ''
    const confirmed = confirm(`Are you sure you want to delete ${count} ${type}${plural}?`)
    if (!confirmed) return

    try {
      const deletable = ['folder', 'page', 'smart-folder']
      if (deletable.includes(type)) {
        for (const item of items) {
          treeStore.deleteNode(item.id)
        }

        toast.push({
          msg: `Deleted ${count} ${type}${plural}`,
          type: 'success',
          action: {
            label: 'Undo',
            handler: () => treeStore.undo()
          }
        })
      } else {
        for (const item of items) {
          if (type === 'song') {
            await invoke('delete_song', { song_id: item.id })
          } else if (type === 'playlist') {
            await invoke('delete_playlist', { playlistId: item.id })
          } else if (type === 'artist') {
            await invoke('delete_artist', { artist_id: item.id })
          }
        }

        toast.push({ msg: `Deleted ${count} ${type}${plural}`, type: 'success' })
        await musicStore.refreshLibrary()
      }
    } catch (err) {
      toast.push({ msg: `Failed to delete ${type}${plural}`, type: 'error' })
    }
  }

  const handleDuplicate = (item) => {
    const cloneTree = (sourceId, parentId = null) => {
      const original = treeStore.findNode(sourceId)
      if (!original) return null

      const cloneId = `${original.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const copy = {
        ...original,
        id: cloneId,
        title: `Copy of ${original.title}`,
        parentId
      }

      treeStore.nodes.push(copy)

      const children = treeStore.getChildren(original.id)
      for (const child of children) {
        cloneTree(child.id, cloneId)
      }

      return copy
    }

    cloneTree(item.id, item.parentId)
    treeStore.save()
    toast.push({ msg: `Duplicated "${item.title}"`, type: 'success' })
  }

  const handleEditSmartFolder = (item) => {
    const current = item.config?.query || ''
    const input = prompt('Edit smart folder query:', current)
    if (!input) return
    treeStore.updateNode(item.id, {
      title: `Smart: "${input}"`,
      config: { ...item.config, query: input.trim() }
    })
    toast.push({ msg: 'Smart folder updated', type: 'success' })
  }

  const handleEditTags = (item) => {
    const current = (item.tags || []).join(', ')
    const input = prompt('Enter comma-separated tags:', current)
    if (input === null) return
    const tags = input
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    treeStore.updateNode(item.id, { tags })
    toast.push({ msg: 'Tags updated', type: 'success' })
  }

  const handleCopyPath = async (item) => {
    try {
      if (item.file_path || item.path) {
        await writeText(item.file_path || item.path)
        toast.push({ msg: 'File path copied to clipboard', type: 'success' })
      } else {
        toast.push({ msg: 'No file path available', type: 'error' })
      }
    } catch (error) {
      toast.push({ msg: 'Failed to copy file path', type: 'error' })
    }
  }

  const handleTogglePin = (item) => {
    const newState = !item.pinned
    treeStore.updateNode(item.id, { pinned: newState })
    toast.push({ msg: newState ? 'Pinned' : 'Unpinned', type: 'success' })
  }

  return {
    handleEditMetadata,
    handleDelete,
    handleDuplicate,
    handleEditSmartFolder,
    handleEditTags,
    handleCopyPath,
    handleTogglePin
  }
}

// File: src/store/tree.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTreeStore = defineStore('tree', () => {
  const nodes = ref([])
  const expanded = ref(new Set())
  const version = 2

  const undoStack = ref([])
  const redoStack = ref([])

  const load = () => {
    try {
      const raw = localStorage.getItem('treeData')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        nodes.value = flattenLegacyTree(parsed)
      } else if (parsed.version === 2) {
        nodes.value = parsed.nodes || []
        expanded.value = new Set(parsed.expanded || [])
      }
    } catch (e) {
      console.error('Failed to load tree:', e)
    }
  }

  const save = () => {
    localStorage.setItem('treeData', JSON.stringify({
      version,
      nodes: nodes.value,
      expanded: [...expanded.value]
    }))
  }

  const createNode = (type, title = '', parentId = null, options = {}) => {
    const node = {
      id: options.id || `${type}-${Date.now()}`,
      type,
      title: title || `Untitled ${type}`,
      parentId,
      data: options.data || {},
      config: options.config || {},
      tags: options.tags || [],
      pinned: options.pinned || false,
      createdAt: new Date().toISOString()
    }
    nodes.value.push(node)
    pushUndo({ type: 'create', node })
    save()
    return node
  }

  const updateNode = (id, updates) => {
    const node = findNode(id)
    if (node) {
      const prev = { ...node }
      Object.assign(node, updates)
      pushUndo({ type: 'update', before: prev, after: { ...node } })
      save()
    }
  }

  const deleteNode = (id) => {
    const toRemove = []
    const gather = (nid) => {
      const n = findNode(nid)
      if (n) {
        toRemove.push({ ...n })
        getChildren(nid).forEach(child => gather(child.id))
      }
    }
    gather(id)
    nodes.value = nodes.value.filter(n => !toRemove.some(d => d.id === n.id))
    pushUndo({ type: 'delete', nodes: toRemove })
    save()
  }

  const undo = () => {
    const action = undoStack.value.pop()
    if (!action) return
    switch (action.type) {
      case 'delete': nodes.value.push(...action.nodes); break
      case 'update': {
        const i = nodes.value.findIndex(n => n.id === action.before.id)
        if (i !== -1) nodes.value[i] = action.before
        break
      }
      case 'create':
        nodes.value = nodes.value.filter(n => n.id !== action.node.id)
        break
    }
    redoStack.value.push(action)
    save()
  }

  const redo = () => {
    const action = redoStack.value.pop()
    if (!action) return
    switch (action.type) {
      case 'delete':
        nodes.value = nodes.value.filter(n => !action.nodes.some(d => d.id === n.id))
        break
      case 'update': {
        const i = nodes.value.findIndex(n => n.id === action.after.id)
        if (i !== -1) nodes.value[i] = action.after
        break
      }
      case 'create':
        nodes.value.push(action.node)
        break
    }
    undoStack.value.push(action)
    save()
  }

  const pushUndo = (action) => {
    undoStack.value.push(action)
    redoStack.value = []
  }

  const findNode = (id) => nodes.value.find(n => n.id === id)
  const getChildren = (parentId) => nodes.value.filter(n => n.parentId === parentId)

  const toggleExpanded = (id) => {
    expanded.value.has(id) ? expanded.value.delete(id) : expanded.value.add(id)
    save()
  }

  const isExpanded = (id) => expanded.value.has(id)

  const getSmartFolderResults = (node) => {
    if (!node || node.type !== 'smart-folder') return []
    const { query = '', filterBy = 'title' } = node.config || {}
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return nodes.value.filter(n => {
      if (filterBy === 'title') {
        return n.type === 'page' && n.title?.toLowerCase().includes(q)
      }
      if (filterBy === 'tag') {
        const tags = n.tags || []
        return tags.some(t => t.toLowerCase().includes(q))
      }
      return false
    })
  }

  const flattenLegacyTree = (legacyNodes, parentId = null) => {
    const flat = []
    for (const node of legacyNodes) {
      const flatNode = {
        id: node.id,
        type: node.type,
        title: node.label || node.title || 'Untitled',
        parentId,
        data: node.data || {},
        config: node.config || {},
        tags: node.tags || [],
        pinned: node.pinned || false,
        createdAt: node.createdAt || new Date().toISOString()
      }
      flat.push(flatNode)
      if (Array.isArray(node.children)) {
        flat.push(...flattenLegacyTree(node.children, node.id))
      }
    }
    return flat
  }

  const exportTree = () => {
    return JSON.stringify({
      version,
      nodes: nodes.value,
      expanded: [...expanded.value]
    }, null, 2)
  }

  const importTree = (json) => {
    try {
      const parsed = JSON.parse(json)
      if (parsed && Array.isArray(parsed.nodes)) {
        nodes.value = parsed.nodes
        expanded.value = new Set(parsed.expanded || [])
        save()
      }
    } catch (e) {
      console.error('Invalid tree import:', e)
    }
  }

  return {
    nodes,
    expanded,
    load,
    save,
    createNode,
    updateNode,
    deleteNode,
    findNode,
    getChildren,
    toggleExpanded,
    isExpanded,
    undo,
    redo,
    getSmartFolderResults,
    exportTree,
    importTree
  }
})

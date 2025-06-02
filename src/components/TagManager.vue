<!-- File: src/components/TagManager.vue -->
<template>
    <div class="p-6 text-white space-y-4">
      <h1 class="text-xl font-bold">Tags</h1>
  
      <div v-if="allTags.length === 0" class="text-white/50">
        No tags yet.
      </div>
  
      <div class="space-y-2">
        <div
          v-for="tag in allTags"
          :key="tag"
          class="flex items-center justify-between border border-white/10 rounded px-3 py-2 bg-white/5"
        >
          <span class="text-sm">{{ tag }}</span>
  
          <div class="flex gap-2 text-xs">
            <button @click="renameTag(tag)">Rename</button>
            <button @click="deleteTag(tag)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useTreeStore } from '@/store/tree'
  import { useToastStore } from '@/store/toast'
  
  const tree = useTreeStore()
  const toast = useToastStore()
  
  const allTags = computed(() => {
    const tags = new Set()
    tree.nodes.forEach(n => {
      (n.tags || []).forEach(t => tags.add(t))
    })
    return Array.from(tags).sort()
  })
  
  const renameTag = (oldTag) => {
    const newTag = prompt(`Rename "${oldTag}" to:`, oldTag)
    if (!newTag || newTag === oldTag) return
  
    for (const node of tree.nodes) {
      if (Array.isArray(node.tags)) {
        const updated = node.tags.map(t => (t === oldTag ? newTag : t))
        tree.updateNode(node.id, { tags: updated })
      }
    }
  
    toast.push({ msg: `Tag renamed to "${newTag}"`, type: 'success' })
  }
  
  const deleteTag = (tagToRemove) => {
    const confirmed = confirm(`Delete tag "${tagToRemove}" from all items?`)
    if (!confirmed) return
  
    for (const node of tree.nodes) {
      if (Array.isArray(node.tags)) {
        const updated = node.tags.filter(t => t !== tagToRemove)
        tree.updateNode(node.id, { tags: updated })
      }
    }
  
    toast.push({ msg: `Tag "${tagToRemove}" deleted`, type: 'success' })
  }
  </script>
  
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Pinia toast store
 *   queue : reactive array [{ id, msg, type, action? }]
 *   push  : add a toast and auto-remove after ms
 *   remove: remove by id (used by close button)
 */
export const useToastStore = defineStore('toast', () => {
  const queue = ref([])

  function push (msg, type = 'info', ms = 3000, action = null) {
    const id = crypto.randomUUID()
    queue.value.push({ id, msg, type, action })

    // auto dismiss
    if (ms > 0) setTimeout(() => remove(id), ms)
  }

  function remove (id) {
    queue.value = queue.value.filter(t => t.id !== id)
  }

  return { queue, push, remove }
})

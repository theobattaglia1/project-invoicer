// In your toast store (e.g., store/toast.js)
import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    queue: []
  }),
  
  actions: {
    push({ msg, type = 'info', duration = 2000, action = null }) {
      const id = Date.now() + Math.random()
      
      this.queue.push({
        id,
        msg,
        type,
        duration, // Default 2 seconds, much shorter
        action,
        timestamp: Date.now()
      })
      
      // Limit queue size to prevent clutter
      if (this.queue.length > 3) {
        this.queue.shift()
      }
      
      return id
    },
    
    remove(id) {
      const index = this.queue.findIndex(t => t.id === id)
      if (index > -1) {
        this.queue.splice(index, 1)
      }
    },
    
    clear() {
      this.queue = []
    }
  }
})
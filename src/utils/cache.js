// src/utils/cache.js

class CacheManager {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  // Set cache with TTL (time to live)
  set(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Set new value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })

    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key)
      }, ttl)
      this.timers.set(key, timer)
    }
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if expired
    if (item.ttl > 0 && Date.now() - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }

    return item.value
  }

  has(key) {
    return this.get(key) !== null
  }

  delete(key) {
    // Clear timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    return this.cache.delete(key)
  }

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  // Get cache size
  size() {
    return this.cache.size
  }

  // Prune expired items
  prune() {
    const now = Date.now()
    const keysToDelete = []

    this.cache.forEach((item, key) => {
      if (item.ttl > 0 && now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.delete(key))
    return keysToDelete.length
  }
}

// Create singleton instance
export const cache = new CacheManager()

// Cache key generators
export const cacheKeys = {
  // Artist cache keys
  artistList: () => 'artists:list',
  artistById: (id) => `artists:${id}`,
  artistProjects: (artistId) => `artists:${artistId}:projects`,
  artistInvoices: (artistId) => `artists:${artistId}:invoices`,
  
  // Project cache keys
  projectList: (filters = {}) => {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':')
    return `projects:list:${filterStr || 'all'}`
  },
  projectById: (id) => `projects:${id}`,
  
  // Invoice cache keys
  invoiceList: (filters = {}) => {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':')
    return `invoices:list:${filterStr || 'all'}`
  },
  invoiceById: (id) => `invoices:${id}`,
  
  // Budget cache keys
  budgetsByProject: (projectId) => `budgets:project:${projectId}`,
  budgetById: (id) => `budgets:${id}`
}

// Cache invalidation helpers
export function invalidateArtistCache(artistId) {
  const patterns = [
    cacheKeys.artistList(),
    cacheKeys.artistById(artistId),
    cacheKeys.artistProjects(artistId),
    cacheKeys.artistInvoices(artistId)
  ]
  
  patterns.forEach(key => cache.delete(key))
}

export function invalidateProjectCache(projectId, artistId) {
  const patterns = [
    cacheKeys.projectList(),
    cacheKeys.projectById(projectId),
    cacheKeys.budgetsByProject(projectId)
  ]
  
  if (artistId) {
    patterns.push(cacheKeys.artistProjects(artistId))
  }
  
  patterns.forEach(key => cache.delete(key))
}

export function invalidateInvoiceCache(invoiceId, artistId, projectId) {
  const patterns = [
    cacheKeys.invoiceList(),
    cacheKeys.invoiceById(invoiceId)
  ]
  
  if (artistId) {
    patterns.push(cacheKeys.artistInvoices(artistId))
  }
  
  if (projectId) {
    patterns.push(cacheKeys.projectList({ projectId }))
  }
  
  patterns.forEach(key => cache.delete(key))
}

// Vue composable
import { ref, onUnmounted } from 'vue'

export function useCache() {
  const cacheStats = ref({
    size: cache.size(),
    hits: 0,
    misses: 0
  })

  // Track cache performance
  const withCache = async (key, fetcher, ttl = 5 * 60 * 1000) => {
    // Check cache first
    const cached = cache.get(key)
    if (cached !== null) {
      cacheStats.value.hits++
      return cached
    }

    // Cache miss
    cacheStats.value.misses++
    
    // Fetch data
    const data = await fetcher()
    
    // Store in cache
    cache.set(key, data, ttl)
    cacheStats.value.size = cache.size()
    
    return data
  }

  // Periodic cleanup
  const pruneInterval = setInterval(() => {
    const pruned = cache.prune()
    if (pruned > 0) {
      cacheStats.value.size = cache.size()
    }
  }, 60 * 1000) // Every minute

  onUnmounted(() => {
    clearInterval(pruneInterval)
  })

  return {
    withCache,
    cache,
    cacheStats,
    invalidate: (key) => {
      cache.delete(key)
      cacheStats.value.size = cache.size()
    },
    clear: () => {
      cache.clear()
      cacheStats.value.size = 0
    }
  }
}
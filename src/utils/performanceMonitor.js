// src/utils/performanceMonitor.js

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.enabled = import.meta.env.DEV // Only enable in development by default
  }

  startTimer(name) {
    if (!this.enabled) return

    const startTime = performance.now()
    this.metrics.set(name, {
      startTime,
      endTime: null,
      duration: null,
      status: 'running'
    })
  }

  endTimer(name, metadata = {}) {
    if (!this.enabled) return

    const metric = this.metrics.get(name)
    if (!metric || metric.status !== 'running') {
      console.warn(`Timer '${name}' was not started or already ended`)
      return
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    this.metrics.set(name, {
      ...metric,
      endTime,
      duration,
      status: 'completed',
      metadata,
      timestamp: new Date().toISOString()
    })

    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }

    return duration
  }

  async measureAsync(name, asyncFn, metadata = {}) {
    if (!this.enabled) return asyncFn()

    this.startTimer(name)
    try {
      const result = await asyncFn()
      const duration = this.endTimer(name, { ...metadata, status: 'success' })
      return result
    } catch (error) {
      const duration = this.endTimer(name, { ...metadata, status: 'error', error: error.message })
      throw error
    }
  }

  measure(name, fn, metadata = {}) {
    if (!this.enabled) return fn()

    this.startTimer(name)
    try {
      const result = fn()
      this.endTimer(name, { ...metadata, status: 'success' })
      return result
    } catch (error) {
      this.endTimer(name, { ...metadata, status: 'error', error: error.message })
      throw error
    }
  }

  getMetrics(filter = {}) {
    const results = []
    
    this.metrics.forEach((metric, name) => {
      // Apply filters
      if (filter.minDuration && metric.duration < filter.minDuration) return
      if (filter.maxDuration && metric.duration > filter.maxDuration) return
      if (filter.status && metric.status !== filter.status) return
      if (filter.namePattern && !name.includes(filter.namePattern)) return

      results.push({
        name,
        ...metric
      })
    })

    // Sort by duration (slowest first)
    return results.sort((a, b) => (b.duration || 0) - (a.duration || 0))
  }

  getSummary() {
    const completed = this.getMetrics({ status: 'completed' })
    
    if (completed.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null
      }
    }

    const durations = completed.map(m => m.duration)
    const total = durations.reduce((sum, d) => sum + d, 0)
    
    return {
      totalOperations: completed.length,
      averageDuration: total / completed.length,
      totalDuration: total,
      slowestOperation: completed[0],
      fastestOperation: completed[completed.length - 1],
      slowQueries: completed.filter(m => m.duration > 1000).length
    }
  }

  clear() {
    this.metrics.clear()
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Supabase query wrapper with performance monitoring
export async function monitoredQuery(queryName, queryFn, metadata = {}) {
  return performanceMonitor.measureAsync(
    `supabase:${queryName}`,
    queryFn,
    metadata
  )
}

// Vue composable
import { ref, onUnmounted } from 'vue'

export function usePerformanceMonitor() {
  const metrics = ref([])
  const summary = ref({})
  
  const refresh = () => {
    metrics.value = performanceMonitor.getMetrics()
    summary.value = performanceMonitor.getSummary()
  }

  // Auto-refresh every 5 seconds in dev mode
  let interval = null
  if (import.meta.env.DEV) {
    interval = setInterval(refresh, 5000)
  }

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  return {
    metrics,
    summary,
    refresh,
    clear: () => {
      performanceMonitor.clear()
      refresh()
    },
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor)
  }
}

// Export console helper for development
if (import.meta.env.DEV) {
  window.perfMonitor = {
    getMetrics: (filter) => performanceMonitor.getMetrics(filter),
    getSummary: () => performanceMonitor.getSummary(),
    clear: () => performanceMonitor.clear(),
    enable: () => performanceMonitor.enable(),
    disable: () => performanceMonitor.disable()
  }
}
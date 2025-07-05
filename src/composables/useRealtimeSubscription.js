// src/composables/useRealtimeSubscription.js
import { ref, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useRealtimeSubscription() {
  const subscriptions = ref([])
  const isConnected = ref(false)
  const lastUpdate = ref(null)

  // Subscribe to a table
  const subscribe = (table, options = {}) => {
    const {
      event = '*', // 'INSERT', 'UPDATE', 'DELETE', or '*' for all
      schema = 'public',
      filter = null,
      onInsert = null,
      onUpdate = null,
      onDelete = null,
      onChange = null
    } = options

    let channel = supabase
      .channel(`${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter
        },
        (payload) => {
          lastUpdate.value = new Date()
          
          // Call specific handlers based on event type
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new)
              break
            case 'UPDATE':
              onUpdate?.(payload.new, payload.old)
              break
            case 'DELETE':
              onDelete?.(payload.old)
              break
          }
          
          // Call general change handler
          onChange?.(payload)
        }
      )
      .subscribe((status) => {
        isConnected.value = status === 'SUBSCRIBED'
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} realtime updates`)
        } else if (status === 'CLOSED') {
          console.log(`Subscription to ${table} closed`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${table}`)
        }
      })

    subscriptions.value.push(channel)
    return channel
  }

  // Subscribe to specific record changes
  const subscribeToRecord = (table, id, options = {}) => {
    return subscribe(table, {
      ...options,
      filter: `id=eq.${id}`
    })
  }

  // Subscribe to artist-specific changes
  const subscribeToArtist = (artistId, options = {}) => {
    const channels = []
    
    // Subscribe to project changes for this artist
    channels.push(
      subscribe('projects', {
        filter: `artist_id=eq.${artistId}`,
        ...options.projects
      })
    )
    
    // Subscribe to invoice changes for this artist
    channels.push(
      subscribe('invoices', {
        filter: `artist_id=eq.${artistId}`,
        ...options.invoices
      })
    )
    
    return channels
  }

  // Unsubscribe from all channels
  const unsubscribeAll = async () => {
    for (const channel of subscriptions.value) {
      await supabase.removeChannel(channel)
    }
    subscriptions.value = []
    isConnected.value = false
  }

  // Unsubscribe from specific channel
  const unsubscribe = async (channel) => {
    await supabase.removeChannel(channel)
    subscriptions.value = subscriptions.value.filter(ch => ch !== channel)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeAll()
  })

  return {
    subscribe,
    subscribeToRecord,
    subscribeToArtist,
    unsubscribe,
    unsubscribeAll,
    isConnected,
    lastUpdate,
    subscriptionCount: ref(subscriptions.value.length)
  }
}

// Store-specific real-time sync composable
export function useRealtimeStoreSync(store, table, options = {}) {
  const { subscribe } = useRealtimeSubscription()
  
  const startSync = () => {
    return subscribe(table, {
      onInsert: (record) => {
        // Add to store if not already present
        const existing = store[table].find(item => item.id === record.id)
        if (!existing) {
          store[table].unshift(record)
          if (options.onInsert) options.onInsert(record)
        }
      },
      onUpdate: (newRecord, oldRecord) => {
        // Update in store
        const index = store[table].findIndex(item => item.id === newRecord.id)
        if (index !== -1) {
          store[table][index] = newRecord
          if (options.onUpdate) options.onUpdate(newRecord, oldRecord)
        }
      },
      onDelete: (record) => {
        // Remove from store
        store[table] = store[table].filter(item => item.id !== record.id)
        if (options.onDelete) options.onDelete(record)
      },
      ...options
    })
  }
  
  return {
    startSync
  }
}
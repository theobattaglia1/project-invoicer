<template>
  <div v-if="showIndicator" class="realtime-indicator" :class="{ connected: isConnected }">
    <div class="indicator-dot"></div>
    <span class="indicator-text">{{ statusText }}</span>
    <span v-if="lastUpdate" class="last-update">
      Last update: {{ formatTime(lastUpdate) }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isConnected: {
    type: Boolean,
    default: false
  },
  lastUpdate: {
    type: Date,
    default: null
  },
  showIndicator: {
    type: Boolean,
    default: true
  }
})

const statusText = computed(() => 
  props.isConnected ? 'Live' : 'Offline'
)

const formatTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return 'just now'
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else {
    return date.toLocaleTimeString()
  }
}
</script>

<style scoped>
.realtime-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.realtime-indicator.connected {
  border-color: rgba(29, 185, 84, 0.3);
  background: rgba(29, 185, 84, 0.1);
}

.indicator-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.connected .indicator-dot {
  background: #1db954;
  box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(29, 185, 84, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(29, 185, 84, 0);
  }
}

.indicator-text {
  font-weight: 500;
}

.connected .indicator-text {
  color: #1db954;
}

.last-update {
  font-size: 0.7rem;
  opacity: 0.7;
}
</style>
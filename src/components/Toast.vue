<template>
  <div class="toast-container" v-if="queue.length">
    <transition-group name="toast-fade" tag="div">
      <div
        v-for="t in queue"
        :key="t.id"
        class="toast"
        :class="[t.type]"
        @mouseenter="pauseTimer(t.id)"
        @mouseleave="resumeTimer(t.id)"
      >
        <span class="toast-message">{{ formatMessage(t.msg) }}</span>

        <button
          v-if="t.action"
          class="toast-action"
          @click="runAction(t)"
        >
          {{ t.action.label }}
        </button>

        <button 
          class="toast-close" 
          @click="handleRemove(t.id)"
        >
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>

        <!-- Subtle progress line -->
        <div 
          v-if="t.duration && t.duration > 0" 
          class="toast-progress"
          :style="{ animationDuration: `${t.duration}ms` }"
        ></div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/store/toast'

const store = useToastStore()
const { queue, remove } = store

// Track timers for each toast
const timers = ref({})

// Format message to remove JSON formatting
function formatMessage(msg) {
  // Check if it's a "Now playing" message with JSON format
  if (msg.includes('"message":') && msg.includes('"type":')) {
    // Extract just the song name from the message
    const match = msg.match(/Now playing:\s*([^"]+)/i)
    if (match) {
      return `Now playing: ${match[1].trim()}`
    }
  }
  return msg
}

// Auto-dismiss toasts after their duration
onMounted(() => {
  // Watch for new toasts
  store.$subscribe(() => {
    queue.forEach(toast => {
      // Default to 2 seconds for music notifications
      const duration = toast.duration || 2000
      if (!timers.value[toast.id]) {
        startTimer({ ...toast, duration })
      }
    })
  })
})

function startTimer(toast) {
  if (!toast.duration || toast.duration <= 0) return
  
  const remainingTime = ref(toast.duration)
  const startTime = Date.now()
  
  timers.value[toast.id] = {
    timeout: setTimeout(() => {
      remove(toast.id)
      delete timers.value[toast.id]
    }, toast.duration),
    startTime,
    remainingTime: toast.duration,
    isPaused: false
  }
}

function pauseTimer(toastId) {
  const timer = timers.value[toastId]
  if (!timer || timer.isPaused) return
  
  clearTimeout(timer.timeout)
  timer.isPaused = true
  timer.remainingTime = timer.remainingTime - (Date.now() - timer.startTime)
}

function resumeTimer(toastId) {
  const timer = timers.value[toastId]
  if (!timer || !timer.isPaused) return
  
  timer.isPaused = false
  timer.startTime = Date.now()
  timer.timeout = setTimeout(() => {
    remove(toastId)
    delete timers.value[toastId]
  }, timer.remainingTime)
}

function handleRemove(id) {
  remove(id)
  if (timers.value[id]) {
    clearTimeout(timers.value[id].timeout)
    delete timers.value[id]
  }
}

function runAction(t) {
  if (t.action?.handler) t.action.handler()
  handleRemove(t.id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

/* Smooth transitions */
.toast-fade-enter-active {
  transition: all 0.3s ease-out;
}
.toast-fade-leave-active {
  transition: all 0.2s ease-in;
}
.toast-fade-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}
.toast-fade-leave-to {
  transform: translateY(-10px) scale(0.95);
  opacity: 0;
}

/* Glass morphism toast */
.toast {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 400;
  position: relative;
  overflow: hidden;
  min-width: 200px;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Light background variant */
@media (prefers-color-scheme: light) {
  .toast {
    background: rgba(255, 255, 255, 0.7);
    color: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
}

/* Message styling */
.toast-message {
  flex: 1;
  line-height: 1.4;
  text-align: center;
  padding: 0 8px;
}

/* Action button */
.toast-action {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  color: inherit;
}

.toast-action:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* Close button - subtle and small */
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin: -4px -8px -4px 0;
  border-radius: 50%;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.5);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.toast:hover .toast-close {
  opacity: 1;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.toast-close svg {
  width: 12px;
  height: 12px;
}

/* Progress bar - very subtle */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  animation: progress-countdown linear forwards;
  transform-origin: left;
}

@keyframes progress-countdown {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* Subtle hover effect */
.toast:hover {
  background: rgba(0, 0, 0, 0.6);
}

/* Remove type-specific styling - keep it minimal */
.toast.success,
.toast.error,
.toast.info {
  /* All use the same glass style */
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .toast-container {
    top: 10px;
    left: 10px;
    right: 10px;
    transform: none;
  }
  
  .toast {
    width: 100%;
    max-width: none;
  }
}
</style>
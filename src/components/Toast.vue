<template>
    <Teleport to="body">
      <TransitionGroup name="toast" tag="div" class="toast-container">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
        >
          <svg v-if="toast.type === 'success'" class="toast-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" class="toast-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <svg v-else class="toast-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span class="toast-message">{{ toast.message }}</span>
          <button @click="removeToast(toast.id)" class="toast-close">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </Teleport>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const toasts = ref([])
  let nextId = 1
  
  const show = ({ message, type = 'info', duration = 3000 }) => {
    const id = nextId++
    const toast = { id, message, type }
    toasts.value.push(toast)
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  defineExpose({ show })
  </script>
  
  <style scoped>
  .toast-container {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    pointer-events: none;
  }
  
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 500px;
    padding: 16px;
    margin-bottom: 12px;
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: all;
    transition: all 0.3s ease;
  }
  
  .toast-success {
    border-left: 4px solid #4caf50;
  }
  
  .toast-error {
    border-left: 4px solid #f44336;
  }
  
  .toast-info {
    border-left: 4px solid #2196f3;
  }
  
  .toast-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  .toast-success .toast-icon {
    color: #4caf50;
  }
  
  .toast-error .toast-icon {
    color: #f44336;
  }
  
  .toast-info .toast-icon {
    color: #2196f3;
  }
  
  .toast-message {
    flex: 1;
    font-size: 14px;
    color: white;
    line-height: 1.5;
  }
  
  .toast-close {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  
  .toast-close:hover {
    color: white;
  }
  
  .toast-close svg {
    width: 16px;
    height: 16px;
  }
  
  /* Animations */
  .toast-enter-active {
    animation: slideIn 0.3s ease;
  }
  
  .toast-leave-active {
    animation: slideOut 0.3s ease;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  </style>
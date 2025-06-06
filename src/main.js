// File: src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'
import { useAuthStore } from '@/store/authStore'

const app = createApp(App)

// 1. Install Pinia
const pinia = createPinia()
app.use(pinia)

// 2. Install Vue Router
app.use(router)

// 3. Configure a global error handler before mounting
app.config.errorHandler = (err, instance, info) => {
  console.warn('Vue error suppressed:', err.message)
  if (err.message && err.message.includes('componentStructure')) {
    // Silently swallow "componentStructure" errors
    return
  }
  // Re‐throw any other errors so you still see them
  throw err
}

// 4. Initialize auth store before mounting
const authStore = useAuthStore(pinia)
authStore.initialize().then(() => {
  // 5. Finally, mount the app after auth is initialized
  app.mount('#app')
})
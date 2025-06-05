// File: src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'

// (Only import these if you actually need to register them globally)
// import ContextMenu from '@/components/ContextMenu.vue'
// import UnifiedContentModal from '@/components/UnifiedContentModal.vue'

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
    // Silently swallow “componentStructure” errors
    return
  }
  // Re‐throw any other errors so you still see them
  throw err
}

// 4. (Optional) Globally register these components if you need them everywhere
//    Otherwise, you can skip this and import them inside the specific views.
// app.component('ContextMenu', ContextMenu)
// app.component('UnifiedContentModal', UnifiedContentModal)

// 5. Finally, mount the app exactly once
app.mount('#app')

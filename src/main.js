import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import ContextMenu from '@/components/ContextMenu.vue'
import UnifiedContentModal from '@/components/UnifiedContentModal.vue'

import './index.css'

const app = createApp(App)
const pinia = createPinia()

// Configure error handler BEFORE mounting
app.config.errorHandler = (err, instance, info) => {
    // Log the error for debugging
    console.warn('Vue error suppressed:', err.message)
    
    // Suppress the componentStructure error
    if (err.message && err.message.includes('componentStructure')) {
      return // Don't throw
    }
    
    // Re-throw other errors
    throw err
}

app.use(pinia)

app.component('ContextMenu', ContextMenu)
app.component('UnifiedContentModal', UnifiedContentModal)

// Mount AFTER setting up error handling
app.mount('#app')
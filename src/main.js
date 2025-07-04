/* ───────────── File: src/main.js ───────────── */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'
import './index.css'

import { useAuthStore } from '@/store/authStore'
import sessionManager from '@/utils/sessionManager'

/* 1. create app */
const app = createApp(App)

/* 2. install plugins BEFORE mount */
app
  .use(createPinia())
  .use(router)
  .use(Toast, {
    position: 'bottom-right',
    timeout: 3500,
    hideProgressBar: false,
    maxToasts: 4
  })

/* 3. global error handler (optional) */
app.config.errorHandler = (err, instance, info) => {
  console.warn('Vue error suppressed:', err.message)
  if (err.message?.includes('componentStructure')) return
  throw err
}

app.mount('#app')          // ← mount immediately

// fire-and-forget; router-guard still awaits it when needed
const authStore = useAuthStore()
authStore.initialize()

// Initialize session manager after auth is ready
authStore.$subscribe((mutation, state) => {
  if (state.user && !sessionManager.initialized) {
    sessionManager.init(router)
  }
})
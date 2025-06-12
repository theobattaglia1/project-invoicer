/* ───────────── File: src/main.js ───────────── */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'
import './index.css'

import { useAuthStore } from '@/store/authStore'

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

/* 4. initialize auth, then mount exactly once */
const authStore = useAuthStore()
authStore.initialize().finally(() => {
  app.mount('#app')
})

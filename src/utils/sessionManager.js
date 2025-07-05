// src/utils/sessionManager.js
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'vue-router'
import { showToast } from '@/utils/toast'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_TIME = 5 * 60 * 1000 // 5 minutes before timeout
const ACTIVITY_CHECK_INTERVAL = 60 * 1000 // Check every minute

class SessionManager {
  constructor() {
    this.lastActivity = Date.now()
    this.warningShown = false
    this.timeoutId = null
    this.warningTimeoutId = null
    this.activityListeners = []
    this.router = null
  }

  init(router) {
    this.router = router
    this.startMonitoring()
    this.setupActivityListeners()
  }

  updateActivity() {
    this.lastActivity = Date.now()
    this.warningShown = false
    
    // Clear existing timeouts
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId)
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    
    // Set new timeouts
    this.scheduleWarning()
    this.scheduleTimeout()
  }

  setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    const activityHandler = () => {
      this.updateActivity()
    }
    
    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true })
      this.activityListeners.push({ event, handler: activityHandler })
    })
  }

  startMonitoring() {
    // Initial scheduling
    this.updateActivity()
    
    // Check periodically if we need to show warning or logout
    setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - this.lastActivity
      
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        this.handleTimeout()
      } else if (timeSinceActivity >= SESSION_TIMEOUT - WARNING_TIME && !this.warningShown) {
        this.showWarning()
      }
    }, ACTIVITY_CHECK_INTERVAL)
  }

  scheduleWarning() {
    this.warningTimeoutId = setTimeout(() => {
      this.showWarning()
    }, SESSION_TIMEOUT - WARNING_TIME)
  }

  scheduleTimeout() {
    this.timeoutId = setTimeout(() => {
      this.handleTimeout()
    }, SESSION_TIMEOUT)
  }

  showWarning() {
    if (this.warningShown) return
    
    this.warningShown = true
    const remainingMinutes = Math.ceil(WARNING_TIME / 60000)
    
    showToast(
      `Your session will expire in ${remainingMinutes} minutes due to inactivity. Click anywhere to stay logged in.`,
      'warning',
      {
        timeout: WARNING_TIME,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        position: 'top-center'
      }
    )
  }

  async handleTimeout() {
    // Clear all listeners
    this.cleanup()
    
    const authStore = useAuthStore()
    
    // Store current route for redirect after login
    const currentRoute = this.router?.currentRoute.value.fullPath
    if (currentRoute && currentRoute !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentRoute)
    }
    
    // Sign out user
    await authStore.signOut()
    
    showToast(
      'Your session has expired due to inactivity. Please log in again.',
      'error',
      {
        timeout: 5000,
        position: 'top-center'
      }
    )
    
    // Redirect to login
    if (this.router) {
      this.router.push('/login')
    }
  }

  cleanup() {
    // Remove event listeners
    this.activityListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler)
    })
    this.activityListeners = []
    
    // Clear timeouts
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId)
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
  }

  // Extended session for important operations
  extendSession() {
    this.updateActivity()
    showToast('Session extended', 'success', { timeout: 2000 })
  }
}

// Create singleton instance
const sessionManager = new SessionManager()

// Vue composable
export function useSessionManager() {
  return {
    extendSession: () => sessionManager.extendSession(),
    updateActivity: () => sessionManager.updateActivity()
  }
}

export default sessionManager
// src/utils/csrf.js

// Generate a cryptographically secure random token
export function generateCSRFToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Store CSRF token in session storage
export function setCSRFToken(token) {
  sessionStorage.setItem('csrf_token', token)
}

// Get CSRF token from session storage
export function getCSRFToken() {
  let token = sessionStorage.getItem('csrf_token')
  if (!token) {
    token = generateCSRFToken()
    setCSRFToken(token)
  }
  return token
}

// Validate CSRF token
export function validateCSRFToken(token) {
  const storedToken = getCSRFToken()
  return token === storedToken
}

// Clear CSRF token (on logout)
export function clearCSRFToken() {
  sessionStorage.removeItem('csrf_token')
}

// Add CSRF token to request headers
export function addCSRFHeader(headers = {}) {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  }
}

// Vue composable for CSRF protection
import { ref, onMounted } from 'vue'

export function useCSRF() {
  const csrfToken = ref('')

  onMounted(() => {
    csrfToken.value = getCSRFToken()
  })

  return {
    csrfToken,
    validateToken: validateCSRFToken,
    refreshToken: () => {
      const newToken = generateCSRFToken()
      setCSRFToken(newToken)
      csrfToken.value = newToken
      return newToken
    }
  }
}
<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-logo">
        <!-- Your logo here -->
      </div>
      
      <h1 class="login-title">Welcome back</h1>
      <p class="login-subtitle">Sign in to your account</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
            :disabled="loading"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="forgot-password">
          <a @click="forgotPassword" href="#">Forgot your password?</a>
        </div>
        
        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="!loading">Sign In</span>
          <div v-else class="spinner"></div>
        </button>
      </form>
      
      <div class="login-footer">
        <p>Need help? Contact support</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/utils/toast'
import { authRateLimiter } from '@/utils/rateLimiter'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  
  // Check rate limit
  const rateLimitKey = `login_${email.value}`
  const { allowed, retriesLeft, message } = authRateLimiter.isAllowed(rateLimitKey, 5, 15 * 60 * 1000)
  
  if (!allowed) {
    error.value = message
    return
  }
  
  loading.value = true
  
  try {
    const result = await authStore.login(email.value, password.value)
    
    if (result.success) {
      // Record successful login
      authRateLimiter.recordSuccess(rateLimitKey)
      
      // Check if this is their first login (using temp password)
      if (!authStore.profile?.setup_complete || !authStore.profile?.name || authStore.profile?.name === authStore.profile?.email.split('@')[0]) {
        router.push('/setup')
      } else if (authStore.isArtist && authStore.profile.artist_id) {
        router.push(`/artist/${authStore.profile.artist_id}/overview`)
      } else {
        router.push('/')
      }
    } else {
      // Generic error message to prevent information leakage
      error.value = 'Invalid email or password'
      
      if (retriesLeft <= 2) {
        error.value += `. ${retriesLeft} attempts remaining`
      }
    }
  } catch (err) {
    error.value = 'An unexpected error occurred. Please try again.'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const forgotPassword = async () => {
  if (!email.value) {
    error.value = 'Please enter your email first'
    return
  }
  
  // Check rate limit for password reset
  const rateLimitKey = `reset_${email.value}`
  const { allowed, message } = authRateLimiter.isAllowed(rateLimitKey, 3, 60 * 60 * 1000)
  
  if (!allowed) {
    error.value = message
    return
  }
  
  loading.value = true
  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`
    })
    
    // Always show success message to prevent email enumeration
    showToast('If an account exists for this email, a password reset link has been sent.', 'success')
    error.value = ''
    
    // Record successful request
    authRateLimiter.recordSuccess(rateLimitKey)
  } catch (err) {
    // Generic error message
    error.value = 'Unable to process request. Please try again later.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  position: relative;
  overflow: hidden;
}

/* Background gradient effect */
.login-view::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 20% 80%,
    rgba(29, 185, 84, 0.1) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 80% 20%,
    rgba(29, 185, 84, 0.05) 0%,
    transparent 50%
  );
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-20px, -20px) rotate(180deg); }
}

.login-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  z-index: 1;
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 0 0 32px 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #1db954;
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 8px;
  color: #f44336;
  font-size: 14px;
  text-align: center;
}

.forgot-password {
  text-align: right;
  margin-top: -12px;
}

.forgot-password a {
  font-size: 14px;
  color: #1db954;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.forgot-password a:hover {
  color: #1ed760;
}

.btn-login {
  padding: 14px 24px;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
}

.btn-login:hover:not(:disabled) {
  background: #1ed760;
  transform: translateY(-1px);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 32px;
  text-align: center;
}

.login-footer p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
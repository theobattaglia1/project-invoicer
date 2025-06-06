<template>
  <div class="login-view">
    <div class="login-container">
      <!-- Logo -->
      <div class="login-logo">
        <h1 style="color: white; font-size: 48px;">AMF</h1>
      </div>
      
      <h1 class="login-title">Welcome Back</h1>
      <p class="login-subtitle">Sign in to your account</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            placeholder="you@example.com"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            placeholder="••••••••"
            :disabled="loading"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="!loading">Sign In</span>
          <div v-else class="spinner"></div>
        </button>
      </form>
      
      <div class="login-footer">
        <p>Having trouble? Contact your administrator.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    // This is a temporary login that just checks credentials
    // We'll add Supabase auth after we confirm the setup works
    
    // For now, hardcode your owner login
    if (email.value === 'theo@allmyfriendsinc.com' && password.value === '(Milo0224!))') {
      // Simulate successful login
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userRole', 'owner')
      router.push('/')
    } else {
      error.value = 'Invalid email or password'
    }
  } catch (err) {
    error.value = 'Login failed'
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
<template>
    <div class="reset-container">
      <div class="reset-card">
        <h1 class="reset-title">Reset Your Password</h1>
        <p class="reset-subtitle">Enter your new password below</p>
        
        <form @submit.prevent="resetPassword" class="reset-form">
          <div class="form-group">
            <label for="password">New Password</label>
            <input
              v-model="form.password"
              type="password"
              id="password"
              placeholder="Enter new password"
              required
              minlength="12"
              class="form-input"
              @input="checkPasswordStrength"
            />
            <div class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.percent + '%' }"
                ></div>
              </div>
              <p class="strength-text">{{ passwordStrength.text }}</p>
            </div>
            <p class="form-hint">At least 12 characters with uppercase, lowercase, numbers, and special characters</p>
            <div v-if="passwordErrors.length > 0" class="password-errors">
              <p v-for="error in passwordErrors" :key="error" class="error-text">{{ error }}</p>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              id="confirmPassword"
              placeholder="Confirm new password"
              required
              class="form-input"
            />
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div v-if="success" class="success-message">
            Password reset successfully! Redirecting...
          </div>
          
          <button type="submit" class="btn-submit" :disabled="loading || success || !isFormValid">
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '@/lib/supabase'
  import { useAuthStore } from '@/store/authStore'
  import { validatePassword, getPasswordStrengthLabel } from '@/utils/passwordValidation'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const form = ref({
    password: '',
    confirmPassword: ''
  })
  
  const loading = ref(false)
  const error = ref('')
  const success = ref(false)
  const passwordStrength = ref({ percent: 0, text: '', class: '' })
  const passwordErrors = ref([])
  
  onMounted(async () => {
    // Check if user has a valid session (from the recovery token)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // No valid recovery session
      error.value = 'Invalid or expired reset link. Please request a new one.'
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  })
  
  const checkPasswordStrength = () => {
    const pwd = form.value.password
    const validation = validatePassword(pwd)
    passwordErrors.value = validation.errors
    
    const strengthInfo = getPasswordStrengthLabel(validation.strength)
    passwordStrength.value = {
      percent: validation.strength,
      text: strengthInfo.label,
      class: strengthInfo.label.toLowerCase().replace(' ', '-')
    }
  }
  
  const isFormValid = computed(() => 
    form.value.password &&
    form.value.password === form.value.confirmPassword &&
    passwordErrors.value.length === 0
  )
  
  const resetPassword = async () => {
    error.value = ''
    
    // Validate passwords match
    if (form.value.password !== form.value.confirmPassword) {
      error.value = 'Passwords do not match'
      return
    }
    
    // Validate password strength
    const validation = validatePassword(form.value.password)
    if (!validation.isValid) {
      error.value = 'Please fix the password errors before submitting'
      return
    }
    
    loading.value = true
    
    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.value.password
      })
      
      if (updateError) throw updateError
      
      success.value = true
      
      // Refresh auth store
      await authStore.initialize()
      
      // Redirect after success message
      setTimeout(() => {
        // Check if user needs to complete profile setup
        if (authStore.profile && (!authStore.profile.setup_complete || !authStore.profile.name || authStore.profile.name === authStore.profile.email.split('@')[0])) {
          router.push('/setup')
        } else if (authStore.isArtist && authStore.profile.artist_id) {
          router.push(`/artist/${authStore.profile.artist_id}/overview`)
        } else {
          router.push('/')
        }
      }, 2000)
      
    } catch (err) {
      console.error('Password reset error:', err)
      error.value = err.message || 'Failed to reset password'
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <style scoped>
  .reset-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #000;
  }
  
  .reset-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 48px 32px;
  }
  
  .reset-title {
    font-size: 28px;
    font-weight: 700;
    color: white;
    text-align: center;
    margin: 0 0 8px 0;
  }
  
  .reset-subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    margin: 0 0 32px 0;
  }
  
  .reset-form {
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
    color: rgba(255, 255, 255, 0.8);
  }
  
  .form-input {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 16px;
    transition: all 0.2s ease;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #1db954;
    background: rgba(255, 255, 255, 0.08);
  }
  
  .form-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
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
  
  .success-message {
    padding: 12px;
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.2);
    border-radius: 8px;
    color: #4caf50;
    font-size: 14px;
    text-align: center;
  }
  
  .btn-submit {
    padding: 14px 24px;
    background: #1db954;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 8px;
  }
  
  .btn-submit:hover:not(:disabled) {
    background: #1ed760;
  }
  
  .btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .password-strength {
    margin-top: 8px;
  }
  
  .strength-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 2px;
  }
  
  .strength-fill.very-weak { background: #f44336; }
  .strength-fill.weak { background: #ff9800; }
  .strength-fill.fair { background: #ffc107; }
  .strength-fill.good { background: #2196f3; }
  .strength-fill.strong { background: #4caf50; }
  
  .strength-text {
    font-size: 12px;
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .password-errors {
    margin-top: 8px;
  }
  
  .error-text {
    font-size: 12px;
    color: #f44336;
    margin: 0 0 4px 0;
  }
  </style>
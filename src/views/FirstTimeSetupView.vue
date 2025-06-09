<template>
    <div class="setup-container">
      <div class="setup-card">
        <h1 class="setup-title">{{ isPasswordReset ? 'Reset Your Password' : "Welcome! Let's set up your account" }}</h1>
        <p class="setup-subtitle">{{ isPasswordReset ? 'Enter your new password below' : 'Please complete your profile to get started' }}</p>
        
        <form @submit.prevent="completeSetup" class="setup-form">
          <div v-if="!isPasswordReset" class="form-group">
            <label for="name">Your Name</label>
            <input
              v-model="form.name"
              type="text"
              id="name"
              placeholder="Enter your full name"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="password">{{ isPasswordReset ? 'New Password' : 'Create Password' }}</label>
            <input
              v-model="form.password"
              type="password"
              id="password"
              placeholder="Choose a secure password"
              required
              minlength="8"
              class="form-input"
            />
            <p class="form-hint">At least 8 characters</p>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              required
              class="form-input"
            />
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Updating...' : (isPasswordReset ? 'Reset Password' : 'Complete Setup') }}
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { supabase } from '@/lib/supabase'
  import { useAuthStore } from '@/store/authStore'
  
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  
  const form = ref({
    name: '',
    password: '',
    confirmPassword: ''
  })
  
  const loading = ref(false)
  const error = ref('')
  
  const isPasswordReset = computed(() => route.query.mode === 'reset-password')
  
  onMounted(async () => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }
    
    // For password reset, we don't need to check profile completion
    if (!isPasswordReset.value) {
      // Check if profile already exists and is complete
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile?.setup_complete && profile?.name && profile.name !== profile.email.split('@')[0]) {
        // Profile already set up, redirect to appropriate page
        if (profile.role === 'artist' && profile.artist_id) {
          router.push(`/artist/${profile.artist_id}/overview`)
        } else {
          router.push('/')
        }
      }
    }
  })
  
  const completeSetup = async () => {
    error.value = ''
    
    // Validate passwords match
    if (form.value.password !== form.value.confirmPassword) {
      error.value = 'Passwords do not match'
      return
    }
    
    loading.value = true
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user found')
      }
      
      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: form.value.password
      })
      
      if (passwordError) throw passwordError
      
      if (isPasswordReset.value) {
        // For password reset, just redirect to appropriate page
        await authStore.initialize()
        
        if (authStore.profile) {
          if (authStore.profile.role === 'artist' && authStore.profile.artist_id) {
            router.push(`/artist/${authStore.profile.artist_id}/overview`)
          } else {
            router.push('/')
          }
        } else {
          router.push('/login')
        }
      } else {
        // For initial setup, update profile with name
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ 
            name: form.value.name,
            setup_complete: true 
          })
          .eq('id', user.id)
        
        if (profileError) throw profileError
        
        // Refresh auth store
        await authStore.initialize()
        
        // Redirect based on role
        const profile = authStore.profile
        if (profile.role === 'artist' && profile.artist_id) {
          router.push(`/artist/${profile.artist_id}/overview`)
        } else {
          router.push('/')
        }
      }
      
    } catch (err) {
      console.error('Setup error:', err)
      error.value = err.message || 'Failed to complete setup'
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <style scoped>
  .setup-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #000;
  }
  
  .setup-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 48px 32px;
  }
  
  .setup-title {
    font-size: 28px;
    font-weight: 700;
    color: white;
    text-align: center;
    margin: 0 0 8px 0;
  }
  
  .setup-subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    margin: 0 0 32px 0;
  }
  
  .setup-form {
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
  </style>
<template>
    <div class="test-import">
      <h1>Import Test Page</h1>
      <p>If you can see this, the routing is working!</p>
      <p>Current user: {{ userEmail }}</p>
      <p>Is owner: {{ isOwner }}</p>
      <button @click="testSupabase">Test Supabase Connection</button>
      <div v-if="testResult">
        <pre>{{ testResult }}</pre>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '@/store/authStore'
  import { supabase } from '@/lib/supabase'
  
  const authStore = useAuthStore()
  const testResult = ref('')
  
  const userEmail = computed(() => authStore.user?.email || 'Not logged in')
  const isOwner = computed(() => authStore.isOwner)
  
  const testSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name')
        .limit(5)
      
      if (error) {
        testResult.value = `Error: ${error.message}`
      } else {
        testResult.value = JSON.stringify(data, null, 2)
      }
    } catch (err) {
      testResult.value = `Exception: ${err.message}`
    }
  }
  
  onMounted(() => {
    console.log('Test Import View mounted')
    console.log('Auth store:', authStore)
    console.log('User:', authStore.user)
    console.log('Profile:', authStore.profile)
  })
  </script>
  
  <style scoped>
  .test-import {
    padding: 32px;
    color: white;
  }
  
  h1 {
    font-size: 32px;
    margin-bottom: 16px;
  }
  
  button {
    padding: 12px 24px;
    background: #1db954;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin: 16px 0;
  }
  
  pre {
    background: rgba(255, 255, 255, 0.1);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }
  </style>
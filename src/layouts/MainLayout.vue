<template>
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="app-title">Invoice Tracker</h1>
        </div>
        
        <nav class="sidebar-nav">
          <router-link to="/" class="nav-link" :class="{ active: $route.name === 'Artists' }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Artists</span>
          </router-link>
          
          <router-link to="/projects" class="nav-link" :class="{ active: $route.name === 'AllProjects' }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
            <span>Projects</span>
          </router-link>
          
          <router-link to="/invoices" class="nav-link" :class="{ active: $route.name === 'AllInvoices' }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <span>Invoices</span>
          </router-link>
          
          <!-- Users link - only visible to owners -->
          <router-link 
            v-if="authStore.isOwner"
            to="/users" 
            class="nav-link" 
            :class="{ active: $route.name === 'UserManagement' }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span>Users</span>
          </router-link>
        </nav>
        
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              <span>{{ getUserInitials() }}</span>
            </div>
            <div class="user-details">
              <p class="user-name">{{ authStore.profile?.name || 'User' }}</p>
              <p class="user-email">{{ authStore.user?.email }}</p>
              <p class="user-role">{{ formatRole(authStore.profile?.role) }}</p>
            </div>
          </div>
          <button @click="logout" class="btn-logout">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </aside>
  
      <!-- Main Content -->
      <main class="main-content">
        <router-view 
          @create="handleCreate"
          @update="handleUpdate"
          @delete="handleDelete"
        />
      </main>
  
      <!-- Toast Notifications -->
      <Toast ref="toastRef" />
  
      <!-- Unified Modal -->
      <UnifiedModal 
        v-if="modalState.isOpen"
        :type="modalState.type"
        :item="modalState.item"
        :defaultData="modalState.defaultData"
        @close="closeModal"
        @save="handleSave"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAuthStore } from '@/store/authStore'
  import { useArtistStore } from '@/store/artistStore'
  import { useProjectStore } from '@/store/projectStore'
  import { useInvoiceStore } from '@/store/invoiceStore'
  import { useAuth } from '@/composables/useAuth'
  import Toast from '@/components/Toast.vue'
  import UnifiedModal from '@/components/UnifiedModal.vue'
  
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const artistStore = useArtistStore()
  const projectStore = useProjectStore()
  const invoiceStore = useInvoiceStore()
  const { logout } = useAuth()
  
  const toastRef = ref(null)
  
  // Modal state
  const modalState = ref({
    isOpen: false,
    type: null,
    item: null,
    defaultData: null
  })
  
  // Debug route changes
  watch(() => route.path, (newPath) => {
    console.log('Route changed to:', newPath)
  })
  
  const getUserInitials = () => {
    const name = authStore.profile?.name || authStore.user?.email || 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  const formatRole = (role) => {
    const roleMap = {
      owner: 'Owner',
      editor: 'Editor',
      invoicer: 'Invoicer',
      artist: 'Artist',
      viewer: 'Viewer'
    }
    return roleMap[role] || role
  }
  
  // Modal handlers
  const handleCreate = (type, defaultData = null) => {
    modalState.value = {
      isOpen: true,
      type,
      item: null,
      defaultData
    }
  }
  
  const handleUpdate = (type, item) => {
    modalState.value = {
      isOpen: true,
      type,
      item,
      defaultData: null
    }
  }
  
  const handleDelete = async (type, id) => {
    try {
      switch (type) {
        case 'artist':
          await artistStore.deleteArtist(id)
          showToast('Artist deleted successfully', 'success')
          router.push('/')
          break
        case 'project':
          await projectStore.deleteProject(id)
          showToast('Project deleted successfully', 'success')
          break
        case 'invoice':
          await invoiceStore.deleteInvoice(id)
          showToast('Invoice deleted successfully', 'success')
          break
      }
    } catch (error) {
      showToast(`Failed to delete ${type}`, 'error')
    }
  }
  
  const closeModal = () => {
    modalState.value.isOpen = false
  }
  
  const handleSave = async (type, data) => {
    try {
      const isUpdate = !!modalState.value.item
      
      switch (type) {
        case 'artist':
          if (isUpdate) {
            await artistStore.updateArtist(modalState.value.item.id, data)
            showToast('Artist updated successfully', 'success')
          } else {
            await artistStore.createArtist(data)
            showToast('Artist created successfully', 'success')
          }
          break
          
        case 'project':
          if (isUpdate) {
            await projectStore.updateProject(modalState.value.item.id, data)
            showToast('Project updated successfully', 'success')
          } else {
            await projectStore.createProject(data)
            showToast('Project created successfully', 'success')
          }
          break
          
        case 'invoice':
          if (isUpdate) {
            await invoiceStore.updateInvoice(modalState.value.item.id, data)
            showToast('Invoice updated successfully', 'success')
          } else {
            await invoiceStore.createInvoice(data)
            showToast('Invoice created successfully', 'success')
          }
          break
      }
      
      closeModal()
    } catch (error) {
      showToast(`Failed to ${modalState.value.item ? 'update' : 'create'} ${type}`, 'error')
    }
  }
  
  const showToast = (message, type = 'info') => {
    toastRef.value?.show({ message, type })
  }
  
  // Load initial data
  onMounted(async () => {
    console.log('MainLayout mounted, current route:', route.path)
    try {
      await Promise.all([
        artistStore.loadArtists(),
        projectStore.loadProjects(),
        invoiceStore.loadInvoices()
      ])
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  })
  </script>
  
  <style scoped>
  .app-container {
    display: flex;
    height: 100vh;
    background: #000;
  }
  
  /* Sidebar */
  .sidebar {
    width: 260px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(50px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
  }
  
  .sidebar-header {
    padding: 32px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .app-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 24px 16px;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
    margin-bottom: 8px;
  }
  
  .nav-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
  
  .nav-link.active {
    background: rgba(29, 185, 84, 0.2);
    color: #1db954;
  }
  
  .nav-link svg {
    width: 20px;
    height: 20px;
  }
  
  .nav-link span {
    font-size: 14px;
    font-weight: 500;
  }
  
  /* User Info */
  .sidebar-footer {
    padding: 24px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .user-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user-avatar span {
    font-size: 16px;
    font-weight: 600;
    color: white;
  }
  
  .user-details {
    flex: 1;
    min-width: 0;
  }
  
  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: white;
    margin: 0 0 2px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-email {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-role {
    font-size: 11px;
    color: #1db954;
    margin: 2px 0 0 0;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .btn-logout {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-logout:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .btn-logout svg {
    width: 20px;
    height: 20px;
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    overflow-y: auto;
    background: #000;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      width: 240px;
    }
  }
  
  @media (max-width: 640px) {
    .app-container {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .sidebar-nav {
      padding: 16px;
      display: flex;
      gap: 8px;
    }
    
    .nav-link {
      flex: 1;
      justify-content: center;
      margin: 0;
      padding: 8px;
    }
    
    .nav-link span {
      display: none;
    }
  }
  </style>
<template>
  <div class="main-layout">
    <!-- ───────── Sidebar (fixed) ───────── -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <img 
          src="https://admin.allmyfriendsinc.com/uploads/upload-1749252346013-699909862.png" 
          alt="All My Friends Inc"
          class="logo-image"
        />
      </div>

      <!-- app title -->
      <div class="sidebar-header">
        <h1 class="app-title">Invoice Tracker</h1>
      </div>

      <!-- nav -->
      <nav class="sidebar-nav">
        <router-link
          to="/"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'Artists' }">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.45.68-1.45 1.5v.5H16v6c0 .8-.69 1.5-1.5 1.5H7c-.8 0-1.5-.7-1.5-1.5V9H7V4.5C7 3.7 7.7 3 8.5 3h4c.8 0 1.5.7 1.5 1.5V6h2.5c1.1 0 2 .9 2 2 0 .37-.11.7-.28 1.01L20 16v4h-2z"/>
          </svg>
          <span>Artists</span>
        </router-link>

        <router-link
          to="/projects"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'AllProjects' }">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
          <span>Projects</span>
        </router-link>

        <router-link
          to="/invoices"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'AllInvoices' }">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span>Invoices</span>
        </router-link>

        <router-link
          v-if="authStore.isOwner"
          to="/users"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'UserManagement' }">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Users</span>
        </router-link>
      </nav>

      <!-- footer / current user -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ getUserInitials() }}
          </div>

          <div class="user-details">
            <p class="user-name">{{ authStore.profile?.name || 'User' }}</p>
            <p class="user-email">{{ authStore.user?.email }}</p>
            <p class="user-role">{{ formatRole(authStore.profile?.role) }}</p>
          </div>
        </div>

        <button @click="logout" class="logout-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- ───────── Main content ───────── -->
    <main class="main-content">
      <div class="content-wrapper">
        <router-view
          @create="handleCreate"
          @update="handleUpdate"
          @delete="handleDelete"
        />
      </div>
    </main>

    <!-- unified modal (unchanged) -->
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
import { useAuth } from '@/composables/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useArtistStore } from '@/store/artistStore'
import { useProjectStore } from '@/store/projectStore'
import { useInvoiceStore } from '@/store/invoiceStore'
import UnifiedModal from '@/components/UnifiedModal.vue'
import { showToast } from '@/utils/toast'

/* stores & router */
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const artistStore = useArtistStore()
const projectStore = useProjectStore()
const invoiceStore = useInvoiceStore()
const { logout } = useAuth()

/* modal state */
const modalState = ref({
  isOpen: false,
  type: null,
  item: null,
  defaultData: null
})

/* debug navigation */
watch(
  () => route.path,
  newPath => console.log('Route changed to:', newPath)
)

/* helpers */
const getUserInitials = () => {
  const name = authStore.profile?.name || authStore.user?.email || 'U'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatRole = role =>
  ({ owner: 'Owner', editor: 'Editor', invoicer: 'Invoicer', artist: 'Artist', viewer: 'Viewer' }[role] || role)

/* modal open/update/delete */
const handleCreate = (type, defaultData = null) => {
  modalState.value = { isOpen: true, type, item: null, defaultData }
}

const handleUpdate = (type, item) => {
  modalState.value = { isOpen: true, type, item, defaultData: null }
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
  } catch {
    showToast(`Failed to delete ${type}`, 'error')
  }
}

const closeModal = () => (modalState.value.isOpen = false)

const handleSave = async (type, data) => {
  try {
    const isUpdate = !!modalState.value.item
    switch (type) {
      case 'artist':
        isUpdate
          ? await artistStore.updateArtist(modalState.value.item.id, data)
          : await artistStore.createArtist(data)
        showToast(`Artist ${isUpdate ? 'updated' : 'created'} successfully`, 'success')
        break
      case 'project':
        isUpdate
          ? await projectStore.updateProject(modalState.value.item.id, data)
          : await projectStore.createProject(data)
        showToast(`Project ${isUpdate ? 'updated' : 'created'} successfully`, 'success')
        break
      case 'invoice':
        isUpdate
          ? await invoiceStore.updateInvoice(modalState.value.item.id, data)
          : await invoiceStore.createInvoice(data)
        showToast(`Invoice ${isUpdate ? 'updated' : 'created'} successfully`, 'success')
        break
    }
    closeModal()
  } catch {
    showToast(`Failed to ${modalState.value.item ? 'update' : 'create'} ${type}`, 'error')
  }
}

/* initial data */
onMounted(async () => {
  console.log('MainLayout mounted, current route:', route.path)
  try {
    await Promise.all([
      artistStore.loadArtists(),
      projectStore.loadProjects(),
      invoiceStore.loadInvoices()
    ])
  } catch (err) {
    console.error('Failed to load initial data:', err)
  }
})
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ────────── Sidebar ──────────*/
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 40;
  height: 100vh;
  width: 240px;
  background: rgba(28, 28, 30, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  flex-direction: column;
  user-select: none;
}

/* Logo Section */
.sidebar-logo {
  padding: 16px 24px 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-image {
  width: 100%;
  max-width: 192px; /* 240px sidebar - 48px padding */
  height: auto;
  display: block;
  object-fit: contain;
}

.sidebar-header {
  padding: 12px 24px 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.5px;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(29, 185, 84, 0.1);
  color: #1db954;
  border-left-color: #1db954;
}

.nav-link svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin: 0 0 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: #1db954;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.logout-btn {
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
  flex-shrink: 0;
}

.logout-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.logout-btn svg {
  width: 18px;
  height: 18px;
}

/* ────────── Main Content ──────────*/
.main-content {
  margin-left: 240px;
  flex: 1;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.content-wrapper {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ────────── Scrollbar ──────────*/
.sidebar-nav::-webkit-scrollbar,
.content-wrapper::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track,
.content-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb,
.content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover,
.content-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ────────── Responsive ──────────*/
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .content-wrapper {
    padding: 16px;
  }
}
</style>
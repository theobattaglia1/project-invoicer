<template>
  <div class="app-container">
    <!-- ────────── Sidebar ────────── -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">Invoice Tracker</h1>
      </div>

      <nav class="sidebar-nav">
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: $route.name === 'Artists' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          <span>Artists</span>
        </router-link>

        <router-link
          to="/projects"
          class="nav-link"
          :class="{ active: $route.name === 'AllProjects' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
            />
          </svg>
          <span>Projects</span>
        </router-link>

        <router-link
          to="/invoices"
          class="nav-link"
          :class="{ active: $route.name === 'AllInvoices' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
            />
          </svg>
          <span>Invoices</span>
        </router-link>

        <!-- Owner-only link -->
        <router-link
          v-if="authStore.isOwner"
          to="/users"
          class="nav-link"
          :class="{ active: $route.name === 'UserManagement' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
            />
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
            <path
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
            />
          </svg>
        </button>
      </div>
    </aside>

    <!-- ────────── Main content ────────── -->
    <main class="main-content">
      <router-view
        @create="handleCreate"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </main>

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

<!-- styles unchanged -->
<style scoped>
/* … existing CSS … */
</style>

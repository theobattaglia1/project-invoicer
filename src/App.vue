<template>
  <div id="app">
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Logo -->
        <div class="sidebar-header">
          <img
            src="@/assets/logo-white.png"
            alt="Logo"
            class="sidebar-logo"
          />
        </div>

        <!-- Main Navigation -->
        <nav class="sidebar-nav">
          <router-link
            to="/"
            class="nav-item"
            :class="{ active: $route.path === '/' }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Artists</span>
          </router-link>

          <router-link
            to="/projects"
            class="nav-item"
            :class="{ active: $route.path.includes('/projects') }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
            <span>Projects</span>
          </router-link>

          <router-link
            to="/invoices"
            class="nav-item"
            :class="{ active: $route.path.includes('/invoices') }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <span>Invoices</span>
          </router-link>
        </nav>

        <!-- Quick Stats -->
        <div class="sidebar-stats">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalArtists }}</div>
            <div class="stat-label">Artists</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.activeProjects }}</div>
            <div class="stat-label">Active Projects</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${{ stats.pendingInvoices }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>

        <!-- Bottom Actions -->
        <div class="sidebar-bottom">
          <button @click="openCreateModal" class="create-button">
            <svg class="create-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <span>Create New</span>
          </button>

          <button @click="openSettings" class="settings-button">
            <svg class="settings-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-scroll">
          <router-view 
            @create="handleCreate"
            @update="handleUpdate"
            @delete="handleDelete"
          />
        </div>
      </main>
    </div>

    <!-- Create Modal -->
    <UnifiedModal 
      v-if="showModal"
      :type="modalType"
      :item="modalItem"
      :defaultData="modalDefaultData"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Toast Notifications -->
    <Toast ref="toastRef" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArtistStore } from '@/store/artistStore'
import { useProjectStore } from '@/store/projectStore'
import { useInvoiceStore } from '@/store/invoiceStore'
import UnifiedModal from '@/components/UnifiedModal.vue'
import Toast from '@/components/Toast.vue'

export default {
  name: 'App',
  components: {
    UnifiedModal,
    Toast
  },
  setup() {
    const router = useRouter()
    const artistStore = useArtistStore()
    const projectStore = useProjectStore()
    const invoiceStore = useInvoiceStore()
    
    const showModal = ref(false)
    const modalType = ref('artist')
    const modalItem = ref(null)
    const modalDefaultData = ref(null)
    const toastRef = ref(null)

    const stats = computed(() => ({
      totalArtists: artistStore.artists.length,
      activeProjects: projectStore.projects.filter(p => p.status === 'active').length,
      pendingInvoices: invoiceStore.invoices
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + i.amount, 0)
        .toFixed(2)
    }))

    const openCreateModal = () => {
      const path = router.currentRoute.value.path
      if (path.includes('projects')) {
        modalType.value = 'project'
      } else if (path.includes('invoices')) {
        modalType.value = 'invoice'
      } else {
        modalType.value = 'artist'
      }
      modalItem.value = null
      modalDefaultData.value = null
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      modalItem.value = null
      modalDefaultData.value = null
    }

    const handleCreate = (type, defaultData = null) => {
      modalType.value = type
      modalItem.value = null
      modalDefaultData.value = defaultData
      showModal.value = true
    }

    const handleUpdate = (type, item) => {
      modalType.value = type
      modalItem.value = item
      modalDefaultData.value = null
      showModal.value = true
    }

    const handleDelete = async (type, id) => {
      try {
        switch (type) {
          case 'artist':
            await artistStore.deleteArtist(id)
            break
          case 'project':
            await projectStore.deleteProject(id)
            break
          case 'invoice':
            await invoiceStore.deleteInvoice(id)
            break
        }
        showToast('Item deleted successfully', 'success')
      } catch (error) {
        showToast('Failed to delete item', 'error')
      }
    }

    const handleSave = async (type, data) => {
      try {
        if (modalItem.value) {
          // Update existing
          switch (type) {
            case 'artist':
              await artistStore.updateArtist(modalItem.value.id, data)
              break
            case 'project':
              await projectStore.updateProject(modalItem.value.id, data)
              break
            case 'invoice':
              await invoiceStore.updateInvoice(modalItem.value.id, data)
              break
          }
          showToast(`${type} updated successfully`, 'success')
        } else {
          // Create new
          switch (type) {
            case 'artist':
              await artistStore.createArtist(data)
              break
            case 'project':
              await projectStore.createProject(data)
              break
            case 'invoice':
              await invoiceStore.createInvoice(data)
              break
          }
          showToast(`${type} created successfully`, 'success')
        }
        closeModal()
      } catch (error) {
        showToast(`Failed to save ${type}`, 'error')
      }
    }

    const openSettings = () => {
      showToast('Settings coming soon!', 'info')
    }

    const showToast = (message, type = 'info') => {
      toastRef.value?.show({ message, type })
    }

    onMounted(async () => {
      // Load initial data
      await Promise.all([
        artistStore.loadArtists(),
        projectStore.loadProjects(),
        invoiceStore.loadInvoices()
      ])
    })

    return {
      stats,
      showModal,
      modalType,
      modalItem,
      modalDefaultData,
      toastRef,
      openCreateModal,
      closeModal,
      handleCreate,
      handleUpdate,
      handleDelete,
      handleSave,
      openSettings
    }
  }
}
</script>

<style scoped>
#app {
  width: 100vw;
  height: 100vh;
  display: flex;
  background: #000;
}

.app-container {
  display: flex;
  width: 100%;
  height: 100%;
}

/* Sidebar Styles */
.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.sidebar-header {
  margin-bottom: 32px;
}

.sidebar-logo {
  height: 32px;
  width: auto;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(29, 185, 84, 0.2);
  color: #1db954;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

/* Stats Section */
.sidebar-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin: 24px 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Bottom Actions */
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.create-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-button:hover {
  background: #1ed760;
  transform: scale(1.05);
}

.create-icon {
  width: 20px;
  height: 20px;
}

.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: center;
}

.settings-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.settings-icon {
  width: 20px;
  height: 20px;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: #000;
}

.content-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom Scrollbar */
.content-scroll::-webkit-scrollbar {
  width: 12px;
}

.content-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.content-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.content-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
  background-clip: padding-box;
}
</style>
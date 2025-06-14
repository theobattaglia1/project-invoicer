<template>
  <div class="flex">
    <!-- ───────── Sidebar (fixed) ───────── -->
    <aside
      class="fixed left-0 top-0 z-40 h-screen w-60
             bg-zinc-900/80 backdrop-blur-lg border-r border-zinc-800
             text-white flex flex-col select-none">

      <!-- app logo / title -->
      <div class="px-6 py-5 font-bold tracking-wide text-lg">
        Invoice Tracker
      </div>

      <!-- nav -->
      <nav class="flex-1 overflow-y-auto space-y-1">
        <router-link
          to="/"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'Artists' }">
          <span class="i-lucide-users w-5 h-5 shrink-0" />
          <span>Artists</span>
        </router-link>

        <router-link
          to="/projects"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'AllProjects' }">
          <span class="i-lucide-folder-open w-5 h-5 shrink-0" />
          <span>Projects</span>
        </router-link>

        <router-link
          to="/invoices"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'AllInvoices' }">
          <span class="i-lucide-receipt w-5 h-5 shrink-0" />
          <span>Invoices</span>
        </router-link>

        <router-link
          v-if="authStore.isOwner"
          to="/users"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === 'UserManagement' }">
          <span class="i-lucide-user-circle w-5 h-5 shrink-0" />
          <span>Users</span>
        </router-link>
      </nav>

      <!-- footer / current user -->
      <div class="px-6 py-5 border-t border-zinc-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-emerald-500 text-zinc-900
                      flex items-center justify-center font-semibold text-sm">
            {{ getUserInitials() }}
          </div>

          <div class="text-xs leading-tight">
            <p class="font-medium truncate max-w-[9.5rem]">{{ authStore.profile?.name || 'User' }}</p>
            <p class="text-zinc-400 truncate max-w-[9.5rem]">{{ authStore.user?.email }}</p>
            <p class="text-emerald-400">{{ formatRole(authStore.profile?.role) }}</p>
          </div>
        </div>

        <button @click="logout" class="text-zinc-400 hover:text-rose-400 transition">
          <span class="i-lucide-log-out w-5 h-5" />
        </button>
      </div>
    </aside>

    <!-- ───────── Main content ───────── -->
    <main class="ml-60 flex-1 overflow-y-auto">
      <router-view
        @create="handleCreate"
        @update="handleUpdate"
        @delete="handleDelete"
      />
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
/* --- minimal extras ----------------------------------------- */
.nav-link {
  @apply flex items-center gap-2 px-6 py-3 text-sm text-zinc-300
         hover:bg-zinc-800/60 transition;
}
.router-link-active,
.nav-link.router-link-active {
  @apply bg-zinc-800 text-emerald-400;
}
/* keep icons small & aligned */
.nav-link span[class^="i-"] { @apply w-5 h-5; }
</style>
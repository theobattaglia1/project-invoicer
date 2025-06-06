<template>
  <div class="artist-layout">
    <!-- Artist Header -->
    <div class="artist-header" v-if="artist">
      <div class="header-content">
        <div class="artist-info">
          <div class="artist-avatar">
            <span>{{ getInitials(artist.name) }}</span>
          </div>
          <div>
            <h1 class="artist-name">{{ artist.name }}</h1>
            <div class="artist-details">
              <span v-if="artist.email">{{ artist.email }}</span>
              <span v-if="artist.email && artist.phone" class="separator">•</span>
              <span v-if="artist.phone">{{ artist.phone }}</span>
            </div>
          </div>
        </div>
        
        <!-- Artist Navigation -->
        <nav class="artist-nav">
          <router-link 
            :to="`/artist/${artistId}/overview`"
            class="nav-tab"
            :class="{ active: $route.name === 'ArtistOverview' }"
          >
            Overview
          </router-link>
          
          <router-link 
            :to="`/artist/${artistId}/projects`"
            class="nav-tab"
            :class="{ active: $route.name === 'ArtistProjects' }"
          >
            Projects
            <span class="tab-count">{{ projectCount }}</span>
          </router-link>
          
          <router-link 
            :to="`/artist/${artistId}/invoices`"
            class="nav-tab"
            :class="{ active: $route.name === 'ArtistInvoices' }"
          >
            Invoices
            <span class="tab-count">{{ invoiceCount }}</span>
          </router-link>
          
          <!-- Only show archive/trash for team members -->
          <template v-if="!authStore.isArtist">
            <router-link 
              :to="`/artist/${artistId}/archived`"
              class="nav-tab"
              :class="{ active: $route.name === 'ArtistArchived' }"
            >
              Archived
              <span v-if="archivedCount > 0" class="tab-count archived">{{ archivedCount }}</span>
            </router-link>
            
            <router-link 
              :to="`/artist/${artistId}/trash`"
              class="nav-tab"
              :class="{ active: $route.name === 'ArtistTrash' }"
            >
              Trash
              <span v-if="trashedCount > 0" class="tab-count trash">{{ trashedCount }}</span>
            </router-link>
          </template>
        </nav>
      </div>
    </div>

    <!-- Child View -->
    <div class="artist-content">
      <router-view 
        :artistId="artistId"
        @create="handleCreate"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useArtistStore } from '@/store/artistStore'
import { useProjectStore } from '@/store/projectStore'
import { useInvoiceStore } from '@/store/invoiceStore'
import { useAuthStore } from '@/store/authStore'

const props = defineProps({
  artistId: {
    type: String,
    required: true
  }
})

const route = useRoute()
const artistStore = useArtistStore()
const projectStore = useProjectStore()
const invoiceStore = useInvoiceStore()
const authStore = useAuthStore()

const emit = defineEmits(['create', 'update', 'delete'])

const artist = computed(() => artistStore.getArtistById(props.artistId))

const projectCount = computed(() => 
  projectStore.getProjectsByArtist(props.artistId).length
)

const activeInvoiceCount = computed(() => 
  invoiceStore.getInvoicesByArtist(props.artistId)
    .filter(i => !['archived', 'trashed'].includes(i.status)).length
)

const invoiceCount = computed(() => activeInvoiceCount.value)

const archivedCount = computed(() => 
  invoiceStore.getInvoicesByArtist(props.artistId)
    .filter(i => i.status === 'archived').length
)

const trashedCount = computed(() => 
  invoiceStore.getInvoicesByArtist(props.artistId)
    .filter(i => i.status === 'trashed').length
)

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const handleCreate = (type, defaultData) => {
  emit('create', type, defaultData)
}

const handleUpdate = (type, item) => {
  emit('update', type, item)
}

const handleDelete = (type, id) => {
  emit('delete', type, id)
}

// Reload data when artist changes
watch(() => props.artistId, async (newId) => {
  if (newId) {
    // Load artist-specific data if needed
    await projectStore.loadProjectsByArtist(newId)
    await invoiceStore.loadInvoicesByArtist(newId)
  }
}, { immediate: true })
</script>

<style scoped>
.artist-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.artist-header {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

.artist-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.artist-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.artist-avatar span {
  font-size: 32px;
  font-weight: 700;
  color: white;
}

.artist-name {
  font-size: 40px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
}

.artist-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.separator {
  color: rgba(255, 255, 255, 0.3);
}

/* Navigation Tabs */
.artist-nav {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  transition: all 0.2s ease;
}

.nav-tab:hover {
  color: white;
}

.nav-tab.active {
  color: white;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #1db954;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.tab-count.archived {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.tab-count.trash {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

/* Content Area */
.artist-content {
  flex: 1;
  overflow: hidden;
}
</style>
<template>
  <div class="artist-list-view">
    <!-- Header -->
    <div class="view-header">
      <h1 class="view-title">Artists</h1>
      <button @click="createArtist" class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Add Artist
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Search artists..."
        class="search-input"
      />
    </div>

    <!-- Artists Grid -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading artists...</p>
    </div>

    <div v-else-if="filteredArtists.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <h3>No artists found</h3>
      <p>Get started by adding your first artist</p>
      <button @click="createArtist" class="btn-primary">Add Artist</button>
    </div>

    <div v-else class="artists-grid">
      <div 
        v-for="artist in filteredArtists" 
        :key="artist.id" 
        class="artist-card"
        @click="viewArtistDetails(artist)"
      >
        <div class="artist-avatar">
          <span>{{ getInitials(artist.name) }}</span>
        </div>
        <div class="artist-info">
          <h3 class="artist-name">{{ artist.name }}</h3>
          <p class="artist-email">{{ artist.email || 'No email' }}</p>
          <div class="artist-stats">
            <span class="stat">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
              {{ getProjectCount(artist.id) }} projects
            </span>
            <span class="stat">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              {{ getInvoiceCount(artist.id) }} invoices
            </span>
          </div>
        </div>
        <div class="artist-actions">
          <button @click.stop="editArtist(artist)" class="btn-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button @click.stop="deleteArtist(artist)" class="btn-icon danger">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArtistStore } from '@/store/artistStore'
import { useProjectStore } from '@/store/projectStore'
import { useInvoiceStore } from '@/store/invoiceStore'

const router = useRouter()
const artistStore = useArtistStore()
const projectStore = useProjectStore()
const invoiceStore = useInvoiceStore()

const searchQuery = ref('')

const loading = computed(() => artistStore.loading)
const filteredArtists = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return artistStore.sortedArtists
  
  return artistStore.sortedArtists.filter(artist => 
    artist.name.toLowerCase().includes(query) ||
    (artist.email && artist.email.toLowerCase().includes(query))
  )
})

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getProjectCount = (artistId) => {
  return projectStore.getProjectsByArtist(artistId).length
}

const getInvoiceCount = (artistId) => {
  return invoiceStore.getInvoicesByArtist(artistId).length
}

const createArtist = () => {
  emit('create', 'artist')
}

const editArtist = (artist) => {
  emit('update', 'artist', artist)
}

const deleteArtist = async (artist) => {
  if (confirm(`Are you sure you want to delete ${artist.name}?`)) {
    emit('delete', 'artist', artist.id)
  }
}

const viewArtistDetails = (artist) => {
  router.push(`/artist/${artist.id}/overview`)
}

const emit = defineEmits(['create', 'update', 'delete'])

onMounted(() => {
  if (artistStore.artists.length === 0) {
    artistStore.loadArtists()
  }
})
</script>

<style scoped>
.artist-list-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.view-title {
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #1ed760;
  transform: translateY(-2px);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

/* Search Bar */
.search-bar {
  position: relative;
  margin-bottom: 32px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #1db954;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.artist-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
}

.artist-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.artist-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.artist-avatar span {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.artist-info {
  flex: 1;
}

.artist-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
}

.artist-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 12px 0;
}

.artist-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.stat svg {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.artist-actions {
  display: flex;
  gap: 8px;
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.artist-card:hover .artist-actions {
  opacity: 1;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-icon.danger:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #1db954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 24px 0;
}
</style>
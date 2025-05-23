<template>
  <div id="app">
    <!-- macOS-style Background -->
    <div class="app-background">
      <div class="gradient-orb gradient-orb-1"></div>
      <div class="gradient-orb gradient-orb-2"></div>
      <div class="gradient-orb gradient-orb-3"></div>
    </div>
    
    <!-- Main Container -->
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="traffic-lights">
            <span class="traffic-light close"></span>
            <span class="traffic-light minimize"></span>
            <span class="traffic-light maximize"></span>
          </div>
          <div class="app-title">
            <svg class="app-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="url(#icon-gradient)"/>
              <path d="M10 16.5v-9l6 4.5-6 4.5z" fill="white"/>
              <defs>
                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
            <span>Music</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <!-- Quick Access -->
          <div class="nav-section">
            <div 
              class="nav-item"
              :class="{ active: activeView === 'home' }"
              @click="activeView = 'home'"
            >
              <div class="nav-item-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                </svg>
              </div>
              <span>Home</span>
            </div>

            <div 
              class="nav-item"
              :class="{ active: activeView === 'search' }"
              @click="activeView = 'search'"
            >
              <div class="nav-item-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
              </div>
              <span>Search</span>
            </div>
          </div>

          <!-- Library -->
          <div class="nav-section">
            <div class="section-label">Library</div>
            
            <div 
              class="nav-item"
              :class="{ active: activeView === 'all-songs' }"
              @click="activeView = 'all-songs'"
            >
              <div class="nav-item-icon gradient-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
                </svg>
              </div>
              <span>Songs</span>
              <span class="nav-badge">{{ allSongs.length }}</span>
            </div>

            <div 
              class="nav-item"
              :class="{ active: activeView === 'artists' }"
              @click="activeView = 'artists'"
            >
              <div class="nav-item-icon gradient-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
                </svg>
              </div>
              <span>Artists</span>
              <span class="nav-badge">{{ artists.length }}</span>
            </div>

            <div 
              class="nav-item"
              :class="{ active: activeView === 'playlists' }"
              @click="activeView = 'playlists'"
            >
              <div class="nav-item-icon gradient-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" fill="currentColor"/>
                </svg>
              </div>
              <span>Playlists</span>
              <span class="nav-badge">{{ generalPlaylists.length }}</span>
            </div>
          </div>

          <!-- Playlists -->
          <div class="nav-section">
            <div class="section-label">
              Playlists
              <button class="add-playlist-btn" @click="showAddModal = true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
            
            <div 
              v-for="playlist in generalPlaylists.slice(0, 5)" 
              :key="playlist.id"
              class="nav-item playlist-item"
              :class="{ active: activeView === 'playlist' && activePlaylistId === playlist.id }"
              @click="setActiveView('playlist', playlist.id)"
            >
              <div class="playlist-cover">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
              </div>
              <span>{{ playlist.name }}</span>
            </div>
          </div>
        </nav>

        <!-- Storage Indicator -->
        <div class="storage-indicator">
          <div class="storage-header">
            <span class="storage-label">Storage</span>
            <span class="storage-amount">42GB <span class="storage-total">from 100GB</span></span>
          </div>
          <div class="storage-bar">
            <div class="storage-used" style="width: 42%"></div>
          </div>
          <button class="upgrade-btn">Upgrade plan</button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-wrapper">
          <!-- Dynamic content based on activeView -->
          <HomeView 
            v-if="activeView === 'home'" 
            :artists="artists" 
            :recentSongs="recentSongs"
            @view-artists="activeView = 'artists'"
            @select-artist="(id) => setActiveView('artist-songs', id)"
            @navigate="(view) => activeView = view"
          />
          <AllSongsView v-else-if="activeView === 'all-songs'" :songs="allSongs" />
          <ArtistsView v-else-if="activeView === 'artists'" :artists="artists" @add-artist="showAddModal = true" @select-artist="(id) => setActiveView('artist-songs', id)" />
          <playlistsview v-else-if="activeView === 'playlists'" :playlists="generalPlaylists" @create-playlist="showAddModal = true" @select-playlist="(id) => setActiveView('playlist', id)" />
          <ArtistSongsView v-else-if="activeView === 'artist-songs'" :artist="currentArtist" :songs="currentArtistSongs" />
        </div>
      </main>

      <!-- Now Playing Bar -->
      <NowPlayingBar v-if="currentSong" :song="currentSong" />
    </div>

    <!-- Add Content Modal -->
    <AddContentModal v-if="showAddModal" @close="showAddModal = false" @add="handleAddContent" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import HomeView from './components/HomeView.vue'
import AllSongsView from './components/AllSongsView.vue'
import ArtistsView from './components/ArtistsView.vue'
import playlistsview from './components/playlistsview.vue'
import ArtistSongsView from './components/ArtistSongsView.vue'
import NowPlayingBar from './components/NowPlayingBar.vue'
import AddContentModal from './components/AddContentModal.vue'

export default {
  name: 'App',
  components: {
    HomeView,
    AllSongsView,
    ArtistsView,
    playlistsview,
    ArtistSongsView,
    NowPlayingBar,
    AddContentModal
  },
  setup() {
    // Navigation state
    const activeView = ref('home')
    const activeArtistId = ref(null)
    const activePlaylistId = ref(null)

    // UI state
    const showAddModal = ref(false)
    const currentSong = ref(null)

    // Data
    const artists = ref([
      {
        id: 1,
        name: 'Glass Animals',
        image: null,
        genre: 'Indie Pop',
        followers: '2.5M'
      },
      {
        id: 2,
        name: 'Tame Impala',
        image: null,
        genre: 'Psychedelic Rock',
        followers: '3.2M'
      },
      {
        id: 3,
        name: 'Mac Miller',
        image: null,
        genre: 'Hip Hop',
        followers: '5.1M'
      }
    ])

    const songs = ref([
      { id: 1, title: 'Heat Waves', artist: 'Glass Animals', artistId: 1, album: 'Dreamland', duration: '3:58' },
      { id: 2, title: 'The Less I Know The Better', artist: 'Tame Impala', artistId: 2, album: 'Currents', duration: '3:36' },
      { id: 3, title: 'Tokyo Drifting', artist: 'Glass Animals', artistId: 1, album: 'Dreamland', duration: '4:52' },
      { id: 4, title: 'Elephant', artist: 'Tame Impala', artistId: 2, album: 'Lonerism', duration: '3:31' },
      { id: 5, title: 'Good News', artist: 'Mac Miller', artistId: 3, album: 'Circles', duration: '5:42' }
    ])

    const generalPlaylists = ref([
      { id: 'gp1', name: 'Favorites', songIds: [1, 2, 5], color: '#FF6B6B' },
      { id: 'gp2', name: 'Chill Vibes', songIds: [1, 3], color: '#4ECDC4' },
      { id: 'gp3', name: 'Workout Mix', songIds: [2, 4], color: '#45B7D1' },
      { id: 'gp4', name: 'Late Night', songIds: [3, 5], color: '#96CEB4' },
      { id: 'gp5', name: 'Focus Flow', songIds: [1, 4], color: '#DDA0DD' }
    ])

    // Computed
    const allSongs = computed(() => songs.value)
    const recentSongs = computed(() => songs.value.slice(0, 4))

    const currentArtist = computed(() => 
      artists.value.find(a => a.id === activeArtistId.value)
    )

    const currentArtistSongs = computed(() => 
      songs.value.filter(s => s.artistId === activeArtistId.value)
    )

    const currentPlaylist = computed(() => {
      return generalPlaylists.value.find(p => p.id === activePlaylistId.value)
    })

    const currentPlaylistSongs = computed(() => {
      const playlist = currentPlaylist.value
      if (!playlist) return []
      
      if (playlist.songIds) {
        return songs.value.filter(s => playlist.songIds.includes(s.id))
      }
      
      return []
    })

    // Methods
    const setActiveView = (view, id = null) => {
      activeView.value = view
      if (view === 'artist-songs') {
        activeArtistId.value = id
      } else if (view === 'playlist') {
        activePlaylistId.value = id
      }
    }

    const handleAddContent = (data) => {
      console.log('Add content:', data)
      showAddModal.value = false
    }

    // Demo: Set a current song
    onMounted(() => {
      setTimeout(() => {
        currentSong.value = songs.value[0]
      }, 1000)
    })

    return {
      activeView,
      activeArtistId,
      activePlaylistId,
      showAddModal,
      currentSong,
      artists,
      songs,
      generalPlaylists,
      allSongs,
      recentSongs,
      currentArtist,
      currentArtistSongs,
      currentPlaylist,
      currentPlaylistSongs,
      setActiveView,
      handleAddContent
    }
  }
}
</script>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Colors */
  --bg-primary: #0A0A0B;
  --bg-secondary: rgba(255, 255, 255, 0.04);
  --bg-tertiary: rgba(255, 255, 255, 0.08);
  --bg-hover: rgba(255, 255, 255, 0.06);
  --bg-active: rgba(255, 255, 255, 0.1);
  
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary: rgba(255, 255, 255, 0.4);
  
  --border-color: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.12);
  
  /* Accent Colors */
  --accent-primary: #FF6B6B;
  --accent-secondary: #4ECDC4;
  --accent-tertiary: #45B7D1;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
  --gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-tertiary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 16px 64px rgba(0, 0, 0, 0.25);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
}

#app {
  width: 100vw;
  height: 100vh;
  position: relative;
}

/* Background */
.app-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.gradient-orb-1 {
  width: 600px;
  height: 600px;
  background: var(--gradient-primary);
  top: -200px;
  left: -200px;
}

.gradient-orb-2 {
  width: 400px;
  height: 400px;
  background: var(--gradient-secondary);
  bottom: -100px;
  right: -100px;
  animation-delay: -5s;
}

.gradient-orb-3 {
  width: 300px;
  height: 300px;
  background: var(--gradient-tertiary);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Main Container */
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  z-index: 1;
}

/* Sidebar */
.sidebar {
  width: 260px;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(100px) saturate(180%);
  -webkit-backdrop-filter: blur(100px) saturate(180%);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Traffic Lights */
.sidebar-header {
  padding: 24px 20px 20px;
  position: relative;
}

.traffic-lights {
  display: flex;
  gap: 8px;
  position: absolute;
  top: 24px;
  left: 20px;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
}

.traffic-light.close {
  background: #FF5F57;
}

.traffic-light.minimize {
  background: #FFBD2E;
}

.traffic-light.maximize {
  background: #28CA42;
}

/* App Title */
.app-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 32px;
  padding: 0 4px;
}

.app-icon {
  width: 28px;
  height: 28px;
}

.app-title span {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 0;
}

.nav-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  padding: 0 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-playlist-btn {
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.add-playlist-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.add-playlist-btn svg {
  width: 14px;
  height: 14px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-active);
  color: var(--text-primary);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--accent-primary);
  border-radius: 0 2px 2px 0;
}

.nav-item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.nav-item-icon svg {
  width: 16px;
  height: 16px;
}

.gradient-icon {
  background: var(--gradient-primary);
}

.gradient-icon svg {
  color: white;
}

.nav-badge {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
}

/* Playlist Items */
.playlist-item {
  font-size: 13px;
}

.playlist-cover {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.playlist-cover svg {
  width: 14px;
  height: 14px;
  color: var(--text-tertiary);
}

/* Storage Indicator */
.storage-indicator {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
}

.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.storage-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.storage-amount {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
}

.storage-total {
  color: var(--text-tertiary);
  font-weight: 400;
}

.storage-bar {
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 16px;
}

.storage-used {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.upgrade-btn {
  width: 100%;
  padding: 10px 16px;
  background: var(--gradient-primary);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upgrade-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    left: -100%;
    z-index: 100;
    transition: left 0.3s ease;
  }
  
  .sidebar.open {
    left: 0;
  }
}
</style>
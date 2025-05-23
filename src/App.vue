<template>
  <div id="app">
    <!-- Background with gradient -->
    <div class="app-background"></div>
    
    <!-- Main Container -->
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="app-title">
            <svg class="app-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
            </svg>
            <span>Music</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <!-- HOME -->
          <div 
            class="nav-item"
            :class="{ active: activeView === 'home' }"
            @click="activeView = 'home'"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
            </svg>
            <span>Home</span>
          </div>

          <!-- ARTISTS -->
          <div class="nav-section">
            <div 
              class="nav-item section-header"
              @click="expandedSections.artists = !expandedSections.artists"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
              </svg>
              <span>Artists</span>
              <svg class="chevron" :class="{ expanded: expandedSections.artists }" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </div>

            <transition name="expand">
              <div v-if="expandedSections.artists" class="nav-subsection">
                <div 
                  v-for="artist in artists" 
                  :key="artist.id"
                  class="nav-artist"
                >
                  <div 
                    class="nav-item sub-item"
                    @click="toggleArtist(artist.id)"
                  >
                    <img v-if="artist.image" :src="artist.image" :alt="artist.name" class="artist-thumbnail">
                    <div v-else class="artist-placeholder">{{ artist.name.charAt(0) }}</div>
                    <span>{{ artist.name }}</span>
                    <svg class="chevron" :class="{ expanded: expandedArtists.includes(artist.id) }" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                    </svg>
                  </div>

                  <transition name="expand">
                    <div v-if="expandedArtists.includes(artist.id)" class="artist-content">
                      <div 
                        class="nav-item sub-sub-item"
                        @click="setActiveView('artist-songs', artist.id)"
                        :class="{ active: activeView === 'artist-songs' && activeArtistId === artist.id }"
                      >
                        <svg class="nav-icon mini" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
                        </svg>
                        <span>All Songs</span>
                      </div>
                      <div 
                        v-for="playlist in artist.playlists" 
                        :key="playlist.id"
                        class="nav-item sub-sub-item"
                        @click="setActiveView('playlist', playlist.id)"
                        :class="{ active: activeView === 'playlist' && activePlaylistId === playlist.id }"
                      >
                        <svg class="nav-icon mini" viewBox="0 0 24 24">
                          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" fill="currentColor"/>
                        </svg>
                        <span>{{ playlist.name }}</span>
                      </div>
                    </div>
                  </transition>
                </div>
              </div>
            </transition>
          </div>

          <!-- LIBRARY -->
          <div class="nav-section">
            <div 
              class="nav-item section-header"
              @click="expandedSections.library = !expandedSections.library"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" fill="currentColor"/>
              </svg>
              <span>Library</span>
              <svg class="chevron" :class="{ expanded: expandedSections.library }" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </div>

            <transition name="expand">
              <div v-if="expandedSections.library" class="nav-subsection">
                <div 
                  class="nav-item sub-item"
                  @click="activeView = 'all-songs'"
                  :class="{ active: activeView === 'all-songs' }"
                >
                  <svg class="nav-icon" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
                  </svg>
                  <span>All Songs</span>
                </div>
                <div 
                  v-for="playlist in generalPlaylists" 
                  :key="playlist.id"
                  class="nav-item sub-item"
                  @click="setActiveView('playlist', playlist.id)"
                  :class="{ active: activeView === 'playlist' && activePlaylistId === playlist.id }"
                >
                  <svg class="nav-icon" viewBox="0 0 24 24">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" fill="currentColor"/>
                  </svg>
                  <span>{{ playlist.name }}</span>
                </div>
              </div>
            </transition>
          </div>
        </nav>

        <!-- Add Content Button -->
        <div class="sidebar-footer">
          <button class="add-button" @click="showAddModal = true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
            <span>Add Content</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-glass">
          <!-- Dynamic content based on activeView -->
          <HomeView v-if="activeView === 'home'" :artists="artists" :recentSongs="recentSongs" />
          <AllSongsView v-else-if="activeView === 'all-songs'" :songs="allSongs" />
          <ArtistSongsView v-else-if="activeView === 'artist-songs'" :artist="currentArtist" :songs="currentArtistSongs" />
          <PlaylistView v-else-if="activeView === 'playlist'" :playlist="currentPlaylist" :songs="currentPlaylistSongs" />
        </div>
      </main>

      <!-- Now Playing Bar -->
      <NowPlayingBar v-if="currentSong" :song="currentSong" />
    </div>

    <!-- Add Content Modal -->
    <AddContentModal v-if="showAddModal" @close="showAddModal = false" @add="handleAddContent" />
    <!-- Visual Editors -->
<StyleEditor />
<LayoutEditor />
  </div>
</template>

<script>
import StyleEditor from './components/StyleEditor.vue'
import LayoutEditor from './components/LayoutEditor.vue'
import { ref, computed, onMounted } from 'vue'
import HomeView from './components/HomeView.vue'
import AllSongsView from './components/AllSongsView.vue'
import ArtistProfileView from './components/ArtistProfileView.vue'
import ArtistSongsView from './components/ArtistSongsView.vue'
import PlaylistView from './components/PlaylistView.vue'
import NowPlayingBar from './components/NowPlayingBar.vue'
import AddContentModal from './components/AddContentModal.vue'

export default {
  name: 'App',
  components: {
    HomeView,
    AllSongsView,
    ArtistProfileView,
    ArtistSongsView,
    PlaylistView,
    NowPlayingBar,
    AddContentModal,
    StyleEditor,
    LayoutEditor
  },
  setup() {
    // Navigation state
    const activeView = ref('home')
    const activeArtistId = ref(null)
    const activePlaylistId = ref(null)
    const expandedSections = ref({
      artists: true,
      library: true
    })
    const expandedArtists = ref([])

    // UI state
    const showAddModal = ref(false)
    const currentSong = ref(null)

    // Data
    const artists = ref([
      {
        id: 1,
        name: 'Glass Animals',
        image: null,
        playlists: [
          { id: 'p1', name: 'Dreamland' },
          { id: 'p2', name: 'How to Be a Human Being' }
        ]
      },
      {
        id: 2,
        name: 'Tame Impala',
        image: null,
        playlists: [
          { id: 'p3', name: 'Currents' },
          { id: 'p4', name: 'The Slow Rush' }
        ]
      }
    ])

    const songs = ref([
      { id: 1, title: 'Heat Waves', artist: 'Glass Animals', artistId: 1, album: 'Dreamland', duration: '3:58' },
      { id: 2, title: 'The Less I Know The Better', artist: 'Tame Impala', artistId: 2, album: 'Currents', duration: '3:36' },
      { id: 3, title: 'Tokyo Drifting', artist: 'Glass Animals', artistId: 1, album: 'Dreamland', duration: '4:52' },
      { id: 4, title: 'Elephant', artist: 'Tame Impala', artistId: 2, album: 'Lonerism', duration: '3:31' }
    ])

    const generalPlaylists = ref([
      { id: 'gp1', name: 'Favorites', songIds: [1, 2] },
      { id: 'gp2', name: 'Chill Vibes', songIds: [1, 3] },
      { id: 'gp3', name: 'Workout Mix', songIds: [2, 4] }
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
      // Check artist playlists
      for (const artist of artists.value) {
        const playlist = artist.playlists.find(p => p.id === activePlaylistId.value)
        if (playlist) return { ...playlist, artistName: artist.name }
      }
      // Check general playlists
      return generalPlaylists.value.find(p => p.id === activePlaylistId.value)
    })

    const currentPlaylistSongs = computed(() => {
      const playlist = currentPlaylist.value
      if (!playlist) return []
      
      if (playlist.songIds) {
        return songs.value.filter(s => playlist.songIds.includes(s.id))
      }
      
      // For artist playlists, return songs from that artist
      // In a real app, playlists would have their own song lists
      return currentArtistSongs.value
    })

    // Methods
    const toggleArtist = (artistId) => {
      const index = expandedArtists.value.indexOf(artistId)
      if (index > -1) {
        expandedArtists.value.splice(index, 1)
      } else {
        expandedArtists.value.push(artistId)
      }
    }

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
      // Handle adding artists, songs, or playlists
    }

    return {
      activeView,
      activeArtistId,
      activePlaylistId,
      expandedSections,
      expandedArtists,
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
      toggleArtist,
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

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Icons', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #000;
}

/* Background */
.app-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 50%, #16213e 100%);
  z-index: 0;
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
  width: 280px;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.app-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.app-icon {
  width: 32px;
  height: 32px;
  color: #fff;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.nav-section {
  margin-bottom: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #fff;
}

.section-header {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-icon.mini {
  width: 16px;
  height: 16px;
}

.chevron {
  width: 20px;
  height: 20px;
  margin-left: auto;
  transition: transform 0.3s ease;
}

.chevron.expanded {
  transform: rotate(180deg);
}

/* Artist Navigation */
.nav-subsection {
  overflow: hidden;
}

.nav-artist {
  position: relative;
}

.sub-item {
  padding-left: 48px;
  font-size: 14px;
}

.sub-sub-item {
  padding-left: 72px;
  font-size: 13px;
}

.artist-thumbnail {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.artist-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.artist-content {
  overflow: hidden;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.add-button {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.add-button:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.add-button svg {
  width: 20px;
  height: 20px;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: hidden;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.content-glass {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
}

/* Animations */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Artist Name Link */
.artist-name-link {
  flex: 1;
  transition: color 0.2s ease;
}

.artist-name-link:hover {
  color: #fff;
  text-decoration: underline;
}
</style>
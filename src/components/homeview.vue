<template>
  <div class="home-view">
    <!-- Header -->
    <div class="view-header">
      <h1 class="view-title">Good {{ greeting }}</h1>
      <p class="view-subtitle">What would you like to listen to today?</p>
    </div>

    <!-- Quick Access Cards -->
    <section class="section">
      <h2 class="section-title">Quick access</h2>
      <div class="quick-access-grid">
        <div 
          v-for="(item, index) in quickAccess" 
          :key="index"
          class="quick-card"
          @click="handleQuickAccess(item.title)"
        >
          <div class="quick-card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="item.icon"/>
            </svg>
          </div>
          <div class="quick-card-info">
            <h3>{{ item.title }}</h3>
            <p>{{ item.subtitle }}</p>
          </div>
          <button class="quick-play-btn" @click.stop="handleQuickPlay(item.title)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Recently Played -->
    <section class="section" v-if="recentSongs.length > 0">
      <div class="section-header">
        <h2 class="section-title">Recently played</h2>
        <button class="see-all-btn" @click="$emit('navigate', 'all-songs')">
          Show all
        </button>
      </div>
      <div class="content-grid">
        <div 
          v-for="song in recentSongs.slice(0, 8)" 
          :key="song.id"
          class="content-card"
          @click="playSong(song)"
          :class="{ playing: currentSong?.id === song.id }"
        >
          <div class="card-artwork">
            <img 
              v-if="song.artwork_path"
              :src="getArtworkUrl(song.artwork_path)"
              :alt="song.album"
              @error="handleImageError"
            />
            <div v-else class="artwork-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <button class="play-overlay" @click.stop="playSong(song)">
              <svg v-if="currentSong?.id !== song.id || !isPlaying" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ song.name }}</h3>
            <p class="card-subtitle">{{ song.artist }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Your Artists -->
    <section class="section" v-if="artists.length > 0">
      <div class="section-header">
        <h2 class="section-title">Your artists</h2>
        <button class="see-all-btn" @click="$emit('view-artists')">
          Show all
        </button>
      </div>
      <div class="content-grid">
        <div 
          v-for="artist in artists.slice(0, 8)" 
          :key="artist.id"
          class="artist-card"
          @click="$emit('select-artist', artist.id)"
        >
          <div class="artist-avatar">
            <img 
              v-if="artist.image_path || artist.artwork_path" 
              :src="getArtistImage(artist.artwork_path || artist.image_path)" 
              :alt="artist.name"
              @error="handleImageError"
            />
            <div v-else class="avatar-placeholder">
              {{ artist.name.charAt(0).toUpperCase() }}
            </div>
            <button class="play-overlay" @click.stop="playArtist(artist.id)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ artist.name }}</h3>
            <p class="card-subtitle">Artist</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Your Playlists -->
    <section class="section" v-if="playlists.length > 0">
      <div class="section-header">
        <h2 class="section-title">Your playlists</h2>
        <button class="see-all-btn" @click="$emit('navigate', 'playlists')">
          Show all
        </button>
      </div>
      <div class="content-grid">
        <div 
          v-for="playlist in playlists.slice(0, 8)" 
          :key="playlist.id"
          class="content-card"
          @click="$emit('select-playlist', playlist.id)"
        >
          <div class="card-artwork">
            <img 
              v-if="playlist.artwork_path" 
              :src="getArtworkUrl(playlist.artwork_path)" 
              :alt="playlist.name"
              @error="handleImageError"
            />
            <div v-else class="playlist-cover" :style="{ background: getPlaylistColor(playlist) }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
            </div>
            <button class="play-overlay" @click.stop="playPlaylist(playlist.id)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ playlist.name }}</h3>
            <p class="card-subtitle">{{ getPlaylistSongCount(playlist) }} songs</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <section v-if="totalSongs === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
      <h3>Welcome to your music library</h3>
      <p>Start by adding some music to build your collection</p>
      <button class="add-music-btn" @click="$emit('open-add-modal', 'import')">
        Add Music
      </button>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'

export default {
  name: 'HomeView',
  props: {
    artists: {
      type: Array,
      default: () => []
    },
    recentSongs: {
      type: Array,
      default: () => []
    },
    playlists: {
      type: Array,
      default: () => []
    },
    allSongs: {
      type: Array,
      default: () => []
    }
  },
  emits: ['view-artists', 'select-artist', 'navigate', 'select-playlist', 'open-add-modal'],
  setup(props, { emit }) {
    const playback = usePlaybackIntegration()

    const currentSong = computed(() => playback.currentSong.value)
    const isPlaying = computed(() => playback.isPlaying.value)

    const currentHour = new Date().getHours()
    const greeting = computed(() => {
      if (currentHour < 12) return 'morning'
      if (currentHour < 18) return 'afternoon'
      return 'evening'
    })

    const quickAccess = computed(() => [
      {
        title: 'Recently Added',
        subtitle: `${props.allSongs?.slice(-10).length || 0} latest`,
        icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
      },
      {
        title: 'All Songs',
        subtitle: `${props.allSongs?.length || 0} songs`,
        icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'
      },
      {
        title: 'Artists',
        subtitle: `${props.artists?.length || 0} artists`,
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'
      },
      {
        title: 'Playlists',
        subtitle: `${props.playlists?.length || 0} playlists`,
        icon: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'
      }
    ])

    const totalSongs = computed(() => props.allSongs?.length || 0)

    const playSong = async (song) => {
      try {
        await playback.playSong(song, props.allSongs || [])
      } catch (error) {
        console.error('Failed to play song:', error)
      }
    }

    const playArtist = async (artistId) => {
      try {
        await playback.playArtist(artistId)
      } catch (error) {
        console.error('Failed to play artist:', error)
      }
    }

    const playPlaylist = async (playlistId) => {
      try {
        await playback.playPlaylist(playlistId)
      } catch (error) {
        console.error('Failed to play playlist:', error)
      }
    }

    const handleQuickAccess = (title) => {
      switch(title) {
        case 'All Songs':
          emit('navigate', 'all-songs')
          break
        case 'Playlists':
          emit('navigate', 'playlists')
          break
        case 'Artists':
          emit('view-artists')
          break
        case 'Recently Added':
          emit('navigate', 'all-songs')
          break
      }
    }

    const handleQuickPlay = async (title) => {
      try {
        switch(title) {
          case 'All Songs':
            if (props.allSongs?.length > 0) {
              await playback.playSong(props.allSongs[0], props.allSongs)
            }
            break
          case 'Recently Added':
            const recentlyAdded = props.allSongs?.slice(-10) || []
            if (recentlyAdded.length > 0) {
              await playback.playSong(recentlyAdded[0], recentlyAdded)
            }
            break
          case 'Artists':
            if (props.artists?.length > 0) {
              await playback.playArtist(props.artists[0].id)
            }
            break
          case 'Playlists':
            if (props.playlists?.length > 0) {
              await playback.playPlaylist(props.playlists[0].id)
            }
            break
        }
      } catch (error) {
        console.error('Failed to play from quick access:', error)
      }
    }

    const getArtworkUrl = (path) => {
      if (!path) return null
      const timestamp = new Date().getTime()
      return convertFileSrc(path) + '?t=' + timestamp
    }

    const getArtistImage = (imagePath) => {
      if (!imagePath) return null
      return convertFileSrc(imagePath)
    }

    const getPlaylistSongCount = (playlist) => {
      return playlist.song_ids?.length || 0
    }

    const getPlaylistColor = (playlist) => {
      const colors = ['#1e1e1e', '#262626', '#2e2e2e', '#363636']
      const index = playlist.name.charCodeAt(0) % colors.length
      return playlist.color || colors[index]
    }

    const handleImageError = (e) => {
      e.target.style.display = 'none'
    }

    return {
      greeting,
      quickAccess,
      totalSongs,
      currentSong,
      isPlaying,
      handleQuickAccess,
      handleQuickPlay,
      playSong,
      playArtist,
      playPlaylist,
      getArtistImage,
      getPlaylistSongCount,
      getPlaylistColor,
      getArtworkUrl,
      handleImageError
    }
  }
}
</script>

<style scoped>
.home-view {
  padding: 24px 32px;
  color: white;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.view-header {
  margin-bottom: 48px;
}

.view-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.view-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* Sections */
.section {
  margin-bottom: 56px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin-bottom: 0;
}

.see-all-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.see-all-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* Quick Access Grid */
.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 200px));
  gap: 12px;
  margin-top: 20px;
}

.quick-card {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.quick-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.quick-card-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.quick-card-icon svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.6);
}

.quick-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.quick-card-info h3 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.2;
}

.quick-card-info p {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.2;
}

.quick-play-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.quick-card:hover .quick-play-btn {
  opacity: 1;
}

.quick-play-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.06);
}

.quick-play-btn svg {
  width: 14px;
  height: 14px;
  color: white;
  margin-left: 1px;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.content-card,
.artist-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.content-card:hover,
.artist-card:hover {
  transform: translateY(-2px);
}

.content-card.playing .card-artwork {
  box-shadow: 0 4px 16px rgba(29, 185, 84, 0.25);
}

.card-artwork,
.artist-avatar {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.artist-avatar {
  border-radius: 50%;
}

.card-artwork img,
.artist-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder,
.playlist-cover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
}

.artwork-placeholder svg,
.playlist-cover svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.2);
}

.avatar-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.5);
}

.play-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.2s ease;
}

.content-card:hover .play-overlay,
.artist-card:hover .play-overlay,
.content-card.playing .play-overlay {
  opacity: 1;
  transform: scale(1);
}

.play-overlay:hover {
  transform: scale(1.06);
  background: rgba(0, 0, 0, 0.9);
}

.play-overlay svg {
  width: 16px;
  height: 16px;
  color: white;
  margin-left: 1px;
}

.card-info {
  padding: 0 2px;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.card-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 40px;
  max-width: 360px;
  margin: 0 auto;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

.add-music-btn {
  padding: 10px 24px;
  background: white;
  border: none;
  border-radius: 20px;
  color: black;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-music-btn:hover {
  transform: scale(1.04);
  background: rgba(255, 255, 255, 0.9);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .quick-access-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .home-view {
    padding: 20px;
  }
  
  .content-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
}
</style>
<template>
  <div class="home-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Good {{ greeting }}</h1>
        <p class="view-subtitle">What would you like to listen to today?</p>
      </div>
      <div class="header-actions">
        <button class="header-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11H7v2h4v4h2v-4h4v-2h-4V7h-2v4z"/>
          </svg>
          <span>New Music</span>
        </button>
      </div>
    </div>

    <!-- Quick Access Cards -->
    <section class="section">
      <h2 class="section-title">Jump back in</h2>
      <div class="quick-access-grid">
        <div 
          v-for="(item, index) in quickAccess" 
          :key="index"
          class="quick-card"
          :style="{ '--gradient': item.gradient }"
        >
          <div class="quick-card-bg"></div>
          <div class="quick-card-content">
            <div class="quick-card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path :d="item.icon"/>
              </svg>
            </div>
            <div class="quick-card-info">
              <h3>{{ item.title }}</h3>
              <p>{{ item.subtitle }}</p>
            </div>
          </div>
          <button class="quick-play-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Recently Played -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Recently played</h2>
        <button class="see-all-btn">See all</button>
      </div>
      <div class="songs-grid">
        <div 
          v-for="song in recentSongs" 
          :key="song.id"
          class="song-card"
        >
          <div class="song-artwork">
            <div class="artwork-placeholder">
              <svg viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" rx="8" fill="url(#artwork-gradient)"/>
                <path d="M50 30v20.55c-1.18-.68-2.54-1.1-4-1.1-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8V40h8V30H50z" fill="white" opacity="0.3"/>
              </svg>
            </div>
            <button class="play-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
          <div class="song-info">
            <h3 class="song-title">{{ song.title }}</h3>
            <p class="song-artist">{{ song.artist }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Your Artists -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Your artists</h2>
        <button class="see-all-btn" @click="$emit('view-artists')">See all</button>
      </div>
      <div class="artists-row">
        <div 
          v-for="artist in artists.slice(0, 5)" 
          :key="artist.id"
          class="artist-card"
          @click="$emit('select-artist', artist.id)"
        >
          <div class="artist-avatar">
            <div v-if="!artist.image" class="avatar-placeholder">
              {{ artist.name.charAt(0) }}
            </div>
            <img v-else :src="artist.image" :alt="artist.name">
            <div class="artist-gradient"></div>
          </div>
          <h3 class="artist-name">{{ artist.name }}</h3>
          <p class="artist-type">{{ artist.genre || 'Artist' }}</p>
        </div>
      </div>
    </section>

    <!-- Library Stats -->
    <section class="section">
      <h2 class="section-title">Your library</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3 class="stat-number">{{ totalSongs }}</h3>
            <p class="stat-label">Songs</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3 class="stat-number">{{ artists.length }}</h3>
            <p class="stat-label">Artists</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3 class="stat-number">{{ totalPlaylists }}</h3>
            <p class="stat-label">Playlists</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SVG Definitions -->
    <svg width="0" height="0">
      <defs>
        <linearGradient id="artwork-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'HomeView',
  props: {
    artists: Array,
    recentSongs: Array
  },
  emits: ['view-artists', 'select-artist', 'navigate'],
  setup(props, { emit }) {
    const currentHour = new Date().getHours()
    const greeting = computed(() => {
      if (currentHour < 12) return 'morning'
      if (currentHour < 18) return 'afternoon'
      return 'evening'
    })

    const quickAccess = ref([
      {
        title: 'Recently Added',
        subtitle: 'Your latest music',
        icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        title: 'Most Played',
        subtitle: 'Your favorite tracks',
        icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      {
        title: 'All Songs',
        subtitle: 'Browse everything',
        icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      {
        title: 'Playlists',
        subtitle: 'Your collections',
        icon: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      }
    ])

    const totalSongs = computed(() => props.recentSongs?.length || 0)
    const totalPlaylists = computed(() => 5) // You can pass this as a prop later

    const handleQuickAccess = (title) => {
      switch(title) {
        case 'All Songs':
          emit('navigate', 'all-songs')
          break
        case 'Playlists':
          emit('navigate', 'playlists')
          break
        case 'Recently Added':
          emit('navigate', 'all-songs') // Could add a filter later
          break
        case 'Most Played':
          emit('navigate', 'all-songs') // Could add sorting later
          break
      }
    }

    return {
      greeting,
      quickAccess,
      totalSongs,
      totalPlaylists,
      handleQuickAccess
    }
  }
}
</script>

<style scoped>
.home-view {
  padding: 0;
}

/* Header */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-content {
  flex: 1;
}

.view-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.view-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-secondary);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.header-btn svg {
  width: 20px;
  height: 20px;
}

/* Sections */
.section {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text-primary);
}

.see-all-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.see-all-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

/* Quick Access Cards */
.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 48px;
}

.quick-card {
  position: relative;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
}

.quick-card-bg {
  position: absolute;
  inset: 0;
  background: var(--gradient);
  opacity: 0.9;
}

.quick-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.quick-card:hover::before {
  opacity: 1;
}

.quick-card-content {
  position: relative;
  height: 100%;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1;
}

.quick-card-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-card-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.quick-card-info {
  flex: 1;
  min-width: 0;
}

.quick-card-info h3 {
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
}

.quick-card-info p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-play-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 2;
}

.quick-card:hover .quick-play-btn {
  opacity: 1;
}

.quick-play-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.1);
}

.quick-play-btn svg {
  width: 20px;
  height: 20px;
  color: white;
  margin-left: 2px;
}

/* Songs Grid */
.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.song-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.song-card:hover {
  transform: translateY(-4px);
}

.song-artwork {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-bottom: 12px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.artwork-placeholder {
  position: absolute;
  inset: 0;
}

.artwork-placeholder svg {
  width: 100%;
  height: 100%;
}

.play-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.song-card:hover .play-overlay {
  opacity: 1;
  transform: translateY(0);
}

.play-overlay:hover {
  transform: scale(1.1);
  background: rgba(0, 0, 0, 0.9);
}

.play-overlay svg {
  width: 18px;
  height: 18px;
  color: white;
  margin-left: 2px;
}

.song-info {
  padding: 0 4px;
}

.song-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Artists Row */
.artists-row {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.artist-card {
  flex-shrink: 0;
  width: 140px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.artist-card:hover {
  transform: translateY(-4px);
}

.artist-avatar {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: 16px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-secondary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  background: var(--gradient-primary);
  color: white;
}

.artist-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 60%, rgba(0, 0, 0, 0.7));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.artist-card:hover .artist-gradient {
  opacity: 1;
}

.artist-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.artist-type {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.follow-btn {
  padding: 6px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.follow-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
}

/* Discover Grid */
.discover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.mix-card {
  position: relative;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.mix-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--mix-color);
  opacity: 0.8;
}

.mix-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.mix-artwork {
  width: 100%;
  height: 160px;
  margin-bottom: 16px;
  position: relative;
}

.mix-icons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  height: 100%;
}

.mix-icon {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.mix-icon svg {
  width: 40px;
  height: 40px;
  color: var(--mix-color);
  opacity: 0.3;
}

.mix-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.mix-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Library Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: var(--gradient-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 1200px) {
  .quick-access-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .view-title {
    font-size: 24px;
  }
  
  .songs-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  
  .discover-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
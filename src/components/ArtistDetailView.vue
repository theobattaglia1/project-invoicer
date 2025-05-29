<template>
  <div class="artist-songs-view">
    <!-- Spotify-style Hero Section -->
    <div class="artist-hero">
      <!-- Background Image -->
      <div class="hero-background">
        <img 
          v-if="artist?.artwork_path || artist?.image_path" 
          :src="getArtworkUrl(artist.artwork_path || artist.image_path)" 
          :alt="artist.name"
          class="hero-image"
        />
        <div v-else class="hero-placeholder">
          <div class="placeholder-icon">
            {{ artist?.name.charAt(0).toUpperCase() }}
          </div>
        </div>
        <!-- Gradient overlay -->
        <div class="hero-gradient"></div>
      </div>
      
      <!-- Content -->
      <div class="hero-content">
        <div class="verified-badge" v-if="artist?.verified">
          <svg viewBox="0 0 24 24" fill="currentColor" class="verified-icon">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>Verified Artist</span>
        </div>
        
        <h1 class="artist-name">{{ artist?.name }}</h1>
        
        <p class="artist-stats">
          <span class="monthly-listeners">{{ formatNumber(monthlyListeners) }} monthly listeners</span>
        </p>
      </div>
    </div>

    <!-- Action buttons section -->
    <div class="actions-section">
      <button class="play-button" @click="playArtist">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      
      <button class="shuffle-button" @click="shufflePlay">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
        </svg>
      </button>
      
      <button class="follow-button" :class="{ following: isFollowing }" @click="toggleFollow">
        {{ isFollowing ? 'Following' : 'Follow' }}
      </button>
      
      <button class="more-button">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
    </div>

    <!-- Songs Section -->
    <div class="songs-section">
      <h2 class="section-title">Songs</h2>
      
      <div class="songs-list">
        <div 
          v-for="(song, index) in songs" 
          :key="song.id"
          class="song-item"
          @click="playSong(song)"
        >
          <div class="song-number">{{ index + 1 }}</div>
          <div class="song-artwork">
            <img 
              v-if="song.artwork_path" 
              :src="getArtworkUrl(song.artwork_path)" 
              :alt="song.name"
            />
            <div v-else class="artwork-placeholder">
              <svg viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" fill="rgba(255,255,255,0.05)" rx="4"/>
                <path d="M20 12v8.22c-.47-.34-1.02-.55-1.6-.55-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2V16h3.2v-4H20z" fill="rgba(255,255,255,0.3)"/>
              </svg>
            </div>
            <div class="play-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div class="song-details">
            <p class="song-title">{{ song.name }}</p>
            <p class="song-album">{{ song.album }}</p>
          </div>
          <div class="song-duration">{{ formatDuration(song.duration) }}</div>
          <button class="song-menu" @click.stop="showSongMenu(song)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useMusicStore } from '@/store/music'

const props = defineProps({
  artist: Object,
  songs: Array
})

const emit = defineEmits(['play-artist', 'toggle-follow'])

const musicStore = useMusicStore()
const isFollowing = ref(false)

// Mock monthly listeners for now
const monthlyListeners = computed(() => Math.floor(Math.random() * 1000000) + 50000)

const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
  return num.toString()
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getArtworkUrl = (path) => {
  if (!path) return null
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  try {
    const url = convertFileSrc(path)
    const cacheBuster = new Date().getTime()
    return `${url}?t=${cacheBuster}`
  } catch (error) {
    console.error('Error converting artwork path:', error)
    return null
  }
}

const playArtist = () => {
  if (props.songs.length > 0) {
    musicStore.playQueue(props.songs)
  }
}

const shufflePlay = () => {
  if (props.songs.length > 0) {
    const shuffled = [...props.songs].sort(() => Math.random() - 0.5)
    musicStore.playQueue(shuffled)
  }
}

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  emit('toggle-follow', isFollowing.value)
}

const playSong = (song) => {
  musicStore.playSong(song)
}

const showSongMenu = (song) => {
  console.log('Show menu for:', song)
  // Implement context menu
}
</script>

<style scoped>
.artist-songs-view {
  height: 100%;
  overflow-y: auto;
  background-color: #121212;
  color: #fff;
}

/* Hero Section - Spotify Style */
.artist-hero {
  position: relative;
  height: 40vh;
  min-height: 340px;
  max-height: 500px;
  display: flex;
  align-items: flex-end;
  padding: 0 32px 24px;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: brightness(0.6);
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #535353 0%, #121212 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 200px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.1);
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent 0, rgba(0,0,0,.5) 100%), 
              linear-gradient(rgba(0,0,0,.1) 0, #121212 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.verified-icon {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 50%;
  padding: 4px;
}

.artist-name {
  font-size: 96px;
  font-weight: 900;
  line-height: 96px;
  letter-spacing: -0.04em;
  margin: 0 0 24px;
  padding: 0.08em 0;
}

.artist-stats {
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
}

/* Actions Section */
.actions-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 32px;
  background: linear-gradient(rgba(0,0,0,0.6) 0, #121212 100%);
}

.play-button {
  width: 56px;
  height: 56px;
  background: #1db954;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-button:hover {
  transform: scale(1.04);
  background: #1ed760;
}

.play-button svg {
  width: 24px;
  height: 24px;
  color: #000;
  margin-left: 2px;
}

.shuffle-button,
.more-button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.shuffle-button:hover,
.more-button:hover {
  color: #fff;
  transform: scale(1.04);
}

.shuffle-button svg,
.more-button svg {
  width: 24px;
  height: 24px;
}

.follow-button {
  padding: 8px 32px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.follow-button:hover {
  border-color: #fff;
  transform: scale(1.04);
}

.follow-button.following {
  border-color: #1db954;
}

/* Songs Section */
.songs-section {
  padding: 32px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  letter-spacing: -0.04em;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-item {
  display: grid;
  grid-template-columns: 24px 40px 1fr 60px 40px;
  gap: 16px;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.song-number {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

.song-item:hover .song-number {
  color: #fff;
}

.song-artwork {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
}

.song-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.song-item:hover .play-overlay {
  opacity: 1;
}

.play-overlay svg {
  width: 20px;
  height: 20px;
  color: #fff;
}

.song-details {
  min-width: 0;
}

.song-title {
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
}

.song-item:hover .song-title {
  color: #1db954;
}

.song-album {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-duration {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: right;
}

.song-menu {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0;
}

.song-item:hover .song-menu {
  opacity: 1;
}

.song-menu:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.song-menu svg {
  width: 20px;
  height: 20px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .artist-name {
    font-size: 72px;
    line-height: 72px;
  }
}

@media (max-width: 768px) {
  .artist-name {
    font-size: 48px;
    line-height: 48px;
  }
  
  .actions-section {
    padding: 16px;
    gap: 16px;
  }
  
  .follow-button {
    padding: 6px 16px;
    font-size: 12px;
  }
}
</style>
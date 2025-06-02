<!-- src/components/ArtistProfileView.vue -->
<template>
  <div class="artist-profile-view">
    <!-- Hero Section -->
    <div class="artist-hero">
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
        <div class="hero-gradient"></div>
      </div>
      
      <div class="hero-content">
        <p class="artist-label">ARTIST</p>
        <h1 class="artist-name">{{ artist?.name }}</h1>
        <p class="artist-info">
          <span v-if="artist?.genre">{{ artist.genre }} • </span>
          <span>{{ songs.length }} songs</span>
          <span v-if="totalDuration"> • {{ totalDuration }}</span>
        </p>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="actions-section">
      <button class="play-button" @click="playArtist">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      
      <button class="action-button" @click="shufflePlay">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
        </svg>
      </button>
      
      <button class="action-button" @click="showMoreOptions">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
      
      <button class="create-playlist-button" @click="createArtistPlaylist">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
        </svg>
        Create Playlist
      </button>
    </div>

    <!-- Content Section -->
    <div class="artist-content">
      <!-- Recent Tracks -->
      <section class="content-section">
        <h2 class="section-title">Recent tracks</h2>
        <div class="tracks-list">
          <div 
            v-for="(track, index) in recentlyAddedTracks" 
            :key="track.id"
            class="track-item"
            :class="{ playing: currentSong?.id === track.id }"
            @click="playSong(track)"
          >
            <div class="track-number">
              <span v-if="currentSong?.id !== track.id">{{ index + 1 }}</span>
              <div v-else class="playing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            
            <div class="track-cover">
              <img 
                v-if="track.artwork_path" 
                :src="getArtworkUrl(track.artwork_path)" 
                :alt="track.album"
              />
              <div v-else class="cover-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            </div>
            
            <div class="track-info">
              <p class="track-name">{{ track.name }}</p>
              <p class="track-meta">
                {{ track.album || 'Unknown Album' }}
                <span v-if="track.date_added" class="track-date">
                  • {{ formatRelativeDate(track.date_added) }}
                </span>
              </p>
            </div>
            
            <p class="track-duration">{{ formatDuration(track.duration) }}</p>
            
            <button class="track-menu" @click.stop="showTrackMenu(track, $event)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
        <button class="show-all-button" @click="showAllSongs">
          Show all songs
        </button>
      </section>

      <!-- Playlists -->
      <section class="content-section" v-if="artistPlaylists.length > 0">
        <div class="section-header">
          <h2 class="section-title">Playlists</h2>
          <button class="see-all-button" @click="showAllPlaylists">
            Show all
          </button>
        </div>
        <div class="playlists-grid">
          <div 
            v-for="playlist in artistPlaylists.slice(0, 6)" 
            :key="playlist.id"
            class="playlist-card"
            @click="openPlaylist(playlist)"
          >
            <div class="playlist-cover">
              <img 
                v-if="playlist.artwork_path" 
                :src="getArtworkUrl(playlist.artwork_path)" 
                :alt="playlist.name"
              />
              <div v-else class="playlist-cover-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
              </div>
              <button class="playlist-play-button" @click.stop="playPlaylist(playlist)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
            <p class="playlist-name">{{ playlist.name }}</p>
            <p class="playlist-info">{{ playlist.song_ids?.length || 0 }} songs</p>
          </div>
        </div>
      </section>

      <!-- About -->
      <section class="content-section" v-if="artist?.bio">
        <h2 class="section-title">About</h2>
        <div class="about-content">
          <p class="artist-bio">{{ artist.bio }}</p>
        </div>
      </section>

      <!-- Statistics -->
      <section class="content-section">
        <h2 class="section-title">Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-value">{{ songs.length }}</p>
            <p class="stat-label">Songs</p>
          </div>
          <div class="stat-card">
            <p class="stat-value">{{ artistPlaylists.length }}</p>
            <p class="stat-label">Playlists</p>
          </div>
          <div class="stat-card">
            <p class="stat-value">{{ totalSize }}</p>
            <p class="stat-label">Total Size</p>
          </div>
          <div class="stat-card">
            <p class="stat-value">{{ mostRecentDate }}</p>
            <p class="stat-label">Last Added</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useMusicStore } from '@/store/music'
import { usePlaybackIntegration } from '@/composables/usePlaybackIntegration'

const props = defineProps({
  artist: Object,
  songs: Array,
  playlists: Array
})

const emit = defineEmits(['show-all-songs', 'show-album', 'show-playlist', 'create-artist-playlist'])

const musicStore = useMusicStore()
const playback = usePlaybackIntegration()
const contextMenuRef = inject('contextMenu', null)

// Current playback state
const currentSong = computed(() => playback.currentSong.value)

// Get artist's playlists
const artistPlaylists = computed(() => {
  return props.playlists?.filter(p => p.artist_id === props.artist?.id) || []
})

// Get recently added tracks
const recentlyAddedTracks = computed(() => {
  const sorted = [...(props.songs || [])]
    .sort((a, b) => {
      const dateA = a.date_added ? new Date(a.date_added).getTime() : 0
      const dateB = b.date_added ? new Date(b.date_added).getTime() : 0
      return dateB - dateA
    })
  return sorted.slice(0, 5)
})

// Calculate total duration
const totalDuration = computed(() => {
  const totalSeconds = props.songs?.reduce((total, song) => total + (song.duration || 0), 0) || 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

// Calculate total file size
const totalSize = computed(() => {
  const bytes = props.songs?.reduce((total, song) => total + (song.file_size || 0), 0) || 0
  return formatFileSize(bytes)
})

// Get most recent date
const mostRecentDate = computed(() => {
  const dates = props.songs
    ?.map(s => s.date_added ? new Date(s.date_added).getTime() : 0)
    .filter(d => d > 0) || []
  
  if (dates.length === 0) return 'N/A'
  
  const mostRecent = new Date(Math.max(...dates))
  return formatRelativeDate(mostRecent)
})

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatRelativeDate = (date) => {
  if (!date) return 'Unknown'
  
  const now = new Date()
  const diffMs = now - new Date(date)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  
  return new Date(date).toLocaleDateString()
}

const getArtworkUrl = (path) => {
  if (!path) return null
  const timestamp = new Date().getTime()
  return convertFileSrc(path) + '?t=' + timestamp
}

const playArtist = async () => {
  if (props.songs?.length > 0) {
    await playback.playSong(props.songs[0], props.songs)
  }
}

const shufflePlay = async () => {
  if (props.songs?.length > 0) {
    const shuffled = [...props.songs].sort(() => Math.random() - 0.5)
    await playback.playSong(shuffled[0], shuffled)
  }
}

const playSong = async (song) => {
  await playback.playSong(song, props.songs)
}

const showTrackMenu = (track, event) => {
  contextMenuRef?.value?.show(event, [track], 'song')
}

const showMoreOptions = (event) => {
  contextMenuRef?.value?.show(event, [props.artist], 'artist')
}

const showAllSongs = () => {
  emit('show-all-songs', props.artist)
}

const createArtistPlaylist = () => {
  emit('create-artist-playlist', props.artist)
}

const playPlaylist = async (playlist) => {
  const playlistSongs = props.songs?.filter(s => 
    playlist.song_ids?.includes(s.id)
  ) || []
  
  if (playlistSongs.length > 0) {
    await playback.playSong(playlistSongs[0], playlistSongs)
  }
}

const openPlaylist = (playlist) => {
  emit('show-playlist', playlist)
}

const showAllPlaylists = () => {
  console.log('Show all playlists')
}
</script>

<style scoped>
/* Use CSS variables for fonts and image visibility */
.artist-profile-view {
  height: 100%;
  overflow-y: auto;
  background: #000;
  color: white;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  line-height: var(--body-font-line-height);
}

.artist-profile-view img {
  display: var(--hide-images);
}

/* Hero Section */
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
  filter: brightness(0.5);
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 200px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.08);
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent 0, rgba(0,0,0,0.5) 100%), 
              linear-gradient(rgba(0,0,0,0.1) 0, #000 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.artist-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
}

.artist-name {
  font-family: var(--header-font-family);
  font-size: var(--header-font-size);
  font-weight: var(--header-font-weight);
  line-height: var(--header-font-line-height);
  margin: 0 0 24px;
  letter-spacing: -0.04em;
}

.artist-info {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  line-height: var(--body-font-line-height);
  color: rgba(255, 255, 255, 0.7);
}

/* Actions Section */
.actions-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 32px;
  background: linear-gradient(rgba(0,0,0,0.6) 0, #000 100%);
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
  transition: all 0.15s ease;
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

.action-button {
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
  transition: all 0.15s ease;
}

.action-button:hover {
  color: white;
  transform: scale(1.04);
}

.action-button svg {
  width: 24px;
  height: 24px;
}

.create-playlist-button {
  margin-left: auto;
  padding: 11px 32px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 500px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
}

.create-playlist-button:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.02);
}

.create-playlist-button svg {
  width: 20px;
  height: 20px;
}

/* Content */
.artist-content {
  padding: 0 32px 32px;
}

.content-section {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-family: var(--header-font-family);
  font-size: var(--header-font-size);
  font-weight: var(--header-font-weight);
  line-height: var(--header-font-line-height);
  margin-bottom: 24px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.see-all-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 4px 8px;
}

.see-all-button:hover {
  color: white;
}

/* Tracks List */
.tracks-list {
  margin-bottom: 16px;
}

.track-item {
  display: grid;
  grid-template-columns: 32px 40px 1fr 80px 40px;
  gap: 16px;
  align-items: center;
  padding: 8px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  line-height: var(--body-font-line-height);
}

.track-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.track-item.playing {
  color: #1db954;
}

.track-number {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.playing-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
}

.playing-indicator span {
  width: 3px;
  height: 12px;
  background: #1db954;
  border-radius: 3px;
  animation: playing 0.8s ease-in-out infinite;
}

.playing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.playing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes playing {
  0%, 100% { height: 12px; opacity: 0.8; }
  50% { height: 4px; opacity: 1; }
}

.track-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.track-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.track-info {
  min-width: 0;
}

.track-name {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-item:hover .track-name {
  color: white;
}

.track-meta {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-date {
  font-size: 12px;
}

.track-duration {
  text-align: right;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.track-menu {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
}

.track-item:hover .track-menu {
  opacity: 1;
}

.track-menu:hover {
  color: white;
}

.track-menu svg {
  width: 20px;
  height: 20px;
}

.show-all-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.15s ease;
}

.show-all-button:hover {
  color: white;
}

/* Playlists Grid */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
}

.playlist-card {
  cursor: pointer;
  transition: all 0.15s ease;
}

.playlist-card:hover {
  transform: translateY(-4px);
}

.playlist-cover {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.playlist-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-cover-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
}

.playlist-cover-placeholder svg {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.3);
}

.playlist-play-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 48px;
  height: 48px;
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
  transition: all 0.2s ease;
}

.playlist-card:hover .playlist-play-button {
  opacity: 1;
  transform: translateY(0);
}

.playlist-play-button:hover {
  transform: scale(1.06);
  background: rgba(0, 0, 0, 0.9);
}

.playlist-play-button svg {
  width: 20px;
  height: 20px;
  color: white;
  margin-left: 2px;
}

.playlist-name {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-info {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  color: rgba(255, 255, 255, 0.6);
}

/* About Section */
.about-content {
  max-width: 800px;
}

.artist-bio {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  line-height: var(--body-font-line-height);
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-wrap;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.15s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.stat-value {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  margin-bottom: 8px;
  font-size: 32px;
  font-weight: 700;
}

.stat-label {
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 14px;
}

/* Scrollbar */
.artist-profile-view::-webkit-scrollbar {
  width: 12px;
}

.artist-profile-view::-webkit-scrollbar-track {
  background: transparent;
}

.artist-profile-view::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.artist-profile-view::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}
</style>

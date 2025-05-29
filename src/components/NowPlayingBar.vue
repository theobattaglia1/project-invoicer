<!-- components/NowPlayingBar.vue - Vinyl slides out from under the bar -->
<template>
  <div class="now-playing-wrapper">
    <!-- Vinyl Record - Sibling of the bar, positioned behind it -->
    <div 
      :class="[
        'vinyl-container',
        isVinylVisible ? 'visible' : '',
        isManuallyShown ? 'manual' : ''
      ]"
      @click="toggleVinyl"
    >
      <div 
        :class="[
          'vinyl-record',
          isPlaying ? 'spinning' : ''
        ]"
      >
        <!-- Album art fills entire circle -->
        <img 
          v-if="currentSong?.artwork_path" 
          :src="getArtworkUrl(currentSong.artwork_path)"
          :alt="currentSong?.album"
          class="album-art"
          @error="handleImageError"
        />
        <div v-else class="album-art-placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        
        <!-- Center hole overlay -->
        <div class="vinyl-hole"></div>
        
        <!-- Grooves effect -->
        <div class="vinyl-grooves"></div>
      </div>
    </div>

    <!-- Now Playing Bar -->
    <div class="now-playing-bar">
      <!-- Left Section - Song Info -->
      <div class="player-left">
        <div class="song-info">
          <div class="song-details">
            <div class="song-title">{{ currentSong?.name || 'No song playing' }}</div>
            <div class="song-artist" @click="$emit('navigate-to-artist', currentSong?.artist_id)">
              {{ currentSong?.artist || '—' }}
            </div>
          </div>
          
          <button 
            @click="toggleFavorite"
            class="icon-btn favorite-btn"
            :class="{ active: isFavorite }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Center Section - Controls and Progress -->
      <div class="player-center">
        <div class="playback-controls">
          <button 
            @click="toggleShuffle"
            class="control-btn small"
            :class="{ active: isShuffled }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          <button 
            @click="playPrevious" 
            class="control-btn"
            :disabled="!hasPrevious"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          <button 
            @click="togglePlayPause"
            class="control-btn play-btn"
            :disabled="!currentSong || isLoading"
          >
            <div v-if="isLoading" class="loading-spinner">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2v4a8 8 0 1 0 8 8h4a12 12 0 1 1-12-12z"/>
              </svg>
            </div>
            <svg v-else-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>

          <button 
            @click="playNext" 
            class="control-btn"
            :disabled="!hasNext"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>

          <button 
            @click="toggleRepeat"
            class="control-btn small"
            :class="{ active: repeatMode }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>

        <div class="playback-bar">
          <span class="time current">{{ formattedCurrentTime }}</span>
          
          <div 
            ref="progressBar"
            @click="handleSeek"
            @mousedown="startDragging"
            class="progress-bar"
          >
            <div class="progress-bg"></div>
            <div 
              class="progress-fill"
              :style="{ width: `${progress}%` }"
            ></div>
            <div 
              class="progress-thumb"
              :style="{ left: `${progress}%` }"
            ></div>
          </div>
          
          <span class="time duration">{{ formattedDuration }}</span>
        </div>
      </div>

      <!-- Right Section - Extra Controls -->
      <div class="player-right">
        <button class="icon-btn" @click="showQueue">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
        </button>

        <button class="icon-btn" @click="showLyrics" v-if="false">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </button>

        <div class="volume-control">
          <button 
            @click="toggleMute"
            class="icon-btn"
          >
            <svg v-if="!isMuted && volume > 0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>
          
          <div 
            ref="volumeSlider"
            @click="handleVolumeClick"
            class="volume-slider"
          >
            <div class="volume-bg"></div>
            <div 
              class="volume-fill"
              :style="{ width: `${isMuted ? 0 : volume}%` }"
            ></div>
            <div 
              class="volume-thumb"
              :style="{ left: `${isMuted ? 0 : volume}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'

// Props
const props = defineProps({
  currentSong: Object,
  isPlaying: Boolean,
  currentTime: Number,
  duration: Number,
  volume: Number,
  isShuffled: Boolean,
  repeatMode: Boolean
})

// Emits
const emit = defineEmits([
  'toggle-playback',
  'seek',
  'previous',
  'next',
  'toggle-shuffle',
  'toggle-repeat',
  'volume-change',
  'navigate-to-artist'
])

// Local state
const isFavorite = ref(false)
const isVinylVisible = ref(false)
const isManuallyShown = ref(false)
const progressBar = ref(null)
const volumeSlider = ref(null)
const isDragging = ref(false)
const isMuted = ref(false)
const isLoading = ref(false)
const autoHideTimer = ref(null)

// Computed
const progress = computed(() => {
  if (!props.duration || props.duration === 0) return 0
  return Math.min(100, Math.max(0, (props.currentTime / props.duration) * 100))
})

const formattedCurrentTime = computed(() => formatTime(props.currentTime))
const formattedDuration = computed(() => formatTime(props.duration))

const hasNext = computed(() => {
  // This would need to be passed from parent or store
  return true
})

const hasPrevious = computed(() => {
  // This would need to be passed from parent or store
  return true
})

// Methods
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getArtworkUrl = (path) => {
  if (!path) return null
  const timestamp = new Date().getTime()
  return convertFileSrc(path) + '?t=' + timestamp
}

const handleImageError = (e) => {
  e.target.style.display = 'none'
}

const togglePlayPause = () => {
  emit('toggle-playback')
}

const playNext = () => {
  emit('next')
}

const playPrevious = () => {
  emit('previous')
}

const toggleShuffle = () => {
  emit('toggle-shuffle')
}

const toggleRepeat = () => {
  emit('toggle-repeat')
}

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}

const toggleVinyl = () => {
  if (!props.currentSong) return
  
  if (isVinylVisible.value && !isManuallyShown.value) {
    // If auto-shown, clicking makes it manual
    isManuallyShown.value = true
    clearAutoHideTimer()
  } else if (isManuallyShown.value) {
    // If manually shown, clicking hides it
    isManuallyShown.value = false
    isVinylVisible.value = false
  } else {
    // If hidden, clicking shows it manually
    isVinylVisible.value = true
    isManuallyShown.value = true
  }
}

const showVinylAuto = () => {
  if (!isManuallyShown.value) {
    isVinylVisible.value = true
    clearAutoHideTimer()
    autoHideTimer.value = setTimeout(() => {
      if (!isManuallyShown.value) {
        isVinylVisible.value = false
      }
    }, 5000)
  }
}

const clearAutoHideTimer = () => {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
    autoHideTimer.value = null
  }
}

const handleSeek = (event) => {
  if (!progressBar.value || !props.duration) return
  
  const rect = progressBar.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = (clickX / rect.width) * 100
  const seekTime = (percentage / 100) * props.duration
  
  emit('seek', seekTime)
}

const startDragging = (event) => {
  isDragging.value = true
  handleSeek(event)
  
  const handleMouseMove = (e) => {
    if (isDragging.value) {
      handleSeek(e)
    }
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleVolumeClick = (event) => {
  if (!volumeSlider.value) return
  
  const rect = volumeSlider.value.getBoundingClientRect()
  const percentage = ((event.clientX - rect.left) / rect.width) * 100
  const newVolume = Math.max(0, Math.min(100, percentage))
  emit('volume-change', newVolume)
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    emit('volume-change', 0)
  } else {
    emit('volume-change', props.volume || 70)
  }
}

const showQueue = () => {
  console.log('Show queue')
}

const showLyrics = () => {
  console.log('Show lyrics')
}

// Watch for song changes
watch(() => props.currentSong?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Reset manual state on song change
    isManuallyShown.value = false
    // Auto-show vinyl when new song plays
    showVinylAuto()
  } else if (!newId) {
    // Hide vinyl if no song
    isVinylVisible.value = false
    isManuallyShown.value = false
    clearAutoHideTimer()
  }
})

// Watch for play state changes
watch(() => props.isPlaying, (playing) => {
  if (playing && props.currentSong && !isVinylVisible.value && !isManuallyShown.value) {
    showVinylAuto()
  }
})

// Cleanup
onUnmounted(() => {
  clearAutoHideTimer()
})
</script>

<style scoped>
/* Wrapper to contain both vinyl and bar */
.now-playing-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 90px;
  z-index: 1000;
}

/* Vinyl Container - Behind the bar as a sibling */
.vinyl-container {
  position: absolute;
  bottom: 90px; /* Start at top of the 90px bar */
  left: 20px; /* Within sidebar area (232px wide) */
  width: 200px;
  height: 200px;
  z-index: 1; /* Behind the bar within the wrapper */
  transform: translateY(105px); /* Push down so only top 1/3 shows */
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  cursor: pointer;
}

.vinyl-container.visible {
  transform: translateY(0); /* Slide up to show fully above the bar */
}

.vinyl-container.visible.manual {
  transform: translateY(-10px); /* Slightly higher when manually shown */
}

/* Now Playing Bar */
.now-playing-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 90px;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 2; /* Above the vinyl within the wrapper */
  display: flex;
  align-items: center;
  padding: 12px 0; /* Add vertical padding */
  box-sizing: border-box;
}

/* Vinyl Record Styling */
.vinyl-record {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}

.vinyl-container:hover .vinyl-record {
  transform: scale(1.02);
}

.vinyl-record.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Album Art */
.album-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: brightness(0.9);
}

.album-art-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 30%, #404040 0%, #1a1a1a 100%);
  color: #b3b3b3;
}

.album-art-placeholder svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

/* Vinyl Details */
.vinyl-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #000;
  z-index: 2;
  pointer-events: none;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.8),
    0 1px 0 rgba(255, 255, 255, 0.1);
}

.vinyl-grooves {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at center,
    transparent 0,
    transparent 3px,
    rgba(255, 255, 255, 0.03) 3px,
    rgba(255, 255, 255, 0.03) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* Main Player Content */
.player-content {
  height: 100%;
  max-height: 66px; /* Constrain height to center content */
  display: grid;
  grid-template-columns: 30% 40% 30%;
  align-items: center;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

/* Left Section */
.player-left {
  display: flex;
  align-items: center;
  padding-left: 16px; /* Extra padding to account for vinyl */
}

.song-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.song-details {
  min-width: 0;
  flex: 1;
}

.song-title {
  font-size: 14px;
  color: #fff;
  font-weight: 400;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 11px;
  color: #b3b3b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.song-artist:hover {
  color: #fff;
  text-decoration: underline;
}

.favorite-btn {
  margin-left: auto;
}

/* Center Section */
.player-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 722px;
  margin: 0 auto;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-btn {
  background: none;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
}

.control-btn:hover:not(:disabled) {
  color: #fff;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn svg {
  width: 16px;
  height: 16px;
}

.control-btn.small svg {
  width: 16px;
  height: 16px;
}

.control-btn.play-btn {
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 50%;
  color: #000;
}

.control-btn.play-btn:hover:not(:disabled) {
  transform: scale(1.06);
}

.control-btn.play-btn svg {
  width: 16px;
  height: 16px;
}

.control-btn.active {
  color: #1db954;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.playback-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.time {
  font-size: 11px;
  color: #b3b3b3;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  flex: 1;
  height: 32px;
  width: 50vw;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.progress-bg {
  position: absolute;
  width: 100%;
  height: 4px;
  background: #535353;
  border-radius: 2px;
}

.progress-fill {
  position: absolute;
  height: 4px;
  background: #fff;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.1s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.progress-bar:hover .progress-bg {
  background: #535353;
}

.progress-bar:hover .progress-fill {
  background: #1db954;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

/* Right Section */
.player-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.icon-btn {
  background: none;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  padding: 0;
  transition: color 0.1s ease;
}

.icon-btn:hover {
  color: #fff;
}

.icon-btn.active {
  color: #1db954;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 93px;
  height: 12px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.volume-bg {
  position: absolute;
  width: 100%;
  height: 4px;
  background: #535353;
  border-radius: 2px;
}

.volume-fill {
  position: absolute;
  height: 4px;
  background: #fff;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.volume-thumb {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.1s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.volume-slider:hover .volume-bg {
  background: #535353;
}

.volume-slider:hover .volume-fill {
  background: #1db954;
}

.volume-slider:hover .volume-thumb {
  opacity: 1;
}
</style>
<template>
  <div class="now-playing-bar">
    <div class="now-playing-container">
      <!-- Song Info -->
      <div class="song-info-section">
        <div class="song-artwork">
          <div class="artwork-inner">
            <svg viewBox="0 0 56 56" class="artwork-placeholder">
              <rect width="56" height="56" rx="8" fill="url(#playing-gradient)"/>
              <path d="M28 18v11.07c-.71-.41-1.52-.65-2.4-.65-2.65 0-4.8 2.15-4.8 4.8s2.15 4.8 4.8 4.8 4.8-2.15 4.8-4.8V24h4.8v-6H28z" fill="white" opacity="0.3"/>
            </svg>
          </div>
        </div>
        <div class="song-details">
          <h4 class="song-title">{{ song.title }}</h4>
          <p class="song-artist">{{ song.artist }}</p>
        </div>
        <button class="favorite-btn" :class="{ active: isFavorite }" @click="toggleFavorite">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
      
      <!-- Player Controls -->
      <div class="player-section">
        <div class="control-buttons">
          <button class="control-btn small">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
          <button class="control-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button class="control-btn play" @click="togglePlay">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button class="control-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button class="control-btn small" :class="{ active: isShuffle }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
        </div>
        
        <div class="progress-section">
          <span class="time-label">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar-container" @click="seekToPosition">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
            </div>
          </div>
          <span class="time-label">{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <!-- Extra Controls -->
      <div class="extra-controls">
        <button class="control-btn small">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </button>
        <button class="control-btn small">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
          </svg>
        </button>
        <div class="volume-control">
          <button class="control-btn small" @click="toggleMute">
            <svg v-if="!isMuted && volume > 0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>
          <div class="volume-slider-container">
            <input 
              type="range" 
              :value="volume"
              max="100"
              @input="setVolume($event.target.value)"
              class="volume-slider"
            >
          </div>
        </div>
        <button class="control-btn small">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- SVG Definitions -->
    <svg width="0" height="0">
      <defs>
        <linearGradient id="playing-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'NowPlayingBar',
  props: {
    song: Object
  },
  setup() {
    const isPlaying = ref(false)
    const isFavorite = ref(false)
    const isShuffle = ref(false)
    const isMuted = ref(false)
    const currentTime = ref(0)
    const duration = ref(180) // 3:00 for demo
    const volume = ref(70)
    
    const progressPercent = computed(() => 
      duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    )
    
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    const togglePlay = () => {
      isPlaying.value = !isPlaying.value
    }
    
    const toggleFavorite = () => {
      isFavorite.value = !isFavorite.value
    }
    
    const toggleMute = () => {
      isMuted.value = !isMuted.value
    }
    
    const seekToPosition = (event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const percent = ((event.clientX - rect.left) / rect.width) * 100
      currentTime.value = (percent / 100) * duration.value
    }
    
    const setVolume = (value) => {
      volume.value = parseInt(value)
      if (value > 0) isMuted.value = false
    }
    
    // Simulate playback
    setInterval(() => {
      if (isPlaying.value && currentTime.value < duration.value) {
        currentTime.value += 0.1
      }
    }, 100)
    
    return {
      isPlaying,
      isFavorite,
      isShuffle,
      isMuted,
      currentTime,
      duration,
      volume,
      progressPercent,
      formatTime,
      togglePlay,
      toggleFavorite,
      toggleMute,
      seekToPosition,
      setVolume
    }
  }
}
</script>

<style scoped>
.now-playing-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 88px;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(100px) saturate(180%);
  -webkit-backdrop-filter: blur(100px) saturate(180%);
  border-top: 1px solid var(--border-color);
  z-index: 100;
}

.now-playing-container {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  padding: 0 24px;
  gap: 32px;
}

/* Song Info Section */
.song-info-section {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.song-artwork {
  flex-shrink: 0;
}

.artwork-inner {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: var(--bg-secondary);
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
}

.song-details {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
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

.favorite-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.favorite-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.favorite-btn.active {
  color: var(--accent-primary);
}

.favorite-btn svg {
  width: 20px;
  height: 20px;
}

/* Player Section */
.player-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-btn {
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
}

.control-btn.small {
  width: 32px;
  height: 32px;
}

.control-btn:hover {
  color: var(--text-primary);
}

.control-btn.play {
  width: 48px;
  height: 48px;
  background: white;
  color: black;
}

.control-btn.play:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.control-btn.play svg {
  width: 20px;
  height: 20px;
  margin-left: 2px;
}

.control-btn.active {
  color: var(--accent-primary);
}

.control-btn.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--accent-primary);
  border-radius: 50%;
}

.control-btn svg {
  width: 18px;
  height: 18px;
}

.control-btn.small svg {
  width: 16px;
  height: 16px;
}

/* Progress Section */
.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 600px;
}

.time-label {
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  min-width: 35px;
}

.progress-bar-container {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  overflow: visible;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-bar-container:hover .progress-handle {
  opacity: 1;
}

/* Extra Controls */
.extra-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider-container {
  width: 100px;
}

.volume-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-secondary);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 1024px) {
  .now-playing-container {
    grid-template-columns: 300px 1fr auto;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .now-playing-container {
    grid-template-columns: 1fr;
    padding: 12px 16px;
  }
  
  .player-section {
    order: -1;
  }
  
  .extra-controls {
    display: none;
  }
}
</style>
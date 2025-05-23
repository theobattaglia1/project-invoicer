<template>
  <div class="now-playing-bar">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>
    
    <div class="bar-content">
      <!-- Song Info -->
      <div class="song-info">
        <div class="song-artwork">
          <svg viewBox="0 0 48 48" class="artwork-placeholder">
            <rect width="48" height="48" fill="url(#now-playing-gradient)" rx="6"/>
            <path d="M24 14v11.07c-.71-.41-1.52-.65-2.4-.65-2.65 0-4.8 2.15-4.8 4.8s2.15 4.8 4.8 4.8 4.8-2.15 4.8-4.8V20h4.8v-6H24z" fill="rgba(255,255,255,0.3)"/>
          </svg>
        </div>
        <div class="song-details">
          <p class="song-title">{{ song.title }}</p>
          <p class="song-artist">{{ song.artist }}</p>
        </div>
        <button class="favorite-button" :class="{ active: isFavorite }" @click="toggleFavorite">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
      
      <!-- Player Controls -->
      <div class="player-controls">
        <div class="control-buttons">
          <button class="control-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26c.783.112 1.45.374 2.001.785.552.411.988.924 1.308 1.538.32.615.48 1.304.48 2.067 0 .763-.16 1.452-.48 2.067-.32.614-.756 1.127-1.308 1.538-.551.41-1.218.673-2.001.785l7.227 8.26h-3.308L12 18.153 5.756 27.55H2.448l7.227-8.26c-.783-.112-1.45-.374-2.001-.785-.552-.411-.988-.924-1.308-1.538-.32-.615-.48-1.304-.48-2.067 0-.763.16-1.452.48-2.067.32-.614.756-1.127 1.308-1.538.551-.41 1.218-.673 2.001-.785L2.448 2.25h3.308L12 11.647 18.244 2.25z"/>
            </svg>
          </button>
          <button class="control-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button class="control-button play" @click="togglePlay">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button class="control-button">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button class="control-button" :class="{ active: isRepeat }" @click="toggleRepeat">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>
        
        <div class="time-display">
          <span class="time-current">{{ formatTime(currentTime) }}</span>
          <div class="time-slider">
            <input 
              type="range" 
              :value="currentTime"
              :max="duration"
              @input="seekTo($event.target.value)"
              class="slider"
            >
          </div>
          <span class="time-total">{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <!-- Volume and Actions -->
      <div class="volume-controls">
        <button class="control-button" @click="toggleMute">
          <svg v-if="!isMuted" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </button>
        <div class="volume-slider">
          <input 
            type="range" 
            :value="volume"
            max="100"
            @input="setVolume($event.target.value)"
            class="slider"
          >
        </div>
        <button class="control-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </button>
        <button class="control-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- SVG Definitions -->
    <svg width="0" height="0">
      <defs>
        <linearGradient id="now-playing-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff0844;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffb199;stop-opacity:1" />
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
    const isRepeat = ref(false)
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
    
    const toggleRepeat = () => {
      isRepeat.value = !isRepeat.value
    }
    
    const toggleMute = () => {
      isMuted.value = !isMuted.value
    }
    
    const seekTo = (value) => {
      currentTime.value = parseInt(value)
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
      isRepeat,
      isMuted,
      currentTime,
      duration,
      volume,
      progressPercent,
      formatTime,
      togglePlay,
      toggleFavorite,
      toggleRepeat,
      toggleMute,
      seekTo,
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
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.progress-bar {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.progress-fill {
  height: 100%;
  background: #fff;
  transition: width 0.1s ease;
}

.bar-content {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  gap: 32px;
}

/* Song Info */
.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
}

.song-artwork {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
  font-weight: 500;
  color: #fff;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-button {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.favorite-button:hover {
  color: #fff;
}

.favorite-button.active {
  color: #ff4757;
}

.favorite-button svg {
  width: 18px;
  height: 18px;
}

/* Player Controls */
.player-controls {
  flex: 1;
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

.control-button {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.control-button:hover {
  color: #fff;
  transform: scale(1.1);
}

.control-button.play {
  width: 40px;
  height: 40px;
  background: #fff;
  color: #000;
}

.control-button.play:hover {
  transform: scale(1.15);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
}

.control-button.active {
  color: #1db954;
}

.control-button svg {
  width: 18px;
  height: 18px;
}

.control-button.play svg {
  width: 20px;
  height: 20px;
  margin-left: 2px;
}

/* Time Display */
.time-display {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 600px;
}

.time-current,
.time-total {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-variant-numeric: tabular-nums;
  min-width: 40px;
}

.time-slider {
  flex: 1;
}

/* Volume Controls */
.volume-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  justify-content: flex-end;
}

.volume-slider {
  width: 100px;
}

/* Slider Styles */
.slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}
</style>
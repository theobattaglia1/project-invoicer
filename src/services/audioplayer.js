// src/services/audioPlayer.js
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

class AudioPlayer {
  constructor() {
    this.audio = new Audio()
    this.isInitialized = false
    
    // Reactive state
    this.currentTime = ref(0)
    this.duration = ref(0)
    this.isPlaying = ref(false)
    this.isLoading = ref(false)
    this.volume = ref(0.7)
    this.isMuted = ref(false)
    
    // Computed properties
    this.progress = computed(() => {
      if (this.duration.value === 0) return 0
      return (this.currentTime.value / this.duration.value) * 100
    })
    
    this.formattedCurrentTime = computed(() => this.formatTime(this.currentTime.value))
    this.formattedDuration = computed(() => this.formatTime(this.duration.value))
    
    this.init()
  }
  
  init() {
    // Set up event listeners
    this.audio.addEventListener('loadstart', () => {
      this.isLoading.value = true
    })
    
    this.audio.addEventListener('loadedmetadata', () => {
      this.duration.value = this.audio.duration
      this.isLoading.value = false
    })
    
    this.audio.addEventListener('timeupdate', () => {
      this.currentTime.value = this.audio.currentTime
    })
    
    this.audio.addEventListener('ended', () => {
      this.isPlaying.value = false
      this.onSongEnded()
    })
    
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      this.isLoading.value = false
      this.isPlaying.value = false
    })
    
    // Set initial volume
    this.audio.volume = this.volume.value
    
    this.isInitialized = true
  }
  
  async loadSong(songPath) {
    try {
      this.isLoading.value = true
      
      // Convert Tauri file path to playable URL
      const audioUrl = await invoke('get_audio_url', { path: songPath })
      
      this.audio.src = audioUrl
      this.audio.load()
      
      return true
    } catch (error) {
      console.error('Failed to load song:', error)
      this.isLoading.value = false
      return false
    }
  }
  
  play() {
    if (this.audio.src) {
      this.audio.play()
      this.isPlaying.value = true
    }
  }
  
  pause() {
    this.audio.pause()
    this.isPlaying.value = false
  }
  
  togglePlayPause() {
    if (this.isPlaying.value) {
      this.pause()
    } else {
      this.play()
    }
  }
  
  seek(time) {
    this.audio.currentTime = time
    this.currentTime.value = time
  }
  
  seekToPercent(percent) {
    const time = (percent / 100) * this.duration.value
    this.seek(time)
  }
  
  setVolume(value) {
    this.volume.value = value
    this.audio.volume = value
    
    if (value > 0) {
      this.isMuted.value = false
    }
  }
  
  toggleMute() {
    this.isMuted.value = !this.isMuted.value
    this.audio.muted = this.isMuted.value
  }
  
  skipForward(seconds = 10) {
    this.seek(Math.min(this.currentTime.value + seconds, this.duration.value))
  }
  
  skipBackward(seconds = 10) {
    this.seek(Math.max(this.currentTime.value - seconds, 0))
  }
  
  // Callbacks
  onSongEnded() {
    // This will be overridden by the store
  }
  
  // Utility methods
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  destroy() {
    this.pause()
    this.audio.src = ''
    this.audio.load()
  }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer()

// Export composable for Vue components
export function useAudioPlayer() {
  return {
    currentTime: audioPlayer.currentTime,
    duration: audioPlayer.duration,
    isPlaying: audioPlayer.isPlaying,
    isLoading: audioPlayer.isLoading,
    volume: audioPlayer.volume,
    isMuted: audioPlayer.isMuted,
    progress: audioPlayer.progress,
    formattedCurrentTime: audioPlayer.formattedCurrentTime,
    formattedDuration: audioPlayer.formattedDuration,
    
    // Methods
    play: () => audioPlayer.play(),
    pause: () => audioPlayer.pause(),
    togglePlayPause: () => audioPlayer.togglePlayPause(),
    seek: (time) => audioPlayer.seek(time),
    seekToPercent: (percent) => audioPlayer.seekToPercent(percent),
    setVolume: (value) => audioPlayer.setVolume(value),
    toggleMute: () => audioPlayer.toggleMute(),
    skipForward: (seconds) => audioPlayer.skipForward(seconds),
    skipBackward: (seconds) => audioPlayer.skipBackward(seconds)
  }
}
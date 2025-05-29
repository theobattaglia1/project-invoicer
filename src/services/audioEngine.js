// services/audioEngine.js - Complete Audio Engine for Tauri Music Player
import { ref, computed, watch } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import mitt from 'mitt'

class AudioEngine {
  constructor() {
    // Audio element
    this.audio = new Audio()
    this.audioContext = null
    this.gainNode = null
    this.analyser = null
    
    // Event emitter
    this.emitter = mitt()
    
    // State
    this.state = {
      isPlaying: ref(false),
      isPaused: ref(false),
      isLoading: ref(false),
      currentTime: ref(0),
      duration: ref(0),
      volume: ref(70),
      isMuted: ref(false),
      currentSong: ref(null),
      error: ref(null)
    }
    
    // Playback settings
    this.settings = {
      crossfadeDuration: 3, // seconds
      gaplessPlayback: true,
      preloadNext: true,
      normalizeVolume: false
    }
    
    // Internal state
    this._sourceUrl = null
    this._nextAudio = null
    this._fadeInterval = null
    
    // Initialize
    this._setupAudioElement()
    this._setupAudioContext()
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Setup Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  _setupAudioElement() {
    // Configure audio element
    this.audio.crossOrigin = 'anonymous'
    this.audio.preload = 'auto'
    
    // Event listeners
    this.audio.addEventListener('loadstart', () => {
      this.state.isLoading.value = true
      this.emitter.emit('loadstart')
    })
    
    this.audio.addEventListener('loadedmetadata', () => {
      this.state.duration.value = this.audio.duration
      this.emitter.emit('loadedmetadata', { duration: this.audio.duration })
    })
    
    this.audio.addEventListener('canplay', () => {
      this.state.isLoading.value = false
      this.emitter.emit('canplay')
    })
    
    this.audio.addEventListener('play', () => {
      this.state.isPlaying.value = true
      this.state.isPaused.value = false
      this.emitter.emit('play')
    })
    
    this.audio.addEventListener('pause', () => {
      this.state.isPlaying.value = false
      this.state.isPaused.value = true
      this.emitter.emit('pause')
    })
    
    this.audio.addEventListener('ended', () => {
      this.state.isPlaying.value = false
      this.emitter.emit('ended')
    })
    
    this.audio.addEventListener('timeupdate', () => {
      this.state.currentTime.value = this.audio.currentTime
      this.emitter.emit('timeupdate', { 
        currentTime: this.audio.currentTime,
        duration: this.audio.duration 
      })
    })
    
    this.audio.addEventListener('error', (e) => {
      const error = this._getErrorMessage(this.audio.error)
      this.state.error.value = error
      this.state.isLoading.value = false
      this.state.isPlaying.value = false
      console.error('Audio playback error:', error, e)
      this.emitter.emit('error', error)
    })
    
    // Volume change
    this.audio.addEventListener('volumechange', () => {
      this.emitter.emit('volumechange', { volume: this.audio.volume * 100 })
    })
    
    // Set initial volume
    this.audio.volume = this.state.volume.value / 100
  }
  
  _setupAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()
      
      // Create audio nodes
      this.gainNode = this.audioContext.createGain()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      
      // Connect nodes
      const source = this.audioContext.createMediaElementSource(this.audio)
      source.connect(this.gainNode)
      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
      
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }
  
  _getErrorMessage(error) {
    if (!error) return 'Unknown error'
    
    switch (error.code) {
      case 1: return 'Playback aborted'
      case 2: return 'Network error'
      case 3: return 'Decoding error'
      case 4: return 'Format not supported'
      default: return 'Playback error'
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Core Playback Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  async load(song) {
    // Check for both 'path' and 'file_path' fields
    const filePath = song?.file_path || song?.path
    if (!song || !filePath) {
      console.error('Invalid song data:', song)
      throw new Error('Invalid song data - missing file_path or path')
    }
    
    try {
      this.state.isLoading.value = true
      this.state.error.value = null
      this.state.currentSong.value = song
      
      // Use Tauri's convertFileSrc to create a URL that can be accessed by the web view
      console.log('Loading audio file:', filePath)
      this._sourceUrl = convertFileSrc(filePath)
      console.log('Converted audio URL:', this._sourceUrl)
      
      // Set audio source
      this.audio.src = this._sourceUrl
      
      // Load the audio
      await this.audio.load()
      
      this.emitter.emit('loaded', song)
      
    } catch (error) {
      console.error('Failed to load audio:', error)
      this.state.error.value = error.message
      this.state.isLoading.value = false
      throw error
    }
  }
  
  async play(song = null) {
    try {
      // Resume audio context if suspended (browser requirement)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      
      // If a new song is provided, load it first
      if (song && (!this.state.currentSong.value || song.id !== this.state.currentSong.value.id)) {
        await this.load(song)
      }
      
      // Play the audio
      await this.audio.play()
      
    } catch (error) {
      console.error('Failed to play audio:', error)
      this.state.error.value = error.message
      throw error
    }
  }
  
  pause() {
    this.audio.pause()
  }
  
  async togglePlayPause() {
    if (this.state.isPlaying.value) {
      this.pause()
    } else {
      await this.play()
    }
  }
  
  stop() {
    this.audio.pause()
    this.audio.currentTime = 0
    this.state.isPlaying.value = false
    this.state.currentTime.value = 0
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Seek and Navigation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  seek(time) {
    if (typeof time !== 'number' || isNaN(time)) return
    
    const clampedTime = Math.max(0, Math.min(time, this.audio.duration || 0))
    this.audio.currentTime = clampedTime
    this.state.currentTime.value = clampedTime
  }
  
  seekPercentage(percentage) {
    if (typeof percentage !== 'number' || isNaN(percentage)) return
    
    const clampedPercentage = Math.max(0, Math.min(100, percentage))
    const time = (clampedPercentage / 100) * this.audio.duration
    this.seek(time)
  }
  
  skipForward(seconds = 10) {
    this.seek(this.audio.currentTime + seconds)
  }
  
  skipBackward(seconds = 10) {
    this.seek(this.audio.currentTime - seconds)
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Volume Control
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  setVolume(volume) {
    if (typeof volume !== 'number' || isNaN(volume)) return
    
    const clampedVolume = Math.max(0, Math.min(100, volume))
    this.state.volume.value = clampedVolume
    this.audio.volume = clampedVolume / 100
    
    if (clampedVolume > 0) {
      this.state.isMuted.value = false
    }
  }
  
  mute() {
    this.state.isMuted.value = true
    this.audio.muted = true
  }
  
  unmute() {
    this.state.isMuted.value = false
    this.audio.muted = false
  }
  
  toggleMute() {
    if (this.state.isMuted.value) {
      this.unmute()
    } else {
      this.mute()
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Advanced Features
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  async preloadNext(song) {
    const filePath = song?.file_path || song?.path
    if (!this.settings.preloadNext || !song || !filePath) return
    
    try {
      // Create a new audio element for preloading
      if (this._nextAudio) {
        this._nextAudio.remove()
      }
      
      this._nextAudio = new Audio()
      this._nextAudio.preload = 'auto'
      
      // Load the next song using convertFileSrc
      const nextUrl = convertFileSrc(filePath)
      this._nextAudio.src = nextUrl
      
      // Start loading
      this._nextAudio.load()
      
    } catch (error) {
      console.error('Failed to preload next song:', error)
    }
  }
  
  async crossfadeTo(song) {
    if (!song || !this.settings.crossfadeDuration) {
      return this.play(song)
    }
    
    // Create new audio for crossfade
    const newAudio = this._nextAudio || new Audio()
    const fadeOutAudio = this.audio
    
    try {
      // Load the new song if not preloaded
      if (!this._nextAudio) {
        const filePath = song?.file_path || song?.path
        const url = convertFileSrc(filePath)
        newAudio.src = url
        await newAudio.load()
      }
      
      // Start playing new audio at 0 volume
      newAudio.volume = 0
      await newAudio.play()
      
      // Crossfade
      const steps = 30
      const stepDuration = (this.settings.crossfadeDuration * 1000) / steps
      let currentStep = 0
      
      this._fadeInterval = setInterval(() => {
        currentStep++
        const progress = currentStep / steps
        
        // Fade out old audio
        fadeOutAudio.volume = (1 - progress) * (this.state.volume.value / 100)
        
        // Fade in new audio
        newAudio.volume = progress * (this.state.volume.value / 100)
        
        if (currentStep >= steps) {
          clearInterval(this._fadeInterval)
          
          // Switch to new audio
          fadeOutAudio.pause()
          this.audio = newAudio
          this._nextAudio = null
          this._setupAudioElement()
          this.state.currentSong.value = song
        }
      }, stepDuration)
      
    } catch (error) {
      console.error('Crossfade failed:', error)
      clearInterval(this._fadeInterval)
      return this.play(song)
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Audio Analysis
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0)
    
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)
    
    return dataArray
  }
  
  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0)
    
    const bufferLength = this.analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)
    
    return dataArray
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Utilities
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  _getMimeType(format) {
    const mimeTypes = {
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      webm: 'audio/webm'
    }
    
    return mimeTypes[format.toLowerCase()] || 'audio/mpeg'
  }
  
  getProgress() {
    if (!this.audio.duration) return 0
    return (this.audio.currentTime / this.audio.duration) * 100
  }
  
  getFormattedTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Event Handling
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  on(event, handler) {
    this.emitter.on(event, handler)
  }
  
  off(event, handler) {
    this.emitter.off(event, handler)
  }
  
  once(event, handler) {
    this.emitter.once(event, handler)
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cleanup
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  destroy() {
    // Stop playback
    this.stop()
    
    // Clear intervals
    if (this._fadeInterval) {
      clearInterval(this._fadeInterval)
    }
    
    // Clean up audio elements
    this.audio.remove()
    if (this._nextAudio) {
      this._nextAudio.remove()
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close()
    }
    
    // Clear emitter
    this.emitter.all.clear()
  }
}

// Create singleton instance
let audioEngineInstance = null

export function useAudioEngine() {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine()
  }
  
  return {
    // State
    isPlaying: audioEngineInstance.state.isPlaying,
    isPaused: audioEngineInstance.state.isPaused,
    isLoading: audioEngineInstance.state.isLoading,
    currentTime: audioEngineInstance.state.currentTime,
    duration: audioEngineInstance.state.duration,
    volume: audioEngineInstance.state.volume,
    isMuted: audioEngineInstance.state.isMuted,
    currentSong: audioEngineInstance.state.currentSong,
    error: audioEngineInstance.state.error,
    
    // Computed
    progress: computed(() => audioEngineInstance.getProgress()),
    formattedCurrentTime: computed(() => 
      audioEngineInstance.getFormattedTime(audioEngineInstance.state.currentTime.value)
    ),
    formattedDuration: computed(() => 
      audioEngineInstance.getFormattedTime(audioEngineInstance.state.duration.value)
    ),
    
    // Methods
    play: (song) => audioEngineInstance.play(song),
    pause: () => audioEngineInstance.pause(),
    togglePlayPause: () => audioEngineInstance.togglePlayPause(),
    stop: () => audioEngineInstance.stop(),
    seek: (time) => audioEngineInstance.seek(time),
    seekPercentage: (percentage) => audioEngineInstance.seekPercentage(percentage),
    skipForward: (seconds) => audioEngineInstance.skipForward(seconds),
    skipBackward: (seconds) => audioEngineInstance.skipBackward(seconds),
    setVolume: (volume) => audioEngineInstance.setVolume(volume),
    toggleMute: () => audioEngineInstance.toggleMute(),
    preloadNext: (song) => audioEngineInstance.preloadNext(song),
    crossfadeTo: (song) => audioEngineInstance.crossfadeTo(song),
    
    // Audio analysis
    getFrequencyData: () => audioEngineInstance.getFrequencyData(),
    getWaveformData: () => audioEngineInstance.getWaveformData(),
    
    // Events
    on: (event, handler) => audioEngineInstance.on(event, handler),
    off: (event, handler) => audioEngineInstance.off(event, handler),
    
    // Instance (for advanced usage)
    engine: audioEngineInstance
  }
}
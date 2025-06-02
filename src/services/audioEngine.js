// services/audioEngine.js

import { ref, computed } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import mitt from 'mitt'

class AudioEngine {
  constructor() {
    // Primary HTMLAudioElement
    this.audio = new Audio()

    // These will be initialized on first play()
    this.audioContext = null
    this.gainNode = null
    this.analyser = null

    // For potential crossfade or preloading next track
    this._nextAudio = null
    this._fadeInterval = null

    // Event emitter (mitt)
    this.emitter = mitt()

    // Reactive state
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

    // Initial volume setup
    this.audio.volume = this.state.volume.value / 100

    // Attach <audio> event listeners immediately
    this._setupAudioElement()

    // Expose for debugging in console
    window.audioEngineInstance = this
  }

  // ─── Private: Initialize <audio> element listeners ─────────────────────────
  _setupAudioElement() {
    this.audio.crossOrigin = 'anonymous'
    this.audio.preload = 'auto'

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
      const errMsg = this._getErrorMessage(this.audio.error)
      this.state.error.value = errMsg
      this.state.isLoading.value = false
      this.state.isPlaying.value = false
      console.error('Audio playback error:', errMsg, e)
      this.emitter.emit('error', errMsg)
    })

    this.audio.addEventListener('volumechange', () => {
      this.emitter.emit('volumechange', { volume: this.audio.volume * 100 })
    })
  }

  // ─── Private: Lazy-create Web Audio context and connect nodes ──────────────
  _setupAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()
      this.gainNode = this.audioContext.createGain()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048

      // Connect HTMLAudioElement into Web Audio graph
      const sourceNode = this.audioContext.createMediaElementSource(this.audio)
      sourceNode.connect(this.gainNode)
      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  // ─── Private: Map MediaError codes to human-readable messages ──────────────
  _getErrorMessage(error) {
    if (!error) return 'Unknown error'
    switch (error.code) {
      case 1:
        return 'Playback aborted'
      case 2:
        return 'Network error'
      case 3:
        return 'Decoding error'
      case 4:
        return 'Format not supported'
      default:
        return 'Playback error'
    }
  }

  // ─── Load a song into the <audio> element (waits for canplay) ──────────────
  async load(song) {
    const filePath = song?.file_path || song?.path
    if (!song || !filePath) {
      console.error('Invalid song data passed to load():', song)
      throw new Error('Invalid song data – missing file_path or path')
    }

    // If the exact same song is already loaded, bail out
    if (
      this.state.currentSong.value &&
      this.state.currentSong.value.id === song.id &&
      this.audio.src === this._sourceUrl
    ) {
      return
    }

    try {
      this.state.isLoading.value = true
      this.state.error.value = null
      this.state.currentSong.value = song

      // Convert to a Tauri‐accessible URL
      this._sourceUrl = convertFileSrc(filePath)
      console.log('Loading audio file:', filePath)
      console.log('Converted audio URL:', this._sourceUrl)

      this.audio.src = this._sourceUrl

      // Wait for 'canplay' or error
      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          this.audio.removeEventListener('error', onError)
          this.audio.removeEventListener('canplay', onCanPlay)
          resolve()
        }
        const onError = () => {
          this.audio.removeEventListener('error', onError)
          this.audio.removeEventListener('canplay', onCanPlay)
          reject(new Error('Audio element failed to load'))
        }
        this.audio.addEventListener('canplay', onCanPlay)
        this.audio.addEventListener('error', onError)
        this.audio.load()
      })

      this.state.isLoading.value = false
      this.emitter.emit('loaded', song)
    } catch (error) {
      console.error('Failed to load audio:', error)
      this.state.error.value = error.message
      this.state.isLoading.value = false
      throw error
    }
  }

  // ─── Play (and optionally load) a song; ensures AudioContext is resumed ────
  async play(song = null) {
    try {
      // 1) Lazy‐initialize AudioContext inside a user gesture
      if (!this.audioContext) {
        this._setupAudioContext()
      }

      // 2) Resume context if suspended (necessary on some browsers)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // 3) Load a new song if provided (and if not already loaded)
      if (
        song &&
        (!this.state.currentSong.value || song.id !== this.state.currentSong.value.id)
      ) {
        await this.load(song)
      }

      // 4) Finally call .play() on the <audio> element
      const playPromise = this.audio.play()
      if (playPromise instanceof Promise) {
        try {
          await playPromise
        } catch (err) {
          console.error('audio.play() was blocked by browser:', err)
          throw err
        }
      }
    } catch (error) {
      console.error('Play() failed:', error)
      this.state.error.value = error.message
      throw error
    }
  }

  // ─── Pause playback ─────────────────────────────────────────────────────────
  pause() {
    this.audio.pause()
  }

  // ─── Toggle between play and pause ──────────────────────────────────────────
  async togglePlayPause() {
    if (this.state.isPlaying.value) {
      this.pause()
    } else {
      await this.play()
    }
  }

  // ─── Stop and reset playback to start ───────────────────────────────────────
  stop() {
    this.audio.pause()
    this.audio.currentTime = 0
    this.state.isPlaying.value = false
    this.state.currentTime.value = 0
  }

  // ─── Seek to a specific time (in seconds) ─────────────────────────────────
  seek(time) {
    if (typeof time !== 'number' || isNaN(time)) return
    const clamped = Math.max(0, Math.min(time, this.audio.duration || 0))
    this.audio.currentTime = clamped
    this.state.currentTime.value = clamped
  }

  // ─── Set volume (0–100) ─────────────────────────────────────────────────────
  setVolume(vol) {
    if (typeof vol !== 'number' || isNaN(vol)) return
    const clamped = Math.max(0, Math.min(100, vol))
    this.state.volume.value = clamped
    this.audio.volume = clamped / 100
    if (clamped > 0) {
      this.state.isMuted.value = false
    }
  }

  // ─── Mute ───────────────────────────────────────────────────────────────────
  mute() {
    this.state.isMuted.value = true
    this.audio.muted = true
  }

  // ─── Unmute ─────────────────────────────────────────────────────────────────
  unmute() {
    this.state.isMuted.value = false
    this.audio.muted = false
  }

  // ─── Toggle mute/unmute ─────────────────────────────────────────────────────
  toggleMute() {
    if (this.state.isMuted.value) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  // ─── Preload the next track (optional; for gapless/crossfade) ──────────────
  async preloadNext(song) {
    const filePath = song?.file_path || song?.path
    if (!this.settings?.preloadNext || !song || !filePath) return

    try {
      // Clean up any previous preloaded audio
      if (this._nextAudio) {
        this._nextAudio.remove()
      }
      this._nextAudio = new Audio()
      this._nextAudio.preload = 'auto'
      const nextUrl = convertFileSrc(filePath)
      this._nextAudio.src = nextUrl
      this._nextAudio.load()
    } catch (error) {
      console.error('Failed to preload next song:', error)
    }
  }

  // ─── Crossfade to a new song over `settings.crossfadeDuration` seconds ──────
  async crossfadeTo(song) {
    if (!song || !this.settings?.crossfadeDuration) {
      return this.play(song)
    }

    // If we haven't preloaded, do it now
    if (!this._nextAudio) {
      await this.preloadNext(song)
    }

    const fadeOutAudio = this.audio
    const newAudio = this._nextAudio

    try {
      // Ensure newAudio is ready
      if (newAudio.readyState < 2) {
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            newAudio.removeEventListener('error', onError)
            newAudio.removeEventListener('canplay', onCanPlay)
            resolve()
          }
          const onError = () => {
            newAudio.removeEventListener('error', onError)
            newAudio.removeEventListener('canplay', onCanPlay)
            reject(new Error('Failed to preload for crossfade'))
          }
          newAudio.addEventListener('canplay', onCanPlay)
          newAudio.addEventListener('error', onError)
        })
      }

      // Start newAudio at zero volume
      newAudio.volume = 0
      await newAudio.play()

      // Fade duration
      const steps = 30
      const stepDuration = (this.settings.crossfadeDuration * 1000) / steps
      let currentStep = 0

      this._fadeInterval = setInterval(() => {
        currentStep += 1
        const progress = currentStep / steps

        fadeOutAudio.volume = (1 - progress) * (this.state.volume.value / 100)
        newAudio.volume = progress * (this.state.volume.value / 100)

        if (currentStep >= steps) {
          clearInterval(this._fadeInterval)
          fadeOutAudio.pause()
          this.audio = newAudio
          this._nextAudio = null
          this._setupAudioElement() // Reattach events on the new main <audio>
          this.state.currentSong.value = song
        }
      }, stepDuration)
    } catch (error) {
      console.error('Crossfade failed:', error)
      clearInterval(this._fadeInterval)
      return this.play(song)
    }
  }

  // ─── Analyze frequency data (for visualizers) ───────────────────────────────
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0)
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)
    return dataArray
  }

  // ─── Analyze waveform data (for visualizers) ────────────────────────────────
  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0)
    const bufferLength = this.analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)
    return dataArray
  }

  // ─── Get current playback progress as percentage (0–100) ───────────────────
  getProgress() {
    if (!this.audio.duration) return 0
    return (this.audio.currentTime / this.audio.duration) * 100
  }

  // ─── Convert elapsed seconds to "M:SS" format ───────────────────────────────
  getFormattedTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // ─── Event subscription ─────────────────────────────────────────────────────
  on(event, handler) {
    this.emitter.on(event, handler)
  }
  off(event, handler) {
    this.emitter.off(event, handler)
  }
  once(event, handler) {
    this.emitter.once(event, handler)
  }

  // ─── Cleanup (stop playback, close context, clear intervals) ─────────────────
  destroy() {
    this.stop()
    if (this._fadeInterval) clearInterval(this._fadeInterval)
    this.audio.remove()
    if (this._nextAudio) this._nextAudio.remove()
    if (this.audioContext) this.audioContext.close()
    this.emitter.all.clear()
  }
}

// Singleton instance
let audioEngineInstance = null

/**
 * Returns the shared AudioEngine instance and exposes reactive properties + methods.
 */
export function useAudioEngine() {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine()
  }
  return {
    // Reactive state
    isPlaying: audioEngineInstance.state.isPlaying,
    isPaused: audioEngineInstance.state.isPaused,
    isLoading: audioEngineInstance.state.isLoading,
    currentTime: audioEngineInstance.state.currentTime,
    duration: audioEngineInstance.state.duration,
    volume: audioEngineInstance.state.volume,
    isMuted: audioEngineInstance.state.isMuted,
    currentSong: audioEngineInstance.state.currentSong,
    error: audioEngineInstance.state.error,

    // Computed helpers
    progress: computed(() => audioEngineInstance.getProgress()),
    formattedCurrentTime: computed(() =>
      audioEngineInstance.getFormattedTime(audioEngineInstance.state.currentTime.value)
    ),
    formattedDuration: computed(() =>
      audioEngineInstance.getFormattedTime(audioEngineInstance.state.duration.value)
    ),

    // Playback methods
    play: (song) => audioEngineInstance.play(song),
    pause: () => audioEngineInstance.pause(),
    togglePlayPause: () => audioEngineInstance.togglePlayPause(),
    stop: () => audioEngineInstance.stop(),
    seek: (time) => audioEngineInstance.seek(time),
    setVolume: (vol) => audioEngineInstance.setVolume(vol),
    toggleMute: () => audioEngineInstance.toggleMute(),
    preloadNext: (song) => audioEngineInstance.preloadNext(song),
    crossfadeTo: (song) => audioEngineInstance.crossfadeTo(song),

    // Analysis methods
    getFrequencyData: () => audioEngineInstance.getFrequencyData(),
    getWaveformData: () => audioEngineInstance.getWaveformData(),

    // Event subscription
    on: (event, fn) => audioEngineInstance.on(event, fn),
    off: (event, fn) => audioEngineInstance.off(event, fn),

    // For debugging or advanced usage
    _internalInstance: audioEngineInstance
  }
}

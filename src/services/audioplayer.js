/**
 * AudioPlayer — singleton + tiny event emitter.
 * Works in dev AND packaged Tauri builds.
 */
import { invoke } from '@tauri-apps/api/tauri'
import mitt from 'mitt'

class AudioPlayer {
  #audio   = null
  #srcURL  = null
  #bus     = mitt()

  /* ───── public API ───── */

  on  (e, fn) { this.#bus.on(e, fn) }
  off (e, fn) { this.#bus.off(e, fn) }

  /** song = { path, title, … } */
  async load (song) {
    if (this.#audio) this.#cleanup()

    const bytes = await invoke('read_audio', { path: song.path })
    const blob  = new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' })
    this.#srcURL = URL.createObjectURL(blob)

    this.#audio = new Audio(this.#srcURL)
    this.#wire()
  }

  play ()           { this.#audio?.play() }
  pause ()          { this.#audio?.pause() }
  seek (s)          { if (this.#audio) this.#audio.currentTime = s }
  get duration ()   { return this.#audio?.duration ?? 0 }
  get currentTime (){ return this.#audio?.currentTime ?? 0 }
  get playing ()    { return this.#audio && !this.#audio.paused }

  /* Hook for legacy code */
  useAudioPlayer () { return this }

  /* ───── private helpers ───── */

  #cleanup () {
    this.#audio.pause()
    URL.revokeObjectURL(this.#srcURL)
    this.#audio = null
    this.#srcURL = null
  }

  #wire () {
    const emitPos = this.#throttle(() =>
      this.#bus.emit('pos', this.currentTime, this.duration), 250)

    this.#audio.addEventListener('timeupdate', emitPos)
    this.#audio.addEventListener('ended', () => this.#bus.emit('ended'))
  }

  #throttle (fn, ms) {
    let last = 0
    return (...a) => {
      const now = performance.now()
      if (now - last >= ms) { last = now; fn(...a) }
    }
  }
}

/* ───── exports ───── */
export const player = new AudioPlayer()
export function useAudioPlayer () { return player }

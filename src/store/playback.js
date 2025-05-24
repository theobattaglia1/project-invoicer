import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlaybackStore = defineStore('playback', () => {
  const currentSong = ref(null)
  const isPlaying = ref(false)
  const position   = ref(0)
  const duration   = ref(0)
  return { currentSong, isPlaying, position, duration }
})

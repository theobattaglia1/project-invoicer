import { defineStore } from 'pinia'
import { invoke }      from '@tauri-apps/api/tauri'
import { readTextFile, writeFile } from '@tauri-apps/api/fs'

export const useMusicStore = defineStore('music', {
  state: () => ({
    songs: [],
    currentSong: null,
    isPlaying: false,
  }),

  actions: {
    async loadLibrary() {
      // e.g. await invoke('load_songs') or use fs.readTextFile to read local JSON
      const txt = await readTextFile('songs.json')
      this.songs = JSON.parse(txt)
    },

    play(song) {
      this.currentSong = song
      this.isPlaying   = true
      // call your playback plugin here
    },

    pause() {
      this.isPlaying = false
      // pause playback
    },
  },
})

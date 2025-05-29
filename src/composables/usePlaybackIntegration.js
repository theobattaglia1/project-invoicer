// src/composables/usePlaybackIntegration - Integrates Store with Audio Engine
import { watch, onMounted } from 'vue'
import { useMusicStore } from '@/store/music'
import { useAudioEngine } from '@/services/audioEngine'

export function usePlaybackIntegration() {
  const musicStore = useMusicStore()
  const audio = useAudioEngine()

  // Initialize integration
  const init = () => {
    // Sync audio engine state with store
    watch(audio.isPlaying, (playing) => {
      musicStore.isPlaying = playing
    })

    watch(audio.currentSong, (song) => {
      if (song && song.id !== musicStore.currentSong?.id) {
        musicStore.currentSong = song
      }
    })

    // Handle song end
    audio.on('ended', () => {
      handleSongEnd()
    })

    // Handle errors
    audio.on('error', (error) => {
      console.error('Playback error:', error)
      // Show error toast if you have toast store
      // toastStore.push({ message: `Playback error: ${error}`, type: 'error' })
    })

    // Handle loading states
    audio.on('loadstart', () => {
      console.log('Loading song...')
    })

    audio.on('canplay', () => {
      console.log('Ready to play')
    })
  }

  // Handle when a song ends
  const handleSongEnd = async () => {
    if (musicStore.isRepeat && musicStore.playQueue.length === 1) {
      // Repeat single song
      await audio.play(musicStore.currentSong)
    } else if (musicStore.queueIndex < musicStore.playQueue.length - 1) {
      // Play next song
      await playNext()
    } else if (musicStore.isRepeat && musicStore.playQueue.length > 1) {
      // Repeat queue from beginning
      musicStore.queueIndex = 0
      await audio.play(musicStore.playQueue[0])
    } else {
      // End of queue
      musicStore.isPlaying = false
    }
  }

  // Play a specific song
  const playSong = async (song, queue = null) => {
    try {
      // Update queue if provided
      if (queue) {
        musicStore.playQueue = queue
        const index = queue.findIndex(s => s.id === song.id)
        musicStore.queueIndex = index !== -1 ? index : 0
      }

      // Update current song in store
      musicStore.currentSong = song

      // Play in audio engine
      await audio.play(song)

      // Preload next song if available
      const nextIndex = musicStore.queueIndex + 1
      if (nextIndex < musicStore.playQueue.length) {
        audio.preloadNext(musicStore.playQueue[nextIndex])
      }
    } catch (error) {
      console.error('Failed to play song:', error)
      throw error
    }
  }

  // Play next song
  const playNext = async () => {
    musicStore.playNext()
    if (musicStore.currentSong) {
      await playSong(musicStore.currentSong)
    }
  }

  // Play previous song
  const playPrevious = async () => {
    // If more than 3 seconds into song, restart it
    if (audio.currentTime.value > 3) {
      audio.seek(0)
      return
    }

    musicStore.playPrevious()
    if (musicStore.currentSong) {
      await playSong(musicStore.currentSong)
    }
  }

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!musicStore.currentSong && musicStore.filteredSongs.length > 0) {
      // No song playing, start with first song
      await playSong(musicStore.filteredSongs[0], musicStore.filteredSongs)
    } else {
      await audio.togglePlayPause()
    }
  }

  // Play an entire artist
  const playArtist = async (artistId) => {
    const songs = musicStore.getSongsByArtist(artistId)
    if (songs.length > 0) {
      const queue = musicStore.isShuffle
        ? [...songs].sort(() => Math.random() - 0.5)
        : songs
      await playSong(queue[0], queue)
    }
  }

  // Play an entire album
  const playAlbum = async (albumId) => {
    const songs = musicStore.getSongsByAlbum(albumId)
    if (songs.length > 0) {
      await playSong(songs[0], songs)
    }
  }

  // Play a playlist
  const playPlaylist = async (playlistId) => {
    const songs = musicStore.getPlaylistSongs(playlistId)
    if (songs.length > 0) {
      const queue = musicStore.isShuffle
        ? [...songs].sort(() => Math.random() - 0.5)
        : songs
      await playSong(queue[0], queue)
    }
  }

  // Add song to queue
  const addToQueue = (songs) => {
    const songsToAdd = Array.isArray(songs) ? songs : [songs]
    musicStore.playQueue = [...musicStore.playQueue, ...songsToAdd]
  }

  // Clear queue
  const clearQueue = () => {
    musicStore.playQueue = []
    musicStore.queueIndex = 0
    audio.stop()
  }

  // Shuffle queue
  const shuffleQueue = () => {
    if (musicStore.playQueue.length <= 1) return

    const currentSong = musicStore.currentSong
    const remainingQueue = musicStore.playQueue.filter(s => s.id !== currentSong?.id)
    const shuffled = [...remainingQueue].sort(() => Math.random() - 0.5)

    if (currentSong) {
      musicStore.playQueue = [currentSong, ...shuffled]
      musicStore.queueIndex = 0
    } else {
      musicStore.playQueue = shuffled
    }
  }

  // Toggle shuffle
  const toggleShuffle = () => {
    musicStore.toggleShuffle()
    // If turning on shuffle and currently playing, reshuffle the remaining queue
    if (musicStore.isShuffle && musicStore.currentSong) {
      shuffleQueue()
    }
  }

  // Toggle repeat
  const toggleRepeat = () => {
    musicStore.toggleRepeat()
  }

  onMounted(() => {
    init()
  })

  return {
    // State from audio engine
    isPlaying: audio.isPlaying,
    isLoading: audio.isLoading,
    currentTime: audio.currentTime,
    duration: audio.duration,
    progress: audio.progress,
    volume: audio.volume,
    currentSong: audio.currentSong,
    
    // State from music store (these were missing!)
    isShuffled: musicStore.isShuffle,
    repeatMode: musicStore.isRepeat,
    playQueue: musicStore.playQueue,
    queueIndex: musicStore.queueIndex,

    // Methods
    playSong,
    playNext,
    playPrevious,
    togglePlayPause,
    playArtist,
    playAlbum,
    playPlaylist,
    addToQueue,
    clearQueue,
    shuffleQueue,
    toggleShuffle,
    toggleRepeat,

    // Audio control
    seek: audio.seek,
    setVolume: audio.setVolume,
    toggleMute: audio.toggleMute
  }
}
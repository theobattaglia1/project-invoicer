<!-- src/pages/ArtistDetail.vue -->
<template>
    <div v-if="artist" class="h-full bg-gradient-to-b from-zinc-900 to-black overflow-hidden flex flex-col">
      <!-- Hero Section -->
      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
        <div class="relative p-8 pb-6">
          <div class="flex items-end gap-8">
            <!-- Artist Image -->
            <div class="relative group">
              <div class="w-48 h-48 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl">
                <img
                  v-if="artistImageUrl"
                  :src="artistImageUrl"
                  :alt="artist.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="text-6xl font-bold text-white/80">
                    {{ artist.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              <button
                @click="uploadArtistImage"
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-full flex items-center justify-center"
              >
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
  
            <!-- Artist Info -->
            <div class="flex-1">
              <p class="text-sm text-gray-400 mb-2">ARTIST</p>
              <h1 class="text-6xl font-bold text-white mb-4">{{ artist.name }}</h1>
              <p class="text-gray-300 mb-4">{{ artist.bio || 'No bio available' }}</p>
              <div class="flex items-center gap-6 text-gray-400">
                <span>{{ artistSongs.length }} songs</span>
                <span>{{ artistPlaylists.length }} playlists</span>
              </div>
            </div>
          </div>
  
          <!-- Action Buttons -->
          <div class="flex gap-3 mt-8">
            <button
              @click="playAllSongs"
              class="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
              Play All
            </button>
            <button
              @click="showAddSong = true"
              class="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-full hover:bg-white/20 transition"
            >
              Add Song
            </button>
            <button
              @click="showCreatePlaylist = true"
              class="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-full hover:bg-white/20 transition"
            >
              Create Playlist
            </button>
          </div>
        </div>
      </div>
  
      <!-- Content Tabs -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <div class="border-b border-white/10">
          <div class="flex gap-8 px-8">
            <button
              @click="activeTab = 'songs'"
              :class="['py-4 border-b-2 transition', activeTab === 'songs' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400 hover:text-white']"
            >
              Songs
            </button>
            <button
              @click="activeTab = 'playlists'"
              :class="['py-4 border-b-2 transition', activeTab === 'playlists' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400 hover:text-white']"
            >
              Playlists
            </button>
          </div>
        </div>
  
        <!-- Songs Tab -->
        <div v-if="activeTab === 'songs'" class="flex-1 overflow-y-auto p-8">
          <div v-if="artistSongs.length === 0" class="text-center py-12">
            <p class="text-gray-400 mb-4">No songs yet</p>
            <button @click="showAddSong = true" class="text-purple-400 hover:text-purple-300">
              Add the first song
            </button>
          </div>
          <div v-else class="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden">
            <table class="w-full">
              <tbody>
                <tr
                  v-for="(song, index) in artistSongs"
                  :key="song.id"
                  @click="playSong(song)"
                  class="group hover:bg-white/5 cursor-pointer transition"
                >
                  <td class="p-4 text-gray-400 w-12">{{ index + 1 }}</td>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded bg-white/10">
                        <img
                          v-if="songImageUrls[song.id]"
                          :src="songImageUrls[song.id]"
                          :alt="song.title"
                          class="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div>
                        <p class="text-white group-hover:text-purple-400 transition">{{ song.title }}</p>
                        <p class="text-sm text-gray-400">{{ song.albumName || 'Single' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="p-4 text-gray-400">{{ formatDuration(song.duration) }}</td>
                  <td class="p-4">
                    <button
                      @click.stop="removeSong(song.id)"
                      class="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition text-red-400"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
  
        <!-- Playlists Tab -->
        <div v-else-if="activeTab === 'playlists'" class="flex-1 overflow-y-auto p-8">
          <div v-if="artistPlaylists.length === 0" class="text-center py-12">
            <p class="text-gray-400 mb-4">No playlists yet</p>
            <button @click="showCreatePlaylist = true" class="text-purple-400 hover:text-purple-300">
              Create the first playlist
            </button>
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              v-for="playlist in artistPlaylists"
              :key="playlist.id"
              @click="goToPlaylist(playlist.id)"
              class="group cursor-pointer"
            >
              <div class="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-3">
                <div class="w-full h-full flex items-center justify-center">
                  <svg class="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <p class="font-medium text-white group-hover:text-purple-400 transition">{{ playlist.name }}</p>
              <p class="text-sm text-gray-400">{{ getPlaylistSongs(playlist.id).length }} songs</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Add Song Modal -->
      <Transition name="modal">
        <div v-if="showAddSong" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10">
            <h2 class="text-2xl font-bold text-white mb-6">Add Song to {{ artist.name }}</h2>
            <form @submit.prevent="addNewSong">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    v-model="newSong.title"
                    required
                    class="w-full px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Album</label>
                  <input
                    v-model="newSong.albumName"
                    class="w-full px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  @click="showAddSong = false"
                  class="px-6 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Add Song
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
  
      <!-- Create Playlist Modal -->
      <Transition name="modal">
        <div v-if="showCreatePlaylist" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-gray-900/90 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10">
            <h2 class="text-2xl font-bold text-white mb-6">Create {{ artist.name }} Playlist</h2>
            <form @submit.prevent="createNewPlaylist">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    v-model="newPlaylist.name"
                    required
                    class="w-full px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Best of..."
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    v-model="newPlaylist.description"
                    rows="3"
                    class="w-full px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  @click="showCreatePlaylist = false"
                  class="px-6 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useMusicStore } from '../stores/music'
  
  const route = useRoute()
  const router = useRouter()
  const store = useMusicStore()
  
  const activeTab = ref('songs')
  const showAddSong = ref(false)
  const showCreatePlaylist = ref(false)
  const artistImageUrl = ref(null)
  const songImageUrls = ref({})
  
  const newSong = ref({
    title: '',
    albumName: ''
  })
  
  const newPlaylist = ref({
    name: '',
    description: ''
  })
  
  const artist = computed(() => store.getArtistById(route.params.id))
  const artistSongs = computed(() => store.getSongsByArtist(route.params.id))
  const artistPlaylists = computed(() => 
    store.playlists.filter(p => p.artistId === route.params.id)
  )
  
  const getPlaylistSongs = (playlistId) => store.getSongsInPlaylist(playlistId)
  
  async function loadImages() {
    // Load artist image
    if (artist.value?.imageURL) {
      artistImageUrl.value = await store.getImagePath(artist.value.imageURL)
    }
  
    // Load song images
    for (const song of artistSongs.value) {
      if (song.artworkURL) {
        const url = await store.getImagePath(song.artworkURL)
        if (url) {
          songImageUrls.value[song.id] = url
        }
      }
    }
  }
  
  watch([artist, artistSongs], loadImages, { immediate: true })
  
  function playSong(song) {
    store.setQueue(artistSongs.value)
    store.play(song)
  }
  
  function playAllSongs() {
    if (artistSongs.value.length > 0) {
      store.setQueue(artistSongs.value)
      store.play(artistSongs.value[0])
    }
  }
  
  async function uploadArtistImage() {
    try {
      const imagePath = await store.updateArtistImage(artist.value.id)
      if (imagePath) {
        artistImageUrl.value = await store.getImagePath(imagePath)
      }
    } catch (error) {
      console.error('Failed to upload artist image:', error)
    }
  }
  
  async function addNewSong() {
    try {
      await store.addSong({
        title: newSong.value.title,
        artistId: artist.value.id,
        artistName: artist.value.name,
        albumName: newSong.value.albumName
      })
      showAddSong.value = false
      newSong.value = { title: '', albumName: '' }
      await loadImages()
    } catch (error) {
      console.error('Failed to add song:', error)
    }
  }
  
  async function createNewPlaylist() {
    try {
      await store.addPlaylist({
        name: newPlaylist.value.name,
        description: newPlaylist.value.description,
        artistId: artist.value.id
      })
      showCreatePlaylist.value = false
      newPlaylist.value = { name: '', description: '' }
    } catch (error) {
      console.error('Failed to create playlist:', error)
    }
  }
  
  async function removeSong(songId) {
    if (confirm('Are you sure you want to remove this song?')) {
      await store.deleteSong(songId)
    }
  }
  
  function goToPlaylist(playlistId) {
    router.push(`/playlist/${playlistId}`)
  }
  
  function formatDuration(seconds) {
    if (!seconds) return '—'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  onMounted(() => {
    if (!artist.value) {
      router.push('/artists')
    }
  })
  </script>
  
  <style scoped>
  .modal-enter-active, .modal-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-enter-from, .modal-leave-to {
    opacity: 0;
  }
  
  .modal-enter-active > div,
  .modal-leave-active > div {
    transition: transform 0.3s ease;
  }
  
  .modal-enter-from > div {
    transform: scale(0.9);
  }
  
  .modal-leave-to > div {
    transform: scale(0.9);
  }
  </style>
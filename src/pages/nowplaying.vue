<template>
    <div class="p-4 flex flex-col items-center">
      <h1 class="text-2xl mb-6">Now Playing</h1>
  
      <div v-if="song" class="w-full max-w-md">
        <img :src="song.artworkURL" alt="Art" class="w-full rounded mb-4"/>
        <h2 class="text-xl font-semibold">{{ song.title }}</h2>
        <p class="text-gray-600">{{ song.artistName }}</p>
  
        <div class="mt-4 space-x-4">
          <button @click="store.pause()">Pause</button>
          <button @click="store.play(song)">Play</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed }    from 'vue'
  import { useMusicStore } from '../stores/music'
  
  const store = useMusicStore()
  const song  = computed(() => store.currentSong)
  </script>
  
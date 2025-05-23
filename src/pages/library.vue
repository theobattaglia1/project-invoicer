<template>
    <div class="p-4">
      <h1 class="text-2xl mb-4">Library</h1>
      <input
        v-model="search"
        placeholder="Search songs…"
        class="border p-2 mb-4 w-full"
      />
  
      <ul>
        <li
          v-for="song in filtered"
          :key="song.id"
          @dblclick="play(song)"
          class="p-2 hover:bg-gray-100 cursor-pointer rounded"
        >
          {{ song.title }}
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useMusicStore }            from '../stores/music'
  
  const store  = useMusicStore()
  const search = ref('')
  
  // load your data when this page mounts
  onMounted(() => store.loadLibrary())
  
  const filtered = computed(() =>
    store.songs.filter(s =>
      s.title.toLowerCase().includes(search.value.toLowerCase())
    )
  )
  
  function play(song) {
    store.play(song)
    router.push({ name: 'NowPlaying' })
  }
  </script>
  
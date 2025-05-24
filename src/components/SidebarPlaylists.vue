<template>
    <aside class="sidebar glass">
      <header class="side-head">PLAYLISTS</header>
  
      <ul>
        <li
          v-for="pl in playlists"
          :key="pl.id"
          class="side-item"
          :class="{ dragover: dragOn === pl.id }"
          @dragover.prevent="dragOn = pl.id"
          @dragleave="dragOn = null"
          @drop="handleDrop(pl.id)"
        >
          {{ pl.name }}
        </li>
      </ul>
    </aside>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useLibraryStore } from '@/store/library'
  import { importFiles } from '@/utils/importFiles'   // util we wrote earlier
  
  const lib      = useLibraryStore()
  const playlists = lib.state.playlists    // reactive
  
  const dragOn = ref(null)
  
  function handleDrop (playlistId) {
    return async e => {
      dragOn.value = null
      const files = [...e.dataTransfer.files].map(f => f.path)
      await importFiles(files, { playlistId })
    }
  }
  </script>
  
  <style scoped>
  .sidebar {
    width: 200px;
    padding: 16px 0;
    overflow-y: auto;
  }
  .side-head   { padding: 0 16px 8px; font-size: 12px; color: var(--text-muted); }
  .side-item   { padding: 8px 16px; font-size: 14px; cursor: pointer; }
  .side-item.dragover { background: var(--bg-hover); }
  </style>
  
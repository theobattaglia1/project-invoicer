<template>
    <div class="artists-view">
      <!-- Header -->
      <div class="view-header">
        <h1 class="view-title">Artists</h1>
        <div class="header-actions">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search artists..."
              class="search-input"
            >
          </div>
          <button class="add-btn" @click="$emit('add-artist')">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Artist
          </button>
        </div>
      </div>
  
      <!-- Artists Grid -->
      <div class="artists-grid">
        <div 
          v-for="artist in filteredArtists" 
          :key="artist.id"
          class="artist-tile"
          @click="$emit('select-artist', artist.id)"
          @dragover.prevent="dragOverArtistId = artist.id"
          @dragleave="dragOverArtistId = null"
          @drop.prevent="handleFileDropToArtist(artist, $event)"
          :class="{ 'drag-over': dragOverArtistId === artist.id }"
        >
          <div class="artist-image">
            <div v-if="!artist.image" class="image-placeholder">
              {{ artist.name.charAt(0) }}
            </div>
            <img v-else :src="artist.image" :alt="artist.name">
            <div class="artist-overlay">
              <button class="play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="artist-info">
            <h3 class="artist-name">{{ artist.name }}</h3>
            <p class="artist-meta">
              <span v-if="artist.genre">{{ artist.genre }}</span>
              <span v-if="artist.genre && artist.followers"> • </span>
              <span v-if="artist.followers">{{ artist.followers }} followers</span>
            </p>
          </div>
          <button class="artist-menu" @click.stop="showArtistMenu(artist)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue'
  
  export default {
    name: 'ArtistsView',
    props: {
      artists: Array,
      onFileDropToArtist: Function
    },
    emits: ['add-artist', 'select-artist'],
    setup(props) {
      const searchQuery = ref('')
      const dragOverArtistId = ref(null)
  
      const filteredArtists = computed(() => {
        if (!searchQuery.value) return props.artists
        
        const query = searchQuery.value.toLowerCase()
        return props.artists.filter(artist => 
          artist.name.toLowerCase().includes(query) ||
          (artist.genre && artist.genre.toLowerCase().includes(query))
        )
      })
  
      const showArtistMenu = (artist) => {
        console.log('Show menu for:', artist)
      }
  
      const handleFileDropToArtist = (artist, e) => {
        dragOverArtistId.value = null
        const files = e.dataTransfer.files
        if (files && files.length > 0) {
          const filePaths = Array.from(files).map(f => f.path || f.name)
          if (props.onFileDropToArtist) props.onFileDropToArtist(artist.id, filePaths)
        } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          const filePaths = Array.from(e.dataTransfer.items)
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile()?.path || item.getAsFile()?.name)
          if (props.onFileDropToArtist) props.onFileDropToArtist(artist.id, filePaths)
        }
      }
  
      return {
        searchQuery,
        filteredArtists,
        showArtistMenu,
        dragOverArtistId,
        handleFileDropToArtist
      }
    }
  }
  </script>
  
  <style scoped>
  .artists-view {
    padding: 0;
  }
  
  /* Header */
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    gap: 24px;
  }
  
  .view-title {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--text-primary);
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .search-box {
    position: relative;
    width: 300px;
  }
  
  .search-box svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: var(--text-tertiary);
  }
  
  .search-input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    background: var(--bg-secondary);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .search-input::placeholder {
    color: var(--text-tertiary);
  }
  
  .search-input:focus {
    background: var(--bg-tertiary);
    border-color: var(--border-hover);
  }
  
  .add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--gradient-primary);
    border: none;
    border-radius: var(--radius-md);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  .add-btn svg {
    width: 20px;
    height: 20px;
  }
  
  /* Artists Grid */
  .artists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 24px;
  }
  
  .artist-tile {
    position: relative;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
  }
  
  .artist-tile::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gradient-primary);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .artist-tile:hover {
    transform: translateY(-4px);
    background: var(--bg-tertiary);
  }
  
  .artist-tile:hover::before {
    opacity: 0.05;
  }
  
  .artist-image {
    position: relative;
    width: 160px;
    height: 160px;
    margin: 0 auto 20px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg-tertiary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64px;
    font-weight: 700;
    background: var(--gradient-primary);
    color: white;
  }
  
  .artist-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .artist-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .artist-tile:hover .artist-overlay {
    opacity: 1;
  }
  
  .play-btn {
    width: 56px;
    height: 56px;
    background: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transform: scale(0.8);
    transition: all 0.2s ease;
  }
  
  .play-btn:hover {
    transform: scale(0.9);
  }
  
  .play-btn svg {
    width: 24px;
    height: 24px;
    color: black;
    margin-left: 2px;
  }
  
  .artist-info {
    text-align: center;
    position: relative;
    z-index: 1;
  }
  
  .artist-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .artist-meta {
    font-size: 13px;
    color: var(--text-secondary);
  }
  
  .artist-menu {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    background: var(--bg-tertiary);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    z-index: 2;
  }
  
  .artist-tile:hover .artist-menu {
    opacity: 1;
  }
  
  .artist-menu:hover {
    background: var(--bg-active);
  }
  
  .artist-menu svg {
    width: 16px;
    height: 16px;
    color: var(--text-secondary);
  }
  
  .artist-tile.drag-over {
    outline: 2px solid #4ECDC4;
    background: rgba(78, 205, 196, 0.08);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .view-header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-box {
      width: 100%;
    }
    
    .artists-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }
    
    .artist-image {
      width: 120px;
      height: 120px;
    }
  }
  </style>
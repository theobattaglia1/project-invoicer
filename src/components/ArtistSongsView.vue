<template>
    <div class="artist-songs-view"
         @dragover.prevent="isDragOver = true"
         @dragleave="isDragOver = false"
         @drop.prevent="handleFileDrop"
         :class="{ 'drag-over': isDragOver }"
    >
      <!-- Artist Header -->
      <div class="artist-header">
        <div class="artist-cover">
          <img v-if="artist?.image" :src="artist.image" :alt="artist.name">
          <div v-else class="cover-placeholder">
            {{ artist?.name.charAt(0) }}
          </div>
        </div>
        
        <div class="artist-info">
          <p class="artist-label">Artist</p>
          <h1 class="artist-name">{{ artist?.name }}</h1>
          <p class="artist-stats">{{ songs.length }} songs • {{ totalDuration }}</p>
          
          <div class="artist-actions">
            <button class="play-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Play</span>
            </button>
            <button class="shuffle-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
              <span>Shuffle</span>
            </button>
            <button class="more-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
  
      <!-- Songs List -->
      <div class="songs-section">
        <h2 class="section-title">All Songs</h2>
        
        <div class="songs-list">
          <div 
            v-for="(song, index) in songs" 
            :key="song.id"
            class="song-item"
            @click="playSong(song)"
          >
            <div class="song-number">{{ index + 1 }}</div>
            <div class="song-artwork">
              <svg viewBox="0 0 40 40" class="artwork-placeholder">
                <rect width="40" height="40" fill="url(#artist-gradient)" rx="4"/>
                <path d="M20 12v8.22c-.47-.34-1.02-.55-1.6-.55-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2V16h3.2v-4H20z" fill="rgba(255,255,255,0.3)"/>
              </svg>
              <div class="play-overlay">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div class="song-details">
              <p class="song-title">{{ song.title }}</p>
              <p class="song-album">{{ song.album }}</p>
            </div>
            <div class="song-duration">{{ song.duration }}</div>
            <button class="song-menu" @click.stop="showSongMenu(song)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
  
      <!-- SVG Definitions -->
      <svg width="0" height="0">
        <defs>
          <linearGradient id="artist-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </template>
  
  <script>
  import { computed, ref } from 'vue'
  
  export default {
    name: 'ArtistSongsView',
    props: {
      artist: Object,
      songs: Array,
      onFileDropToArtist: Function
    },
    setup(props) {
      const isDragOver = ref(false)
      const totalDuration = computed(() => {
        // Calculate total duration of all songs
        // In a real app, this would sum up actual durations
        const totalMinutes = props.songs.length * 3.5 // Approximate
        const hours = Math.floor(totalMinutes / 60)
        const minutes = Math.floor(totalMinutes % 60)
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      })
      
      const playSong = (song) => {
        console.log('Playing:', song)
        // Emit play event
      }
      
      const showSongMenu = (song) => {
        console.log('Show menu for:', song)
        // Show context menu
      }
      
      const handleFileDrop = (e) => {
        isDragOver.value = false
        const files = e.dataTransfer.files
        if (files && files.length > 0) {
          const filePaths = Array.from(files).map(f => f.path || f.name)
          if (props.onFileDropToArtist) props.onFileDropToArtist(props.artist.id, filePaths)
        } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          const filePaths = Array.from(e.dataTransfer.items)
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile()?.path || item.getAsFile()?.name)
          if (props.onFileDropToArtist) props.onFileDropToArtist(props.artist.id, filePaths)
        }
      }
      
      return {
        totalDuration,
        playSong,
        showSongMenu,
        isDragOver,
        handleFileDrop
      }
    }
  }
  </script>
  
  <style scoped>
  .artist-songs-view {
    height: 100%;
    overflow-y: auto;
    color: #fff;
  }
  
  /* Artist Header */
  .artist-header {
    padding: 48px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
    display: flex;
    gap: 32px;
    align-items: flex-end;
  }
  
  .artist-cover {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 72px;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.2) 100%);
    color: rgba(255, 255, 255, 0.4);
  }
  
  .artist-info {
    flex: 1;
  }
  
  .artist-label {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }
  
  .artist-name {
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 16px;
    line-height: 1;
  }
  
  .artist-stats {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 24px;
  }
  
  .artist-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .play-button,
  .shuffle-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .play-button {
    background: #fff;
    color: #000;
  }
  
  .shuffle-button {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .play-button:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
  }
  
  .shuffle-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
  }
  
  .more-button {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .more-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
  }
  
  .play-button svg,
  .shuffle-button svg {
    width: 20px;
    height: 20px;
  }
  
  .more-button svg {
    width: 24px;
    height: 24px;
  }
  
  /* Songs Section */
  .songs-section {
    padding: 32px 48px 48px;
  }
  
  .section-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 24px;
    letter-spacing: -0.5px;
  }
  
  .songs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .song-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .song-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .song-number {
    width: 24px;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }
  
  .song-artwork {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  
  .artwork-placeholder {
    width: 100%;
    height: 100%;
  }
  
  .play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .song-item:hover .play-overlay {
    opacity: 1;
  }
  
  .play-overlay svg {
    width: 20px;
    height: 20px;
    color: #fff;
  }
  
  .song-details {
    flex: 1;
  }
  
  .song-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .song-album {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .song-duration {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }
  
  .song-menu {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    opacity: 0;
  }
  
  .song-item:hover .song-menu {
    opacity: 1;
  }
  
  .song-menu:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .song-menu svg {
    width: 20px;
    height: 20px;
  }
  
  .artist-songs-view.drag-over {
    outline: 2px solid #4ECDC4;
    background: rgba(78, 205, 196, 0.08);
  }
  </style>
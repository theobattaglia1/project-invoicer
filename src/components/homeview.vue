<template>
    <div class="home-view">
      <div class="view-header">
        <h1 class="view-title">Home</h1>
        <p class="view-subtitle">Your music at a glance</p>
      </div>
  
      <div class="home-content">
        <!-- Recently Played -->
        <section class="home-section">
          <div class="section-header">
            <h2 class="section-title">Recently Played</h2>
            <button class="see-all-button">See All</button>
          </div>
          <div class="recent-grid">
            <div v-for="song in recentSongs" :key="song.id" class="recent-card">
              <div class="recent-artwork">
                <svg viewBox="0 0 100 100" class="artwork-placeholder">
                  <rect width="100" height="100" fill="url(#gradient)" />
                  <path d="M50 30v20.55c-1.18-.68-2.54-1.1-4-1.1-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8V40h8V30H50z" fill="rgba(255,255,255,0.3)"/>
                </svg>
                <button class="play-button">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
              <div class="recent-info">
                <p class="recent-title">{{ song.title }}</p>
                <p class="recent-artist">{{ song.artist }}</p>
              </div>
            </div>
          </div>
        </section>
  
        <!-- Top Artists -->
        <section class="home-section">
          <div class="section-header">
            <h2 class="section-title">Top Artists</h2>
            <button class="see-all-button">See All</button>
          </div>
          <div class="artists-grid">
            <div v-for="artist in artists" :key="artist.id" class="artist-card">
              <div class="artist-avatar">
                <img v-if="artist.image" :src="artist.image" :alt="artist.name">
                <div v-else class="avatar-placeholder">
                  {{ artist.name.charAt(0) }}
                </div>
              </div>
              <p class="artist-name">{{ artist.name }}</p>
              <p class="artist-meta">{{ artist.playlists.length }} playlists</p>
            </div>
          </div>
        </section>
  
        <!-- Quick Actions -->
        <section class="home-section">
          <h2 class="section-title">Quick Actions</h2>
          <div class="actions-grid">
            <button class="action-card">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <span>Import Music</span>
            </button>
            <button class="action-card">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
              </div>
              <span>Create Playlist</span>
            </button>
            <button class="action-card">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 5.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
              </div>
              <span>Discover</span>
            </button>
          </div>
        </section>
      </div>
  
      <!-- SVG Definitions -->
      <svg width="0" height="0">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HomeView',
    props: {
      artists: Array,
      recentSongs: Array
    }
  }
  </script>
  
  <style scoped>
  .home-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    color: #fff;
  }
  
  .view-header {
    padding: 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .view-title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  
  .view-subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .home-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
  }
  
  .home-section {
    margin-bottom: 48px;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.3px;
  }
  
  .see-all-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .see-all-button:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  
  /* Recently Played Grid */
  .recent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  
  .recent-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .recent-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  .recent-artwork {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    margin-bottom: 12px;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .artwork-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .play-button {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 50%;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.2s ease;
  }
  
  .recent-card:hover .play-button {
    opacity: 1;
    transform: scale(1);
  }
  
  .play-button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
  
  .play-button svg {
    width: 20px;
    height: 20px;
    margin-left: 2px;
  }
  
  .recent-info {
    text-align: left;
  }
  
  .recent-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .recent-artist {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Artists Grid */
  .artists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 24px;
  }
  
  .artist-card {
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .artist-card:hover {
    transform: translateY(-2px);
  }
  
  .artist-avatar {
    width: 120px;
    height: 120px;
    margin: 0 auto 12px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .artist-card:hover .artist-avatar {
    border-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
  
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.3);
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  }
  
  .artist-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .artist-meta {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  /* Quick Actions */
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .action-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
  }
  
  .action-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  .action-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-icon svg {
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.8);
  }
  </style>
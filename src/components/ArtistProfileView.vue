<template>
    <div class="artist-profile-view">
      <!-- Hero Section -->
      <div class="artist-hero">
        <div class="hero-background">
          <img v-if="artist?.image" :src="artist.image" :alt="artist.name" class="hero-bg-image">
          <div class="hero-gradient"></div>
        </div>
        
        <div class="hero-content">
          <div class="artist-avatar-large">
            <img v-if="artist?.image" :src="artist.image" :alt="artist.name">
            <div v-else class="avatar-placeholder-large">
              {{ artist?.name.charAt(0) }}
            </div>
          </div>
          
          <div class="artist-info">
            <p class="verified-badge" v-if="artist?.verified">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Verified Artist
            </p>
            <h1 class="artist-title">{{ artist?.name }}</h1>
            <p class="artist-stats">{{ formatNumber(monthlyListeners) }} monthly listeners</p>
            
            <div class="hero-actions">
              <button class="play-button-large" @click="playArtist">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <button class="follow-button" :class="{ following: isFollowing }" @click="toggleFollow">
                {{ isFollowing ? 'Following' : 'Follow' }}
              </button>
              <button class="more-button">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Content Section -->
      <div class="artist-content">
        <!-- Popular Tracks -->
        <section class="content-section">
          <h2 class="section-title">Popular</h2>
          <div class="popular-tracks">
            <div 
              v-for="(track, index) in popularTracks" 
              :key="track.id"
              class="track-item"
              @click="playSong(track)"
            >
              <span class="track-number">{{ index + 1 }}</span>
              <img v-if="track.cover" :src="track.cover" alt="" class="track-cover">
              <div v-else class="track-cover-placeholder">
                <svg viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" fill="rgba(255,255,255,0.05)" rx="4"/>
                  <path d="M20 12v8.22c-.47-.34-1.02-.55-1.6-.55-1.77 0-3.2 1.43-3.2 3.2s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2V16h3.2v-4H20z" fill="rgba(255,255,255,0.2)"/>
                </svg>
              </div>
              <div class="track-info">
                <p class="track-title">{{ track.title }}</p>
                <p class="track-plays">{{ formatNumber(track.plays) }}</p>
              </div>
              <p class="track-duration">{{ track.duration }}</p>
              <button class="track-menu" @click.stop="showTrackMenu(track)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          </div>
          <button class="show-more-button" @click="showAllSongs">Show all</button>
        </section>
  
        <!-- Albums -->
        <section class="content-section">
          <div class="section-header">
            <h2 class="section-title">Albums</h2>
            <button class="see-all-button" @click="showAllAlbums">See all</button>
          </div>
          <div class="albums-grid">
            <div 
              v-for="album in albums.slice(0, 6)" 
              :key="album.id"
              class="album-card"
              @click="openAlbum(album)"
            >
              <div class="album-cover">
                <img v-if="album.cover" :src="album.cover" :alt="album.name">
                <div v-else class="album-cover-placeholder">
                  <svg viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="url(#album-gradient)" rx="8"/>
                    <path d="M50 30v20.55c-1.18-.68-2.54-1.1-4-1.1-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8V40h8V30H50z" fill="rgba(255,255,255,0.2)"/>
                  </svg>
                </div>
                <button class="album-play-button" @click.stop="playAlbum(album)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
              <p class="album-name">{{ album.name }}</p>
              <p class="album-year">{{ album.year }}</p>
            </div>
          </div>
        </section>
  
        <!-- Playlists -->
        <section class="content-section" v-if="artistPlaylists.length > 0">
          <div class="section-header">
            <h2 class="section-title">Artist Playlists</h2>
            <button class="see-all-button" @click="showAllPlaylists">See all</button>
          </div>
          <div class="playlists-grid">
            <div 
              v-for="playlist in artistPlaylists.slice(0, 6)" 
              :key="playlist.id"
              class="playlist-card"
              @click="openPlaylist(playlist)"
            >
              <div class="playlist-cover">
                <div class="playlist-cover-grid">
                  <div v-for="i in 4" :key="i" class="grid-item">
                    <svg viewBox="0 0 50 50" fill="none">
                      <rect width="50" height="50" :fill="`url(#grad${i})`"/>
                    </svg>
                  </div>
                </div>
              </div>
              <p class="playlist-name">{{ playlist.name }}</p>
              <p class="playlist-info">{{ playlist.songs?.length || 0 }} songs</p>
            </div>
          </div>
        </section>
  
        <!-- About -->
        <section class="content-section">
          <h2 class="section-title">About</h2>
          <div class="about-section">
            <div class="about-content">
              <div class="artist-bio" v-if="artist?.bio">
                <p>{{ artist.bio }}</p>
              </div>
              <div v-else class="bio-placeholder">
                <p>No biography available for this artist yet.</p>
              </div>
              
              <div class="artist-stats-grid">
                <div class="stat-item">
                  <p class="stat-value">{{ formatNumber(monthlyListeners) }}</p>
                  <p class="stat-label">Monthly listeners</p>
                </div>
                <div class="stat-item">
                  <p class="stat-value">{{ albums.length }}</p>
                  <p class="stat-label">Albums</p>
                </div>
                <div class="stat-item">
                  <p class="stat-value">{{ totalSongs }}</p>
                  <p class="stat-label">Songs</p>
                </div>
              </div>
            </div>
            
            <div class="artist-image-large" v-if="artist?.image">
              <img :src="artist.image" :alt="artist.name">
            </div>
          </div>
        </section>
  
        <!-- Similar Artists -->
        <section class="content-section" v-if="similarArtists.length > 0">
          <div class="section-header">
            <h2 class="section-title">Fans also like</h2>
            <button class="see-all-button" @click="showSimilarArtists">See all</button>
          </div>
          <div class="similar-artists-grid">
            <div 
              v-for="similarArtist in similarArtists.slice(0, 6)" 
              :key="similarArtist.id"
              class="similar-artist-card"
              @click="goToArtist(similarArtist)"
            >
              <div class="similar-artist-avatar">
                <img v-if="similarArtist.image" :src="similarArtist.image" :alt="similarArtist.name">
                <div v-else class="avatar-placeholder">
                  {{ similarArtist.name.charAt(0) }}
                </div>
              </div>
              <p class="similar-artist-name">{{ similarArtist.name }}</p>
              <p class="similar-artist-type">Artist</p>
            </div>
          </div>
        </section>
      </div>
  
      <!-- SVG Gradients -->
      <svg width="0" height="0">
        <defs>
          <linearGradient id="album-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#43e97b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#38f9d7;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue'
  import { useStore } from 'vuex'
  
  export default {
    name: 'ArtistProfileView',
    props: {
      artistId: {
        type: Number,
        required: true
      }
    },
    setup(props) {
      const store = useStore()
      const isFollowing = ref(false)
      
      // Computed properties
      const artist = computed(() => 
        store.getters.artistById(props.artistId)
      )
      
      const songs = computed(() => 
        store.getters.artistSongs(props.artistId)
      )
      
      const albums = computed(() => 
        store.getters.artistAlbums(props.artistId)
      )
      
      const artistPlaylists = computed(() => 
        store.state.playlists.filter(p => p.artist_id === props.artistId)
      )
      
      const popularTracks = computed(() => 
        // In a real app, this would be sorted by play count
        songs.value.slice(0, 5).map(song => ({
          ...song,
          plays: Math.floor(Math.random() * 10000000) // Mock data
        }))
      )
      
      const monthlyListeners = computed(() => 
        // Mock data - in real app this would come from analytics
        Math.floor(Math.random() * 1000000) + 100000
      )
      
      const totalSongs = computed(() => songs.value.length)
      
      const similarArtists = computed(() => 
        // Mock data - in real app this would be based on genre/style analysis
        store.state.artists.filter(a => a.id !== props.artistId).slice(0, 6)
      )
      
      // Methods
      const formatNumber = (num) => {
        if (num >= 1000000) {
          return `${(num / 1000000).toFixed(1)}M`
        } else if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}K`
        }
        return num.toString()
      }
      
      const playArtist = () => {
        store.dispatch('playArtist', props.artistId)
      }
      
      const toggleFollow = () => {
        isFollowing.value = !isFollowing.value
        // In real app, save to user preferences
      }
      
      const playSong = (song) => {
        store.dispatch('playSong', song)
      }
      
      const playAlbum = (album) => {
        store.dispatch('playAlbum', { album, songs: songs.value })
      }
      
      const openAlbum = (album) => {
        // Navigate to album view
        console.log('Open album:', album)
      }
      
      const openPlaylist = (playlist) => {
        // Navigate to playlist view
        store.commit('SET_ACTIVE_VIEW', { view: 'playlist', id: playlist.id })
      }
      
      const showTrackMenu = (track) => {
        console.log('Show menu for track:', track)
      }
      
      const showAllSongs = () => {
        store.commit('SET_ACTIVE_VIEW', { view: 'artist-songs', id: props.artistId })
      }
      
      const showAllAlbums = () => {
        console.log('Show all albums')
      }
      
      const showAllPlaylists = () => {
        console.log('Show all playlists')
      }
      
      const showSimilarArtists = () => {
        console.log('Show similar artists')
      }
      
      const goToArtist = (artist) => {
        store.commit('SET_ACTIVE_VIEW', { view: 'artist-profile', id: artist.id })
      }
      
      return {
        artist,
        songs,
        albums,
        artistPlaylists,
        popularTracks,
        monthlyListeners,
        totalSongs,
        similarArtists,
        isFollowing,
        formatNumber,
        playArtist,
        toggleFollow,
        playSong,
        playAlbum,
        openAlbum,
        openPlaylist,
        showTrackMenu,
        showAllSongs,
        showAllAlbums,
        showAllPlaylists,
        showSimilarArtists,
        goToArtist
      }
    }
  }
  </script>
  
  <style scoped>
  .artist-profile-view {
    height: 100%;
    overflow-y: auto;
    color: #fff;
    background: linear-gradient(180deg, rgba(20, 20, 20, 0) 0%, rgba(10, 10, 10, 1) 300px);
  }
  
  /* Hero Section */
  .artist-hero {
    position: relative;
    height: 420px;
    display: flex;
    align-items: flex-end;
    padding: 48px;
    margin-bottom: 32px;
  }
  
  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  .hero-bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(50px) brightness(0.5);
    transform: scale(1.1);
  }
  
  .hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(transparent 0%, rgba(18, 18, 18, 0.7) 50%, #121212 100%);
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    gap: 32px;
    width: 100%;
  }
  
  .artist-avatar-large {
    width: 232px;
    height: 232px;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .artist-avatar-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder-large {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 96px;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%);
    color: rgba(255, 255, 255, 0.6);
  }
  
  .artist-info {
    flex: 1;
    padding-bottom: 8px;
  }
  
  .verified-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #3b82f6;
    margin-bottom: 8px;
  }
  
  .verified-badge svg {
    width: 16px;
    height: 16px;
  }
  
  .artist-title {
    font-size: 96px;
    font-weight: 900;
    letter-spacing: -4px;
    line-height: 1;
    margin-bottom: 24px;
  }
  
  .artist-stats {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 24px;
  }
  
  .hero-actions {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  
  .play-button-large {
    width: 56px;
    height: 56px;
    background: #1db954;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .play-button-large:hover {
    transform: scale(1.06);
    background: #1ed760;
  }
  
  .play-button-large svg {
    width: 24px;
    height: 24px;
    color: #000;
    margin-left: 2px;
  }
  
  .follow-button {
    padding: 8px 32px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .follow-button:hover {
    border-color: #fff;
    transform: scale(1.04);
  }
  
  .follow-button.following {
    border-color: #1db954;
  }
  
  .more-button {
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .more-button:hover {
    color: #fff;
  }
  
  .more-button svg {
    width: 24px;
    height: 24px;
  }
  
  /* Content Sections */
  .artist-content {
    padding: 0 48px 48px;
  }
  
  .content-section {
    margin-bottom: 64px;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  
  .see-all-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .see-all-button:hover {
    color: #fff;
  }
  
  /* Popular Tracks */
  .popular-tracks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .track-item {
    display: grid;
    grid-template-columns: 24px 40px 1fr 60px 40px;
    gap: 16px;
    align-items: center;
    padding: 8px 0;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .track-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .track-number {
    text-align: center;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .track-cover,
  .track-cover-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .track-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .track-info {
    min-width: 0;
  }
  
  .track-title {
    font-size: 16px;
    font-weight: 400;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .track-plays {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .track-duration {
    text-align: right;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .track-menu {
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.2s ease;
  }
  
  .track-item:hover .track-menu {
    opacity: 1;
  }
  
  .track-menu:hover {
    color: #fff;
  }
  
  .track-menu svg {
    width: 20px;
    height: 20px;
  }
  
  .show-more-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    padding: 8px 0;
    transition: all 0.2s ease;
  }
  
  .show-more-button:hover {
    color: #fff;
  }
  
  /* Albums Grid */
  .albums-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
  }
  
  .album-card {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .album-card:hover {
    transform: translateY(-4px);
  }
  
  .album-cover {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  
  .album-cover img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .album-cover-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .album-play-button {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 48px;
    height: 48px;
    background: #1db954;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.3s ease;
    box-shadow: 0 8px 8px rgba(0, 0, 0, 0.3);
  }
  
  .album-card:hover .album-play-button {
    opacity: 1;
    transform: translateY(0);
  }
  
  .album-play-button:hover {
    transform: scale(1.06);
    background: #1ed760;
  }
  
  .album-play-button svg {
    width: 20px;
    height: 20px;
    color: #000;
    margin-left: 2px;
  }
  
  .album-name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .album-year {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* Playlists Grid */
  .playlists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
  }
  
  .playlist-card {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .playlist-card:hover {
    transform: translateY(-4px);
  }
  
  .playlist-cover {
    width: 100%;
    padding-bottom: 100%;
    position: relative;
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  
  .playlist-cover-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  .grid-item {
    overflow: hidden;
  }
  
  .grid-item svg {
    width: 100%;
    height: 100%;
  }
  
  .playlist-name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .playlist-info {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* About Section */
  .about-section {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 48px;
    align-items: start;
  }
  
  .about-content {
    max-width: 600px;
  }
  
  .artist-bio {
    font-size: 16px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 32px;
  }
  
  .bio-placeholder {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 32px;
  }
  
  .artist-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .artist-image-large {
    width: 300px;
    height: 300px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  
  .artist-image-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  /* Similar Artists */
  .similar-artists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 24px;
  }
  
  .similar-artist-card {
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .similar-artist-card:hover {
    transform: translateY(-4px);
  }
  
  .similar-artist-avatar {
    width: 160px;
    height: 160px;
    margin: 0 auto 16px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  
  .similar-artist-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .similar-artist-avatar .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    color: rgba(255, 255, 255, 0.5);
  }
  
  .similar-artist-name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .similar-artist-type {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* Responsive */
  @media (max-width: 1200px) {
    .artist-title {
      font-size: 72px;
    }
    
    .albums-grid,
    .playlists-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
  }
  
  @media (max-width: 768px) {
    .artist-hero {
      height: auto;
      padding: 24px;
    }
    
    .hero-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .artist-title {
      font-size: 48px;
    }
    
    .about-section {
      grid-template-columns: 1fr;
    }
    
    .artist-image-large {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    }
  }
  </style>
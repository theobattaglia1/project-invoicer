<template>
    <div class="profile-page">
      <!-- Hero Section -->
      <div class="profile-hero">
        <div class="hero-background">
          <img 
            v-if="entity?.image || entity?.artwork_path" 
            :src="entity.image || entity.artwork_path" 
            :alt="entity.name"
            class="hero-image"
          />
          <div v-else class="hero-placeholder">
            <div class="placeholder-icon">
              {{ entity?.name?.charAt(0)?.toUpperCase() || '?' }}
            </div>
          </div>
          <div class="hero-gradient"></div>
        </div>
        
        <div class="hero-content">
          <p class="entity-label">{{ entity?.type || 'PROFILE' }}</p>
          <h1 class="entity-name">{{ entity?.name || 'Untitled' }}</h1>
          <p class="entity-info">
            <slot name="hero-info">
              <span v-if="entity?.description">{{ entity.description }}</span>
              <span v-if="stats?.length"> • {{ formatStats(stats) }}</span>
            </slot>
          </p>
        </div>
      </div>
  
      <!-- Actions Section -->
      <div class="actions-section">
        <slot name="primary-actions">
          <button class="play-button" @click="$emit('action', { type: 'primary-action' })">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </slot>
        
        <slot name="secondary-actions">
          <button class="action-button" @click="$emit('action', { type: 'share' })">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          </button>
          
          <button class="action-button" @click="$emit('action', { type: 'edit' })">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          
          <button class="action-button" @click="$emit('action', { type: 'more' })">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </slot>
        
        <slot name="custom-actions" />
      </div>
  
      <!-- Content Sections -->
      <div class="profile-content">
        <div v-for="section in visibleSections" :key="section.id" class="content-section">
          <h2 v-if="section.title" class="section-title">{{ section.title }}</h2>
          
          <!-- Recent Items Section -->
          <div v-if="section.type === 'recent-items'" class="recent-items">
            <div class="items-list">
              <div 
                v-for="(item, index) in section.items?.slice(0, section.limit || 5)" 
                :key="item.id"
                class="item-row"
                @click="$emit('action', { type: 'select-item', item, section })"
              >
                <slot :name="`${section.id}-item`" :item="item" :index="index">
                  <div class="item-number">{{ index + 1 }}</div>
                  <div class="item-cover">
                    <img v-if="item.image" :src="item.image" :alt="item.name" />
                    <div v-else class="cover-placeholder">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  </div>
                  <div class="item-info">
                    <p class="item-name">{{ item.name }}</p>
                    <p class="item-meta">{{ item.meta }}</p>
                  </div>
                  <p class="item-extra">{{ item.extra }}</p>
                </slot>
              </div>
            </div>
            <button v-if="section.showMore" class="show-all-button" @click="$emit('action', { type: 'show-all', section })">
              Show all {{ section.title.toLowerCase() }}
            </button>
          </div>
  
          <!-- Grid Section -->
          <div v-else-if="section.type === 'grid'" class="grid-section">
            <div class="section-header" v-if="section.showHeader">
              <h2 class="section-title">{{ section.title }}</h2>
              <button class="see-all-button" @click="$emit('action', { type: 'show-all', section })">
                Show all
              </button>
            </div>
            <div class="items-grid" :style="{ gridTemplateColumns: section.columns || 'repeat(auto-fill, minmax(180px, 1fr))' }">
              <slot :name="`${section.id}-grid`" :items="section.items">
                <div 
                  v-for="item in section.items?.slice(0, section.limit || 6)" 
                  :key="item.id"
                  class="grid-card"
                  @click="$emit('action', { type: 'select-item', item, section })"
                >
                  <div class="card-cover">
                    <img v-if="item.image" :src="item.image" :alt="item.name" />
                    <div v-else class="cover-placeholder">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      </svg>
                    </div>
                    <button class="card-play-button" @click.stop="$emit('action', { type: 'play-item', item })">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                  <p class="card-name">{{ item.name }}</p>
                  <p class="card-info">{{ item.info }}</p>
                </div>
              </slot>
            </div>
          </div>
  
          <!-- Text Section -->
          <div v-else-if="section.type === 'text'" class="text-section">
            <div class="text-content">
              <slot :name="`${section.id}-content`">
                <p>{{ section.content }}</p>
              </slot>
            </div>
          </div>
  
          <!-- Stats Section -->
          <div v-else-if="section.type === 'stats'" class="stats-section">
            <div class="stats-grid">
              <div v-for="stat in section.stats" :key="stat.label" class="stat-card">
                <p class="stat-value">{{ stat.value }}</p>
                <p class="stat-label">{{ stat.label }}</p>
              </div>
            </div>
          </div>
  
          <!-- Custom Section -->
          <div v-else class="custom-section">
            <slot :name="`section-${section.id}`" :section="section" />
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { computed } from 'vue'
  
  export default {
    name: 'ProfilePageTemplate',
    props: {
      entity: {
        type: Object,
        required: true
      },
      sections: {
        type: Array,
        default: () => []
      },
      stats: {
        type: Array,
        default: () => []
      }
    },
    emits: ['action'],
    setup(props) {
      const visibleSections = computed(() => 
        props.sections.filter(section => section.visible !== false)
      )
  
      const formatStats = (stats) => {
        return stats.map(stat => `${stat.value} ${stat.label}`).join(' • ')
      }
  
      return {
        visibleSections,
        formatStats
      }
    }
  }
  </script>
  
  <style scoped>
  .profile-page {
    height: 100%;
    overflow-y: auto;
    background: #000;
    color: white;
  }
  
  /* Hero Section */
  .profile-hero {
    position: relative;
    height: 40vh;
    min-height: 340px;
    max-height: 500px;
    display: flex;
    align-items: flex-end;
    padding: 0 32px 24px;
  }
  
  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    filter: brightness(0.5);
  }
  
  .hero-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-icon {
    font-size: 200px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.08);
  }
  
  .hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(transparent 0, rgba(0,0,0,0.5) 100%), 
                linear-gradient(rgba(0,0,0,0.1) 0, #000 100%);
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    width: 100%;
  }
  
  .entity-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .entity-name {
    font-size: clamp(48px, 8vw, 96px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.04em;
    margin: 0 0 24px;
  }
  
  .entity-info {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* Actions Section */
  .actions-section {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 24px 32px;
    background: linear-gradient(rgba(0,0,0,0.6) 0, #000 100%);
  }
  
  .play-button {
    width: 56px;
    height: 56px;
    background: #1db954;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .play-button:hover {
    transform: scale(1.04);
    background: #1ed760;
  }
  
  .play-button svg {
    width: 24px;
    height: 24px;
    color: #000;
    margin-left: 2px;
  }
  
  .action-button {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .action-button:hover {
    color: white;
    transform: scale(1.04);
  }
  
  .action-button svg {
    width: 24px;
    height: 24px;
  }
  
  /* Content */
  .profile-content {
    padding: 0 32px 32px;
  }
  
  .content-section {
    margin-bottom: 48px;
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
    letter-spacing: -0.04em;
    margin-bottom: 24px;
  }
  
  .section-header .section-title {
    margin-bottom: 0;
  }
  
  .see-all-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 4px 8px;
  }
  
  .see-all-button:hover {
    color: white;
  }
  
  /* Recent Items */
  .items-list {
    margin-bottom: 16px;
  }
  
  .item-row {
    display: grid;
    grid-template-columns: 32px 40px 1fr 80px;
    gap: 16px;
    align-items: center;
    padding: 8px 0;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  
  .item-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .item-number {
    text-align: center;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .item-cover {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .item-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .cover-placeholder svg {
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.3);
  }
  
  .item-info {
    min-width: 0;
  }
  
  .item-name {
    font-size: 16px;
    font-weight: 400;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-meta {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .item-extra {
    text-align: right;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .show-all-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    padding: 8px 0;
    transition: all 0.15s ease;
  }
  
  .show-all-button:hover {
    color: white;
  }
  
  /* Grid Section */
  .items-grid {
    display: grid;
    gap: 24px;
  }
  
  .grid-card {
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .grid-card:hover {
    transform: translateY(-4px);
  }
  
  .card-cover {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .card-cover img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .card-play-button {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.2s ease;
  }
  
  .grid-card:hover .card-play-button {
    opacity: 1;
    transform: translateY(0);
  }
  
  .card-play-button:hover {
    transform: scale(1.06);
    background: rgba(0, 0, 0, 0.9);
  }
  
  .card-play-button svg {
    width: 20px;
    height: 20px;
    color: white;
    margin-left: 2px;
  }
  
  .card-name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .card-info {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Text Section */
  .text-content {
    max-width: 800px;
  }
  
  .text-content p {
    font-size: 16px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.8);
    white-space: pre-wrap;
  }
  
  /* Stats Section */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    transition: all 0.15s ease;
  }
  
  .stat-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  /* Scrollbar */
  .profile-page::-webkit-scrollbar {
    width: 12px;
  }
  
  .profile-page::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .profile-page::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  
  .profile-page::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
    background-clip: padding-box;
  }
  </style>
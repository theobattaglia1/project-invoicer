<template>
    <div class="dashboard-page">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <h1 class="view-title">{{ title || getGreeting() }}</h1>
          <p class="view-subtitle">{{ subtitle || getDefaultSubtitle() }}</p>
        </div>
        <div class="header-actions">
          <slot name="header-actions">
            <button class="action-btn ghost" @click="$emit('action', { type: 'customize' })">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
              </svg>
              Customize
            </button>
          </slot>
        </div>
      </div>
  
      <!-- Dashboard Sections -->
      <div class="dashboard-content">
        <section 
          v-for="section in visibleSections" 
          :key="section.id"
          class="section"
          :class="`section-${section.type}`"
        >
          <!-- Quick Access Section -->
          <template v-if="section.type === 'quick-access'">
            <h2 class="section-title">{{ section.title || 'Quick access' }}</h2>
            <div class="quick-access-grid">
              <div 
                v-for="(item, index) in section.items" 
                :key="index"
                class="quick-card"
                @click="$emit('action', { type: 'quick-access', item })"
              >
                <div class="quick-card-icon">
                  <slot :name="`${section.id}-icon`" :item="item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path :d="item.icon || 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'"/>
                    </svg>
                  </slot>
                </div>
                <div class="quick-card-info">
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.subtitle }}</p>
                </div>
                <button class="quick-play-btn" @click.stop="$emit('action', { type: 'quick-play', item })">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            </div>
          </template>
  
          <!-- Recent Section -->
          <template v-else-if="section.type === 'recent'">
            <div class="section-header">
              <h2 class="section-title">{{ section.title || 'Recent' }}</h2>
              <button class="see-all-btn" @click="$emit('action', { type: 'show-all', section })">
                Show all
              </button>
            </div>
            <div class="content-grid">
              <div 
                v-for="item in section.items.slice(0, section.limit || 8)" 
                :key="item.id"
                class="content-card"
                @click="$emit('action', { type: 'select-item', item, section })"
              >
                <div class="card-artwork">
                  <img 
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                  />
                  <div v-else class="artwork-placeholder">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <button class="play-overlay" @click.stop="$emit('action', { type: 'play-item', item })">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
                <div class="card-info">
                  <h3 class="card-title">{{ item.name }}</h3>
                  <p class="card-subtitle">{{ item.subtitle }}</p>
                </div>
              </div>
            </div>
          </template>
  
          <!-- Stats Section -->
          <template v-else-if="section.type === 'stats'">
            <h2 class="section-title">{{ section.title || 'Overview' }}</h2>
            <div class="stats-grid">
              <div 
                v-for="stat in section.stats" 
                :key="stat.id"
                class="stat-card"
                :class="stat.trend && `trend-${stat.trend}`"
              >
                <div class="stat-header">
                  <p class="stat-label">{{ stat.label }}</p>
                  <div v-if="stat.icon" class="stat-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path :d="stat.icon"/>
                    </svg>
                  </div>
                </div>
                <p class="stat-value">{{ stat.value }}</p>
                <p v-if="stat.change" class="stat-change">
                  <span :class="stat.trend">{{ stat.change }}</span>
                  <span class="stat-period">{{ stat.period || 'vs last period' }}</span>
                </p>
              </div>
            </div>
          </template>
  
          <!-- Activity Feed Section -->
          <template v-else-if="section.type === 'activity'">
            <div class="section-header">
              <h2 class="section-title">{{ section.title || 'Recent Activity' }}</h2>
              <button class="see-all-btn" @click="$emit('action', { type: 'show-all', section })">
                View all
              </button>
            </div>
            <div class="activity-feed">
              <div 
                v-for="activity in section.activities.slice(0, section.limit || 10)" 
                :key="activity.id"
                class="activity-item"
                @click="$emit('action', { type: 'view-activity', activity })"
              >
                <div class="activity-icon" :class="`type-${activity.type}`">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path :d="getActivityIcon(activity.type)"/>
                  </svg>
                </div>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.text }}</p>
                  <p class="activity-time">{{ formatTime(activity.timestamp) }}</p>
                </div>
              </div>
            </div>
          </template>
  
          <!-- Chart Section -->
          <template v-else-if="section.type === 'chart'">
            <div class="section-header">
              <h2 class="section-title">{{ section.title }}</h2>
              <div class="chart-controls">
                <slot :name="`${section.id}-controls`" />
              </div>
            </div>
            <div class="chart-container">
              <slot :name="`chart-${section.id}`" :data="section.data">
                <div class="chart-placeholder">
                  <p>Chart visualization here</p>
                </div>
              </slot>
            </div>
          </template>
  
          <!-- Custom Section -->
          <template v-else>
            <slot :name="`section-${section.id}`" :section="section">
              <div class="custom-section">
                <h2 v-if="section.title" class="section-title">{{ section.title }}</h2>
                <div class="section-content">
                  <p>Custom section content</p>
                </div>
              </div>
            </slot>
          </template>
        </section>
  
        <!-- Empty State -->
        <div v-if="!visibleSections.length" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <h3>No data to display</h3>
          <p>Start by adding some content to your dashboard</p>
          <button class="add-content-btn" @click="$emit('action', { type: 'add-content' })">
            Add Content
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { computed } from 'vue'
  
  export default {
    name: 'DashboardPageTemplate',
    props: {
      title: String,
      subtitle: String,
      sections: {
        type: Array,
        default: () => []
      }
    },
    emits: ['action'],
    setup(props) {
      const visibleSections = computed(() => 
        props.sections.filter(section => section.visible !== false)
      )
  
      const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
      }
  
      const getDefaultSubtitle = () => {
        const date = new Date()
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }
  
      const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now - date
        
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
        
        return date.toLocaleDateString()
      }
  
      const getActivityIcon = (type) => {
        const icons = {
          play: 'M8 5v14l11-7z',
          add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
          edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
          delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
          share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
          default: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
        }
        return icons[type] || icons.default
      }
  
      return {
        visibleSections,
        getGreeting,
        getDefaultSubtitle,
        formatTime,
        getActivityIcon
      }
    }
  }
  </script>
  
  <style scoped>
  .dashboard-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
    overflow-y: auto;
  }
  
  /* Header */
  .view-header {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .header-content {
    flex: 1;
  }
  
  .view-title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  
  .view-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .action-btn.ghost {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .action-btn.ghost:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  /* Dashboard Content */
  .dashboard-content {
    flex: 1;
    padding: 32px;
  }
  
  /* Sections */
  .section {
    margin-bottom: 56px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.3px;
    margin-bottom: 0;
  }
  
  .see-all-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  
  .see-all-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  /* Quick Access Grid */
  .quick-access-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-top: 20px;
  }
  
  .quick-card {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  
  .quick-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
  
  .quick-card-icon {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  
  .quick-card-icon svg {
    width: 18px;
    height: 18px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .quick-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .quick-card-info h3 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  
  .quick-card-info p {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.2;
  }
  
  .quick-play-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.2s ease;
  }
  
  .quick-card:hover .quick-play-btn {
    opacity: 1;
    transform: scale(1);
  }
  
  .quick-play-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.06);
  }
  
  .quick-play-btn svg {
    width: 16px;
    height: 16px;
    color: white;
    margin-left: 1px;
  }
  
  /* Content Grid */
  .content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }
  
  .content-card {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .content-card:hover {
    transform: translateY(-2px);
  }
  
  .card-artwork {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    margin-bottom: 12px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .card-artwork img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .artwork-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
  }
  
  .artwork-placeholder svg {
    width: 32px;
    height: 32px;
    color: rgba(255, 255, 255, 0.2);
  }
  
  .play-overlay {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.2s ease;
  }
  
  .content-card:hover .play-overlay {
    opacity: 1;
    transform: scale(1);
  }
  
  .play-overlay:hover {
    transform: scale(1.06);
    background: rgba(0, 0, 0, 0.9);
  }
  
  .play-overlay svg {
    width: 16px;
    height: 16px;
    color: white;
    margin-left: 1px;
  }
  
  .card-info {
    padding: 0 2px;
  }
  
  .card-title {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
  }
  
  .card-subtitle {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
  }
  
  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.15s ease;
  }
  
  .stat-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .stat-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .stat-icon {
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .stat-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .stat-change {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .stat-change .trend-up {
    color: #4ade80;
  }
  
  .stat-change .trend-down {
    color: #f87171;
  }
  
  .stat-period {
    margin-left: 4px;
    color: rgba(255, 255, 255, 0.4);
  }
  
  /* Activity Feed */
  .activity-feed {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .activity-item {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .activity-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .activity-icon svg {
    width: 18px;
    height: 18px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .activity-icon.type-play {
    background: rgba(29, 185, 84, 0.2);
  }
  
  .activity-icon.type-play svg {
    color: #1db954;
  }
  
  .activity-icon.type-add {
    background: rgba(59, 130, 246, 0.2);
  }
  
  .activity-icon.type-add svg {
    color: #3b82f6;
  }
  
  .activity-icon.type-edit {
    background: rgba(251, 191, 36, 0.2);
  }
  
  .activity-icon.type-edit svg {
    color: #fbbf24;
  }
  
  .activity-content {
    flex: 1;
    min-width: 0;
  }
  
  .activity-text {
    font-size: 14px;
    margin-bottom: 4px;
    line-height: 1.4;
  }
  
  .activity-time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  /* Chart Section */
  .chart-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 24px;
    min-height: 300px;
  }
  
  .chart-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.3);
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 80px 40px;
    max-width: 400px;
    margin: 0 auto;
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .empty-icon svg {
    width: 40px;
    height: 40px;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .empty-state h3 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  
  .empty-state p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 32px;
  }
  
  .add-content-btn {
    padding: 12px 32px;
    background: white;
    border: none;
    border-radius: 24px;
    color: black;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .add-content-btn:hover {
    transform: scale(1.04);
    background: rgba(255, 255, 255, 0.9);
  }
  
  /* Scrollbar */
  .dashboard-page::-webkit-scrollbar {
    width: 12px;
  }
  
  .dashboard-page::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .dashboard-page::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  
  .dashboard-page::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
    background-clip: padding-box;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .dashboard-content {
      padding: 20px;
    }
    
    .quick-access-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .content-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>
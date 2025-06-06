<template>
    <div class="artist-layout">
      <!-- Header -->
      <div class="artist-header">
        <div class="header-left">
          <button @click="goBack" class="btn-back">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div class="artist-info">
            <h1 class="artist-name">{{ artist?.name }}</h1>
            <div class="artist-contact">
              <span v-if="artist?.email">{{ artist.email }}</span>
              <span v-if="artist?.phone" class="separator">•</span>
              <span v-if="artist?.phone">{{ artist.phone }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Sub Navigation -->
      <div class="artist-nav">
        <router-link 
          :to="`/artist/${artistId}/overview`" 
          class="nav-tab"
          :class="{ active: currentTab === 'overview' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          Overview
        </router-link>
        
        <router-link 
          :to="`/artist/${artistId}/projects`" 
          class="nav-tab"
          :class="{ active: currentTab === 'projects' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
          Projects
        </router-link>
        
        <router-link 
          :to="`/artist/${artistId}/invoices`" 
          class="nav-tab"
          :class="{ active: currentTab === 'invoices' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          Invoices
          <span v-if="activeInvoiceCount > 0" class="badge">{{ activeInvoiceCount }}</span>
        </router-link>
        
        <router-link 
          :to="`/artist/${artistId}/archived`" 
          class="nav-tab"
          :class="{ active: currentTab === 'archived' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
          </svg>
          Archived
          <span v-if="archivedCount > 0" class="badge secondary">{{ archivedCount }}</span>
        </router-link>
        
        <router-link 
          :to="`/artist/${artistId}/trash`" 
          class="nav-tab"
          :class="{ active: currentTab === 'trash' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Trash
          <span v-if="trashedCount > 0" class="badge danger">{{ trashedCount }}</span>
        </router-link>
      </div>
  
      <!-- Content -->
      <div class="artist-content">
        <slot></slot>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useArtistStore } from '@/store/artistStore'
  import { useInvoiceStore } from '@/store/invoiceStore'
  
  const props = defineProps({
    artistId: {
      type: String,
      required: true
    }
  })
  
  const router = useRouter()
  const route = useRoute()
  const artistStore = useArtistStore()
  const invoiceStore = useInvoiceStore()
  
  const artist = computed(() => artistStore.getArtistById(props.artistId))
  
  const currentTab = computed(() => {
    const path = route.path
    if (path.includes('/overview')) return 'overview'
    if (path.includes('/projects')) return 'projects'
    if (path.includes('/invoices')) return 'invoices'
    if (path.includes('/archived')) return 'archived'
    if (path.includes('/trash')) return 'trash'
    return 'overview'
  })
  
  const activeInvoiceCount = computed(() => 
    invoiceStore.getActiveInvoicesByArtist(props.artistId).length
  )
  
  const archivedCount = computed(() => 
    invoiceStore.getArchivedInvoicesByArtist(props.artistId).length
  )
  
  const trashedCount = computed(() => 
    invoiceStore.getTrashedInvoicesByArtist(props.artistId).length
  )
  
  const goBack = () => {
    router.push('/')
  }
  </script>
  
  <style scoped>
  .artist-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .artist-header {
    padding: 24px 32px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .btn-back {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-back:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .btn-back svg {
    width: 20px;
    height: 20px;
  }
  
  .artist-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .artist-name {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  
  .artist-contact {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .separator {
    margin: 0 8px;
  }
  
  /* Sub Navigation */
  .artist-nav {
    display: flex;
    gap: 32px;
    padding: 0 32px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .nav-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .nav-tab:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .nav-tab.active {
    color: white;
    border-bottom-color: #1db954;
  }
  
  .nav-tab svg {
    width: 18px;
    height: 18px;
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: #1db954;
    color: white;
    font-size: 11px;
    font-weight: 600;
    border-radius: 10px;
    margin-left: 4px;
  }
  
  .badge.secondary {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .badge.danger {
    background: #f44336;
  }
  
  /* Content Area */
  .artist-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
  }
  </style>
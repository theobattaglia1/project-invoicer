<template>
    <component 
      :is="getPageComponent(pageConfig?.type)"
      v-bind="pageProps"
      @navigate="handleNavigation"
      @action="handleAction"
      @update="handleUpdate"
    />
  </template>
  
  <script>
  import { computed, inject, ref } from 'vue'
  
  // Import page templates
  import GridPageTemplate from './templates/GridPageTemplate.vue'
  import ListPageTemplate from './templates/ListPageTemplate.vue'
  import ProfilePageTemplate from './templates/ProfilePageTemplate.vue'
  import DashboardPageTemplate from './templates/DashboardPageTemplate.vue'
  import CalendarPageTemplate from './templates/CalendarPageTemplate.vue'
  import TimelinePageTemplate from './templates/TimelinePageTemplate.vue'
  import AssetLibraryTemplate from './templates/AssetLibraryTemplate.vue'
  import MoodBoardTemplate from './templates/MoodBoardTemplate.vue'
  import IdeasPageTemplate from './templates/IdeasPageTemplate.vue'
  import FolderPageTemplate from './templates/FolderPageTemplate.vue'

  export default {
    name: 'DynamicPage',
    props: {
      pageConfig: {
        type: Object,
        required: true
      }
    },
    
    emits: ['navigate', 'action', 'update'],
    setup(props, { emit }) {
  const customPages = inject('customPages', ref([]))
  const playlists = inject('playlists', ref([]))  // ADD THIS
      const pageComponents = {
        grid: GridPageTemplate,
        list: ListPageTemplate,
        profile: ProfilePageTemplate,
        dashboard: DashboardPageTemplate,
        calendar: CalendarPageTemplate,
        timeline: TimelinePageTemplate,
        assets: AssetLibraryTemplate,
        moodboard: MoodBoardTemplate,
        ideas: IdeasPageTemplate,
        folder: FolderPageTemplate
      }
  
      const getPageComponent = (type) => {
        return pageComponents[type] || DashboardPageTemplate
      }
  
      const pageProps = computed(() => {
        if (!props.pageConfig) {
          return {}
        }
  
        const baseProps = {
          title: props.pageConfig.title,
          subtitle: props.pageConfig.subtitle,
          data: props.pageConfig.data || {},
          config: props.pageConfig.config || {}
        }
  
        // Add type-specific props
        switch (props.pageConfig.type) {
            case 'folder':
  return {
    ...baseProps,
    folderId: props.pageConfig.id,
    folderData: props.pageConfig.data || { items: [] },
    parentPath: props.pageConfig.parentPath || [],
    customPages: inject('customPages', ref([])).value,
    playlists: inject('playlists', ref([])).value  // ADD THIS
  }
          
          case 'grid':
            return {
              ...baseProps,
              items: props.pageConfig.data?.items || [],
              cardType: props.pageConfig.config?.cardType,
              columns: props.pageConfig.config?.columns || 'auto-fill',
              showSearch: props.pageConfig.config?.showSearch !== false,
              showSort: props.pageConfig.config?.showSort !== false,
              selectable: props.pageConfig.config?.selectable !== false
            }
          
          case 'list':
            return {
              ...baseProps,
              songs: props.pageConfig.data?.songs || [],
              columns: props.pageConfig.config?.columns,
              showHero: props.pageConfig.config?.showHero,
              heroData: props.pageConfig.config?.heroData,
              virtualScroll: props.pageConfig.config?.virtualScroll !== false
            }
          
          case 'profile':
            return {
              ...baseProps,
              entity: props.pageConfig.data?.entity,
              sections: props.pageConfig.config?.sections,
              stats: props.pageConfig.data?.stats,
              relatedItems: props.pageConfig.data?.relatedItems
            }
          
          case 'dashboard':
            return {
              ...baseProps,
              sections: props.pageConfig.data?.sections || []
            }
          
          case 'calendar':
            return {
              ...baseProps,
              events: props.pageConfig.data?.events || [],
              defaultView: props.pageConfig.config?.defaultView || 'month'
            }
          
          case 'timeline':
            return {
              ...baseProps,
              items: props.pageConfig.data?.items || [],
              viewMode: props.pageConfig.config?.viewMode || 'stack'
            }
          
          case 'assets':
            return {
              ...baseProps,
              assets: props.pageConfig.data?.assets || [],
              itemsPerPage: props.pageConfig.config?.itemsPerPage || 24
            }
          
          case 'moodboard':
            return {
              ...baseProps,
              elements: props.pageConfig.data?.elements || [],
              canvasSize: props.pageConfig.config?.canvasSize || 2000,
              gridSize: props.pageConfig.config?.gridSize || 20
            }
          
          case 'ideas':
            return {
              ...baseProps,
              boards: props.pageConfig.data?.boards || [],
              notes: props.pageConfig.data?.notes || [],
              itemsPerPage: props.pageConfig.config?.itemsPerPage || 20
            }
          
          default:
            return baseProps
        }
      })
  
      const handleNavigation = (target) => {
        emit('navigate', target)
      }
  
      const handleAction = (action) => {
        emit('action', action)
      }
  
      const handleUpdate = (update) => {
        emit('update', update)
      }
  
      return {
        getPageComponent,
        pageProps,
        handleNavigation,
        handleAction,
        handleUpdate
      }
    }
  }

  </script>

  <style scoped>
  .dynamic-page {
    height: 100%;
    color: white;
    overflow-y: auto;
  }
  
  /* Page Header */
  .page-header {
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .folder-icon {
    width: 32px;
    height: 32px;
    opacity: 0.8;
  }
  
  .page-actions {
    display: flex;
    gap: 12px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
  
  .action-btn.primary {
    background: #1db954;
    border-color: #1db954;
    color: white;
  }
  
  .action-btn.primary:hover {
    background: #1ed760;
  }
  
  .action-btn svg {
    width: 20px;
    height: 20px;
  }
  
  /* Breadcrumb */
  .breadcrumb {
    padding: 16px 32px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .breadcrumb-item {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    transition: color 0.2s ease;
  }
  
  .breadcrumb-item:hover {
    color: white;
  }
  
  .breadcrumb-separator {
    opacity: 0.4;
  }
  
  .breadcrumb-current {
    color: white;
    font-weight: 500;
  }
  
  /* Folder Content */
  .folder-content {
    padding: 32px;
  }
  
  .empty-folder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    text-align: center;
  }
  
  .empty-folder svg {
    width: 64px;
    height: 64px;
    opacity: 0.2;
    margin-bottom: 16px;
  }
  
  .empty-folder p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .folder-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 16px;
  }
  
  .folder-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }
  
  .folder-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .item-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
    opacity: 0.8;
  }
  
  .item-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .item-name {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  
  /* Other Page Types */
  .calendar-container,
  .timeline-container,
  .assets-grid,
  .moodboard-canvas,
  .ideas-boards,
  .dashboard-sections {
    padding: 32px;
  }
  
  .placeholder-text {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.3);
    text-align: center;
    padding: 60px 20px;
  }
  
  /* Ideas/Notes Boards */
  .ideas-boards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .idea-board {
    background: rgba(255, 255, 255, 0.03);
    border: 2px solid;
    border-radius: 12px;
    padding: 20px;
    min-height: 300px;
  }
  
  .idea-board h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .board-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .empty-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.3);
    text-align: center;
    padding: 40px 20px;
  }
  
  /* Dashboard Sections */
  .dashboard-sections {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  
  .dashboard-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
  }
  
  .quick-access-grid,
  .recent-items,
  .stats-grid {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 24px;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>
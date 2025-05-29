<template>
    <component 
      :is="getPageComponent(pageConfig.type)"
      v-bind="pageProps"
      @navigate="handleNavigation"
      @action="handleAction"
      @update="handleUpdate"
    />
  </template>
  
  <script>
  import { computed } from 'vue'
  
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
        const baseProps = {
          title: props.pageConfig.title,
          subtitle: props.pageConfig.subtitle,
          data: props.pageConfig.data,
          config: props.pageConfig.config
        }
  
        // Add type-specific props
        switch (props.pageConfig.type) {
          case 'folder':
            return {
              ...baseProps,
              folderId: props.pageConfig.id,
              folderData: props.pageConfig.data,
              parentPath: props.pageConfig.parentPath || []
            }
          
          case 'grid':
            return {
              ...baseProps,
              items: props.pageConfig.data.items,
              cardType: props.pageConfig.config.cardType,
              columns: props.pageConfig.config.columns || 'auto-fill',
              showSearch: props.pageConfig.config.showSearch !== false,
              showSort: props.pageConfig.config.showSort !== false,
              selectable: props.pageConfig.config.selectable !== false
            }
          
          case 'list':
            return {
              ...baseProps,
              songs: props.pageConfig.data.songs,
              columns: props.pageConfig.config.columns,
              showHero: props.pageConfig.config.showHero,
              heroData: props.pageConfig.config.heroData,
              virtualScroll: props.pageConfig.config.virtualScroll !== false
            }
          
          case 'profile':
            return {
              ...baseProps,
              entity: props.pageConfig.data.entity,
              sections: props.pageConfig.config.sections,
              stats: props.pageConfig.data.stats,
              relatedItems: props.pageConfig.data.relatedItems
            }
          
          case 'dashboard':
            return {
              ...baseProps,
              sections: props.pageConfig.data.sections || []
            }
          
          case 'calendar':
            return {
              ...baseProps,
              events: props.pageConfig.data.events || [],
              defaultView: props.pageConfig.config.defaultView || 'month'
            }
          
          case 'timeline':
            return {
              ...baseProps,
              items: props.pageConfig.data.items || [],
              viewMode: props.pageConfig.config.viewMode || 'stack'
            }
          
          case 'assets':
            return {
              ...baseProps,
              assets: props.pageConfig.data.assets || [],
              itemsPerPage: props.pageConfig.config.itemsPerPage || 24
            }
          
          case 'moodboard':
            return {
              ...baseProps,
              elements: props.pageConfig.data.elements || [],
              canvasSize: props.pageConfig.config.canvasSize || 2000,
              gridSize: props.pageConfig.config.gridSize || 20
            }
          
          case 'ideas':
            return {
              ...baseProps,
              boards: props.pageConfig.data.boards || [],
              notes: props.pageConfig.data.notes || [],
              itemsPerPage: props.pageConfig.config.itemsPerPage || 20
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
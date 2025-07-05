// src/store/projectStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { monitoredQuery } from '@/utils/performanceMonitor'

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [],
    loading: false,
    error: null,
    // Pagination state
    totalCount: 0,
    pageSize: 20,
    currentPage: 1
  }),

  getters: {
    getProjectById: (state) => (id) => {
      return state.projects.find(project => project.id === id)
    },
    
    getProjectsByArtist: (state) => (artistId) => {
      return state.projects.filter(project => project.artist_id === artistId)
    },
    
    activeProjects: (state) => {
      return state.projects.filter(p => p.status === 'active')
    },
    
    completedProjects: (state) => {
      return state.projects.filter(p => p.status === 'completed')
    }
  },

  actions: {
    async loadProjects(page = 1, pageSize = 20, filters = {}) {
      this.loading = true
      this.error = null
      this.currentPage = page
      this.pageSize = pageSize
      
      try {
        // Build query
        let query = supabase.from('projects').select('*', { count: 'exact' })
        
        // Apply filters
        if (filters.artistId) {
          query = query.eq('artist_id', filters.artistId)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`)
        }
        
        // Apply pagination
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        
        const { data, error, count } = await monitoredQuery(
          'loadProjects',
          () => query.order('created_at', { ascending: false }).range(from, to),
          { page, pageSize, filters }
        )
        
        if (error) throw error
        
        this.projects = data || []
        this.totalCount = count || 0
      } catch (err) {
        this.error = err.message
        console.error('Failed to load projects:', err)
      } finally {
        this.loading = false
      }
    },

    async loadProjectsByArtist(artistId, page = 1, pageSize = 20) {
      try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        
        const { data, error, count } = await supabase
          .from('projects')
          .select('*', { count: 'exact' })
          .eq('artist_id', artistId)
          .order('created_at', { ascending: false })
          .range(from, to)
        
        if (error) throw error
        
        // For artist-specific views, replace the projects array
        this.projects = data || []
        this.totalCount = count || 0
        this.currentPage = page
        this.pageSize = pageSize
        
        return { data: data || [], count: count || 0 }
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async createProject(projectData) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            artist_id: projectData.artist_id,
            name: projectData.name,
            description: projectData.description || null,
            status: projectData.status || 'active',
            start_date: projectData.start_date || null,
            end_date: projectData.end_date || null,
            budget: projectData.budget || 0
          }])
          .select()
          .single()
        
        if (error) throw error
        
        // Add to beginning of list for newest first
        this.projects.unshift(data)
        this.totalCount++
        
        // If we're over the page size, remove the last item
        if (this.projects.length > this.pageSize) {
          this.projects.pop()
        }
        
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async updateProject(id, projectData) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update({
            name: projectData.name,
            description: projectData.description || null,
            status: projectData.status,
            start_date: projectData.start_date || null,
            end_date: projectData.end_date || null,
            budget: projectData.budget || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        const index = this.projects.findIndex(p => p.id === id)
        if (index !== -1) {
          this.projects[index] = data
        }
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async deleteProject(id) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        this.projects = this.projects.filter(p => p.id !== id)
        this.totalCount = Math.max(0, this.totalCount - 1)
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
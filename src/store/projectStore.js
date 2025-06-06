// src/store/projectStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [],
    loading: false,
    error: null
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
    async loadProjects() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        this.projects = data || []
      } catch (err) {
        this.error = err.message
        console.error('Failed to load projects:', err)
      } finally {
        this.loading = false
      }
    },

    async loadProjectsByArtist(artistId) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('artist_id', artistId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        // Update local state with these projects
        const existingIds = this.projects.map(p => p.id)
        const newProjects = (data || []).filter(p => !existingIds.includes(p.id))
        this.projects.push(...newProjects)
        
        return data || []
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
        this.projects.push(data)
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
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
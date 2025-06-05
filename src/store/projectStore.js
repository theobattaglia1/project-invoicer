// src/store/projectStore.js
import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/tauri'

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
        const result = await invoke('get_all_projects')
        this.projects = result
      } catch (err) {
        this.error = err.toString()
        console.error('Failed to load projects:', err)
      } finally {
        this.loading = false
      }
    },

    async loadProjectsByArtist(artistId) {
      try {
        const result = await invoke('get_projects_by_artist', { artistId })
        return result
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async createProject(projectData) {
      try {
        const newProject = await invoke('create_project', {
          artistId: projectData.artist_id,
          name: projectData.name,
          description: projectData.description,
          status: projectData.status || 'active',
          startDate: projectData.start_date,
          endDate: projectData.end_date,
          budget: projectData.budget || 0
        })
        this.projects.push(newProject)
        return newProject
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async updateProject(id, projectData) {
      try {
        const updated = await invoke('update_project', {
          projectId: id,
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          startDate: projectData.start_date,
          endDate: projectData.end_date,
          budget: projectData.budget
        })
        const index = this.projects.findIndex(p => p.id === id)
        if (index !== -1) {
          this.projects[index] = updated
        }
        return updated
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async deleteProject(id) {
      try {
        await invoke('delete_project', { projectId: id })
        this.projects = this.projects.filter(p => p.id !== id)
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    }
  }
})
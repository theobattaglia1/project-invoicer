<template>
    <div class="projects-view">
      <!-- Header -->
      <div class="view-header">
        <h1 class="view-title">All Projects</h1>
        <button @click="createProject" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          New Project
        </button>
      </div>
  
      <!-- Filters -->
      <div class="filters">
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search projects..."
            class="search-input"
          />
        </div>
        
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
  
      <!-- Projects Table -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading projects...</p>
      </div>
  
      <div v-else-if="filteredProjects.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
        <h3>No projects found</h3>
        <p>Create your first project to get started</p>
        <button @click="createProject" class="btn-primary">Create Project</button>
      </div>
  
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Artist</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Budget</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in filteredProjects" :key="project.id">
              <td>
                <div class="project-name">{{ project.name }}</div>
                <div class="project-description">{{ project.description || 'No description' }}</div>
              </td>
              <td>
                <div class="artist-cell">
                  {{ getArtistName(project.artist_id) }}
                </div>
              </td>
              <td>
                <span :class="['status-badge', `status-${project.status}`]">
                  {{ formatStatus(project.status) }}
                </span>
              </td>
              <td>{{ formatDate(project.start_date) }}</td>
              <td>{{ formatDate(project.end_date) }}</td>
              <td class="amount">${{ formatAmount(project.budget) }}</td>
              <td class="actions">
                <button @click="editProject(project)" class="btn-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button @click="deleteProject(project)" class="btn-icon danger">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useProjectStore } from '@/store/projectStore'
  import { useArtistStore } from '@/store/artistStore'
  
  const projectStore = useProjectStore()
  const artistStore = useArtistStore()
  
  const searchQuery = ref('')
  const statusFilter = ref('')
  
  const loading = computed(() => projectStore.loading)
  const filteredProjects = computed(() => {
    let projects = projectStore.projects
    
    if (statusFilter.value) {
      projects = projects.filter(p => p.status === statusFilter.value)
    }
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        getArtistName(p.artist_id).toLowerCase().includes(query)
      )
    }
    
    return projects
  })
  
  const getArtistName = (artistId) => {
    const artist = artistStore.getArtistById(artistId)
    return artist ? artist.name : 'Unknown Artist'
  }
  
  const formatStatus = (status) => {
    const statusMap = {
      active: 'Active',
      completed: 'Completed',
      on_hold: 'On Hold',
      cancelled: 'Cancelled'
    }
    return statusMap[status] || status
  }
  
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }
  
  const formatAmount = (amount) => {
    return (amount || 0).toFixed(2)
  }
  
  const createProject = () => {
    emit('create', 'project')
  }
  
  const editProject = (project) => {
    emit('update', 'project', project)
  }
  
  const deleteProject = async (project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      emit('delete', 'project', project.id)
    }
  }
  
  const emit = defineEmits(['create', 'update', 'delete'])
  
  onMounted(() => {
    if (projectStore.projects.length === 0) {
      projectStore.loadProjects()
    }
  })
  </script>
  
  <style scoped>
  .projects-view {
    padding: 32px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  
  .view-title {
    font-size: 48px;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  
  /* Filters */
  .filters {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .search-bar {
    position: relative;
    flex: 1;
  }
  
  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .search-input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .search-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: #1db954;
  }
  
  .filter-select {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .filter-select:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: #1db954;
  }
  
  .filter-select option {
    background: #1e1e1e;
  }
  
  /* Table */
  .table-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .data-table th {
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .data-table td {
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .data-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .project-name {
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
  }
  
  .project-description {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .artist-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .status-active {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }
  
  .status-completed {
    background: rgba(33, 150, 243, 0.2);
    color: #2196f3;
  }
  
  .status-on_hold {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }
  
  .status-cancelled {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }
  
  .amount {
    font-weight: 600;
    color: #1db954;
  }
  
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  /* Common button styles */
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #1db954;
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary:hover {
    background: #1ed760;
    transform: translateY(-2px);
  }
  
  .btn-icon {
    width: 32px;
    height: 32px;
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
  
  .btn-icon:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .btn-icon.danger:hover {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }
  
  .btn-icon svg {
    width: 16px;
    height: 16px;
  }
  
  /* Loading & Empty States */
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #1db954;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .empty-icon {
    width: 64px;
    height: 64px;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 16px;
  }
  
  .empty-state h3 {
    font-size: 24px;
    font-weight: 600;
    color: white;
    margin: 0 0 8px 0;
  }
  
  .empty-state p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 0 24px 0;
  }
  </style>
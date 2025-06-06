<template>
  <div class="projects-content">
    <!-- Header -->
    <div class="content-header">
      <h2 class="content-title">Projects</h2>
      <button @click="createProject" class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        New Project
      </button>
    </div>

    <!-- Projects Table -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading projects...</p>
    </div>

    <div v-else-if="projects.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
      </svg>
      <h3>No projects yet</h3>
      <p>Create your first project for {{ artist?.name }}</p>
      <button @click="createProject" class="btn-primary">Create Project</button>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Budget</th>
            <th>Invoices</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in sortedProjects" :key="project.id">
            <td>
              <div class="project-name">{{ project.name }}</div>
              <div class="project-description">{{ project.description || 'No description' }}</div>
            </td>
            <td>
              <span :class="['status-badge', `status-${project.status}`]">
                {{ formatStatus(project.status) }}
              </span>
            </td>
            <td>{{ formatDate(project.start_date) }}</td>
            <td>{{ formatDate(project.end_date) }}</td>
            <td class="amount">${{ formatAmount(project.budget) }}</td>
            <td>
              <span class="invoice-count">{{ getInvoiceCount(project.id) }}</span>
            </td>
            <td class="actions">
              <button @click="createInvoiceForProject(project)" class="btn-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </button>
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
import { useArtistStore } from '@/store/artistStore'
import { useProjectStore } from '@/store/projectStore'
import { useInvoiceStore } from '@/store/invoiceStore'

const props = defineProps({
  artistId: {
    type: String,
    required: true
  }
})

const artistStore = useArtistStore()
const projectStore = useProjectStore()
const invoiceStore = useInvoiceStore()

const loading = ref(false)
const projects = ref([])

const artist = computed(() => artistStore.getArtistById(props.artistId))

const sortedProjects = computed(() => {
  return [...projects.value].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  )
})

const getInvoiceCount = (projectId) => {
  return invoiceStore.getInvoicesByProject(projectId).length
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
  emit('create', 'project', { artist_id: props.artistId })
}

const createInvoiceForProject = (project) => {
  emit('create', 'invoice', { 
    artist_id: props.artistId,
    project_id: project.id 
  })
}

const editProject = (project) => {
  emit('update', 'project', project)
}

const deleteProject = async (project) => {
  if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
    emit('delete', 'project', project.id)
    await loadData()
  }
}

const loadData = async () => {
  loading.value = true
  try {
    projects.value = await projectStore.loadProjectsByArtist(props.artistId)
  } catch (error) {
    console.error('Failed to load projects:', error)
  } finally {
    loading.value = false
  }
}

const emit = defineEmits(['create', 'update', 'delete'])

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.projects-content {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.content-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0;
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

.invoice-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
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

/* Responsive */
@media (max-width: 768px) {
  .table-container {
    overflow-x: auto;
  }
  
  .data-table {
    min-width: 600px;
  }
}
</style>
<template>
    <div class="artist-invoices-view">
      <!-- Header -->
      <div class="view-header">
        <div class="header-left">
          <button @click="goBack" class="btn-back">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div v-if="artist" class="header-info">
            <h1 class="view-title">{{ artist.name }}'s Invoices</h1>
            <div class="breadcrumb">
              <router-link to="/" class="breadcrumb-link">Artists</router-link>
              <span class="breadcrumb-separator">/</span>
              <span>{{ artist.name }}</span>
              <span class="breadcrumb-separator">/</span>
              <span>Invoices</span>
            </div>
          </div>
        </div>
        <button @click="createInvoice" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          New Invoice
        </button>
      </div>
  
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${{ totalRevenue.toFixed(2) }}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${{ pendingAmount.toFixed(2) }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ invoiceCount }}</div>
          <div class="stat-label">Total Invoices</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ overdueCount }}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>
  
      <!-- Invoices Table -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading invoices...</p>
      </div>
  
      <div v-else-if="invoices.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        <h3>No invoices yet</h3>
        <p>Create your first invoice for {{ artist?.name }}</p>
        <button @click="createInvoice" class="btn-primary">Create Invoice</button>
      </div>
  
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Project</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in sortedInvoices" :key="invoice.id">
              <td class="invoice-number">{{ invoice.invoice_number }}</td>
              <td>
                <div v-if="getProject(invoice.project_id)" class="project-name">
                  {{ getProject(invoice.project_id).name }}
                </div>
                <div v-else class="no-project">No project</div>
              </td>
              <td>{{ formatDate(invoice.issue_date) }}</td>
              <td :class="{ 'overdue': isOverdue(invoice) }">
                {{ formatDate(invoice.due_date) }}
              </td>
              <td class="amount">${{ invoice.amount.toFixed(2) }}</td>
              <td>
                <span :class="['status-badge', `status-${invoice.status}`]">
                  {{ formatStatus(invoice.status) }}
                </span>
              </td>
              <td class="actions">
                <button 
                  v-if="invoice.status === 'pending'" 
                  @click="markAsPaid(invoice)" 
                  class="btn-icon success"
                  title="Mark as paid"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </button>
                <button @click="editInvoice(invoice)" class="btn-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button @click="deleteInvoice(invoice)" class="btn-icon danger">
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
  import { useRouter } from 'vue-router'
  import { useArtistStore } from '@/store/artistStore'
  import { useProjectStore } from '@/store/projectStore'
  import { useInvoiceStore } from '@/store/invoiceStore'
  
  const props = defineProps({
    artistId: {
      type: String,
      required: true
    }
  })
  
  const router = useRouter()
  const artistStore = useArtistStore()
  const projectStore = useProjectStore()
  const invoiceStore = useInvoiceStore()
  
  const loading = ref(false)
  const invoices = ref([])
  const projects = ref([])
  
  const artist = computed(() => artistStore.getArtistById(props.artistId))
  
  const sortedInvoices = computed(() => {
    return [...invoices.value].sort((a, b) => 
      new Date(b.issue_date) - new Date(a.issue_date)
    )
  })
  
  const totalRevenue = computed(() => {
    return invoices.value
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0)
  })
  
  const pendingAmount = computed(() => {
    return invoices.value
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0)
  })
  
  const invoiceCount = computed(() => invoices.value.length)
  
  const overdueCount = computed(() => {
    const today = new Date()
    return invoices.value.filter(i => 
      i.status === 'pending' && new Date(i.due_date) < today
    ).length
  })
  
  const getProject = (projectId) => {
    return projects.value.find(p => p.id === projectId)
  }
  
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }
  
  const formatStatus = (status) => {
    const statusMap = {
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled'
    }
    return statusMap[status] || status
  }
  
  const isOverdue = (invoice) => {
    if (invoice.status !== 'pending') return false
    return new Date(invoice.due_date) < new Date()
  }
  
  const goBack = () => {
    router.push('/')
  }
  
  const createInvoice = () => {
    emit('create', 'invoice', { artist_id: props.artistId })
  }
  
  const editInvoice = (invoice) => {
    emit('update', 'invoice', invoice)
  }
  
  const deleteInvoice = async (invoice) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      emit('delete', 'invoice', invoice.id)
      await loadData()
    }
  }
  
  const markAsPaid = async (invoice) => {
    try {
      await invoiceStore.markAsPaid(invoice.id)
      await loadData()
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error)
    }
  }
  
  const loadData = async () => {
    loading.value = true
    try {
      invoices.value = await invoiceStore.loadInvoicesByArtist(props.artistId)
      projects.value = await projectStore.loadProjectsByArtist(props.artistId)
    } catch (error) {
      console.error('Failed to load data:', error)
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
  .artist-invoices-view {
    padding: 32px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
  }
  
  .header-left {
    display: flex;
    align-items: flex-start;
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
    margin-top: 8px;
  }
  
  .btn-back:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .btn-back svg {
    width: 20px;
    height: 20px;
  }
  
  .header-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .view-title {
    font-size: 48px;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .breadcrumb-link {
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  
  .breadcrumb-link:hover {
    color: white;
  }
  
  .breadcrumb-separator {
    color: rgba(255, 255, 255, 0.3);
  }
  
  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-bottom: 32px;
  }
  
  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
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
  
  .invoice-number {
    font-weight: 600;
    color: white;
  }
  
  .project-name {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .no-project {
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }
  
  .overdue {
    color: #f44336;
  }
  
  .amount {
    font-weight: 600;
    color: #1db954;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .status-pending {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }
  
  .status-paid {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }
  
  .status-overdue {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }
  
  .status-cancelled {
    background: rgba(158, 158, 158, 0.2);
    color: #9e9e9e;
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
  
  .btn-icon.success:hover {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
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
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    .data-table {
      min-width: 600px;
    }
  }
  </style>
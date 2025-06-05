<template>
    <div class="invoices-view">
      <!-- Header -->
      <div class="view-header">
        <h1 class="view-title">Invoices</h1>
        <button @click="createInvoice" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create Invoice
        </button>
      </div>
  
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Pending</h3>
            <p class="stat-value">${{ formatAmount(invoiceStore.totalPending) }}</p>
            <span class="stat-count">{{ pendingCount }} invoices</span>
          </div>
        </div>
  
        <div class="stat-card">
          <div class="stat-icon paid">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Paid</h3>
            <p class="stat-value">${{ formatAmount(invoiceStore.totalPaid) }}</p>
            <span class="stat-count">{{ paidCount }} invoices</span>
          </div>
        </div>
  
        <div class="stat-card">
          <div class="stat-icon overdue">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Overdue</h3>
            <p class="stat-value">${{ formatAmount(overdueTotal) }}</p>
            <span class="stat-count">{{ overdueCount }} invoices</span>
          </div>
        </div>
  
        <div class="stat-card">
          <div class="stat-icon total">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.93.66 1.64 2.08 1.64 1.96 0 2.37-.79 2.37-1.54 0-1.06-.92-1.52-2.37-1.87-1.37-.33-2.92-.88-2.92-2.72 0-1.37 1.02-2.47 2.66-2.95V6h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s3.18 1.05 3.18 2.96c0 1.23-.9 2.44-2.82 3.11z"/>
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Revenue</h3>
            <p class="stat-value">${{ formatAmount(totalRevenue) }}</p>
            <span class="stat-count">All time</span>
          </div>
        </div>
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
            placeholder="Search invoices..."
            class="search-input"
          />
        </div>
        
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
  
        <select v-model="artistFilter" class="filter-select">
          <option value="">All Artists</option>
          <option 
            v-for="artist in artists" 
            :key="artist.id" 
            :value="artist.id"
          >
            {{ artist.name }}
          </option>
        </select>
      </div>
  
      <!-- Invoices Table -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading invoices...</p>
      </div>
  
      <div v-else-if="filteredInvoices.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        <h3>No invoices found</h3>
        <p>Create your first invoice to get started</p>
        <button @click="createInvoice" class="btn-primary">Create Invoice</button>
      </div>
  
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Artist</th>
              <th>Project</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in filteredInvoices" :key="invoice.id">
              <td class="invoice-number">{{ invoice.invoice_number }}</td>
              <td>{{ getArtistName(invoice.artist_id) }}</td>
              <td>{{ getProjectName(invoice.project_id) || '-' }}</td>
              <td class="amount">${{ formatAmount(invoice.amount) }}</td>
              <td>
                <span :class="['status-badge', `status-${getInvoiceStatus(invoice)}`]">
                  {{ formatStatus(getInvoiceStatus(invoice)) }}
                </span>
              </td>
              <td>{{ formatDate(invoice.issue_date) }}</td>
              <td>{{ formatDate(invoice.due_date) }}</td>
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
  import { useInvoiceStore } from '@/store/invoiceStore'
  import { useArtistStore } from '@/store/artistStore'
  import { useProjectStore } from '@/store/projectStore'
  
  const invoiceStore = useInvoiceStore()
  const artistStore = useArtistStore()
  const projectStore = useProjectStore()
  
  const searchQuery = ref('')
  const statusFilter = ref('')
  const artistFilter = ref('')
  
  const loading = computed(() => invoiceStore.loading)
  const artists = computed(() => artistStore.sortedArtists)
  
  const filteredInvoices = computed(() => {
    let invoices = invoiceStore.invoices
    
    if (statusFilter.value) {
      invoices = invoices.filter(i => getInvoiceStatus(i) === statusFilter.value)
    }
    
    if (artistFilter.value) {
      invoices = invoices.filter(i => i.artist_id === artistFilter.value)
    }
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      invoices = invoices.filter(i => 
        i.invoice_number.toLowerCase().includes(query) ||
        getArtistName(i.artist_id).toLowerCase().includes(query) ||
        getProjectName(i.project_id).toLowerCase().includes(query)
      )
    }
    
    return invoices
  })
  
  const pendingCount = computed(() => 
    invoiceStore.invoices.filter(i => i.status === 'pending').length
  )
  
  const paidCount = computed(() => 
    invoiceStore.invoices.filter(i => i.status === 'paid').length
  )
  
  const overdueInvoices = computed(() => 
    invoiceStore.invoices.filter(i => getInvoiceStatus(i) === 'overdue')
  )
  
  const overdueCount = computed(() => overdueInvoices.value.length)
  
  const overdueTotal = computed(() => 
    overdueInvoices.value.reduce((sum, i) => sum + i.amount, 0)
  )
  
  const totalRevenue = computed(() => 
    invoiceStore.invoices.reduce((sum, i) => sum + i.amount, 0)
  )
  
  const getInvoiceStatus = (invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return invoice.status
    }
    
    const dueDate = new Date(invoice.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (dueDate < today) {
      return 'overdue'
    }
    
    return invoice.status
  }
  
  const getArtistName = (artistId) => {
    const artist = artistStore.getArtistById(artistId)
    return artist ? artist.name : 'Unknown Artist'
  }
  
  const getProjectName = (projectId) => {
    if (!projectId) return null
    const project = projectStore.getProjectById(projectId)
    return project ? project.name : 'Unknown Project'
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
  
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }
  
  const formatAmount = (amount) => {
    return (amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  
  const createInvoice = () => {
    emit('create', 'invoice')
  }
  
  const editInvoice = (invoice) => {
    emit('update', 'invoice', invoice)
  }
  
  const deleteInvoice = async (invoice) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      emit('delete', 'invoice', invoice.id)
    }
  }
  
  const markAsPaid = async (invoice) => {
    try {
      await invoiceStore.markAsPaid(invoice.id)
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error)
    }
  }
  
  const emit = defineEmits(['create', 'update', 'delete'])
  
  onMounted(() => {
    if (invoiceStore.invoices.length === 0) {
      invoiceStore.loadInvoices()
    }
  })
  </script>
  
  <style scoped>
  .invoices-view {
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
  
  /* Stats Cards */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }
  
  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    gap: 16px;
    align-items: center;
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    flex-shrink: 0;
  }
  
  .stat-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .stat-icon.pending {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }
  
  .stat-icon.paid {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }
  
  .stat-icon.overdue {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }
  
  .stat-icon.total {
    background: rgba(29, 185, 84, 0.2);
    color: #1db954;
  }
  
  .stat-content h3 {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 8px 0;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin: 0 0 4px 0;
  }
  
  .stat-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
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
  
  /* Table styles are the same as in AllProjectsView */
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
  
  .invoice-number {
    font-weight: 600;
    color: white;
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
  
  /* Other styles remain the same */
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
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
  
  .btn-icon.success:hover {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }
  
  .btn-icon.danger:hover {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
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
  </style>
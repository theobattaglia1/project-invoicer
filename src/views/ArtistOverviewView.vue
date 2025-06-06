<template>
    <ArtistLayout :artistId="artistId">
      <div class="overview-content">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon revenue">
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
  
          <div class="stat-card">
            <div class="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <div class="stat-content">
              <h3>Pending</h3>
              <p class="stat-value">${{ formatAmount(pendingAmount) }}</p>
              <span class="stat-count">{{ pendingCount }} invoices</span>
            </div>
          </div>
  
          <div class="stat-card">
            <div class="stat-icon projects">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <div class="stat-content">
              <h3>Active Projects</h3>
              <p class="stat-value">{{ activeProjectsCount }}</p>
              <span class="stat-count">{{ totalProjectsCount }} total</span>
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
              <p class="stat-value">${{ formatAmount(overdueAmount) }}</p>
              <span class="stat-count">{{ overdueCount }} invoices</span>
            </div>
          </div>
        </div>
  
        <!-- Recent Activity -->
        <div class="activity-section">
          <h2 class="section-title">Recent Invoices</h2>
          <div v-if="recentInvoices.length > 0" class="activity-list">
            <div v-for="invoice in recentInvoices" :key="invoice.id" class="activity-item">
              <div class="activity-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <div class="activity-content">
                <p class="activity-title">{{ invoice.invoice_number }}</p>
                <p class="activity-meta">{{ formatDate(invoice.issue_date) }}</p>
              </div>
              <div class="activity-amount">
                <span :class="['status-badge', `status-${invoice.status}`]">
                  ${{ formatAmount(invoice.amount) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-activity">
            <p>No recent activity</p>
          </div>
        </div>
  
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button @click="createInvoice" class="action-btn primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Invoice
          </button>
          <button @click="createProject" class="action-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            New Project
          </button>
        </div>
      </div>
    </ArtistLayout>
  </template>
  
  <script setup>
  import { computed, onMounted } from 'vue'
  import { useArtistStore } from '@/store/artistStore'
  import { useProjectStore } from '@/store/projectStore'
  import { useInvoiceStore } from '@/store/invoiceStore'
  import ArtistLayout from '@/components/ArtistLayout.vue'
  
  const props = defineProps({
    artistId: {
      type: String,
      required: true
    }
  })
  
  const artistStore = useArtistStore()
  const projectStore = useProjectStore()
  const invoiceStore = useInvoiceStore()
  
  const artist = computed(() => artistStore.getArtistById(props.artistId))
  const projects = computed(() => projectStore.getProjectsByArtist(props.artistId))
  const invoices = computed(() => invoiceStore.getActiveInvoicesByArtist(props.artistId))
  
  const totalRevenue = computed(() => {
    return invoiceStore.getInvoicesByArtist(props.artistId)
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0)
  })
  
  const pendingAmount = computed(() => {
    return invoices.value
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0)
  })
  
  const pendingCount = computed(() => {
    return invoices.value.filter(i => i.status === 'pending').length
  })
  
  const overdueInvoices = computed(() => {
    const today = new Date()
    return invoices.value.filter(i => 
      i.status === 'pending' && new Date(i.due_date) < today
    )
  })
  
  const overdueAmount = computed(() => {
    return overdueInvoices.value.reduce((sum, i) => sum + i.amount, 0)
  })
  
  const overdueCount = computed(() => overdueInvoices.value.length)
  
  const activeProjectsCount = computed(() => {
    return projects.value.filter(p => p.status === 'active').length
  })
  
  const totalProjectsCount = computed(() => projects.value.length)
  
  const recentInvoices = computed(() => {
    return [...invoices.value]
      .sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date))
      .slice(0, 5)
  })
  
  const formatAmount = (amount) => {
    return (amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }
  
  const createInvoice = () => {
    emit('create', 'invoice', { artist_id: props.artistId })
  }
  
  const createProject = () => {
    emit('create', 'project', { artist_id: props.artistId })
  }
  
  const emit = defineEmits(['create'])
  
  onMounted(async () => {
    // Ensure data is loaded
    if (invoiceStore.invoices.length === 0) {
      await invoiceStore.loadInvoices()
    }
    if (projectStore.projects.length === 0) {
      await projectStore.loadProjects()
    }
  })
  </script>
  
  <style scoped>
  .overview-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-bottom: 48px;
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
  
  .stat-icon.revenue {
    background: rgba(29, 185, 84, 0.2);
    color: #1db954;
  }
  
  .stat-icon.pending {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }
  
  .stat-icon.projects {
    background: rgba(33, 150, 243, 0.2);
    color: #2196f3;
  }
  
  .stat-icon.overdue {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
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
  
  /* Activity Section */
  .activity-section {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin: 0 0 16px 0;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .activity-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .activity-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .activity-icon svg {
    width: 20px;
    height: 20px;
  }
  
  .activity-content {
    flex: 1;
  }
  
  .activity-title {
    font-size: 14px;
    font-weight: 500;
    color: white;
    margin: 0 0 2px 0;
  }
  
  .activity-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }
  
  .status-badge {
    font-size: 14px;
    font-weight: 600;
  }
  
  .status-pending {
    color: #ff9800;
  }
  
  .status-paid {
    color: #4caf50;
  }
  
  .empty-activity {
    text-align: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  /* Quick Actions */
  .quick-actions {
    display: flex;
    gap: 16px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .action-btn.primary {
    background: #1db954;
    border-color: #1db954;
  }
  
  .action-btn.primary:hover {
    background: #1ed760;
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  </style>
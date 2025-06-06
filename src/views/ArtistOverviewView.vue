<template>
  <div class="artist-overview">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon projects">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Total Projects</h3>
          <p class="stat-value">{{ projectStats.total }}</p>
          <div class="stat-detail">
            <span class="active">{{ projectStats.active }} active</span>
            <span class="completed">{{ projectStats.completed }} completed</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon revenue">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.93.66 1.64 2.08 1.64 1.96 0 2.37-.79 2.37-1.54 0-1.06-.92-1.52-2.37-1.87-1.37-.33-2.92-.88-2.92-2.72 0-1.37 1.02-2.47 2.66-2.95V6h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s3.18 1.05 3.18 2.96c0 1.23-.9 2.44-2.82 3.11z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Total Revenue</h3>
          <p class="stat-value">${{ revenueStats.total.toFixed(2) }}</p>
          <div class="stat-detail">
            <span class="paid">${{ revenueStats.paid.toFixed(2) }} paid</span>
            <span class="pending">${{ revenueStats.pending.toFixed(2) }} pending</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon invoices">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Invoices</h3>
          <p class="stat-value">{{ invoiceStats.total }}</p>
          <div class="stat-detail">
            <span class="pending">{{ invoiceStats.pending }} pending</span>
            <span class="overdue">{{ invoiceStats.overdue }} overdue</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon activity">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>This Month</h3>
          <p class="stat-value">${{ monthlyRevenue.toFixed(2) }}</p>
          <div class="stat-detail">
            <span>{{ monthlyInvoices }} invoices</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <h2 class="section-title">Recent Activity</h2>
      
      <div class="activity-grid">
        <!-- Recent Projects -->
        <div class="activity-card">
          <h3>Recent Projects</h3>
          <div v-if="recentProjects.length === 0" class="empty-state">
            <p>No projects yet</p>
          </div>
          <div v-else class="activity-list">
            <div v-for="project in recentProjects" :key="project.id" class="activity-item">
              <div class="item-info">
                <h4>{{ project.name }}</h4>
                <p class="item-meta">{{ formatDate(project.created_at) }}</p>
              </div>
              <span :class="['status-badge', `status-${project.status}`]">
                {{ formatStatus(project.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Recent Invoices -->
        <div class="activity-card">
          <h3>Recent Invoices</h3>
          <div v-if="recentInvoices.length === 0" class="empty-state">
            <p>No invoices yet</p>
          </div>
          <div v-else class="activity-list">
            <div v-for="invoice in recentInvoices" :key="invoice.id" class="activity-item">
              <div class="item-info">
                <h4>{{ invoice.invoice_number }}</h4>
                <p class="item-meta">{{ formatDate(invoice.issue_date) }}</p>
              </div>
              <div class="item-right">
                <span class="amount">${{ invoice.amount.toFixed(2) }}</span>
                <span :class="['status-badge', `status-${invoice.status}`]">
                  {{ formatStatus(invoice.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useProjectStore } from '@/store/projectStore'
import { useInvoiceStore } from '@/store/invoiceStore'

const props = defineProps({
  artistId: {
    type: String,
    required: true
  }
})

const projectStore = useProjectStore()
const invoiceStore = useInvoiceStore()

// Project stats
const projects = computed(() => projectStore.getProjectsByArtist(props.artistId))
const projectStats = computed(() => ({
  total: projects.value.length,
  active: projects.value.filter(p => p.status === 'active').length,
  completed: projects.value.filter(p => p.status === 'completed').length
}))

// Invoice stats
const invoices = computed(() => invoiceStore.getInvoicesByArtist(props.artistId))
const invoiceStats = computed(() => {
  const now = new Date()
  return {
    total: invoices.value.length,
    pending: invoices.value.filter(i => i.status === 'pending').length,
    overdue: invoices.value.filter(i => {
      return i.status === 'pending' && new Date(i.due_date) < now
    }).length
  }
})

// Revenue stats
const revenueStats = computed(() => ({
  total: invoices.value.reduce((sum, i) => sum + i.amount, 0),
  paid: invoices.value
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0),
  pending: invoices.value
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0)
}))

// Monthly stats
const monthlyRevenue = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return invoices.value
    .filter(i => new Date(i.issue_date) >= startOfMonth)
    .reduce((sum, i) => sum + i.amount, 0)
})

const monthlyInvoices = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return invoices.value.filter(i => new Date(i.issue_date) >= startOfMonth).length
})

// Recent items
const recentProjects = computed(() => 
  [...projects.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
)

const recentInvoices = computed(() => 
  [...invoices.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const formatStatus = (status) => {
  const statusMap = {
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
    pending: 'Pending',
    paid: 'Paid',
    overdue: 'Overdue'
  }
  return statusMap[status] || status
}

onMounted(async () => {
  // Load data if needed
  if (projects.value.length === 0) {
    await projectStore.loadProjectsByArtist(props.artistId)
  }
  if (invoices.value.length === 0) {
    await invoiceStore.loadInvoicesByArtist(props.artistId)
  }
})
</script>

<style scoped>
.artist-overview {
  padding: 32px;
  max-width: 1400px;
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
  gap: 20px;
  align-items: flex-start;
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

.stat-icon.projects {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.stat-icon.revenue {
  background: rgba(29, 185, 84, 0.2);
  color: #1db954;
}

.stat-icon.invoices {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.stat-icon.activity {
  background: rgba(156, 39, 176, 0.2);
  color: #9c27b0;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 12px 0;
}

.stat-detail {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.stat-detail span {
  color: rgba(255, 255, 255, 0.6);
}

.stat-detail .active { color: #4caf50; }
.stat-detail .completed { color: #2196f3; }
.stat-detail .paid { color: #4caf50; }
.stat-detail .pending { color: #ff9800; }
.stat-detail .overdue { color: #f44336; }

/* Activity Section */
.activity-section {
  margin-top: 48px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 24px 0;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.activity-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
}

.activity-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 20px 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.item-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
}

.item-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.amount {
  font-size: 16px;
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

.status-active { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
.status-completed { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
.status-pending { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
.status-paid { background: rgba(76, 175, 80, 0.2); color: #4caf50; }

.empty-state {
  padding: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}
</style>
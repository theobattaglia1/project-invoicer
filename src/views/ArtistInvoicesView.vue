<template>
  <div class="invoices-content">
    <!-- Header with Actions -->
    <div class="content-header">
      <div class="header-left">
        <h2 class="content-title">Invoices</h2>
        <div v-if="selectedInvoices.length > 0" class="selection-info">
          <span class="selection-count">{{ selectedInvoices.length }} selected</span>
          <span class="selection-total">${{ selectedTotal.toFixed(2) }}</span>
        </div>
      </div>
      <div class="header-actions">
        <div v-if="selectedInvoices.length > 0" class="bulk-actions">
          <button @click="bulkUpdateStatus('paid')" class="btn-action">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Mark Paid
          </button>
          <button @click="bulkArchive" class="btn-action">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
            </svg>
            Archive
          </button>
          <button @click="bulkTrash" class="btn-action danger">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>
          <button @click="clearSelection" class="btn-action secondary">
            Clear
          </button>
        </div>
        <button @click="createInvoice" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          New Invoice
        </button>
      </div>
    </div>

    <!-- Stats Cards (updated to show selection stats when items are selected) -->
    <div class="stats-grid">
      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 }">
        <div class="stat-value">${{ displayedStats.total.toFixed(2) }}</div>
        <div class="stat-label">{{ selectedInvoices.length > 0 ? 'Selected Total' : 'Total Revenue' }}</div>
      </div>
      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 && displayedStats.pendingCount > 0 }">
        <div class="stat-value">${{ displayedStats.pending.toFixed(2) }}</div>
        <div class="stat-label">Pending ({{ displayedStats.pendingCount }})</div>
      </div>
      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 && displayedStats.paidCount > 0 }">
        <div class="stat-value">${{ displayedStats.paid.toFixed(2) }}</div>
        <div class="stat-label">Paid ({{ displayedStats.paidCount }})</div>
      </div>
      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 && displayedStats.overdueCount > 0 }">
        <div class="stat-value">{{ displayedStats.overdueCount }}</div>
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
            <th class="checkbox-column">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </th>
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
          <tr 
            v-for="(invoice, index) in sortedInvoices" 
            :key="invoice.id"
            :class="{ selected: isSelected(invoice.id) }"
            @click="handleRowClick($event, invoice, index)"
          >
            <td class="checkbox-column" @click.stop>
              <input 
                type="checkbox" 
                :checked="isSelected(invoice.id)"
                @change="toggleSelection(invoice.id)"
              />
            </td>
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
              <span :class="['status-badge', `status-${getInvoiceStatus(invoice)}`]">
                {{ formatStatus(getInvoiceStatus(invoice)) }}
              </span>
            </td>
            <td class="actions" @click.stop>
              <button 
                @click="generatePDF(invoice)" 
                class="btn-icon pdf"
                title="Generate PDF"
                :disabled="generatingPDF[invoice.id]"
              >
                <svg v-if="!generatingPDF[invoice.id]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 11.5h1v-1H7v1zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5V9H8c.83 0 1.5.67 1.5 1.5v1zm5-1H13v4h-1.5V9h3v1.5zm4 3c0 .83-.67 1.5-1.5 1.5h-2.5V9H18c.83 0 1.5.67 1.5 1.5v3zM16.5 10.5H17v3h-.5v-3z"/>
                </svg>
                <div v-else class="spinner-small"></div>
              </button>
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
import { showToast } from '@/utils/toast'
import { ref, computed, onMounted, reactive } from 'vue'
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
const invoices = ref([])
const projects = ref([])
const selectedInvoices = ref([])
const lastSelectedIndex = ref(-1)
const generatingPDF = reactive({})

const artist = computed(() => artistStore.getArtistById(props.artistId))

const sortedInvoices = computed(() => {
  return [...invoices.value].sort((a, b) => 
    new Date(b.issue_date) - new Date(a.issue_date)
  )
})

const isAllSelected = computed(() => {
  return invoices.value.length > 0 && selectedInvoices.value.length === invoices.value.length
})

const isIndeterminate = computed(() => {
  return selectedInvoices.value.length > 0 && selectedInvoices.value.length < invoices.value.length
})

const selectedTotal = computed(() => {
  return selectedInvoices.value.reduce((sum, id) => {
    const invoice = invoices.value.find(i => i.id === id)
    return sum + (invoice?.amount || 0)
  }, 0)
})

const displayedStats = computed(() => {
  if (selectedInvoices.value.length === 0) {
    // Show overall stats
    const paid = invoices.value
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0)
    
    const pending = invoices.value
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0)
    
    const overdueCount = invoices.value.filter(i => isOverdue(i)).length
    
    return {
      total: paid + pending,
      paid,
      paidCount: invoices.value.filter(i => i.status === 'paid').length,
      pending,
      pendingCount: invoices.value.filter(i => i.status === 'pending').length,
      overdueCount
    }
  } else {
    // Show stats for selected invoices
    const selected = invoices.value.filter(i => selectedInvoices.value.includes(i.id))
    
    const paid = selected
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0)
    
    const pending = selected
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0)
    
    const overdueCount = selected.filter(i => isOverdue(i)).length
    
    return {
      total: selectedTotal.value,
      paid,
      paidCount: selected.filter(i => i.status === 'paid').length,
      pending,
      pendingCount: selected.filter(i => i.status === 'pending').length,
      overdueCount
    }
  }
})

const getProject = (projectId) => {
  return projects.value.find(p => p.id === projectId)
}

const getInvoiceStatus = (invoice) => {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return invoice.status
  }
  
  if (isOverdue(invoice)) {
    return 'overdue'
  }
  
  return invoice.status
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

const isSelected = (invoiceId) => {
  return selectedInvoices.value.includes(invoiceId)
}

const toggleSelection = (invoiceId) => {
  const index = selectedInvoices.value.indexOf(invoiceId)
  if (index > -1) {
    selectedInvoices.value.splice(index, 1)
  } else {
    selectedInvoices.value.push(invoiceId)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedInvoices.value = []
  } else {
    selectedInvoices.value = invoices.value.map(i => i.id)
  }
}

const clearSelection = () => {
  selectedInvoices.value = []
  lastSelectedIndex.value = -1
}

const handleRowClick = (event, invoice, index) => {
  if (event.metaKey || event.ctrlKey) {
    // Cmd/Ctrl + Click: Toggle individual selection
    toggleSelection(invoice.id)
    lastSelectedIndex.value = index
  } else if (event.shiftKey && lastSelectedIndex.value >= 0) {
    // Shift + Click: Select range
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    const rangeIds = sortedInvoices.value
      .slice(start, end + 1)
      .map(i => i.id)
    
    // Add all in range to selection (without duplicates)
    selectedInvoices.value = [...new Set([...selectedInvoices.value, ...rangeIds])]
  } else {
    // Regular click: Select only this item
    selectedInvoices.value = [invoice.id]
    lastSelectedIndex.value = index
  }
}

const bulkUpdateStatus = async (status) => {
  try {
    await invoiceStore.updateMultipleInvoicesStatus(selectedInvoices.value, status)
    clearSelection()
    await loadData()
    showToast(`Updated ${selectedInvoices.value.length} invoices`, 'success')
  } catch (error) {
    showToast('Failed to update invoices', 'error')
  }
}

const bulkArchive = async () => {
  try {
    await invoiceStore.archiveInvoices(selectedInvoices.value)
    clearSelection()
    await loadData()
    showToast('Invoices archived', 'success')
  } catch (error) {
    showToast('Failed to archive invoices', 'error')
  }
}

const bulkTrash = async () => {
  if (confirm(`Are you sure you want to delete ${selectedInvoices.value.length} invoices?`)) {
    try {
      await invoiceStore.trashInvoices(selectedInvoices.value)
      clearSelection()
      await loadData()
      showToast('Invoices moved to trash', 'success')
    } catch (error) {
      showToast('Failed to delete invoices', 'error')
    }
  }
}

const generatePDF = async (invoice) => {
  console.log('New PDF generation code is running');
  try {
    if (!generatingPDF) {
      console.error('generatingPDF is not defined - using fallback');
      window.generatingPDF = window.generatingPDF || {};
      window.generatingPDF[invoice.id] = true;
    } else {
      generatingPDF[invoice.id] = true;
    }
    
    // Get related data
    const artist = artistStore.getArtistById(invoice.artist_id)
    const project = invoice.project_id ? projectStore.getProjectById(invoice.project_id) : null
    
    // Parse line items
    let lineItems = []
    try {
      lineItems = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
    } catch (e) {
      lineItems = []
    }
    
    // Generate PDF
    const { generateInvoicePDF } = await import('@/services/pdfGenerator')
    const pdfUrl = await generateInvoicePDF({
      invoice,
      artist,
      project,
      line_items: lineItems
    })
    
    // Open PDF in new tab
    window.open(pdfUrl, '_blank')
    
    // Show success toast
    showToast('Invoice PDF generated successfully', 'success')
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    showToast('Failed to generate PDF', 'error')
  } finally {
    generatingPDF[invoice.id] = false
  }
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
.invoices-content {
  width: 100%;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.content-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(29, 185, 84, 0.1);
  border: 1px solid rgba(29, 185, 84, 0.2);
  border-radius: 8px;
}

.selection-count {
  font-size: 14px;
  font-weight: 500;
  color: #1db954;
}

.selection-total {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.bulk-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-action.secondary {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
}

.btn-action.danger {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.btn-action.danger:hover {
  background: rgba(244, 67, 54, 0.3);
}

.btn-action svg {
  width: 16px;
  height: 16px;
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
  transition: all 0.3s ease;
}

.stat-card.highlighted {
  background: rgba(29, 185, 84, 0.1);
  border-color: rgba(29, 185, 84, 0.2);
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

.checkbox-column {
  width: 40px;
  text-align: center;
}

.data-table td {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.data-table tbody tr {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.data-table tbody tr.selected {
  background: rgba(29, 185, 84, 0.1);
}

.data-table tbody tr.selected:hover {
  background: rgba(29, 185, 84, 0.15);
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

.btn-icon.pdf:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.btn-icon.success:hover {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.btn-icon.danger:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
<template>
    <ArtistLayout :artistId="artistId">
      <div class="archived-content">
        <!-- Header -->
        <div class="content-header">
          <h2 class="content-title">Archived Invoices</h2>
          <div v-if="selectedInvoices.length > 0" class="selection-info">
            <span class="selection-count">{{ selectedInvoices.length }} selected</span>
            <button @click="restoreSelected" class="btn-action">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
              </svg>
              Restore
            </button>
            <button @click="deleteSelected" class="btn-action danger">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </button>
            <button @click="clearSelection" class="btn-action secondary">
              Clear
            </button>
          </div>
        </div>
  
        <!-- Archived Invoices Table -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading archived invoices...</p>
        </div>
  
        <div v-else-if="archivedInvoices.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
          </svg>
          <h3>No archived invoices</h3>
          <p>Archived invoices will appear here</p>
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
                <th>Amount</th>
                <th>Archived Date</th>
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
                <td class="amount">${{ invoice.amount.toFixed(2) }}</td>
                <td>{{ formatDate(invoice.updated_at) }}</td>
                <td class="actions" @click.stop>
                  <button @click="restoreInvoice(invoice)" class="btn-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
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
    </ArtistLayout>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useArtistStore } from '@/store/artistStore'
  import { useProjectStore } from '@/store/projectStore'
  import { useInvoiceStore } from '@/store/invoiceStore'
  import ArtistLayout from '@/layouts/ArtistLayout.vue'
  
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
  const selectedInvoices = ref([])
  const lastSelectedIndex = ref(-1)
  
  const artist = computed(() => artistStore.getArtistById(props.artistId))
  const archivedInvoices = computed(() => invoiceStore.getArchivedInvoicesByArtist(props.artistId))
  const projects = computed(() => projectStore.getProjectsByArtist(props.artistId))
  
  const sortedInvoices = computed(() => {
    return [...archivedInvoices.value].sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    )
  })
  
  const isAllSelected = computed(() => {
    return archivedInvoices.value.length > 0 && selectedInvoices.value.length === archivedInvoices.value.length
  })
  
  const isIndeterminate = computed(() => {
    return selectedInvoices.value.length > 0 && selectedInvoices.value.length < archivedInvoices.value.length
  })
  
  const getProject = (projectId) => {
    return projects.value.find(p => p.id === projectId)
  }
  
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
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
      selectedInvoices.value = archivedInvoices.value.map(i => i.id)
    }
  }
  
  const clearSelection = () => {
    selectedInvoices.value = []
    lastSelectedIndex.value = -1
  }
  
  const handleRowClick = (event, invoice, index) => {
    if (event.metaKey || event.ctrlKey) {
      toggleSelection(invoice.id)
      lastSelectedIndex.value = index
    } else if (event.shiftKey && lastSelectedIndex.value >= 0) {
      const start = Math.min(lastSelectedIndex.value, index)
      const end = Math.max(lastSelectedIndex.value, index)
      const rangeIds = sortedInvoices.value
        .slice(start, end + 1)
        .map(i => i.id)
      
      selectedInvoices.value = [...new Set([...selectedInvoices.value, ...rangeIds])]
    } else {
      selectedInvoices.value = [invoice.id]
      lastSelectedIndex.value = index
    }
  }
  
  const restoreSelected = async () => {
    try {
      await invoiceStore.restoreInvoices(selectedInvoices.value)
      clearSelection()
      showToast('Invoices restored', 'success')
    } catch (error) {
      showToast('Failed to restore invoices', 'error')
    }
  }
  
  const deleteSelected = async () => {
    if (confirm(`Are you sure you want to permanently delete ${selectedInvoices.value.length} invoices?`)) {
      try {
        for (const id of selectedInvoices.value) {
          await invoiceStore.deleteInvoice(id)
        }
        clearSelection()
        showToast('Invoices deleted permanently', 'success')
      } catch (error) {
        showToast('Failed to delete invoices', 'error')
      }
    }
  }
  
  const restoreInvoice = async (invoice) => {
    try {
      await invoiceStore.restoreInvoices([invoice.id])
      showToast('Invoice restored', 'success')
    } catch (error) {
      showToast('Failed to restore invoice', 'error')
    }
  }
  
  const deleteInvoice = async (invoice) => {
    if (confirm(`Are you sure you want to permanently delete invoice ${invoice.invoice_number}?`)) {
      try {
        await invoiceStore.deleteInvoice(invoice.id)
        showToast('Invoice deleted permanently', 'success')
      } catch (error) {
        showToast('Failed to delete invoice', 'error')
      }
    }
  }
  
  const showToast = (message, type) => {
    const app = document.querySelector('#app').__vue_app__
    const toastRef = app._context.components.App.refs.toastRef
    if (toastRef) {
      toastRef.show({ message, type })
    }
  }
  
  onMounted(async () => {
    loading.value = true
    try {
      await invoiceStore.loadInvoices()
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      loading.value = false
    }
  })
  </script>
  
  <style scoped>
  .archived-content {
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
  
  .selection-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .selection-count {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: white;
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
  
  .amount {
    font-weight: 600;
    color: #1db954;
  }
  
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
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
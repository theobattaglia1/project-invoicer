<template>
  <div class="invoices-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h1 class="view-title">Invoices</h1>
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
        <button v-if="authStore.isOwner && !showImportSection" @click="initializeImport" class="btn-action">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 3V1h6v2H9zM8 4h8v2H8V4zm0 3h8v2H8V7zm0 3h8v2H8v-2zm-1 3h10v2H7v-2zm-1 3h12v2H6v-2zm-1 3h14v2H5v-2z"/>
          </svg>
          Import Data
        </button>
        <button @click="createInvoice" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create Invoice
        </button>
      </div>
    </div>

    <!-- Temporary Import Section -->
    <div v-if="showImportSection" class="import-section">
      <div class="import-header">
        <h3>Import Invoices for Jack Schrepferman</h3>
        <button @click="showImportSection = false" class="btn-close">×</button>
      </div>
      
      <div class="import-summary">
        <p>Ready to import {{ groupedInvoices.length }} invoices with a total of ${{ totalImportAmount.toLocaleString() }}</p>
      </div>
      
      <div class="import-preview">
        <div v-for="group in groupedInvoices" :key="group.artist" class="import-group">
          <h4>{{ group.artist }}</h4>
          <p>{{ group.tracks.length }} tracks - ${{ group.totalAmount.toLocaleString() }}</p>
        </div>
      </div>
      
      <button @click="performImport" :disabled="importing" class="btn-import">
        {{ importing ? 'Importing...' : 'Start Import' }}
      </button>
      
      <div v-if="importResults.length > 0" class="import-results">
        <h4>Results:</h4>
        <div v-for="result in importResults" :key="result.artist">
          {{ result.artist }}: {{ result.success ? '✓ Success' : '✗ Failed' }}
        </div>
      </div>
    </div>

    <!-- Stats Cards (updated to show selection stats when items are selected) -->
    <div class="stats-grid">
      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 && displayedStats.pendingCount > 0 }">
        <div class="stat-icon pending">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Pending</h3>
          <p class="stat-value">${{ formatAmount(displayedStats.pending) }}</p>
          <span class="stat-count">{{ displayedStats.pendingCount }} invoices</span>
        </div>
      </div>

      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 && displayedStats.paidCount > 0 }">
        <div class="stat-icon paid">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Paid</h3>
          <p class="stat-value">${{ formatAmount(displayedStats.paid) }}</p>
          <span class="stat-count">{{ displayedStats.paidCount }} invoices</span>
        </div>
      </div>

      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 && displayedStats.overdueCount > 0 }">
        <div class="stat-icon overdue">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Overdue</h3>
          <p class="stat-value">${{ formatAmount(displayedStats.overdue) }}</p>
          <span class="stat-count">{{ displayedStats.overdueCount }} invoices</span>
        </div>
      </div>

      <div class="stat-card" :class="{ highlighted: selectedInvoices.length > 0 }">
        <div class="stat-icon total">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.93.66 1.64 2.08 1.64 1.96 0 2.37-.79 2.37-1.54 0-1.06-.92-1.52-2.37-1.87-1.37-.33-2.92-.88-2.92-2.72 0-1.37 1.02-2.47 2.66-2.95V6h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s3.18 1.05 3.18 2.96c0 1.23-.9 2.44-2.82 3.11z"/>
          </svg>
        </div>
        <div class="stat-content">
          <h3>{{ selectedInvoices.length > 0 ? 'Selected Total' : 'Total Revenue' }}</h3>
          <p class="stat-value">${{ formatAmount(displayedStats.total) }}</p>
          <span class="stat-count">{{ selectedInvoices.length > 0 ? `${selectedInvoices.length} invoices` : 'All time' }}</span>
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
            <th class="checkbox-column">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </th>
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
          <tr 
            v-for="(invoice, index) in filteredInvoices" 
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
import { useInvoiceStore } from '@/store/invoiceStore'
import { useArtistStore } from '@/store/artistStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

const invoiceStore = useInvoiceStore()
const artistStore = useArtistStore()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const statusFilter = ref('')
const artistFilter = ref('')
const generatingPDF = reactive({})
const selectedInvoices = ref([])
const lastSelectedIndex = ref(-1)

// Import-related state
const showImportSection = ref(false)
const importing = ref(false)
const importResults = ref([])
const jackSchrepfermanId = '77ad8f58-a932-4c2a-b7f9-09fbf15b57b2'

// The invoice data
const invoiceImportData = [
  {
    artist: "Sleinza",
    track: "High and Dry",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 2000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: true,
    upstreamAmount: null
  },
  {
    artist: "Dasha",
    track: "42",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "IN DROPBOX",
    invoiced: true,
    invoicedAmount: 1000,
    paid: true,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: true,
    upstreamAmount: null
  },
  {
    artist: "Jonas Conner",
    track: "Oh, Appalacia",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 5000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Jonas Conner",
    track: "Too Young, Too Dumb",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 5000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Kenzie Cait",
    track: "Downtown",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 2000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Conall Cafferty",
    track: "If You Ever Wanna Fall",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 500,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: 7500
  },
  {
    artist: "Conall Cafferty",
    track: "What Don't You See",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 500,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: 7500
  },
  {
    artist: "Conall Cafferty",
    track: "Dog At Your Doorstep",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 500,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: 7500
  },
  {
    artist: "Ryman",
    track: "Lose",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 650,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: 4500
  },
  {
    artist: "Midwest",
    track: "Car Seats",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "IN DROPBOX",
    invoiced: true,
    invoicedAmount: 1000,
    paid: true,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: true,
    upstreamAmount: null
  },
  {
    artist: "Casper Sage",
    track: "Flow State",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: null,
    invoiced: true,
    invoicedAmount: 1000,
    paid: true,
    linkToRoyaltiesHub: "IN DISTROKID",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Sleinza",
    track: "Habits",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: null,
    invoiced: null,
    invoicedAmount: null,
    paid: null,
    linkToRoyaltiesHub: "IN TOO LOST",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Sleinza",
    track: "Doctor, Doctor",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: null,
    invoiced: null,
    invoicedAmount: null,
    paid: null,
    linkToRoyaltiesHub: "IN TOO LOST",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Sleinza",
    track: "To The West",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: null,
    invoiced: null,
    invoicedAmount: null,
    paid: null,
    linkToRoyaltiesHub: "IN TOO LOST",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Conall Cafferty",
    track: "Straight Line",
    delivered: false,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 500,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: 7500
  },
  {
    artist: "Conall Cafferty",
    track: "Don't Say You Love Me",
    delivered: false,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 500,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: 7500
  },
  {
    artist: "Jonas Conner",
    track: "Home Ain't a Place No More",
    delivered: false,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 5000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Jonas Conner",
    track: "33s",
    delivered: false,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 5000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Jonas Conner",
    track: "Muscle It Up",
    delivered: false,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 5000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Jonas Conner",
    track: "Tears to Cry",
    delivered: false,
    termsAgreed: true,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 5000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null
  },
  {
    artist: "Kenzie Cait",
    track: "Phantom Pain",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "IN DROPBOX",
    invoiced: true,
    invoicedAmount: 1250,
    paid: true,
    linkToRoyaltiesHub: "IN DISTROKID",
    upstreamed: false,
    upstreamAmount: null
  },
  {
    artist: "Kenzie Cait",
    track: "20 + ALONE",
    delivered: true,
    termsAgreed: true,
    linkToProducerAgreement: "IN DROPBOX",
    invoiced: true,
    invoicedAmount: 1250,
    paid: true,
    linkToRoyaltiesHub: "IN DISTROKID",
    upstreamed: false,
    upstreamAmount: null
  },
  {
    artist: "Hudson Ingram",
    track: "Mr. Optimist",
    delivered: true,
    termsAgreed: false,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: null,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: null,
    upstreamAmount: null,
    pendingTerms: true
  },
  {
    artist: "Reklaws",
    track: "NDA",
    delivered: false,
    termsAgreed: false,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: 2000,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: null
  },
  {
    artist: "Tom Siletto/Amelie Kalia",
    track: "Carolina",
    delivered: true,
    termsAgreed: false,
    linkToProducerAgreement: "*NOT RECIEVED*",
    invoiced: false,
    invoicedAmount: null,
    paid: false,
    linkToRoyaltiesHub: "*NOT RECIEVED*",
    upstreamed: false,
    upstreamAmount: null,
    pendingTerms: true
  }
]

const loading = computed(() => invoiceStore.loading)
const artists = computed(() => artistStore.sortedArtists)

const filteredInvoices = computed(() => {
  let invoices = invoiceStore.activeInvoices
  
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

const isAllSelected = computed(() => {
  return filteredInvoices.value.length > 0 && 
    selectedInvoices.value.length === filteredInvoices.value.length &&
    filteredInvoices.value.every(i => selectedInvoices.value.includes(i.id))
})

const isIndeterminate = computed(() => {
  return selectedInvoices.value.length > 0 && !isAllSelected.value
})

const selectedTotal = computed(() => {
  return selectedInvoices.value.reduce((sum, id) => {
    const invoice = invoiceStore.getInvoiceById(id)
    return sum + (invoice?.amount || 0)
  }, 0)
})

const displayedStats = computed(() => {
  let invoicesToAnalyze = []
  
  if (selectedInvoices.value.length > 0) {
    // Show stats for selected invoices
    invoicesToAnalyze = invoiceStore.activeInvoices.filter(i => 
      selectedInvoices.value.includes(i.id)
    )
  } else {
    // Show overall stats
    invoicesToAnalyze = invoiceStore.activeInvoices
  }
  
  const pending = invoicesToAnalyze
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0)
  
  const paid = invoicesToAnalyze
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0)
  
  const overdueInvoices = invoicesToAnalyze.filter(i => getInvoiceStatus(i) === 'overdue')
  const overdue = overdueInvoices.reduce((sum, i) => sum + i.amount, 0)
  
  return {
    total: selectedInvoices.value.length > 0 ? selectedTotal.value : (pending + paid),
    pending,
    pendingCount: invoicesToAnalyze.filter(i => i.status === 'pending').length,
    paid,
    paidCount: invoicesToAnalyze.filter(i => i.status === 'paid').length,
    overdue,
    overdueCount: overdueInvoices.length
  }
})

// Import-related computed properties
const groupedInvoices = computed(() => {
  const grouped = {}
  
  invoiceImportData.forEach(track => {
    if (track.invoicedAmount === null || track.invoicedAmount === undefined) {
      return
    }
    
    if (!grouped[track.artist]) {
      grouped[track.artist] = {
        artist: track.artist,
        tracks: [],
        totalAmount: 0,
        allPaid: true
      }
    }
    
    grouped[track.artist].tracks.push(track)
    grouped[track.artist].totalAmount += track.invoicedAmount
    if (!track.paid) {
      grouped[track.artist].allPaid = false
    }
  })
  
  return Object.values(grouped)
})

const totalImportAmount = computed(() => {
  return invoiceImportData.reduce((sum, track) => sum + (track.invoicedAmount || 0), 0)
})

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
    selectedInvoices.value = filteredInvoices.value.map(i => i.id)
  }
}

const clearSelection = () => {
  selectedInvoices.value = []
  lastSelectedIndex.value = -1
}

const handleRowClick = (event, invoice, index) => {
  const actualIndex = filteredInvoices.value.findIndex(i => i.id === invoice.id)
  
  if (event.metaKey || event.ctrlKey) {
    // Cmd/Ctrl + Click: Toggle individual selection
    toggleSelection(invoice.id)
    lastSelectedIndex.value = actualIndex
  } else if (event.shiftKey && lastSelectedIndex.value >= 0) {
    // Shift + Click: Select range
    const start = Math.min(lastSelectedIndex.value, actualIndex)
    const end = Math.max(lastSelectedIndex.value, actualIndex)
    const rangeIds = filteredInvoices.value
      .slice(start, end + 1)
      .map(i => i.id)
    
    // Add all in range to selection (without duplicates)
    selectedInvoices.value = [...new Set([...selectedInvoices.value, ...rangeIds])]
  } else {
    // Regular click: Select only this item
    selectedInvoices.value = [invoice.id]
    lastSelectedIndex.value = actualIndex
  }
}

const bulkUpdateStatus = async (status) => {
  try {
    await invoiceStore.updateMultipleInvoicesStatus(selectedInvoices.value, status)
    clearSelection()
    showToast(`Updated ${selectedInvoices.value.length} invoices`, 'success')
  } catch (error) {
    showToast('Failed to update invoices', 'error')
  }
}

const bulkArchive = async () => {
  try {
    await invoiceStore.archiveInvoices(selectedInvoices.value)
    clearSelection()
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
      showToast('Invoices moved to trash', 'success')
    } catch (error) {
      showToast('Failed to delete invoices', 'error')
    }
  }
}

const generatePDF = async (invoice) => {
  try {
    generatingPDF[invoice.id] = true
    
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

// Import-related methods
const initializeImport = () => {
  showImportSection.value = true
  importResults.value = []
}

const generateInvoiceNumber = (artistName) => {
  const prefix = 'JS'
  const artistInitials = artistName
    .split(/[\s\/]+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 4)
  const timestamp = Date.now().toString().slice(-6)
  return `${prefix}-${artistInitials}-${timestamp}`
}

const createLineItem = (track) => {
  return {
    description: track.track,
    amount: track.invoicedAmount || 0,
    artist: track.artist,
    songProject: track.track,
    company: 'Jack Schrepferman Productions',
    delivered: track.delivered || false,
    termsAgreed: track.termsAgreed || false,
    invoiced: track.invoiced || false,
    upstreamed: track.upstreamed || false,
    upstreamAmount: track.upstreamAmount || 0,
    attachmentUrl: '',
    attachmentName: ''
  }
}

const performImport = async () => {
  importing.value = true
  importResults.value = []
  
  try {
    for (const invoiceGroup of groupedInvoices.value) {
      try {
        const invoiceNumber = generateInvoiceNumber(invoiceGroup.artist)
        const issueDate = new Date()
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30)
        
        const lineItems = invoiceGroup.tracks.map(track => createLineItem(track))
        
        const invoiceData = {
          artist_id: jackSchrepfermanId,
          invoice_number: invoiceNumber,
          amount: invoiceGroup.totalAmount,
          status: invoiceGroup.allPaid ? 'paid' : 'pending',
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          bill_to: `${invoiceGroup.artist}\n[Address to be added]`,
          items: JSON.stringify(lineItems),
          notes: 'Imported from spreadsheet',
          paid_date: invoiceGroup.allPaid ? issueDate.toISOString().split('T')[0] : null
        }
        
        const { data, error } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select()
          .single()
        
        if (error) throw error
        
        importResults.value.push({
          artist: invoiceGroup.artist,
          success: true,
          invoiceNumber: invoiceNumber
        })
        
      } catch (error) {
        console.error(`Failed to import invoice for ${invoiceGroup.artist}:`, error)
        importResults.value.push({
          artist: invoiceGroup.artist,
          success: false,
          error: error.message
        })
      }
    }
    
    // Refresh the invoice list
    await invoiceStore.loadInvoices()
    
  } finally {
    importing.value = false
  }
}

const showToast = (message, type) => {
  // Get the toast component from the parent App.vue
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

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.view-title {
  font-size: 48px;
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

/* Import Section */
.import-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.import-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.import-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.import-summary {
  margin-bottom: 24px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.import-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.import-group {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
}

.import-group h4 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.import-group p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.btn-import {
  padding: 12px 32px;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-import:hover:not(:disabled) {
  background: #1ed760;
}

.btn-import:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.import-results {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.import-results h4 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 12px 0;
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
  transition: all 0.3s ease;
}

.stat-card.highlighted {
  background: rgba(29, 185, 84, 0.1);
  border-color: rgba(29, 185, 84, 0.2);
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

/* Table styles */
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
</style>
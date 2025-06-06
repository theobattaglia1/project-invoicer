<template>
    <div class="import-view">
      <div class="import-container">
        <h1 class="import-title">Invoice Data Import</h1>
        <p class="import-subtitle">Import invoice data for Jack Schrepferman</p>
        
        <div class="import-stats">
          <div class="stat">
            <span class="stat-label">Total Tracks:</span>
            <span class="stat-value">{{ totalTracks }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Grouped Invoices:</span>
            <span class="stat-value">{{ groupedInvoices.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Amount:</span>
            <span class="stat-value">${{ totalAmount.toLocaleString() }}</span>
          </div>
        </div>
  
        <div class="invoice-preview">
          <h2>Invoice Preview</h2>
          <div v-for="invoice in groupedInvoices" :key="invoice.artist" class="invoice-group">
            <h3>{{ invoice.artist }}</h3>
            <div class="invoice-details">
              <p><strong>Tracks:</strong> {{ invoice.tracks.length }}</p>
              <p><strong>Total:</strong> ${{ invoice.totalAmount.toLocaleString() }}</p>
              <p><strong>Status:</strong> {{ invoice.allPaid ? 'Paid' : 'Pending' }}</p>
            </div>
            <div class="track-list">
              <div v-for="track in invoice.tracks" :key="track.track" class="track-item">
                <span class="track-name">{{ track.track }}</span>
                <span class="track-amount">${{ track.invoicedAmount.toLocaleString() }}</span>
                <div class="track-status">
                  <span v-if="track.delivered" class="status-chip delivered">✓ Delivered</span>
                  <span v-if="track.termsAgreed" class="status-chip terms">✓ Terms</span>
                  <span v-if="track.invoiced" class="status-chip invoiced">✓ Invoiced</span>
                  <span v-if="track.paid" class="status-chip paid">✓ Paid</span>
                  <span v-if="track.upstreamed" class="status-chip upstreamed">
                    ✓ Upstreamed (${{ track.upstreamAmount || 0 }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div class="import-actions">
          <button 
            @click="performImport" 
            class="btn-import"
            :disabled="importing"
          >
            {{ importing ? 'Importing...' : 'Import All Invoices' }}
          </button>
        </div>
  
        <div v-if="importResults.length > 0" class="import-results">
          <h2>Import Results</h2>
          <div v-for="result in importResults" :key="result.artist" class="result-item">
            <span class="result-artist">{{ result.artist }}</span>
            <span v-if="result.success" class="result-success">✓ Success - {{ result.invoiceNumber }}</span>
            <span v-else class="result-error">✗ Failed: {{ result.error }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { supabase } from '@/lib/supabase'
  
  // The invoice data from the spreadsheet
  const invoiceData = [
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
  
  // State
  const importing = ref(false)
  const importResults = ref([])
  const jackSchrepfermanId = '77ad8f58-a932-4c2a-b7f9-09fbf15b57b2'
  
  // Computed
  const totalTracks = computed(() => {
    return invoiceData.filter(track => track.invoicedAmount !== null).length
  })
  
  const totalAmount = computed(() => {
    return invoiceData.reduce((sum, track) => sum + (track.invoicedAmount || 0), 0)
  })
  
  const groupedInvoices = computed(() => {
    // Group by artist and filter out tracks without amounts
    const grouped = {}
    
    invoiceData.forEach(track => {
      if (track.invoicedAmount === null || track.invoicedAmount === undefined) {
        return // Skip tracks without amounts
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
    
    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount)
  })
  
  // Methods
  const generateInvoiceNumber = (artistName) => {
    const prefix = 'JS' // Jack Schrepferman
    const artistInitials = artistName
      .split(/[\s\/]+/)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 4)
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${artistInitials}-${timestamp}`
  }
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }
  
  const getNotesFromLinks = (track) => {
    const notes = []
    
    if (track.linkToProducerAgreement && track.linkToProducerAgreement !== '*NOT RECIEVED*') {
      notes.push(`Producer Agreement: ${track.linkToProducerAgreement}`)
    }
    
    if (track.linkToRoyaltiesHub && track.linkToRoyaltiesHub !== '*NOT RECIEVED*') {
      notes.push(`Royalties Hub: ${track.linkToRoyaltiesHub}`)
    }
    
    if (track.pendingTerms) {
      notes.push('Terms pending agreement')
    }
    
    return notes.join('\n')
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
          dueDate.setDate(dueDate.getDate() + 30) // Net 30
          
          // Build line items
          const lineItems = invoiceGroup.tracks.map(track => createLineItem(track))
          
          // Collect any special notes
          const allNotes = invoiceGroup.tracks
            .map(track => getNotesFromLinks(track))
            .filter(note => note)
            .join('\n\n')
          
          // Create the invoice
          const invoiceData = {
            artist_id: jackSchrepfermanId,
            invoice_number: invoiceNumber,
            amount: invoiceGroup.totalAmount,
            status: invoiceGroup.allPaid ? 'paid' : 'pending',
            issue_date: formatDate(issueDate),
            due_date: formatDate(dueDate),
            bill_to: `${invoiceGroup.artist}\n[Address to be added]`,
            items: JSON.stringify(lineItems),
            notes: allNotes || 'Imported from spreadsheet',
            paid_date: invoiceGroup.allPaid ? formatDate(issueDate) : null
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
    } finally {
      importing.value = false
    }
  }
  
  onMounted(() => {
    console.log('Invoice Import component loaded')
    console.log('Total tracks with amounts:', totalTracks.value)
    console.log('Total amount:', totalAmount.value)
    console.log('Grouped invoices:', groupedInvoices.value)
  })
  </script>
  
  <style scoped>
  .import-view {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .import-container {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 32px;
  }
  
  .import-title {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin: 0 0 8px 0;
  }
  
  .import-subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 32px 0;
  }
  
  .import-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 32px;
  }
  
  .stat {
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
  }
  
  .stat-label {
    display: block;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }
  
  .stat-value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: white;
  }
  
  .invoice-preview {
    margin-bottom: 32px;
  }
  
  .invoice-preview h2 {
    font-size: 24px;
    font-weight: 600;
    color: white;
    margin: 0 0 24px 0;
  }
  
  .invoice-group {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
  }
  
  .invoice-group h3 {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin: 0 0 16px 0;
  }
  
  .invoice-details {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
  }
  
  .invoice-details p {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
  
  .invoice-details strong {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .track-list {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 16px;
  }
  
  .track-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .track-item:last-child {
    border-bottom: none;
  }
  
  .track-name {
    font-size: 14px;
    color: white;
    flex: 1;
  }
  
  .track-amount {
    font-size: 14px;
    font-weight: 600;
    color: #1db954;
    margin: 0 16px;
  }
  
  .track-status {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 400px;
    justify-content: flex-end;
  }
  
  .status-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }
  
  .status-chip.delivered {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }
  
  .status-chip.terms {
    background: rgba(33, 150, 243, 0.2);
    color: #2196f3;
  }
  
  .status-chip.invoiced {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }
  
  .status-chip.paid {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }
  
  .status-chip.upstreamed {
    background: rgba(156, 39, 176, 0.2);
    color: #9c27b0;
  }
  
  .import-actions {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }
  
  .btn-import {
    padding: 16px 48px;
    background: #1db954;
    color: white;
    border: none;
    border-radius: 32px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-import:hover:not(:disabled) {
    background: #1ed760;
    transform: translateY(-2px);
  }
  
  .btn-import:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .import-results {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
  }
  
  .import-results h2 {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin: 0 0 16px 0;
  }
  
  .result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .result-item:last-child {
    border-bottom: none;
  }
  
  .result-artist {
    font-size: 14px;
    color: white;
    font-weight: 500;
  }
  
  .result-success {
    color: #4caf50;
    font-size: 14px;
  }
  
  .result-error {
    color: #f44336;
    font-size: 14px;
  }
  </style>
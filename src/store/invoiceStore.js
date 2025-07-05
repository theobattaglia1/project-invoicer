// src/store/invoiceStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { monitoredQuery } from '@/utils/performanceMonitor'

export const useInvoiceStore = defineStore('invoices', {
  state: () => ({
    invoices: [],
    loading: false,
    error: null,
    totalCount: 0,
    paymentMethods: [
      { value: 'cash', label: 'Cash', icon: '💵' },
      { value: 'check', label: 'Check', icon: '🏦' },
      { value: 'wire', label: 'Wire Transfer', icon: '🏧' },
      { value: 'paypal', label: 'PayPal', icon: '💳' },
      { value: 'venmo', label: 'Venmo', icon: '📱' },
      { value: 'zelle', label: 'Zelle', icon: '⚡' },
      { value: 'credit_card', label: 'Credit Card', icon: '💳' },
      { value: 'other', label: 'Other', icon: '💰' }
    ]
  }),

  getters: {
    getInvoiceById: (state) => (id) => {
      return state.invoices.find(invoice => invoice.id === id)
    },
    
    getInvoicesByArtist: (state) => (artistId) => {
      return state.invoices.filter(invoice => invoice.artist_id === artistId)
    },
    
    getActiveInvoicesByArtist: (state) => (artistId) => {
      return state.invoices.filter(invoice => 
        invoice.artist_id === artistId && 
        invoice.status !== 'archived' && 
        invoice.status !== 'trashed'
      )
    },
    
    getArchivedInvoicesByArtist: (state) => (artistId) => {
      return state.invoices.filter(invoice => 
        invoice.artist_id === artistId && 
        invoice.status === 'archived'
      )
    },
    
    getTrashedInvoicesByArtist: (state) => (artistId) => {
      return state.invoices.filter(invoice => 
        invoice.artist_id === artistId && 
        invoice.status === 'trashed'
      )
    },
    
    getInvoicesByProject: (state) => (projectId) => {
      return state.invoices.filter(invoice => invoice.project_id === projectId)
    },
    
    pendingInvoices: (state) => {
      return state.invoices.filter(i => i.status === 'pending')
    },
    
    overDueInvoices: (state) => {
      const today = new Date()
      return state.invoices.filter(i => 
        i.status === 'pending' && 
        new Date(i.due_date) < today
      )
    },
    
    getPaymentMethodIcon: (state) => (method) => {
      const pm = state.paymentMethods.find(m => m.value === method)
      return pm ? pm.icon : '💰'
    },
    
    getPaymentMethodLabel: (state) => (method) => {
      const pm = state.paymentMethods.find(m => m.value === method)
      return pm ? pm.label : method
    },
    
    totalRevenue: (state) => {
      return state.invoices
        .filter(i => i.status === 'paid')
        .reduce((total, invoice) => total + parseFloat(invoice.amount), 0)
    },
    
    outstandingAmount: (state) => {
      return state.invoices
        .filter(i => i.status === 'pending')
        .reduce((total, invoice) => total + parseFloat(invoice.amount), 0)
    }
    
    paidInvoices: (state) => {
      return state.invoices.filter(i => i.status === 'paid')
    },
    
    activeInvoices: (state) => {
      return state.invoices.filter(i => 
        i.status !== 'archived' && i.status !== 'trashed'
      )
    },
    
    totalPending: (state) => {
      return state.invoices
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
    },
    
    totalPaid: (state) => {
      return state.invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
    }
  },

  actions: {
    async loadInvoices() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        this.invoices = data || []
      } catch (err) {
        this.error = err.message
        console.error('Failed to load invoices:', err)
      } finally {
        this.loading = false
      }
    },

    async loadInvoicesByArtist(artistId) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('artist_id', artistId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        // Update local state with these invoices
        const existingIds = this.invoices.map(i => i.id)
        const newInvoices = (data || []).filter(i => !existingIds.includes(i.id))
        this.invoices.push(...newInvoices)
        
        return data || []
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async createInvoice(invoiceData) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .insert([{
            artist_id: invoiceData.artist_id,
            project_id: invoiceData.project_id || null,
            invoice_number: invoiceData.invoice_number,
            amount: invoiceData.amount || 0,
            status: invoiceData.status || 'pending',
            issue_date: invoiceData.issue_date,
            due_date: invoiceData.due_date,
            bill_to: invoiceData.bill_to || null,
            items: invoiceData.items || [],
            notes: invoiceData.notes || null
          }])
          .select()
          .single()
        
        if (error) throw error
        this.invoices.push(data)
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async updateInvoice(id, invoiceData) {
      try {
        const updateData = {
          invoice_number: invoiceData.invoice_number,
          amount: invoiceData.amount || 0,
          status: invoiceData.status,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          bill_to: invoiceData.bill_to || null,
          items: invoiceData.items || [],
          notes: invoiceData.notes || null,
          updated_at: new Date().toISOString()
        }
        
        // If status changed to paid, set paid_date
        if (invoiceData.status === 'paid') {
          updateData.paid_date = new Date().toISOString().split('T')[0]
        }
        
        const { data, error } = await supabase
          .from('invoices')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        const index = this.invoices.findIndex(i => i.id === id)
        if (index !== -1) {
          this.invoices[index] = data
        }
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async deleteInvoice(id) {
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        this.invoices = this.invoices.filter(i => i.id !== id)
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async markAsPaid(id) {
      try {
        const invoice = this.getInvoiceById(id)
        if (invoice) {
          await this.updateInvoice(id, {
            ...invoice,
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0]
          })
        }
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async archiveInvoices(ids) {
      try {
        for (const id of ids) {
          const invoice = this.getInvoiceById(id)
          if (invoice && invoice.status !== 'archived') {
            await this.updateInvoice(id, {
              ...invoice,
              status: 'archived'
            })
          }
        }
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async trashInvoices(ids) {
      try {
        for (const id of ids) {
          const invoice = this.getInvoiceById(id)
          if (invoice && invoice.status !== 'trashed') {
            await this.updateInvoice(id, {
              ...invoice,
              status: 'trashed'
            })
          }
        }
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async restoreInvoices(ids) {
      try {
        for (const id of ids) {
          const invoice = this.getInvoiceById(id)
          if (invoice && (invoice.status === 'archived' || invoice.status === 'trashed')) {
            await this.updateInvoice(id, {
              ...invoice,
              status: 'pending'
            })
          }
        }
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async updateMultipleInvoicesStatus(ids, status) {
      try {
        for (const id of ids) {
          const invoice = this.getInvoiceById(id)
          if (invoice) {
            await this.updateInvoice(id, {
              ...invoice,
              status: status
            })
          }
        }
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
// src/store/invoiceStore.js
import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/tauri'

export const useInvoiceStore = defineStore('invoices', {
  state: () => ({
    invoices: [],
    loading: false,
    error: null
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
        .reduce((sum, i) => sum + i.amount, 0)
    },
    
    totalPaid: (state) => {
      return state.invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0)
    }
  },

  actions: {
    async loadInvoices() {
      this.loading = true
      this.error = null
      try {
        const result = await invoke('get_all_invoices')
        this.invoices = result
      } catch (err) {
        this.error = err.toString()
        console.error('Failed to load invoices:', err)
      } finally {
        this.loading = false
      }
    },

    async loadInvoicesByArtist(artistId) {
      try {
        const result = await invoke('get_invoices_by_artist', { artistId })
        return result
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async createInvoice(invoiceData) {
      try {
        const newInvoice = await invoke('create_invoice', {
          artistId: invoiceData.artist_id,
          projectId: invoiceData.project_id,
          invoiceNumber: invoiceData.invoice_number,
          amount: invoiceData.amount,
          status: invoiceData.status || 'pending',
          issueDate: invoiceData.issue_date,
          dueDate: invoiceData.due_date,
          items: JSON.stringify(invoiceData.items || []),
          notes: invoiceData.notes
        })
        this.invoices.push(newInvoice)
        return newInvoice
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async updateInvoice(id, invoiceData) {
      try {
        const updated = await invoke('update_invoice', {
          invoiceId: id,
          invoiceNumber: invoiceData.invoice_number,
          amount: invoiceData.amount,
          status: invoiceData.status,
          issueDate: invoiceData.issue_date,
          dueDate: invoiceData.due_date,
          items: JSON.stringify(invoiceData.items || []),
          notes: invoiceData.notes
        })
        const index = this.invoices.findIndex(i => i.id === id)
        if (index !== -1) {
          this.invoices[index] = updated
        }
        return updated
      } catch (err) {
        this.error = err.toString()
        throw err
      }
    },

    async deleteInvoice(id) {
      try {
        await invoke('delete_invoice', { invoiceId: id })
        this.invoices = this.invoices.filter(i => i.id !== id)
      } catch (err) {
        this.error = err.toString()
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
            paid_date: new Date().toISOString()
          })
        }
      } catch (err) {
        this.error = err.toString()
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
        this.error = err.toString()
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
        this.error = err.toString()
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
        this.error = err.toString()
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
        this.error = err.toString()
        throw err
      }
    }
  }
})
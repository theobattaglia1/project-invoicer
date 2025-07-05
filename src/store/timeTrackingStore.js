// src/store/timeTrackingStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { monitoredQuery } from '@/utils/performanceMonitor'

export const useTimeTrackingStore = defineStore('timeTracking', {
  state: () => ({
    entries: [],
    loading: false,
    error: null,
    totalCount: 0,
    activeTimer: null // For running timer functionality
  }),

  getters: {
    entriesByProject: (state) => (projectId) => {
      return state.entries.filter(entry => entry.project_id === projectId)
    },
    
    totalHoursByProject: (state) => (projectId) => {
      return state.entries
        .filter(entry => entry.project_id === projectId)
        .reduce((total, entry) => total + parseFloat(entry.hours), 0)
    },
    
    billableHoursByProject: (state) => (projectId) => {
      return state.entries
        .filter(entry => entry.project_id === projectId && entry.billable)
        .reduce((total, entry) => total + parseFloat(entry.hours), 0)
    },
    
    totalEarningsByProject: (state) => (projectId) => {
      return state.entries
        .filter(entry => entry.project_id === projectId && entry.billable)
        .reduce((total, entry) => total + (parseFloat(entry.hours) * parseFloat(entry.hourly_rate || 0)), 0)
    },
    
    uninvoicedEntries: (state) => {
      return state.entries.filter(entry => entry.billable && !entry.invoiced)
    }
  },

  actions: {
    async loadTimeEntries(projectId = null, page = 1, pageSize = 50) {
      this.loading = true
      this.error = null
      
      try {
        let query = supabase
          .from('time_entries')
          .select('*', { count: 'exact' })
          .order('date', { ascending: false })
        
        if (projectId) {
          query = query.eq('project_id', projectId)
        }
        
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        
        const { data, error, count } = await monitoredQuery(
          'loadTimeEntries',
          () => query.range(from, to),
          { projectId, page, pageSize }
        )
        
        if (error) throw error
        
        this.entries = data || []
        this.totalCount = count || 0
      } catch (err) {
        this.error = err.message
        console.error('Failed to load time entries:', err)
      } finally {
        this.loading = false
      }
    },

    async createTimeEntry(entryData) {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .insert([{
            project_id: entryData.project_id,
            user_id: entryData.user_id,
            title: entryData.title,
            description: entryData.description || null,
            hours: entryData.hours,
            hourly_rate: entryData.hourly_rate || null,
            date: entryData.date || new Date().toISOString().split('T')[0],
            billable: entryData.billable !== undefined ? entryData.billable : true
          }])
          .select()
          .single()
        
        if (error) throw error
        
        this.entries.unshift(data)
        this.totalCount++
        
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async updateTimeEntry(id, entryData) {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .update({
            title: entryData.title,
            description: entryData.description || null,
            hours: entryData.hours,
            hourly_rate: entryData.hourly_rate || null,
            date: entryData.date,
            billable: entryData.billable,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        const index = this.entries.findIndex(e => e.id === id)
        if (index !== -1) {
          this.entries[index] = data
        }
        
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async deleteTimeEntry(id) {
      try {
        const { error } = await supabase
          .from('time_entries')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        this.entries = this.entries.filter(e => e.id !== id)
        this.totalCount = Math.max(0, this.totalCount - 1)
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    // Timer functionality for real-time tracking
    startTimer(projectId, title, hourlyRate = null) {
      this.activeTimer = {
        projectId,
        title,
        hourlyRate,
        startTime: Date.now(),
        elapsed: 0
      }
    },

    stopTimer() {
      if (!this.activeTimer) return null
      
      const elapsed = Date.now() - this.activeTimer.startTime
      const hours = elapsed / (1000 * 60 * 60) // Convert to hours
      
      const timerData = {
        ...this.activeTimer,
        hours: parseFloat(hours.toFixed(2))
      }
      
      this.activeTimer = null
      return timerData
    },

    updateTimerElapsed() {
      if (this.activeTimer) {
        this.activeTimer.elapsed = Date.now() - this.activeTimer.startTime
      }
    },

    // Bulk operations for invoicing
    async markEntriesAsInvoiced(entryIds, invoiceId) {
      try {
        const { error } = await supabase
          .from('time_entries')
          .update({ 
            invoiced: true, 
            invoice_id: invoiceId,
            updated_at: new Date().toISOString()
          })
          .in('id', entryIds)
        
        if (error) throw error
        
        // Update local state
        this.entries.forEach(entry => {
          if (entryIds.includes(entry.id)) {
            entry.invoiced = true
            entry.invoice_id = invoiceId
          }
        })
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
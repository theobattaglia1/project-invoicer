// src/store/expenseStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { monitoredQuery } from '@/utils/performanceMonitor'

export const useExpenseStore = defineStore('expenses', {
  state: () => ({
    expenses: [],
    loading: false,
    error: null,
    totalCount: 0,
    categories: [
      { value: 'studio_rental', label: 'Studio Rental', icon: '🎚️' },
      { value: 'equipment', label: 'Equipment', icon: '🎤' },
      { value: 'travel', label: 'Travel', icon: '🚗' },
      { value: 'materials', label: 'Materials', icon: '📦' },
      { value: 'software', label: 'Software/Plugins', icon: '💿' },
      { value: 'meals', label: 'Meals & Entertainment', icon: '🍕' },
      { value: 'other', label: 'Other', icon: '📄' }
    ]
  }),

  getters: {
    expensesByProject: (state) => (projectId) => {
      return state.expenses.filter(expense => expense.project_id === projectId)
    },
    
    expensesByCategory: (state) => (category) => {
      return state.expenses.filter(expense => expense.category === category)
    },
    
    totalExpensesByProject: (state) => (projectId) => {
      return state.expenses
        .filter(expense => expense.project_id === projectId)
        .reduce((total, expense) => total + parseFloat(expense.amount), 0)
    },
    
    billableExpensesByProject: (state) => (projectId) => {
      return state.expenses
        .filter(expense => expense.project_id === projectId && expense.billable)
        .reduce((total, expense) => total + parseFloat(expense.amount), 0)
    },
    
    unreimbursedExpenses: (state) => {
      return state.expenses.filter(expense => expense.billable && !expense.reimbursed)
    },
    
    getCategoryIcon: (state) => (category) => {
      const cat = state.categories.find(c => c.value === category)
      return cat ? cat.icon : '📄'
    },
    
    getCategoryLabel: (state) => (category) => {
      const cat = state.categories.find(c => c.value === category)
      return cat ? cat.label : category
    }
  },

  actions: {
    async loadExpenses(projectId = null, page = 1, pageSize = 50) {
      this.loading = true
      this.error = null
      
      try {
        let query = supabase
          .from('expenses')
          .select('*', { count: 'exact' })
          .order('expense_date', { ascending: false })
        
        if (projectId) {
          query = query.eq('project_id', projectId)
        }
        
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        
        const { data, error, count } = await monitoredQuery(
          'loadExpenses',
          () => query.range(from, to),
          { projectId, page, pageSize }
        )
        
        if (error) throw error
        
        this.expenses = data || []
        this.totalCount = count || 0
      } catch (err) {
        this.error = err.message
        console.error('Failed to load expenses:', err)
      } finally {
        this.loading = false
      }
    },

    async createExpense(expenseData) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert([{
            project_id: expenseData.project_id,
            user_id: expenseData.user_id,
            title: expenseData.title,
            description: expenseData.description || null,
            amount: expenseData.amount,
            category: expenseData.category || 'other',
            expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
            receipt_url: expenseData.receipt_url || null,
            billable: expenseData.billable !== undefined ? expenseData.billable : true
          }])
          .select()
          .single()
        
        if (error) throw error
        
        this.expenses.unshift(data)
        this.totalCount++
        
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async updateExpense(id, expenseData) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .update({
            title: expenseData.title,
            description: expenseData.description || null,
            amount: expenseData.amount,
            category: expenseData.category,
            expense_date: expenseData.expense_date,
            receipt_url: expenseData.receipt_url || null,
            billable: expenseData.billable,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        const index = this.expenses.findIndex(e => e.id === id)
        if (index !== -1) {
          this.expenses[index] = data
        }
        
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async deleteExpense(id) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        this.expenses = this.expenses.filter(e => e.id !== id)
        this.totalCount = Math.max(0, this.totalCount - 1)
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    // File upload for receipts
    async uploadReceipt(file, expenseId) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${expenseId}-${Date.now()}.${fileExt}`
        const filePath = `receipts/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(filePath, file)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('expense-receipts')
          .getPublicUrl(filePath)
        
        // Update expense with receipt URL
        await this.updateExpense(expenseId, { receipt_url: publicUrl })
        
        return publicUrl
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    // Bulk operations for invoicing
    async markExpensesAsReimbursed(expenseIds, invoiceId) {
      try {
        const { error } = await supabase
          .from('expenses')
          .update({ 
            reimbursed: true, 
            invoice_id: invoiceId,
            updated_at: new Date().toISOString()
          })
          .in('id', expenseIds)
        
        if (error) throw error
        
        // Update local state
        this.expenses.forEach(expense => {
          if (expenseIds.includes(expense.id)) {
            expense.reimbursed = true
            expense.invoice_id = invoiceId
          }
        })
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
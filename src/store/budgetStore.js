import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useBudgetStore = defineStore('budgets', {
  state: () => ({
    budgets: [],
    loading: false,
    error: null
  }),

  getters: {
    getBudgetById: (state) => (id) => {
      return state.budgets.find(b => b.id === id)
    },

    getBudgetsByProject: (state) => (projectId) => {
      return state.budgets.filter(b => b.project_id === projectId)
    },

    totalEstimatedByProject: (state) => (projectId) => {
      return state.budgets
        .filter(b => b.project_id === projectId)
        .reduce((sum, b) => sum + computeEstTotal(b), 0)
    },

    totalActualByProject: (state) => (projectId) => {
      return state.budgets
        .filter(b => b.project_id === projectId)
        .reduce((sum, b) => sum + computeActualTotal(b), 0)
    }
  },

  actions: {
    async loadBudgets() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*, budget_items(*)')
          .order('created_at', { ascending: false })
        if (error) throw error
        this.budgets = data || []
      } catch (err) {
        this.error = err.message
        console.error('Failed to load budgets:', err)
      } finally {
        this.loading = false
      }
    },

    async loadBudgetsByProject(projectId) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*, budget_items(*)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
        if (error) throw error
        // Merge into local state without duplications
        const existingIds = this.budgets.map(b => b.id)
        const newB = (data || []).filter(b => !existingIds.includes(b.id))
        this.budgets.push(...newB)
        return data || []
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async createBudget(budgetData) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .insert([
            {
              project_id: budgetData.project_id,
              title: budgetData.title,
              notes: budgetData.notes || null
            }
          ])
          .select('*, budget_items(*)')
          .single()
        if (error) throw error
        this.budgets.push(data)
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async updateBudget(id, budgetData) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .update({
            title: budgetData.title,
            notes: budgetData.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('*, budget_items(*)')
          .single()
        if (error) throw error
        const index = this.budgets.findIndex(b => b.id === id)
        if (index !== -1) this.budgets[index] = data
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async deleteBudget(id) {
      try {
        const { error } = await supabase.from('budgets').delete().eq('id', id)
        if (error) throw error
        this.budgets = this.budgets.filter(b => b.id !== id)
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})

// helper functions
function computeEstTotal(budget) {
  const items = budget.budget_items || []
  return items.reduce((s, it) => s + (parseFloat(it.qty || 1) * parseFloat(it.unit_cost_est || 0)), 0)
}

function computeActualTotal(budget) {
  const items = budget.budget_items || []
  return items.reduce((s, it) => s + (parseFloat(it.qty || 1) * parseFloat(it.unit_cost_actual || 0)), 0)
} 
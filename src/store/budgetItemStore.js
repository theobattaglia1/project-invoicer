import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useBudgetItemStore = defineStore('budget_items', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),

  getters: {
    getItemById: (state) => (id) => {
      return state.items.find(i => i.id === id)
    },

    getItemsByBudget: (state) => (budgetId) => {
      return state.items.filter(i => i.budget_id === budgetId)
    }
  },

  actions: {
    async loadItemsByBudget(budgetId) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('budget_items')
          .select('*')
          .eq('budget_id', budgetId)
          .order('created_at', { ascending: true })
        if (error) throw error
        // merge without duplicates
        const existingIds = this.items.map(i => i.id)
        const newItems = (data || []).filter(i => !existingIds.includes(i.id))
        this.items.push(...newItems)
      } catch (err) {
        this.error = err.message
        console.error('Failed to load budget items:', err)
      } finally {
        this.loading = false
      }
    },

    async createItem(itemData) {
      try {
        const { data, error } = await supabase
          .from('budget_items')
          .insert([
            {
              budget_id: itemData.budget_id,
              category: itemData.category,
              sub_item: itemData.sub_item,
              qty: itemData.qty || 1,
              unit_cost_est: itemData.unit_cost_est || 0,
              unit_cost_actual: itemData.unit_cost_actual || null,
              status: itemData.status || 'planned',
              notes: itemData.notes || null,
              due_date: itemData.due_date || null
            }
          ])
          .select()
          .single()
        if (error) throw error
        this.items.push(data)
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async updateItem(id, itemData) {
      try {
        const { data, error } = await supabase
          .from('budget_items')
          .update({
            category: itemData.category,
            sub_item: itemData.sub_item,
            qty: itemData.qty || 1,
            unit_cost_est: itemData.unit_cost_est || 0,
            unit_cost_actual: itemData.unit_cost_actual,
            status: itemData.status,
            notes: itemData.notes || null,
            due_date: itemData.due_date || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        const idx = this.items.findIndex(i => i.id === id)
        if (idx !== -1) this.items[idx] = data
        return data
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async deleteItem(id) {
      try {
        const { error } = await supabase.from('budget_items').delete().eq('id', id)
        if (error) throw error
        this.items = this.items.filter(i => i.id !== id)
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
}) 
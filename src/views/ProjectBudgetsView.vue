<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Budgets</h1>

    <button
      class="bg-blue-600 text-white px-3 py-1 rounded mb-4"
      @click="openCreateModal"
    >
      + New Budget
    </button>

    <div v-if="loading" class="text-gray-500">Loading…</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>

    <table v-if="budgets.length" class="min-w-full text-sm text-left">
      <thead>
        <tr>
          <th class="px-2 py-1">Title</th>
          <th class="px-2 py-1">Est. Total</th>
          <th class="px-2 py-1">Actual Total</th>
          <th class="px-2 py-1">Variance</th>
          <th class="px-2 py-1">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="budget in budgets"
          :key="budget.id"
          class="border-t border-gray-200 hover:bg-gray-50"
        >
          <td class="px-2 py-1">{{ budget.title }}</td>
          <td class="px-2 py-1">${{ formatCurrency(estTotal(budget)) }}</td>
          <td class="px-2 py-1">${{ formatCurrency(actualTotal(budget)) }}</td>
          <td
            class="px-2 py-1"
            :class="actualTotal(budget) > estTotal(budget) ? 'text-red-600' : 'text-green-600'"
          >
            ${{ formatCurrency(actualTotal(budget) - estTotal(budget)) }}
          </td>
          <td class="px-2 py-1 space-x-2">
            <router-link
              :to="{ name: 'BudgetDetail', params: { budgetId: budget.id } }"
              class="text-blue-600 hover:underline"
            >
              View
            </router-link>
            <button class="text-red-600" @click="deleteBudget(budget.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="text-gray-500">No budgets yet.</p>

    <!-- Create Budget Modal stub -->
    <UnifiedModal v-if="showModal" @close="showModal=false" title="Create Budget">
      <form @submit.prevent="submitCreate">
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Title</label>
          <input v-model="form.title" class="border rounded w-full px-2 py-1" required />
        </div>
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Notes</label>
          <textarea v-model="form.notes" class="border rounded w-full px-2 py-1" rows="3" />
        </div>
        <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
      </form>
    </UnifiedModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBudgetStore } from '@/store/budgetStore'
import UnifiedModal from '@/components/UnifiedModal.vue'
import { showToast } from '@/utils/toast'

const route = useRoute()
const projectId = route.params.projectId
const budgetStore = useBudgetStore()

const loading = computed(() => budgetStore.loading)
const error = computed(() => budgetStore.error)
const budgets = computed(() => budgetStore.getBudgetsByProject(projectId))

onMounted(() => {
  budgetStore.loadBudgetsByProject(projectId)
})

function formatCurrency(val) {
  return (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function estTotal(budget) {
  return (budget.budget_items || []).reduce((s,i)=> s + (parseFloat(i.qty||1)*parseFloat(i.unit_cost_est||0)),0)
}
function actualTotal(budget) {
  return (budget.budget_items || []).reduce((s,i)=> s + (parseFloat(i.qty||1)*parseFloat(i.unit_cost_actual||0)),0)
}

/* ── Create Budget Modal ─ */
const showModal = ref(false)
const form = ref({ title: '', notes: '' })

function openCreateModal() {
  form.value = { title: '', notes: '' }
  showModal.value = true
}

async function submitCreate() {
  try {
    await budgetStore.createBudget({
      project_id: projectId,
      title: form.value.title,
      notes: form.value.notes
    })
    showModal.value = false
    showToast('Budget created', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  }
}

async function deleteBudget(id) {
  if (!confirm('Delete this budget?')) return
  try {
    await budgetStore.deleteBudget(id)
    showToast('Budget deleted', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  }
}
</script> 
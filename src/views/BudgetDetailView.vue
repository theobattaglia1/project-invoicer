<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-2">{{ budget?.title }}</h1>
    <p class="mb-4 text-gray-600">Project ID: {{ budget?.project_id }}</p>

    <button
      class="bg-blue-600 text-white px-3 py-1 rounded mb-4"
      @click="openAddItem"
    >
      + Add Item
    </button>

    <div v-if="itemsLoading" class="text-gray-500">Loading items…</div>
    <div v-else-if="itemError" class="text-red-600">{{ itemError }}</div>

    <table v-if="items.length" class="min-w-full text-sm text-left">
      <thead>
        <tr>
          <th class="px-2 py-1">Category</th>
          <th class="px-2 py-1">Sub-Item</th>
          <th class="px-2 py-1">Qty</th>
          <th class="px-2 py-1">Est. Unit $</th>
          <th class="px-2 py-1">Actual Unit $</th>
          <th class="px-2 py-1">Status</th>
          <th class="px-2 py-1">Notes</th>
          <th class="px-2 py-1">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id" class="border-t border-gray-200">
          <td class="px-2 py-1">{{ item.category }}</td>
          <td class="px-2 py-1">{{ item.sub_item }}</td>
          <td class="px-2 py-1">{{ item.qty }}</td>
          <td class="px-2 py-1">${{ formatCurrency(item.unit_cost_est) }}</td>
          <td class="px-2 py-1">${{ formatCurrency(item.unit_cost_actual) }}</td>
          <td class="px-2 py-1">{{ item.status }}</td>
          <td class="px-2 py-1 w-40 truncate" :title="item.notes">{{ item.notes }}</td>
          <td class="px-2 py-1 space-x-2">
            <button class="text-blue-600" @click="editItem(item)">Edit</button>
            <button class="text-red-600" @click="deleteItem(item.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="text-gray-500">No items yet.</p>

    <!-- Add/Edit Item Modal -->
    <UnifiedModal v-if="showItemModal" @close="closeItemModal" :title="itemModalTitle">
      <form @submit.prevent="submitItem">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Category</label>
            <input v-model="itemForm.category" class="border rounded w-full px-2 py-1" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Sub-Item</label>
            <input v-model="itemForm.sub_item" class="border rounded w-full px-2 py-1" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Qty</label>
            <input type="number" v-model.number="itemForm.qty" class="border rounded w-full px-2 py-1" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Est. Unit $</label>
            <input type="number" v-model.number="itemForm.unit_cost_est" class="border rounded w-full px-2 py-1" step="0.01" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Actual Unit $</label>
            <input type="number" v-model.number="itemForm.unit_cost_actual" class="border rounded w-full px-2 py-1" step="0.01" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Status</label>
            <select v-model="itemForm.status" class="border rounded w-full px-2 py-1">
              <option value="planned">Planned</option>
              <option value="needs-approval">Needs Approval</option>
              <option value="paid">Paid</option>
              <option value="follow-up">Follow-Up</option>
              <option value="reimbursed">Reimbursed</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-1">Notes</label>
            <textarea v-model="itemForm.notes" rows="3" class="border rounded w-full px-2 py-1" />
          </div>
        </div>
        <button type="submit" class="mt-4 bg-blue-600 text-white px-3 py-1 rounded">Save</button>
      </form>
    </UnifiedModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBudgetStore } from '@/store/budgetStore'
import { useBudgetItemStore } from '@/store/budgetItemStore'
import UnifiedModal from '@/components/UnifiedModal.vue'
import { showToast } from '@/utils/toast'

const route = useRoute()
const budgetId = route.params.budgetId

const budgetStore = useBudgetStore()
const itemStore = useBudgetItemStore()

const budget = computed(() => budgetStore.getBudgetById(budgetId))
const items = computed(() => itemStore.getItemsByBudget(budgetId))
const itemsLoading = computed(() => itemStore.loading)
const itemError = computed(() => itemStore.error)

onMounted(async () => {
  if (!budget.value) {
    await budgetStore.loadBudgets()
  }
  await itemStore.loadItemsByBudget(budgetId)
})

function formatCurrency(val) {
  return (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
}

/* ── Add / Edit item modal ─ */
const showItemModal = ref(false)
const editingId = ref(null)
const itemForm = ref(defaultItem())

function defaultItem() {
  return {
    category: '',
    sub_item: '',
    qty: 1,
    unit_cost_est: 0,
    unit_cost_actual: null,
    status: 'planned',
    notes: ''
  }
}

function openAddItem() {
  editingId.value = null
  itemForm.value = defaultItem()
  showItemModal.value = true
}

function editItem(item) {
  editingId.value = item.id
  itemForm.value = { ...item }
  showItemModal.value = true
}

function closeItemModal() {
  showItemModal.value = false
}

async function submitItem() {
  try {
    if (editingId.value) {
      await itemStore.updateItem(editingId.value, itemForm.value)
    } else {
      await itemStore.createItem({ ...itemForm.value, budget_id: budgetId })
    }
    showItemModal.value = false
    showToast('Item saved', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  }
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return
  try {
    await itemStore.deleteItem(id)
    showToast('Item deleted', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  }
}

const itemModalTitle = computed(() => editingId.value ? 'Edit Item' : 'Add Item')
</script>

<style>
  /* No changes to style section */
</style> 
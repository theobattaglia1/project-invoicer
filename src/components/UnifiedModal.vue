<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">{{ modalTitle }}</h2>
            <button @click="close" class="modal-close">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="modal-body">
            <!-- Artist Form -->
            <template v-if="type === 'artist'">
              <div class="form-group">
                <label>Name *</label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  required
                  placeholder="Artist name"
                />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input 
                  v-model="formData.email" 
                  type="email"
                  placeholder="artist@example.com"
                />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input 
                  v-model="formData.phone" 
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div class="form-group">
                <label>Address</label>
                <textarea 
                  v-model="formData.address"
                  rows="3"
                  placeholder="123 Main St, City, State ZIP"
                ></textarea>
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea 
                  v-model="formData.notes"
                  rows="3"
                  placeholder="Additional notes..."
                ></textarea>
              </div>
            </template>

            <!-- Project Form -->
            <template v-else-if="type === 'project'">
              <div class="form-group">
                <label>Artist *</label>
                <select v-model="formData.artist_id" required>
                  <option value="">Select an artist</option>
                  <option 
                    v-for="artist in artists" 
                    :key="artist.id" 
                    :value="artist.id"
                  >
                    {{ artist.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Project Name *</label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  required
                  placeholder="Project name"
                />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea 
                  v-model="formData.description"
                  rows="3"
                  placeholder="Project description..."
                ></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Start Date</label>
                  <input 
                    v-model="formData.start_date" 
                    type="date"
                  />
                </div>
                <div class="form-group">
                  <label>End Date</label>
                  <input 
                    v-model="formData.end_date" 
                    type="date"
                  />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Budget</label>
                  <input 
                    v-model.number="formData.budget" 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select v-model="formData.status">
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Invoice Form -->
            <template v-else-if="type === 'invoice'">
              <div class="form-group">
                <label>Artist *</label>
                <select 
                  v-model="formData.artist_id" 
                  required 
                  @change="onArtistChange"
                  :disabled="isArtistLocked"
                >
                  <option value="">Select an artist</option>
                  <option 
                    v-for="artist in artists" 
                    :key="artist.id" 
                    :value="artist.id"
                  >
                    {{ artist.name }}
                  </option>
                </select>
                <div v-if="selectedArtist" class="artist-preview">
                  <div class="preview-label">Bill To:</div>
                  <div class="preview-content">
                    <strong>{{ selectedArtist.name }}</strong>
                    <span v-if="selectedArtist.email">{{ selectedArtist.email }}</span>
                    <span v-if="selectedArtist.phone">{{ selectedArtist.phone }}</span>
                    <span v-if="selectedArtist.address" class="address">{{ selectedArtist.address }}</span>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Project</label>
                <select v-model="formData.project_id">
                  <option value="">No specific project</option>
                  <option 
                    v-for="project in availableProjects" 
                    :key="project.id" 
                    :value="project.id"
                  >
                    {{ project.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Invoice Number *</label>
                <input 
                  v-model="formData.invoice_number" 
                  type="text" 
                  required
                  placeholder="INV-001"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Issue Date *</label>
                  <input 
                    v-model="formData.issue_date" 
                    type="date"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Due Date *</label>
                  <input 
                    v-model="formData.due_date" 
                    type="date"
                    required
                  />
                </div>
              </div>
              
              <!-- Invoice Items -->
              <div class="invoice-items">
                <label>Invoice Items</label>
                <div v-for="(item, index) in formData.items" :key="index" class="invoice-item">
                  <input 
                    v-model="item.description" 
                    type="text"
                    placeholder="Description"
                    class="item-description"
                  />
                  <input 
                    v-model.number="item.amount" 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="item-amount"
                  />
                  <button 
                    @click="removeItem(index)" 
                    type="button"
                    class="btn-remove"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
                <button 
                  @click="addItem" 
                  type="button"
                  class="btn-add-item"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Item
                </button>
              </div>

              <div class="form-group">
                <label>Total Amount</label>
                <div class="total-amount">${{ totalAmount.toFixed(2) }}</div>
              </div>

              <div class="form-group">
                <label>Status</label>
                <select v-model="formData.status">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div class="form-group">
                <label>Notes</label>
                <textarea 
                  v-model="formData.notes"
                  rows="3"
                  placeholder="Additional notes..."
                ></textarea>
              </div>
            </template>
          </form>

          <div class="modal-footer">
            <button @click="close" class="btn-secondary">Cancel</button>
            <button @click="handleSubmit" class="btn-primary">
              {{ item ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useArtistStore } from '@/store/artistStore'
import { useProjectStore } from '@/store/projectStore'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  item: {
    type: Object,
    default: null
  },
  // New prop for pre-filling data
  defaultData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const artistStore = useArtistStore()
const projectStore = useProjectStore()

const visible = ref(true)
const formData = ref({})

const artists = computed(() => artistStore.sortedArtists)
const selectedArtist = computed(() => {
  if (!formData.value.artist_id) return null
  return artistStore.getArtistById(formData.value.artist_id)
})

// Check if artist is locked (when creating from artist-specific view)
const isArtistLocked = computed(() => {
  return props.defaultData?.artist_id && !props.item
})

const availableProjects = computed(() => {
  if (!formData.value.artist_id) return []
  return projectStore.getProjectsByArtist(formData.value.artist_id)
})

const modalTitle = computed(() => {
  const action = props.item ? 'Edit' : 'New'
  const typeMap = {
    artist: 'Artist',
    project: 'Project',
    invoice: 'Invoice'
  }
  return `${action} ${typeMap[props.type]}`
})

const totalAmount = computed(() => {
  if (!formData.value.items) return 0
  return formData.value.items.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const initializeForm = () => {
  if (props.item) {
    formData.value = { ...props.item }
    if (props.type === 'invoice' && props.item.items) {
      formData.value.items = JSON.parse(props.item.items)
    }
  } else {
    // Start with default values
    switch (props.type) {
      case 'artist':
        formData.value = {
          name: '',
          email: '',
          phone: '',
          address: '',
          notes: ''
        }
        break
      case 'project':
        formData.value = {
          artist_id: '',
          name: '',
          description: '',
          status: 'active',
          start_date: '',
          end_date: '',
          budget: 0
        }
        break
      case 'invoice':
        formData.value = {
          artist_id: '',
          project_id: '',
          invoice_number: generateInvoiceNumber(),
          amount: 0,
          status: 'pending',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: getDefaultDueDate(),
          items: [{ description: '', amount: 0 }],
          notes: ''
        }
        break
    }
    
    // Apply any default data passed in
    if (props.defaultData) {
      formData.value = { ...formData.value, ...props.defaultData }
    }
  }
}

const generateInvoiceNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `INV-${year}${month}-${random}`
}

const getDefaultDueDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 30) // 30 days from today
  return date.toISOString().split('T')[0]
}

const onArtistChange = () => {
  formData.value.project_id = ''
}

const addItem = () => {
  if (!formData.value.items) formData.value.items = []
  formData.value.items.push({ description: '', amount: 0 })
}

const removeItem = (index) => {
  formData.value.items.splice(index, 1)
}

const handleSubmit = () => {
  if (props.type === 'invoice') {
    formData.value.amount = totalAmount.value
  }
  emit('save', props.type, formData.value)
}

const handleOverlayClick = () => {
  close()
}

const close = () => {
  emit('close')
}

watch(() => props.item, () => {
  initializeForm()
}, { immediate: true })

watch(() => props.defaultData, () => {
  if (!props.item) {
    initializeForm()
  }
}, { immediate: true })

watch(() => formData.value.items, () => {
  if (props.type === 'invoice') {
    formData.value.amount = totalAmount.value
  }
}, { deep: true })
</script>

<style scoped>
/* Existing styles remain the same */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #1db954;
}

.form-group select option {
  background: #1e1e1e;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Artist Preview in Invoice Form */
.artist-preview {
  margin-top: 12px;
  padding: 12px;
  background: rgba(29, 185, 84, 0.1);
  border: 1px solid rgba(29, 185, 84, 0.2);
  border-radius: 8px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #1db954;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-content strong {
  color: white;
  font-size: 14px;
}

.preview-content span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.preview-content .address {
  white-space: pre-line;
}

/* Invoice Items */
.invoice-items {
  margin-bottom: 20px;
}

.invoice-items label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.invoice-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.item-description {
  flex: 1;
}

.item-amount {
  width: 120px;
}

.btn-remove {
  width: 32px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 67, 54, 0.2);
  border: none;
  border-radius: 6px;
  color: #f44336;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: rgba(244, 67, 54, 0.3);
}

.btn-remove svg {
  width: 16px;
  height: 16px;
}

.btn-add-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(29, 185, 84, 0.2);
  border: 1px solid rgba(29, 185, 84, 0.3);
  border-radius: 6px;
  color: #1db954;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-item:hover {
  background: rgba(29, 185, 84, 0.3);
}

.btn-add-item svg {
  width: 16px;
  height: 16px;
}

.total-amount {
  font-size: 24px;
  font-weight: 700;
  color: #1db954;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.btn-primary {
  background: #1db954;
  color: white;
}

.btn-primary:hover {
  background: #1ed760;
}

/* Disabled state for locked fields */
select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container {
  transform: scale(0.9);
}

.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
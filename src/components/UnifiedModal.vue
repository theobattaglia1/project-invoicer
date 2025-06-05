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
                  <select v-model="formData.artist_id" required @change="onArtistChange">
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
    }
  })
  
  const emit = defineEmits(['close', 'save'])
  
  const artistStore = useArtistStore()
  const projectStore = useProjectStore()
  
  const visible = ref(true)
  const formData = ref({})
  
  const artists = computed(() => artistStore.sortedArtists)
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
            due_date: '',
            items: [{ description: '', amount: 0 }],
            notes: ''
          }
          break
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
  
    watch(() => formData.value.items, () => {
      if (props.type === 'invoice') {
        formData.value.amount = totalAmount.value
      }
    }, { deep: true })
  
  </script>

<template>
  <div class="enhanced-invoice-form">
    <div class="form-header">
      <h2>{{ isEditing ? 'Edit Invoice' : 'Create Invoice' }}</h2>
      <p class="form-subtitle">{{ isEditing ? 'Update invoice details' : 'Generate a new invoice for your client' }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="invoice-form">
      <!-- Invoice Title & Description -->
      <div class="form-section">
        <h3 class="section-title">📋 Invoice Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="title">Invoice Title *</label>
            <input
              v-model="form.title"
              id="title"
              type="text"
              placeholder="Studio Session - December 2024"
              required
              class="form-input"
              :disabled="loading"
            />
            <p class="form-hint">Brief description of what this invoice is for</p>
          </div>
          <div class="form-group">
            <label for="invoice_number">Invoice Number *</label>
            <input
              v-model="form.invoice_number"
              id="invoice_number"
              type="text"
              placeholder="INV-2024-001"
              required
              class="form-input"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            v-model="form.description"
            id="description"
            placeholder="Additional details about the work performed, terms, or any special notes..."
            class="form-textarea"
            rows="3"
            :disabled="loading"
          ></textarea>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="form-section">
        <h3 class="section-title">💰 Billing Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="amount">Amount *</label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input
                v-model="form.amount"
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                class="form-input"
                :disabled="loading"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="status">Status</label>
            <select v-model="form.status" id="status" class="form-select" :disabled="loading">
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="issue_date">Issue Date *</label>
            <input
              v-model="form.issue_date"
              id="issue_date"
              type="date"
              required
              class="form-input"
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label for="due_date">Due Date *</label>
            <input
              v-model="form.due_date"
              id="due_date"
              type="date"
              required
              class="form-input"
              :disabled="loading"
            />
          </div>
        </div>
      </div>

      <!-- Payment Tracking -->
      <div v-if="form.status === 'paid'" class="form-section">
        <h3 class="section-title">💳 Payment Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="payment_method">Payment Method</label>
            <select v-model="form.payment_method" id="payment_method" class="form-select" :disabled="loading">
              <option value="">Select payment method</option>
              <option
                v-for="method in paymentMethods"
                :key="method.value"
                :value="method.value"
              >
                {{ method.icon }} {{ method.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="payment_reference">Payment Reference</label>
            <input
              v-model="form.payment_reference"
              id="payment_reference"
              type="text"
              placeholder="Check #1234, Transaction ID, etc."
              class="form-input"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="paid_date">Payment Date</label>
            <input
              v-model="form.paid_date"
              id="paid_date"
              type="date"
              class="form-input"
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label for="partial_payment_amount">Partial Payment</label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input
                v-model="form.partial_payment_amount"
                id="partial_payment_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="form-input"
                :disabled="loading"
              />
            </div>
            <p class="form-hint">Leave blank if paid in full</p>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="form-section">
        <h3 class="section-title">📝 Line Items</h3>
        
        <div class="line-items">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="line-item"
          >
            <div class="line-item-content">
              <div class="form-group">
                <input
                  v-model="item.description"
                  type="text"
                  placeholder="Description of work"
                  class="form-input"
                  :disabled="loading"
                />
              </div>
              <div class="form-group">
                <input
                  v-model="item.quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Qty"
                  class="form-input number-input"
                  :disabled="loading"
                />
              </div>
              <div class="form-group">
                <div class="input-with-prefix">
                  <span class="input-prefix">$</span>
                  <input
                    v-model="item.rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Rate"
                    class="form-input"
                    :disabled="loading"
                  />
                </div>
              </div>
              <div class="line-item-total">
                ${{ calculateLineTotal(item).toFixed(2) }}
              </div>
              <button
                type="button"
                @click="removeLineItem(index)"
                class="btn-remove-line"
                :disabled="loading"
              >
                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <button
            type="button"
            @click="addLineItem"
            class="btn-add-line"
            :disabled="loading"
          >
            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Add Line Item
          </button>
          
          <div class="line-items-total">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${{ calculateSubtotal().toFixed(2) }}</span>
            </div>
            <div class="total-row final-total">
              <span>Total:</span>
              <span>${{ calculateSubtotal().toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="form-section">
        <h3 class="section-title">📄 Additional Information</h3>
        
        <div class="form-group">
          <label for="bill_to">Bill To</label>
          <textarea
            v-model="form.bill_to"
            id="bill_to"
            placeholder="Client Name&#10;Company Name&#10;Address&#10;City, State ZIP"
            class="form-textarea"
            rows="4"
            :disabled="loading"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea
            v-model="form.notes"
            id="notes"
            placeholder="Payment terms, thank you message, or any additional notes..."
            class="form-textarea"
            rows="3"
            :disabled="loading"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn-secondary" :disabled="loading">
          Cancel
        </button>
        <div class="action-buttons">
          <button
            type="button"
            @click="saveDraft"
            class="btn-outline"
            :disabled="loading"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="loading || !isFormValid"
          >
            {{ loading ? 'Saving...' : (isEditing ? 'Update Invoice' : 'Create Invoice') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useInvoiceStore } from '@/store/invoiceStore'

const props = defineProps({
  invoice: {
    type: Object,
    default: null
  },
  artistId: {
    type: String,
    required: true
  },
  projectId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

const invoiceStore = useInvoiceStore()
const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  invoice_number: '',
  amount: '',
  status: 'draft',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  paid_date: '',
  payment_method: '',
  payment_reference: '',
  partial_payment_amount: '',
  bill_to: '',
  notes: '',
  items: [
    { description: '', quantity: 1, rate: '' }
  ]
})

const isEditing = computed(() => !!props.invoice)

const paymentMethods = computed(() => invoiceStore.paymentMethods)

const isFormValid = computed(() => 
  form.value.title.trim() &&
  form.value.invoice_number.trim() &&
  form.value.amount &&
  form.value.issue_date &&
  form.value.due_date
)

// Calculate line item totals
const calculateLineTotal = (item) => {
  const quantity = parseFloat(item.quantity) || 0
  const rate = parseFloat(item.rate) || 0
  return quantity * rate
}

const calculateSubtotal = () => {
  return form.value.items.reduce((total, item) => total + calculateLineTotal(item), 0)
}

// Auto-update amount based on line items
watch(
  () => form.value.items,
  () => {
    const subtotal = calculateSubtotal()
    if (subtotal > 0) {
      form.value.amount = subtotal.toFixed(2)
    }
  },
  { deep: true }
)

// Line item management
const addLineItem = () => {
  form.value.items.push({ description: '', quantity: 1, rate: '' })
}

const removeLineItem = (index) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

// Generate invoice number
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `INV-${year}${month}-${random}`
}

// Form actions
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  try {
    const invoiceData = {
      ...form.value,
      artist_id: props.artistId,
      project_id: props.projectId,
      items: JSON.stringify(form.value.items.filter(item => 
        item.description.trim() && (item.quantity || item.rate)
      ))
    }
    
    emit('submit', invoiceData)
  } finally {
    loading.value = false
  }
}

const saveDraft = async () => {
  form.value.status = 'draft'
  await handleSubmit()
}

// Initialize form
onMounted(() => {
  if (props.invoice) {
    // Edit mode - populate form
    Object.assign(form.value, {
      ...props.invoice,
      items: props.invoice.items ? JSON.parse(props.invoice.items) : [{ description: '', quantity: 1, rate: '' }]
    })
  } else {
    // Create mode - generate invoice number
    form.value.invoice_number = generateInvoiceNumber()
  }
})
</script>

<style scoped>
.enhanced-invoice-form {
  max-width: 4xl;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

.invoice-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.form-input, .form-textarea, .form-select {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #1db954;
  background: rgba(255, 255, 255, 0.08);
}

.form-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  z-index: 1;
}

.input-with-prefix .form-input {
  padding-left: 2rem;
}

.number-input {
  text-align: center;
}

/* Line Items */
.line-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.line-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
}

.line-item-content {
  display: grid;
  grid-template-columns: 2fr 80px 120px 100px 40px;
  gap: 1rem;
  align-items: end;
}

.line-item-total {
  font-weight: 600;
  color: #1db954;
  text-align: right;
  padding: 0.75rem 0;
}

.btn-remove-line {
  padding: 0.5rem;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 0.375rem;
  color: #f44336;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-line:hover {
  background: rgba(244, 67, 54, 0.2);
}

.btn-add-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(29, 185, 84, 0.1);
  border: 1px dashed rgba(29, 185, 84, 0.3);
  border-radius: 0.5rem;
  color: #1db954;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-add-line:hover {
  background: rgba(29, 185, 84, 0.15);
  border-color: rgba(29, 185, 84, 0.5);
}

.line-items-total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: rgba(255, 255, 255, 0.8);
}

.final-total {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 0.5rem;
  padding-top: 1rem;
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-primary, .btn-secondary, .btn-outline {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #1db954;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1ed760;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-outline {
  background: transparent;
  color: #1db954;
  border: 1px solid rgba(29, 185, 84, 0.3);
}

.btn-outline:hover {
  background: rgba(29, 185, 84, 0.1);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .enhanced-invoice-form {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .line-item-content {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .line-item-total {
    text-align: left;
    padding: 0.5rem 0;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
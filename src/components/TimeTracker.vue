<template>
  <div class="time-tracker">
    <!-- Quick Timer Section -->
    <div class="timer-section">
      <div class="timer-display">
        <div class="timer-time">{{ formatElapsedTime(currentElapsed) }}</div>
        <div v-if="isRunning" class="timer-pulse"></div>
      </div>
      
      <div v-if="!isRunning" class="timer-start">
        <input
          v-model="quickTimerTitle"
          placeholder="What are you working on?"
          class="timer-input"
          @keyup.enter="startQuickTimer"
        />
        <button @click="startQuickTimer" class="btn-timer-start" :disabled="!quickTimerTitle.trim()">
          <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          Start Timer
        </button>
      </div>
      
      <div v-else class="timer-controls">
        <div class="timer-info">
          <span class="timer-title">{{ timeTrackingStore.activeTimer?.title }}</span>
          <span v-if="timeTrackingStore.activeTimer?.hourlyRate" class="timer-rate">
            ${{ timeTrackingStore.activeTimer.hourlyRate }}/hr
          </span>
        </div>
        <div class="timer-actions">
          <button @click="stopAndSaveTimer" class="btn-timer-stop">
            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
            </svg>
            Stop & Save
          </button>
          <button @click="stopTimer" class="btn-timer-discard">
            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            Discard
          </button>
        </div>
      </div>
    </div>

    <!-- Manual Entry Form -->
    <div v-if="showManualEntry" class="manual-entry">
      <h3>Add Time Entry</h3>
      <form @submit.prevent="saveManualEntry" class="entry-form">
        <div class="form-row">
          <div class="form-group">
            <label for="title">Description *</label>
            <input
              v-model="manualEntry.title"
              id="title"
              type="text"
              placeholder="Recording vocals, mixing, etc."
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="hours">Hours *</label>
            <input
              v-model="manualEntry.hours"
              id="hours"
              type="number"
              step="0.25"
              min="0"
              placeholder="2.5"
              required
              class="form-input"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="date">Date</label>
            <input
              v-model="manualEntry.date"
              id="date"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="hourlyRate">Rate ($/hr)</label>
            <input
              v-model="manualEntry.hourlyRate"
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              placeholder="75.00"
              class="form-input"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Notes</label>
          <textarea
            v-model="manualEntry.description"
            id="description"
            placeholder="Additional details about the work..."
            class="form-textarea"
            rows="2"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <label class="checkbox-label">
            <input v-model="manualEntry.billable" type="checkbox" />
            <span>Billable</span>
          </label>
          
          <div class="button-group">
            <button type="button" @click="cancelManualEntry" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="!manualEntry.title || !manualEntry.hours">
              Save Entry
            </button>
          </div>
        </div>
      </form>
    </div>

    <div v-else class="entry-toggle">
      <button @click="showManualEntry = true" class="btn-link">
        <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Add manual time entry
      </button>
    </div>

    <!-- Recent Entries -->
    <div v-if="recentEntries.length > 0" class="recent-entries">
      <h3>Recent Entries</h3>
      <div class="entries-list">
        <div
          v-for="entry in recentEntries"
          :key="entry.id"
          class="entry-item"
          :class="{ 'not-billable': !entry.billable }"
        >
          <div class="entry-info">
            <div class="entry-title">{{ entry.title }}</div>
            <div class="entry-meta">
              {{ formatDate(entry.date) }} • {{ entry.hours }}h
              <span v-if="entry.hourly_rate">• ${{ entry.hourly_rate }}/hr</span>
              <span v-if="!entry.billable" class="not-billable-tag">Non-billable</span>
            </div>
          </div>
          <div class="entry-actions">
            <button @click="editEntry(entry)" class="btn-icon">
              <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button @click="deleteEntry(entry.id)" class="btn-icon btn-danger">
              <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimeTrackingStore } from '@/store/timeTrackingStore'
import { useAuthStore } from '@/store/authStore'
import { showToast } from '@/utils/toast'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  defaultHourlyRate: {
    type: Number,
    default: null
  }
})

const timeTrackingStore = useTimeTrackingStore()
const authStore = useAuthStore()

const quickTimerTitle = ref('')
const showManualEntry = ref(false)
const currentElapsed = ref(0)
let timerInterval = null

const manualEntry = ref({
  title: '',
  description: '',
  hours: '',
  hourlyRate: props.defaultHourlyRate,
  date: new Date().toISOString().split('T')[0],
  billable: true
})

const isRunning = computed(() => !!timeTrackingStore.activeTimer)

const recentEntries = computed(() => 
  timeTrackingStore.entriesByProject(props.projectId).slice(0, 5)
)

// Timer functionality
const startQuickTimer = () => {
  if (!quickTimerTitle.value.trim()) return
  
  timeTrackingStore.startTimer(
    props.projectId,
    quickTimerTitle.value.trim(),
    props.defaultHourlyRate
  )
  
  quickTimerTitle.value = ''
  startTimerInterval()
}

const stopTimer = () => {
  timeTrackingStore.stopTimer()
  stopTimerInterval()
  currentElapsed.value = 0
}

const stopAndSaveTimer = async () => {
  const timerData = timeTrackingStore.stopTimer()
  if (!timerData) return
  
  try {
    await timeTrackingStore.createTimeEntry({
      project_id: props.projectId,
      user_id: authStore.user.id,
      title: timerData.title,
      hours: timerData.hours,
      hourly_rate: timerData.hourlyRate,
      billable: true
    })
    
    showToast(`Saved ${timerData.hours}h for "${timerData.title}"`, 'success')
  } catch (error) {
    showToast('Failed to save time entry', 'error')
  }
  
  stopTimerInterval()
  currentElapsed.value = 0
}

const startTimerInterval = () => {
  timerInterval = setInterval(() => {
    timeTrackingStore.updateTimerElapsed()
    currentElapsed.value = timeTrackingStore.activeTimer?.elapsed || 0
  }, 1000)
}

const stopTimerInterval = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// Manual entry
const saveManualEntry = async () => {
  try {
    await timeTrackingStore.createTimeEntry({
      project_id: props.projectId,
      user_id: authStore.user.id,
      title: manualEntry.value.title,
      description: manualEntry.value.description,
      hours: parseFloat(manualEntry.value.hours),
      hourly_rate: manualEntry.value.hourlyRate ? parseFloat(manualEntry.value.hourlyRate) : null,
      date: manualEntry.value.date,
      billable: manualEntry.value.billable
    })
    
    showToast('Time entry saved', 'success')
    cancelManualEntry()
  } catch (error) {
    showToast('Failed to save time entry', 'error')
  }
}

const cancelManualEntry = () => {
  showManualEntry.value = false
  manualEntry.value = {
    title: '',
    description: '',
    hours: '',
    hourlyRate: props.defaultHourlyRate,
    date: new Date().toISOString().split('T')[0],
    billable: true
  }
}

const editEntry = (entry) => {
  // TODO: Implement edit functionality
  showToast('Edit functionality coming soon', 'info')
}

const deleteEntry = async (entryId) => {
  if (!confirm('Delete this time entry?')) return
  
  try {
    await timeTrackingStore.deleteTimeEntry(entryId)
    showToast('Time entry deleted', 'success')
  } catch (error) {
    showToast('Failed to delete time entry', 'error')
  }
}

// Utility functions
const formatElapsedTime = (elapsed) => {
  const hours = Math.floor(elapsed / (1000 * 60 * 60))
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  // Load recent entries
  timeTrackingStore.loadTimeEntries(props.projectId, 1, 10)
  
  // Resume timer if it was running
  if (isRunning.value) {
    startTimerInterval()
  }
})

onUnmounted(() => {
  stopTimerInterval()
})
</script>

<style scoped>
.time-tracker {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.timer-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.timer-display {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer-time {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 2rem;
  font-weight: 600;
  color: #1db954;
  min-width: 8rem;
}

.timer-pulse {
  width: 0.75rem;
  height: 0.75rem;
  background: #1db954;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.timer-start {
  display: flex;
  gap: 1rem;
  flex: 1;
  align-items: center;
}

.timer-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
}

.timer-input:focus {
  outline: none;
  border-color: #1db954;
}

.btn-timer-start {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-timer-start:hover:not(:disabled) {
  background: #1ed760;
  transform: translateY(-1px);
}

.btn-timer-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.timer-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.timer-title {
  font-weight: 600;
  color: white;
}

.timer-rate {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.timer-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-timer-stop {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-timer-discard {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.manual-entry {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 2rem;
  margin-bottom: 2rem;
}

.manual-entry h3 {
  margin-bottom: 1rem;
  color: white;
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
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

.form-input, .form-textarea {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #1db954;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.btn-primary, .btn-secondary, .btn-link {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1db954;
  color: white;
  border: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-link {
  background: none;
  color: #1db954;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}

.entry-toggle {
  text-align: center;
  padding: 1rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.recent-entries {
  margin-top: 2rem;
}

.recent-entries h3 {
  margin-bottom: 1rem;
  color: white;
  font-size: 1.125rem;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}

.entry-item.not-billable {
  opacity: 0.7;
  border-color: rgba(255, 193, 7, 0.2);
}

.entry-info {
  flex: 1;
}

.entry-title {
  font-weight: 500;
  color: white;
  margin-bottom: 0.25rem;
}

.entry-meta {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.not-billable-tag {
  color: #ffc107;
  font-weight: 500;
}

.entry-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-icon.btn-danger:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  border-color: rgba(244, 67, 54, 0.2);
}

.icon {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .timer-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .timer-start {
    flex-direction: column;
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .button-group {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
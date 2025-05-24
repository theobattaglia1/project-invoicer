<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- ───────────────── Header ───────────────── -->
      <div class="modal-header">
        <h2 class="modal-title">Add Content</h2>
        <button class="close-button" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12Z" />
          </svg>
        </button>
      </div>

      <!-- ───────────────── Tabs ───────────────── -->
      <div class="modal-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path :d="tab.icon" />
          </svg>
          {{ tab.label }}
        </button>
      </div>

      <!-- ───────────────── Content ───────────────── -->
      <div class="modal-content">
        <!-- Import Music -->
        <div v-if="activeTab === 'import'" class="tab-content">
          <div
            class="drop-zone"
            :class="{ dragover: isDragging }"
            @click="selectFiles">
            <svg viewBox="0 0 24 24" fill="currentColor" class="drop-icon">
              <path d="M9 16h6v-6h4l-7-7-7 7h4Zm-4 2h14v2H5Z" />
            </svg>
            <p class="drop-text">Click or drop music files</p>
            <p class="drop-subtext">MP3 · M4A · FLAC · WAV · OGG</p>
            <p class="drop-note">Drag files anywhere in the window</p>
          </div>

          <div v-if="selectedFiles.length" class="files-list">
            <div class="list-header">
              <h3 class="list-title">
                Selected ({{ selectedFiles.length }})
              </h3>
              <button class="clear-all-btn" @click="clearAllFiles">
                Clear All
              </button>
            </div>

            <div class="files-scroll">
              <div
                v-for="(file, i) in selectedFiles"
                :key="file.path"
                class="file-item">
                <svg viewBox="0 0 24 24" fill="currentColor" class="file-icon">
                  <path
                    d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6Z" />
                </svg>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button class="remove-file" @click="removeFile(i)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12Z" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="import-summary">
              <p>Ready to import {{ selectedFiles.length }} file<span
                  v-if="selectedFiles.length !== 1">s</span></p>
              <p class="summary-size">
                Total size: {{ formatFileSize(totalSize) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Add Artist -->
        <div v-else-if="activeTab === 'artist'" class="tab-content">
          <!-- (form unchanged) -->
          <form @submit.prevent="handleSubmit" class="form">
            <div class="form-group">
              <label class="form-label">Artist Name</label>
              <input
                v-model="artistForm.name"
                class="form-input"
                placeholder="Enter artist name"
                required />
            </div>
            <div class="form-group">
              <label class="form-label">Genre (optional)</label>
              <input
                v-model="artistForm.genre"
                class="form-input"
                placeholder="Indie, Rock…" />
            </div>
          </form>
        </div>

        <!-- Create Playlist -->
        <div v-else class="tab-content">
          <!-- (form unchanged) -->
          <form @submit.prevent="handleSubmit" class="form">
            <div class="form-group">
              <label class="form-label">Playlist Name</label>
              <input
                v-model="playlistForm.name"
                class="form-input"
                placeholder="Enter playlist name"
                required />
            </div>
            <div class="form-group">
              <label class="form-label">Description (optional)</label>
              <textarea
                v-model="playlistForm.description"
                class="form-textarea"
                rows="3"
                placeholder="Add a description…" />
            </div>
            <div class="form-group">
              <label class="form-label">Playlist Color</label>
              <div class="color-picker">
                <button
                  v-for="c in playlistColors"
                  :key="c"
                  type="button"
                  class="color-option"
                  :class="{ active: playlistForm.color === c }"
                  :style="{ background: c }"
                  @click="playlistForm.color = c" />
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- ───────────────── Footer ───────────────── -->
      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">Cancel</button>
        <button
          class="submit-button"
          :disabled="!canSubmit || isProcessing"
          @click="handleSubmit">
          <span v-if="isProcessing" class="loading-spinner" />
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { open } from '@tauri-apps/api/dialog'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'
import { useLibraryStore } from '../store/library'
import { useToastStore } from '../store/toast'

/* ─────────── Reactive state ─────────── */
const activeTab      = ref('import')
const isDragging     = ref(false)
const selectedFiles  = ref([])
const isProcessing   = ref(false)

const artistForm = ref({ name: '', genre: '' })
const playlistForm = ref({ name: '', description: '', color: '#FF6B6B' })

/* ─────────── Tabs config ─────────── */
const tabs = [
  { id: 'import',   label: 'Import Music',   icon: 'M9 16h6v-6h4l-7-7-7 7h4Zm-4 2h14v2H5Z' },
  { id: 'artist',   label: 'Add Artist',     icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 14.2A6.99 6.99 0 0 1 6 16c.03-2 4-3.08 6-3.08S17.97 14 18 16a6.99 6.99 0 0 1-6 3.2Z' },
  { id: 'playlist', label: 'Create Playlist', icon: 'M15 6H3v2h12V6Zm0 4H3v2h12v-2ZM3 16h8v-2H3v2Zm14-10v8.18c-.31-.11-.65-.18-1-.18a3 3 0 1 0 3 3V8h3V6h-5Z' }
]

/* ─────────── Pinia stores ─────────── */
const lib   = useLibraryStore()
const toast = useToastStore()

/* ─────────── Drag-and-drop listeners ─────────── */
let unlistenDrop
onMounted(async () => {
  unlistenDrop = await listen('tauri://file-drop', e => {
    if (activeTab.value === 'import') addPaths(e.payload)
  })
  await listen('tauri://file-drop-hover', () => (isDragging.value = true))
  await listen('tauri://file-drop-cancelled', () => (isDragging.value = false))
})
onUnmounted(() => unlistenDrop?.())

/* ─────────── Derived values ─────────── */
const canSubmit = computed(() => {
  if (activeTab.value === 'import')   return selectedFiles.value.length > 0
  if (activeTab.value === 'artist')   return artistForm.value.name.trim().length
  if (activeTab.value === 'playlist') return playlistForm.value.name.trim().length
  return false
})

const submitLabel = computed(() =>
  isProcessing.value
    ? 'Processing…'
    : activeTab.value === 'import'
      ? `Import ${selectedFiles.value.length}`
      : activeTab.value === 'artist'
        ? 'Add Artist'
        : 'Create Playlist'
)

const totalSize = computed(() =>
  selectedFiles.value.reduce((s, f) => s + f.size, 0)
)

/* ─────────── Helpers ─────────── */
function formatFileSize (b) {
  if (!b) return '0 B'
  const k = 1024, i = Math.floor(Math.log(b) / Math.log(k))
  return (b / k ** i).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB'][i]
}

function addPaths (paths) {
  const audioExt = ['mp3', 'm4a', 'flac', 'wav', 'ogg']
  const existing = new Set(selectedFiles.value.map(f => f.path))
  paths.forEach(p => {
    const ext = p.split('.').pop().toLowerCase()
    if (audioExt.includes(ext) && !existing.has(p)) {
      selectedFiles.value.push({ path: p, name: p.split(/[/\\]/).pop(), size: 0 })
    }
  })
  isDragging.value = false
}

/* ─────────── File dialogs ─────────── */
async function selectFiles () {
  const sel = await open({
    multiple: true,
    filters : [{ name: 'Audio', extensions: ['mp3','m4a','flac','wav','ogg'] }]
  })
  if (sel) addPaths(Array.isArray(sel) ? sel : [sel])
}

/* ─────────── Remove / clear UI helpers ─────────── */
const removeFile   = i => selectedFiles.value.splice(i, 1)
const clearAllFiles = () => (selectedFiles.value = [])

/* ─────────── Submit handler ─────────── */
async function handleSubmit () {
  if (!canSubmit.value || isProcessing.value) return
  isProcessing.value = true

  try {
    if (activeTab.value === 'import') {
      let imported = 0, skipped = 0
      for (const f of selectedFiles.value) {
        const hash = await invoke('hash_file', { path: f.path })
        if (lib.state.songs.some(s => s.hash === hash)) {
          skipped++
          continue
        }
        lib.state.songs.push({
          id   : crypto.randomUUID(),
          title: f.name.replace(/\.\w+$/, ''),
          path : f.path,
          hash,
          artistId   : null,
          playlistIds: []
        })
        imported++
      }
      toast.push(`Imported ${imported} · Skipped ${skipped} duplicate${skipped!==1?'s':''}`)
      selectedFiles.value = []
    }

    // (Artist & Playlist flow placeholders — implement later)
    if (activeTab.value === 'artist') toast.push('Artist saved (stub)')
    if (activeTab.value === 'playlist') toast.push('Playlist saved (stub)')
  } catch (e) {
    console.error(e)
    toast.push('Something went wrong', 'error')
  } finally { isProcessing.value = false }
}

/* ─────────── Expose to template ─────────── */
defineExpose({
  selectFiles, removeFile, clearAllFiles, handleSubmit,
  activeTab, isDragging, selectedFiles,
  artistForm, playlistForm, playlistColors: ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD'],
  canSubmit, submitLabel, totalSize, isProcessing, tabs, formatFileSize
})
</script>

<!-- Styles: (unchanged from your original) -->
<style scoped>
/* … keep all your existing CSS here … */
</style>

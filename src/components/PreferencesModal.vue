<!-- src/components/PreferencesModal.vue -->
<template>
  <!-- Teleport the modal into <body> so it sits above everything -->
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-overlay"
      @click="close"
    >
      <div
        class="modal-content"
        @click.stop
        ref="modalContent"
      >
        <h3>Global Preferences</h3>

        <!-- Section: Header Font -->
        <section class="prefs-section">
          <h4>Header Font</h4>
          <div class="field">
            <label>Family:</label>
            <select v-model="local.headerFont.family">
              <option v-for="f in allFontFamilies" :key="f" :value="f">
                {{ f }}
              </option>
              <optgroup label="Custom Uploaded">
                <option
                  v-for="cf in globalPrefs.customFonts"
                  :key="cf.name"
                  :value="cf.name"
                >
                  {{ cf.name }}
                </option>
              </optgroup>
            </select>
          </div>
          <div class="field">
            <label>Size:</label>
            <input
              type="text"
              v-model="local.headerFont.size"
              placeholder="e.g. 24px or 2rem"
            />
          </div>
          <div class="field">
            <label>Weight:</label>
            <input
              type="text"
              v-model="local.headerFont.weight"
              placeholder="e.g. 600 or bold"
            />
          </div>
          <div class="field">
            <label>Line-height:</label>
            <input
              type="text"
              v-model="local.headerFont.lineHeight"
              placeholder="e.g. 1.2"
            />
          </div>
        </section>

        <!-- Section: Body Font -->
        <section class="prefs-section">
          <h4>Body Font</h4>
          <div class="field">
            <label>Family:</label>
            <select v-model="local.bodyFont.family">
              <option v-for="f in allFontFamilies" :key="f" :value="f">
                {{ f }}
              </option>
              <optgroup label="Custom Uploaded">
                <option
                  v-for="cf in globalPrefs.customFonts"
                  :key="cf.name"
                  :value="cf.name"
                >
                  {{ cf.name }}
                </option>
              </optgroup>
            </select>
          </div>
          <div class="field">
            <label>Size:</label>
            <input
              type="text"
              v-model="local.bodyFont.size"
              placeholder="e.g. 16px or 1rem"
            />
          </div>
          <div class="field">
            <label>Weight:</label>
            <input
              type="text"
              v-model="local.bodyFont.weight"
              placeholder="e.g. 400 or normal"
            />
          </div>
          <div class="field">
            <label>Line-height:</label>
            <input
              type="text"
              v-model="local.bodyFont.lineHeight"
              placeholder="e.g. 1.5"
            />
          </div>
        </section>

        <!-- Section: Colors & Toggles -->
        <section class="prefs-section">
          <h4>Colors &amp; Toggles</h4>
          <div class="field">
            <label>Background Color:</label>
            <input type="color" v-model="local.bgColor" />
          </div>
          <div class="field">
            <label>Accent Color:</label>
            <input type="color" v-model="local.accentColor" />
          </div>
          <div class="field">
            <label>
              <input type="checkbox" v-model="local.hideImages" />
              Hide Images
            </label>
          </div>
          <div class="field">
            <label>
              <input type="checkbox" v-model="local.compactMode" />
              Compact Mode (tighter spacing)
            </label>
          </div>
        </section>

        <!-- Section: Upload Your Own Font -->
        <section class="prefs-section">
          <h4>Upload Custom Font</h4>
          <div class="field">
            <input
              type="file"
              accept=".ttf,.woff,.woff2,.otf"
              @change="onFontFileChange"
            />
          </div>
          <p v-if="fontUploadError" class="error">{{ fontUploadError }}</p>
        </section>

        <!-- ACTION BUTTONS -->
        <div class="actions">
          <button
            type="button"
            class="save-button"
            @click="save"
          >
            Save
          </button>
          <button
            type="button"
            class="reset-button"
            @click="resetToDefaults"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            class="cancel-button"
            @click="close"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, inject, watch, computed, onMounted, onBeforeUnmount } from 'vue'

// Only need a single “visible” prop now:
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})
const emit = defineEmits(['update:visible'])

// Inject the global preferences API:
const {
  preferences,
  setGlobalPreferences,
  addCustomFont
} = inject('preferencesApi')

// Access the “global” preferences object directly:
const globalPrefs = computed(() => preferences.value.global)

// Create a local copy of globalPrefs for two‐way editing:
const local = reactive({
  headerFont:   { ...globalPrefs.value.headerFont },
  bodyFont:     { ...globalPrefs.value.bodyFont },
  hideImages:   globalPrefs.value.hideImages,
  bgColor:      globalPrefs.value.bgColor,
  accentColor:  globalPrefs.value.accentColor,
  compactMode:  globalPrefs.value.compactMode
})

// Any error message during font upload:
const fontUploadError = ref('')

// Common web‐safe font families:
const commonFamilies = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Lucida Console, monospace'
]
const allFontFamilies = computed(() => {
  // Append any previously uploaded custom‐font names:
  const customNames = (globalPrefs.value.customFonts || []).map(cf => cf.name)
  return commonFamilies.concat(customNames)
})

// Keep “local” in sync if globalPrefs ever change externally:
watch(
  globalPrefs,
  (newVal) => {
    local.headerFont   = { ...newVal.headerFont }
    local.bodyFont     = { ...newVal.bodyFont }
    local.hideImages   = newVal.hideImages
    local.bgColor      = newVal.bgColor
    local.accentColor  = newVal.accentColor
    local.compactMode  = newVal.compactMode
  }
)

// Save: write local → global preferences, then close:
function save() {
  setGlobalPreferences({
    headerFont:   { ...local.headerFont },
    bodyFont:     { ...local.bodyFont },
    hideImages:   local.hideImages,
    bgColor:      local.bgColor,
    accentColor:  local.accentColor,
    compactMode:  local.compactMode
  })
  close()
}

// Reset back to the original built-in defaults:
function resetToDefaults() {
  const d = preferences.value.defaults
  setGlobalPreferences({
    headerFont:   { ...d.headerFont },
    bodyFont:     { ...d.bodyFont },
    hideImages:   d.hideImages,
    bgColor:      d.bgColor,
    accentColor:  d.accentColor,
    compactMode:  d.compactMode
  })
  close()
}

function close() {
  emit('update:visible', false)
}

// ─── UPLOAD FONT FILE HANDLING ────────────────────────────────────────────────
async function onFontFileChange(e) {
  fontUploadError.value = ''

  const file = e.target.files[0]
  if (!file) {
    fontUploadError.value = 'Font upload canceled.'
    return
  }

  // Only allow TTF / OTF / WOFF / WOFF2:
  const ext = file.name.split('.').pop().toLowerCase()
  const valid = ['ttf', 'otf', 'woff', 'woff2']
  if (!valid.includes(ext)) {
    fontUploadError.value = 'Unsupported font format. Must be TTF/OTF/WOFF/WOFF2.'
    e.target.value = ''
    return
  }

  // Automatically use the filename (without extension) as fontFamily:
  let fontName = file.name.replace(/\.[^/.]+$/, '').trim()

  // Read it as ArrayBuffer → base64 dataURL:
  const reader = new FileReader()
  reader.onload = () => {
    const arrayBuffer = reader.result
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    let mimeType = ''
    if (ext === 'ttf')   mimeType = 'font/ttf'
    else if (ext === 'otf') mimeType = 'font/otf'
    else if (ext === 'woff') mimeType = 'font/woff'
    else if (ext === 'woff2') mimeType = 'font/woff2'

    const dataUrl = `data:${mimeType};base64,${base64}`

    // Register an @font-face rule in a new <style>:
    const style = document.createElement('style')
    style.innerText = `
      @font-face {
        font-family: '${fontName}';
        src: url('${dataUrl}') format('${ext}');
        font-weight: normal;
        font-style: normal;
      }
    `
    document.head.appendChild(style)

    // Store this custom font into globalPrefs.customFonts:
    addCustomFont({ name: fontName, dataUrl, format: ext })
    e.target.value = '' // Clear the <input> so you can re-upload if needed
  }
  reader.onerror = () => {
    fontUploadError.value = 'Error reading font file.'
    e.target.value = ''
  }

  reader.readAsArrayBuffer(file)
}

// ─── CLOSE ON ESCAPE KEY ─────────────────────────────────────────────────────
function onKeydown(e) {
  if (e.key === 'Escape') {
    close()
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #282828;
  padding: 24px;
  border-radius: 8px;
  width: 360px;
  max-height: 90vh;
  overflow-y: auto;
  color: #fff;
}
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 20px;
  text-align: center;
}
.prefs-section {
  margin-bottom: 20px;
}
.prefs-section h4 {
  margin-bottom: 8px;
  font-size: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}
.field {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.field label {
  flex: 0 0 110px;
  font-size: 14px;
}
.field input[type="text"],
.field input[type="color"],
.field select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
  background: #333;
  color: #fff;
}
.field input[type="checkbox"] {
  transform: scale(1.1);
}
.error {
  color: #f55;
  font-size: 13px;
  margin-top: -8px;
  margin-bottom: 8px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: filter 0.1s ease;
}
.actions button:hover {
  filter: brightness(1.2);
}
/* “Save” button (green) */
.save-button {
  background-color: #1db954;
  color: #fff;
}
/* “Reset to Defaults” button (grey) */
.reset-button {
  background-color: #444;
  color: #fff;
}
/* “Cancel” button (darker grey) */
.cancel-button {
  background-color: #666;
  color: #fff;
}
</style>

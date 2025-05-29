<template>
    <Teleport to="body">
      <div v-if="isVisible" class="modal-overlay" @click.self="close">
        <div class="modal-container" @click.stop>
          <!-- Header -->
          <header class="modal-header">
            <h2 class="modal-title">
              <template v-if="mode === 'create'">
                <span v-if="activeTab === 'import'">Import Music</span>
                <span v-else-if="activeTab === 'artist'">Add Artist</span>
                <span v-else-if="activeTab === 'playlist'">Create Playlist</span>
              </template>
              <template v-else>
                Edit {{ typeLabel }}
                <span v-if="items.length > 1">({{ items.length }})</span>
              </template>
            </h2>
            <button class="close-button" @click="close">×</button>
          </header>
  
          <!-- Tabs (only in create mode) -->
          <div v-if="mode === 'create'" class="modal-tabs">
            <button
              class="tab-button"
              :class="{ active: activeTab === 'import' }"
              @click="activeTab = 'import'"
            >
              Import Music
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'artist' }"
              @click="activeTab = 'artist'"
            >
              Add Artist
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'playlist' }"
              @click="activeTab = 'playlist'"
            >
              Create Playlist
            </button>
          </div>
  
          <!-- Content -->
          <div class="modal-content">
            <!-- CREATE MODE -->
            <div v-if="mode === 'create'">
              <!-- Import Tab -->
              <div v-if="activeTab === 'import'" class="import-content">
                <div class="drop-zone" @click="selectFiles">
                  <p>Click to select music files</p>
                  <p>MP3 · M4A · FLAC · WAV · OGG</p>
                </div>
                <div v-if="selectedFiles.length" class="files-list">
                  <h3>Selected Files ({{ selectedFiles.length }})</h3>
                  <div v-for="(file, i) in selectedFiles" :key="i" class="file-item">
                    {{ file.name }}
                    <button @click="selectedFiles.splice(i, 1)">×</button>
                  </div>
                </div>
              </div>
  
              <!-- Artist Tab -->
              <form v-else-if="activeTab === 'artist'" @submit.prevent="handleSubmit">
                <div class="form-group">
                  <label>Artist Name</label>
                  <input v-model="formData.name" required />
                </div>
                <div class="form-group">
                  <label>Genre (optional)</label>
                  <input v-model="formData.genre" />
                </div>
                <div class="form-group">
                  <label>Artist Image</label>
                  <div class="image-upload-section">
                    <div 
                      class="image-upload-area"
                      :class="{ 'has-image': currentImageUrl || formData.imagePreview, 'drag-over': isDragging }"
                      @click="selectImage"
                      @dragenter.prevent="isDragging = true"
                      @dragover.prevent
                      @dragleave.prevent="isDragging = false"
                      @drop.prevent="handleImageDrop"
                    >
                      <img 
                        v-if="currentImageUrl || formData.imagePreview" 
                        :src="formData.imagePreview || currentImageUrl" 
                        alt="Artist" 
                        class="image-preview"
                      />
                      <div v-else class="upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                        </svg>
                        <span>Click or drag image here</span>
                      </div>
                      <div v-if="currentImageUrl || formData.imagePreview" class="upload-overlay">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                        </svg>
                        <span>Change Image</span>
                      </div>
                    </div>
                    <div v-if="currentImageUrl || formData.imagePreview" class="image-actions">
                      <span class="image-info">150x150px</span>
                      <button type="button" class="remove-image-btn" @click.stop="removeImage">
                        Remove Image
                      </button>
                    </div>
                  </div>
                </div>
              </form>
  
              <!-- Playlist Tab -->
              <form v-else-if="activeTab === 'playlist'" @submit.prevent="handleSubmit">
                <div class="form-group">
                  <label>Playlist Name</label>
                  <input v-model="formData.name" required />
                </div>
                <div class="form-group">
                  <label>Description (optional)</label>
                  <textarea v-model="formData.description" rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label>Artist (optional)</label>
                  <select v-model="formData.artistId">
                    <option :value="null">No Artist (General Playlist)</option>
                    <option v-for="artist in artists" :key="artist.id" :value="artist.id">
                      {{ artist.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Cover Art</label>
                  <div class="image-upload-section">
                    <div 
                      class="image-upload-area"
                      :class="{ 'has-image': currentImageUrl || formData.imagePreview, 'drag-over': isDragging }"
                      @click="selectImage"
                      @dragenter.prevent="isDragging = true"
                      @dragover.prevent
                      @dragleave.prevent="isDragging = false"
                      @drop.prevent="handleImageDrop"
                    >
                      <img 
                        v-if="currentImageUrl || formData.imagePreview" 
                        :src="formData.imagePreview || currentImageUrl" 
                        alt="Playlist cover" 
                        class="image-preview"
                      />
                      <div v-else class="upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                        </svg>
                        <span>Click or drag image here</span>
                      </div>
                      <div v-if="currentImageUrl || formData.imagePreview" class="upload-overlay">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                        </svg>
                        <span>Change Cover</span>
                      </div>
                    </div>
                    <div v-if="currentImageUrl || formData.imagePreview" class="image-actions">
                      <span class="image-info">150x150px</span>
                      <button type="button" class="remove-image-btn" @click.stop="removeImage">
                        Remove Image
                      </button>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label>Color</label>
                  <div class="color-picker">
                    <button
                      v-for="color in colors"
                      :key="color"
                      type="button"
                      class="color-option"
                      :class="{ active: formData.color === color }"
                      :style="{ background: color }"
                      @click="formData.color = color"
                    />
                  </div>
                </div>
              </form>
            </div>
  
            <!-- EDIT MODE -->
            <div v-else class="edit-content">
              <form @submit.prevent="handleSubmit">
                <div class="form-group">
                  <label>Name</label>
                  <input v-model="formData.name" required />
                </div>
  
                <!-- Song fields -->
                <template v-if="type === 'song'">
                  <div class="form-group">
                    <label>Artist</label>
                    <input v-model="formData.artist" />
                  </div>
                  <div class="form-group">
                    <label>Album</label>
                    <input v-model="formData.album" />
                  </div>
                  <div class="form-group">
                    <label>Genre</label>
                    <input v-model="formData.genre" />
                  </div>
                  <div class="form-group">
                    <label>Year</label>
                    <input v-model="formData.year" type="number" />
                  </div>
                  <div class="form-group">
                    <label>Album Artwork</label>
                    <div class="image-upload-section">
                      <div 
                        class="image-upload-area"
                        :class="{ 'has-image': currentImageUrl || formData.imagePreview, 'drag-over': isDragging }"
                        @click="selectImage"
                        @dragenter.prevent="isDragging = true"
                        @dragover.prevent
                        @dragleave.prevent="isDragging = false"
                        @drop.prevent="handleImageDrop"
                      >
                        <img 
                          v-if="currentImageUrl || formData.imagePreview" 
                          :src="formData.imagePreview || currentImageUrl" 
                          alt="Album artwork" 
                          class="image-preview"
                        />
                        <div v-else class="upload-placeholder">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                          </svg>
                          <span>Click or drag image here</span>
                        </div>
                        <div v-if="currentImageUrl || formData.imagePreview" class="upload-overlay">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                          </svg>
                          <span>Change Artwork</span>
                        </div>
                      </div>
                      <div v-if="currentImageUrl || formData.imagePreview" class="image-actions">
                        <span class="image-info">150x150px</span>
                        <button type="button" class="remove-image-btn" @click.stop="removeImage">
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
  
                <!-- Playlist fields -->
                <template v-if="type === 'playlist'">
                  <div class="form-group">
                    <label>Description</label>
                    <textarea v-model="formData.description" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Artist</label>
                    <select v-model="formData.artistId">
                      <option :value="null">No Artist (General Playlist)</option>
                      <option v-for="artist in artists" :key="artist.id" :value="artist.id">
                        {{ artist.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Cover Art</label>
                    <div class="image-upload-section">
                      <div 
                        class="image-upload-area"
                        :class="{ 'has-image': currentImageUrl || formData.imagePreview, 'drag-over': isDragging }"
                        @click="selectImage"
                        @dragenter.prevent="isDragging = true"
                        @dragover.prevent
                        @dragleave.prevent="isDragging = false"
                        @drop.prevent="handleImageDrop"
                      >
                        <img 
                          v-if="currentImageUrl || formData.imagePreview" 
                          :src="formData.imagePreview || currentImageUrl" 
                          alt="Playlist cover" 
                          class="image-preview"
                        />
                        <div v-else class="upload-placeholder">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                          </svg>
                          <span>Click or drag image here</span>
                        </div>
                        <div v-if="currentImageUrl || formData.imagePreview" class="upload-overlay">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                          </svg>
                          <span>Change Cover</span>
                        </div>
                      </div>
                      <div v-if="currentImageUrl || formData.imagePreview" class="image-actions">
                        <span class="image-info">150x150px</span>
                        <button type="button" class="remove-image-btn" @click.stop="removeImage">
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Color</label>
                    <div class="color-picker">
                      <button
                        v-for="color in colors"
                        :key="color"
                        type="button"
                        class="color-option"
                        :class="{ active: formData.color === color }"
                        :style="{ background: color }"
                        @click="formData.color = color"
                      />
                    </div>
                  </div>
                </template>
  
                <!-- Artist fields -->
                <template v-if="type === 'artist'">
                  <div class="form-group">
                    <label>Genre</label>
                    <input v-model="formData.genre" />
                  </div>
                  <div class="form-group">
                    <label>Biography</label>
                    <textarea v-model="formData.bio" rows="4"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Artist Image</label>
                    <div class="image-upload-section">
                      <div 
                        class="image-upload-area"
                        :class="{ 'has-image': currentImageUrl || formData.imagePreview, 'drag-over': isDragging }"
                        @click="selectImage"
                        @dragenter.prevent="isDragging = true"
                        @dragover.prevent
                        @dragleave.prevent="isDragging = false"
                        @drop.prevent="handleImageDrop"
                      >
                        <img 
                          v-if="currentImageUrl || formData.imagePreview" 
                          :src="formData.imagePreview || currentImageUrl" 
                          alt="Artist" 
                          class="image-preview"
                        />
                        <div v-else class="upload-placeholder">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                          </svg>
                          <span>Click or drag image here</span>
                        </div>
                        <div v-if="currentImageUrl || formData.imagePreview" class="upload-overlay">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                          </svg>
                          <span>Change Image</span>
                        </div>
                      </div>
                      <div v-if="currentImageUrl || formData.imagePreview" class="image-actions">
                        <span class="image-info">150x150px</span>
                        <button type="button" class="remove-image-btn" @click.stop="removeImage">
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </form>
            </div>
          </div>
  
          <!-- Footer -->
          <footer class="modal-footer">
            <button class="cancel-button" @click="close">Cancel</button>
            <button
              class="submit-button"
              :disabled="!canSubmit || isProcessing"
              @click="handleSubmit"
            >
              <span v-if="isProcessing">Processing...</span>
              <span v-else>{{ submitLabel }}</span>
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </template>
  
  <script setup>
  import { ref, reactive, computed, watch } from 'vue'
  import { open } from '@tauri-apps/api/dialog'
  import { readBinaryFile } from '@tauri-apps/api/fs'
  import { invoke } from '@tauri-apps/api/tauri'
  import { convertFileSrc } from '@tauri-apps/api/tauri'
  import { useMusicStore } from '@/store/music'
  
  // State
  const isVisible = ref(false)
  const isProcessing = ref(false)
  const mode = ref('create')
  const type = ref('song')
  const items = ref([])
  const defaults = ref(null)
  const activeTab = ref('import')
  const selectedFiles = ref([])
  const currentImageUrl = ref(null)
  const selectedImageFile = ref(null)
  const isDragging = ref(false)
  
  // Get artists from store
  const musicStore = useMusicStore()
  const artists = computed(() => musicStore.artists || [])
  
  // Form data
  const formData = reactive({
    name: '',
    artist: '',
    album: '',
    genre: '',
    year: '',
    description: '',
    bio: '',
    artistId: null,
    color: '#FF6B6B',
    imagePreview: null,
    imageData: null,
    imageExtension: null
  })
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD']
  
  // Computed
  const typeLabel = computed(() => ({
    song: 'Song',
    playlist: 'Playlist',
    artist: 'Artist'
  }[type.value] || 'Item'))
  
  const canSubmit = computed(() => {
    if (mode.value === 'create') {
      if (activeTab.value === 'import') return selectedFiles.value.length > 0
      return formData.name.trim().length > 0
    }
    return formData.name.trim().length > 0
  })
  
  const submitLabel = computed(() => {
    if (mode.value === 'create') {
      if (activeTab.value === 'import') return `Import ${selectedFiles.value.length} Files`
      if (activeTab.value === 'artist') return 'Add Artist'
      if (activeTab.value === 'playlist') return 'Create Playlist'
    }
    return 'Save Changes'
  })
  
  // Methods
  function resetForm() {
    formData.name = ''
    formData.artist = ''
    formData.album = ''
    formData.genre = ''
    formData.year = ''
    formData.description = ''
    formData.bio = ''
    formData.artistId = null
    formData.color = '#FF6B6B'
    formData.imagePreview = null
    formData.imageData = null
    formData.imageExtension = null
    selectedFiles.value = []
    currentImageUrl.value = null
    selectedImageFile.value = null
  }
  
  function show(options = {}) {
    console.log('🎯 [UnifiedModal] show called with:', JSON.stringify(options, null, 2))
    
    resetForm()
    
    mode.value = options.mode || 'create'
    type.value = options.type || 'song'
    items.value = options.items || []
    defaults.value = options.defaults || null
    
    // Set tab for create mode
    if (mode.value === 'create') {
      activeTab.value = options.tab || options.type || 'import'
    }
    
    // Apply defaults for create mode
    if (mode.value === 'create' && defaults.value) {
      console.log('🎨 [UnifiedModal] Applying defaults:', defaults.value)
      if (defaults.value.artistId) {
        formData.artistId = defaults.value.artistId
        console.log('🎨 [UnifiedModal] Set artistId:', formData.artistId)
      }
    }
    
    // Populate form for edit mode
    if (mode.value === 'edit' && items.value.length > 0) {
      const item = items.value[0]
      formData.name = item.name || ''
      formData.artist = item.artist || ''
      formData.album = item.album || ''
      formData.genre = item.genre || ''
      formData.year = item.year || ''
      formData.description = item.description || ''
      formData.bio = item.bio || ''
      formData.artistId = item.artist_id || null
      formData.color = item.color || '#FF6B6B'
      
      // Set current image URL
      if (item.artwork_path || item.image_path) {
        currentImageUrl.value = convertFileSrc(item.artwork_path || item.image_path)
      }
    }
    
    isVisible.value = true
  }
  
  function close() {
    isVisible.value = false
    isProcessing.value = false
  }
  
  async function selectFiles() {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Audio', extensions: ['mp3', 'm4a', 'flac', 'wav', 'ogg'] }]
    })
    
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected]
      selectedFiles.value = paths.map(path => ({
        path,
        name: path.split(/[/\\]/).pop()
      }))
    }
  }
  
  async function selectImage() {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
        }]
      })
      
      if (selected) {
        selectedImageFile.value = selected
        const imageData = await readBinaryFile(selected)
        const extension = selected.split('.').pop().toLowerCase()
        
        // Store image data for upload
        formData.imageData = Array.from(imageData)
        formData.imageExtension = extension
        
        // Create preview
        const blob = new Blob([imageData], { type: `image/${extension}` })
        formData.imagePreview = URL.createObjectURL(blob)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
    }
  }
  
  async function handleImageDrop(e) {
    isDragging.value = false
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        try {
          // Read the file
          const reader = new FileReader()
          reader.onload = async (event) => {
            // Store image data
            const arrayBuffer = event.target.result
            const uint8Array = new Uint8Array(arrayBuffer)
            formData.imageData = Array.from(uint8Array)
            
            // Get extension
            const extension = file.name.split('.').pop().toLowerCase()
            formData.imageExtension = extension
            
            // Create preview
            const blob = new Blob([arrayBuffer], { type: file.type })
            formData.imagePreview = URL.createObjectURL(blob)
          }
          reader.readAsArrayBuffer(file)
        } catch (error) {
          console.error('Error processing dropped image:', error)
        }
      }
    }
  }
  
  function removeImage() {
    formData.imagePreview = null
    formData.imageData = null
    formData.imageExtension = null
    selectedImageFile.value = null
    currentImageUrl.value = null
  }
  
  // Emit
  const emit = defineEmits(['add', 'update'])
  
  async function handleSubmit() {
    if (!canSubmit.value || isProcessing.value) return
    
    isProcessing.value = true
    console.log('🚀 [UnifiedModal] handleSubmit called')
    console.log('🚀 [UnifiedModal] Current formData:', JSON.stringify(formData, null, 2))
    console.log('🚀 [UnifiedModal] Mode:', mode.value)
    console.log('🚀 [UnifiedModal] Type:', type.value)
    
    try {
      if (mode.value === 'create') {
        // CREATE MODE
        const data = {
          type: activeTab.value,
          data: null
        }
        
        if (activeTab.value === 'import') {
          data.data = { files: selectedFiles.value }
        } else if (activeTab.value === 'artist') {
          data.data = {
            name: formData.name,
            genre: formData.genre || null
          }
        } else if (activeTab.value === 'playlist') {
          console.log('🎯 [UnifiedModal] Creating playlist with artistId:', formData.artistId)
          data.data = {
            name: formData.name,
            description: formData.description || null,
            color: formData.color,
            artistId: formData.artistId
          }
        }
        
        emit('add', data)
        close()
      } else {
        // EDIT MODE - Actually implement the update logic
        for (const item of items.value) {
          try {
            if (type.value === 'song') {
              await invoke('update_song', {
                payload: {
                  id: item.id,
                  name: formData.name,
                  artist: formData.artist,
                  album: formData.album,
                  genre: formData.genre || '',
                  year: formData.year ? formData.year.toString() : '',
                  artwork: null // Handle artwork separately
                }
              })
              
              // Upload artwork if changed
              if (formData.imageData && formData.imageExtension) {
                await invoke('save_song_artwork', {
                  songId: item.id,
                  imageData: formData.imageData,
                  extension: formData.imageExtension
                })
              }
            } else if (type.value === 'playlist') {
              console.log('🎯 [UnifiedModal] Updating playlist:', {
                id: item.id,
                name: formData.name,
                artistId: formData.artistId
              })
              
              await invoke('update_playlist', {
                playlistId: item.id,
                name: formData.name,
                description: formData.description || null,
                color: formData.color || null,
                artistId: formData.artistId
              })
              
              // Upload artwork if changed
              if (formData.imageData && formData.imageExtension) {
                await invoke('save_playlist_artwork', {
                  playlistId: item.id,
                  imageData: formData.imageData,
                  extension: formData.imageExtension
                })
              }
            } else if (type.value === 'artist') {
              await invoke('update_artist', {
                artistId: item.id,
                name: formData.name,
                genre: formData.genre || null,
                bio: formData.bio || null
              })
              
              // Upload image if changed
              if (formData.imageData && formData.imageExtension) {
                await invoke('save_artist_image', {
                  artistId: item.id,
                  imageData: formData.imageData,
                  extension: formData.imageExtension
                })
              }
            }
          } catch (error) {
            console.error('Failed to update item:', error)
            alert(`Failed to update: ${error}`)
            isProcessing.value = false
            return
          }
        }
        
        // Emit update event and refresh library
        emit('update')
        window.dispatchEvent(new CustomEvent('library-updated'))
        close()
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert(`Error: ${error}`)
    } finally {
      isProcessing.value = false
    }
  }
  
  // Expose
  defineExpose({ show, close })
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-container {
    background: rgba(20, 20, 23, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 90vw;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0;
  }
  
  .close-button {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .modal-tabs {
    display: flex;
    gap: 4px;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .tab-button {
    flex: 1;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid transparent;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .tab-button:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .tab-button.active {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
  }
  
  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  /* Image Upload Section */
  .image-upload-section {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .image-upload-area {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    border: 2px dashed rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .image-upload-area:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.08);
  }
  
  .image-upload-area.drag-over {
    border-color: #4ECDC4;
    background: rgba(78, 205, 196, 0.1);
  }
  
  .image-upload-area.has-image {
    border-style: solid;
  }
  
  .image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .upload-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.5);
    padding: 16px;
    text-align: center;
  }
  
  .upload-placeholder svg {
    width: 32px;
    height: 32px;
  }
  
  .upload-placeholder span {
    font-size: 12px;
    line-height: 1.4;
  }
  
  .image-upload-area:hover .upload-placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .upload-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .image-upload-area.has-image:hover .upload-overlay {
    opacity: 1;
  }
  
  .upload-overlay svg {
    width: 32px;
    height: 32px;
    color: white;
  }
  
  .upload-overlay span {
    font-size: 12px;
    color: white;
  }
  
  .image-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .image-info {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .remove-image-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .remove-image-btn:hover {
    background: rgba(255, 85, 85, 0.1);
    border-color: rgba(255, 85, 85, 0.3);
    color: #ff5555;
  }
  
  .drop-zone {
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 60px 40px;
    text-align: center;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.02);
  }
  
  .drop-zone:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.04);
  }
  
  .files-list {
    margin-top: 24px;
  }
  
  .files-list h3 {
    font-size: 16px;
    margin-bottom: 16px;
  }
  
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .file-item button {
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
  }
  
  .file-item button:hover {
    background: rgba(255, 107, 107, 0.2);
    color: #FF6B6B;
  }
  
  .color-picker {
    display: flex;
    gap: 12px;
  }
  
  .color-option {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .color-option:hover {
    transform: scale(1.1);
  }
  
  .color-option.active {
    border-color: #fff;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .cancel-button,
  .submit-button {
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cancel-button {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .cancel-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .submit-button {
    background: #4ECDC4;
    color: #000;
  }
  
  .submit-button:hover:not(:disabled) {
    background: #5dd5cd;
  }
  
  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  </style>
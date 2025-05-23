<template>
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">Add Content</h2>
          <button class="close-button" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
  
        <div class="modal-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab-button"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="tab.icon"/>
            </svg>
            {{ tab.label }}
          </button>
        </div>
  
        <div class="modal-content">
          <!-- Import Music Tab -->
          <div v-if="activeTab === 'import'" class="tab-content">
            <div 
              class="drop-zone"
              :class="{ dragover: isDragging }"
              @drop.prevent="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="drop-icon">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
              </svg>
              <p class="drop-text">Drop music files here</p>
              <p class="drop-subtext">or</p>
              <button class="browse-button" @click="$refs.fileInput.click()">
                Browse Files
              </button>
              <input 
                ref="fileInput"
                type="file" 
                multiple 
                accept="audio/*"
                @change="handleFileSelect"
                style="display: none"
              >
            </div>
            
            <div v-if="selectedFiles.length > 0" class="files-list">
              <h3 class="list-title">Selected Files</h3>
              <div 
                v-for="(file, index) in selectedFiles" 
                :key="index"
                class="file-item"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="file-icon">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <span class="file-name">{{ file.name }}</span>
                <button class="remove-file" @click="removeFile(index)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
  
          <!-- Add Artist Tab -->
          <div v-if="activeTab === 'artist'" class="tab-content">
            <form @submit.prevent="addArtist" class="form">
              <div class="form-group">
                <label class="form-label">Artist Name</label>
                <input 
                  v-model="artistForm.name"
                  type="text" 
                  class="form-input"
                  placeholder="Enter artist name"
                  required
                >
              </div>
              
              <div class="form-group">
                <label class="form-label">Artist Image</label>
                <div class="image-upload">
                  <div class="image-preview" :class="{ 'has-image': artistForm.imagePreview }">
                    <img v-if="artistForm.imagePreview" :src="artistForm.imagePreview" alt="Preview">
                    <svg v-else viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <button type="button" class="upload-button" @click="$refs.artistImageInput.click()">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    Choose Image
                  </button>
                  <input 
                    ref="artistImageInput"
                    type="file" 
                    accept="image/*"
                    @change="handleArtistImage"
                    style="display: none"
                  >
                </div>
              </div>
            </form>
          </div>
  
          <!-- Create Playlist Tab -->
          <div v-if="activeTab === 'playlist'" class="tab-content">
            <form @submit.prevent="createPlaylist" class="form">
              <div class="form-group">
                <label class="form-label">Playlist Name</label>
                <input 
                  v-model="playlistForm.name"
                  type="text" 
                  class="form-input"
                  placeholder="Enter playlist name"
                  required
                >
              </div>
              
              <div class="form-group">
                <label class="form-label">Description (optional)</label>
                <textarea 
                  v-model="playlistForm.description"
                  class="form-textarea"
                  placeholder="Add a description..."
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Type</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input 
                      type="radio" 
                      v-model="playlistForm.type" 
                      value="general"
                      class="radio-input"
                    >
                    <span class="radio-text">General Playlist</span>
                  </label>
                  <label class="radio-label">
                    <input 
                      type="radio" 
                      v-model="playlistForm.type" 
                      value="artist"
                      class="radio-input"
                    >
                    <span class="radio-text">Artist Playlist</span>
                  </label>
                </div>
              </div>
              
              <div v-if="playlistForm.type === 'artist'" class="form-group">
                <label class="form-label">Select Artist</label>
                <select v-model="playlistForm.artistId" class="form-select" required>
                  <option value="">Choose an artist</option>
                  <option value="1">Glass Animals</option>
                  <option value="2">Tame Impala</option>
                </select>
              </div>
            </form>
          </div>
        </div>
  
        <div class="modal-footer">
          <button class="cancel-button" @click="$emit('close')">Cancel</button>
          <button class="submit-button" @click="handleSubmit" :disabled="!canSubmit">
            {{ submitButtonText }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue'
  
  export default {
    name: 'AddContentModal',
    emits: ['close', 'add'],
    setup(props, { emit }) {
      const activeTab = ref('import')
      const isDragging = ref(false)
      const selectedFiles = ref([])
      
      const tabs = [
        { id: 'import', label: 'Import Music', icon: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z' },
        { id: 'artist', label: 'Add Artist', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' },
        { id: 'playlist', label: 'Create Playlist', icon: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z' }
      ]
      
      const artistForm = ref({
        name: '',
        imagePreview: null,
        imageFile: null
      })
      
      const playlistForm = ref({
        name: '',
        description: '',
        type: 'general',
        artistId: ''
      })
      
      const canSubmit = computed(() => {
        switch (activeTab.value) {
          case 'import':
            return selectedFiles.value.length > 0
          case 'artist':
            return artistForm.value.name.trim() !== ''
          case 'playlist':
            return playlistForm.value.name.trim() !== '' && 
                   (playlistForm.value.type !== 'artist' || playlistForm.value.artistId)
          default:
            return false
        }
      })
      
      const submitButtonText = computed(() => {
        switch (activeTab.value) {
          case 'import':
            return `Import ${selectedFiles.value.length} File${selectedFiles.value.length !== 1 ? 's' : ''}`
          case 'artist':
            return 'Add Artist'
          case 'playlist':
            return 'Create Playlist'
          default:
            return 'Submit'
        }
      })
      
      const handleDrop = (e) => {
        isDragging.value = false
        const files = Array.from(e.dataTransfer.files).filter(file => 
          file.type.startsWith('audio/')
        )
        selectedFiles.value = [...selectedFiles.value, ...files]
      }
      
      const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        selectedFiles.value = [...selectedFiles.value, ...files]
      }
      
      const removeFile = (index) => {
        selectedFiles.value.splice(index, 1)
      }
      
      const handleArtistImage = (e) => {
        const file = e.target.files[0]
        if (file) {
          artistForm.value.imageFile = file
          const reader = new FileReader()
          reader.onload = (e) => {
            artistForm.value.imagePreview = e.target.result
          }
          reader.readAsDataURL(file)
        }
      }
      
      const handleSubmit = () => {
        const data = {
          type: activeTab.value,
          data: null
        }
        
        switch (activeTab.value) {
          case 'import':
            data.data = { files: selectedFiles.value }
            break
          case 'artist':
            data.data = { ...artistForm.value }
            break
          case 'playlist':
            data.data = { ...playlistForm.value }
            break
        }
        
        emit('add', data)
      }
      
      const addArtist = () => {
        if (canSubmit.value) handleSubmit()
      }
      
      const createPlaylist = () => {
        if (canSubmit.value) handleSubmit()
      }
      
      return {
        activeTab,
        tabs,
        isDragging,
        selectedFiles,
        artistForm,
        playlistForm,
        canSubmit,
        submitButtonText,
        handleDrop,
        handleFileSelect,
        removeFile,
        handleArtistImage,
        handleSubmit,
        addArtist,
        createPlaylist
      }
    }
  }
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }
  
  .modal-container {
    width: 100%;
    max-width: 600px;
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(50px);
    -webkit-backdrop-filter: blur(50px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
  }
  
  .close-button {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  
  .close-button svg {
    width: 20px;
    height: 20px;
  }
  
  /* Tabs */
  .modal-tabs {
    display: flex;
    padding: 0 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tab-button {
    flex: 1;
    padding: 16px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .tab-button:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .tab-button.active {
    color: #fff;
  }
  
  .tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #fff;
  }
  
  .tab-button svg {
    width: 20px;
    height: 20px;
  }
  
  /* Content */
  .modal-content {
    padding: 24px;
    min-height: 300px;
  }
  
  .tab-content {
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Drop Zone */
  .drop-zone {
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 48px;
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .drop-zone.dragover {
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
  }
  
  .drop-icon {
    width: 48px;
    height: 48px;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 16px;
  }
  
  .drop-text {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }
  
  .drop-subtext {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 16px;
  }
  
  .browse-button {
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .browse-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  
  /* Files List */
  .files-list {
    margin-top: 24px;
  }
  
  .list-title {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 12px;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .file-icon {
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .file-name {
    flex: 1;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .remove-file {
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  
  .remove-file:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ff4757;
  }
  
  .remove-file svg {
    width: 16px;
    height: 16px;
  }
  
  /* Form Styles */
  .form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .form-input,
  .form-textarea,
  .form-select {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .form-input::placeholder,
  .form-textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .form-select {
    cursor: pointer;
  }
  
  /* Image Upload */
  .image-upload {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  
  .image-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: rgba(255, 255, 255, 0.3);
  }
  
  .image-preview.has-image {
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .image-preview svg {
    width: 40px;
    height: 40px;
  }
  
  .upload-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .upload-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .upload-button svg {
    width: 18px;
    height: 18px;
  }
  
  /* Radio Group */
  .radio-group {
    display: flex;
    gap: 24px;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .radio-input {
    width: 18px;
    height: 18px;
    accent-color: #fff;
  }
  
  .radio-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  /* Footer */
  .modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .cancel-button,
  .submit-button {
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cancel-button {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .cancel-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .submit-button {
    background: #fff;
    color: #000;
  }
  
  .submit-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
  }
  
  .submit-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  </style>
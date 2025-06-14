<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Create New User</h2>
          <button @click="$emit('close')" class="modal-close">×</button>
        </div>

        <form @submit.prevent="$emit('submit')" class="invite-form">
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="user@example.com"
              required
              :disabled="sending"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="userType">User Type *</label>
            <select
              id="userType"
              v-model="form.userType"
              required
              :disabled="sending"
              class="form-input"
            >
              <option value="">Select user type</option>
              <option value="owner">Owner</option>
              <option value="editor">Editor</option>
              <option value="invoicer">Invoicer</option>
              <option value="viewer">Viewer</option>
              <option value="artist">Artist</option>
            </select>
          </div>

          <!-- Artist Selection for Artist accounts -->
          <div v-if="form.userType === 'artist'" class="form-group">
            <label for="artistId">Link to Artist *</label>
            <select
              id="artistId"
              v-model="form.artistId"
              required
              :disabled="sending"
              class="form-input"
            >
              <option value="">Select an artist</option>
              <option
                v-for="artist in availableArtists"
                :key="artist.id"
                :value="artist.id"
              >
                {{ artist.name }}
              </option>
            </select>
          </div>

          <!-- Artist Permissions for Editors -->
          <div v-if="form.userType === 'editor'" class="form-group">
            <label>Artist Access Permissions</label>
            
            <div class="checkbox-item">
              <input
                id="fullAccess"
                v-model="form.fullAccess"
                type="checkbox"
                :disabled="sending"
                @change="toggleFullAccess"
              />
              <label for="fullAccess">Full access to all artists</label>
            </div>

            <div v-if="!form.fullAccess" class="artist-checkboxes">
              <div
                v-for="artist in artists"
                :key="artist.id"
                class="checkbox-item"
              >
                <input
                  :id="`artist-${artist.id}`"
                  v-model="form.selectedArtists"
                  :value="artist.id"
                  type="checkbox"
                  :disabled="sending"
                />
                <label :for="`artist-${artist.id}`">{{ artist.name }}</label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="btn-secondary" :disabled="sending">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="sending || !isFormValid">
              {{ sending ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  artists: {
    type: Array,
    required: true
  },
  availableArtists: {
    type: Array,
    required: true
  },
  sending: {
    type: Boolean,
    default: false
  },
  form: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'submit'])

const isFormValid = computed(() => {
  if (!props.form.email || !props.form.userType) return false
  
  if (props.form.userType === 'artist' && !props.form.artistId) return false
  
  if (props.form.userType === 'editor' && !props.form.fullAccess && props.form.selectedArtists.length === 0) {
    return false
  }
  
  return true
})

const toggleFullAccess = () => {
  if (props.form.fullAccess) {
    props.form.selectedArtists = props.artists.map(a => a.id)
  } else {
    props.form.selectedArtists = []
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
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
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
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.invite-form {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
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

.form-input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #1db954;
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-input option {
  background: #1e1e1e;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.artist-checkboxes {
  margin-top: 12px;
  padding-left: 24px;
  max-height: 200px;
  overflow-y: auto;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.btn-primary {
  padding: 12px 24px;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #1ed760;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.btn-secondary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.artist-checkboxes::-webkit-scrollbar {
  width: 8px;
}

.artist-checkboxes::-webkit-scrollbar-track {
  background: transparent;
}

.artist-checkboxes::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.artist-checkboxes::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
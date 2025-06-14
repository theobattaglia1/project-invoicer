<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="credentials-modal" @click.stop>
        <h3>User Created Successfully!</h3>
        
        <div class="credentials-info">
          <p><strong>Email:</strong> {{ creds.email }}</p>
          <p><strong>Temporary Password:</strong> {{ creds.password }}</p>
        </div>
        
        <div class="credentials-actions">
          <button @click="$emit('copy')" class="btn-primary">
            Copy Credentials
          </button>
          <button @click="$emit('close')" class="btn-secondary">
            Close
          </button>
        </div>
        
        <p class="credentials-note">
          Share these credentials with the user. They will be prompted to change their password on first login.
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  creds: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'copy'])
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

.credentials-modal {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  text-align: center;
}

.credentials-modal h3 {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0 0 24px 0;
}

.credentials-info {
  background: rgba(29, 185, 84, 0.1);
  border: 1px solid rgba(29, 185, 84, 0.2);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: left;
}

.credentials-info p {
  font-size: 16px;
  color: white;
  margin: 0 0 12px 0;
  font-family: monospace;
}

.credentials-info p:last-child {
  margin-bottom: 0;
}

.credentials-info strong {
  color: #1db954;
  display: inline-block;
  width: 150px;
}

.credentials-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.credentials-note {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
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

.btn-primary:hover {
  background: #1ed760;
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

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
</style>
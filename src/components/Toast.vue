<template>
  <div class="toast-container" v-if="queue.length">
    <transition-group name="toast-fade" tag="div">
      <div
        v-for="t in queue"
        :key="t.id"
        class="toast"
        :class="t.type"
      >
        <span class="toast-message">{{ t.msg }}</span>

        <button
          v-if="t.action"
          class="toast-action"
          @click="runAction(t)"
        >
          {{ t.action.label }}
        </button>

        <button class="toast-close" @click="remove(t.id)">
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '@/store/toast'
const store = useToastStore()
const { queue, push, remove } = store  // push is unused but handy later

function runAction (t) {
  if (t.action?.handler) t.action.handler()
  remove(t.id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

/* Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active { transition: opacity .3s, transform .3s; }
.toast-fade-enter-from,
.toast-fade-leave-to    { opacity: 0; transform: translateY(20px); }

/* Toast box */
.toast {
  min-width: 180px;
  max-width: 320px;
  background: var(--bg-secondary, #222);
  color: var(--text-primary, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  opacity: .95;
}
.toast.success { background: #4ECDC4; color: #222; }
.toast.error   { background: #FF6B6B; color: #fff; }
.toast.info    { background: #45B7D1; color: #fff; }

/* Buttons */
.toast-close,
.toast-action {
  background: none;
  border: none;
  cursor: pointer;
}
.toast-close  { color: inherit; font-size: 18px; margin-left: 12px; }
.toast-action { color: var(--accent-primary, #FF6B6B); font-weight: bold; }
</style>

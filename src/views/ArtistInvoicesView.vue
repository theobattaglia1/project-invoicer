<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-white">
      Invoices for {{ artistId }}
    </h2>
    <p class="mt-4 text-gray-400">[Invoices table goes here]</p>
  </div>
</template>

<script setup>
const props = defineProps({
  artistId: { type: String, required: true }
})
</script>

<style scoped>
/* Add any view‐specific styles here */
</style>

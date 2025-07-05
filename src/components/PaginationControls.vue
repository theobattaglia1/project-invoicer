<template>
  <div class="pagination-controls">
    <div class="pagination-info">
      <span>{{ pageInfo.startItem }}-{{ pageInfo.endItem }} of {{ pageInfo.totalItems }}</span>
    </div>
    
    <div class="pagination-nav">
      <button
        @click="$emit('previous')"
        :disabled="!pageInfo.hasPrevious"
        class="pagination-btn"
        aria-label="Previous page"
      >
        <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="$emit('page-change', page)"
          :class="['page-number', { active: page === pageInfo.currentPage }]"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
      </div>
      
      <button
        @click="$emit('next')"
        :disabled="!pageInfo.hasNext"
        class="pagination-btn"
        aria-label="Next page"
      >
        <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <div class="page-size-selector">
      <label for="page-size">Per page:</label>
      <select
        id="page-size"
        :value="pageInfo.pageSize"
        @change="$emit('page-size-change', Number($event.target.value))"
        class="page-size-select"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PAGE_SIZE_OPTIONS } from '@/utils/pagination'

const props = defineProps({
  pageInfo: {
    type: Object,
    required: true
  },
  pageSizeOptions: {
    type: Array,
    default: () => PAGE_SIZE_OPTIONS
  }
})

const emit = defineEmits(['previous', 'next', 'page-change', 'page-size-change'])

// Calculate visible page numbers with ellipsis
const visiblePages = computed(() => {
  const { currentPage, totalPages } = props.pageInfo
  const pages = []
  const maxVisible = 7
  
  if (totalPages <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)
    
    if (currentPage > 3) {
      pages.push('...')
    }
    
    // Show pages around current
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...')
    }
    
    // Always show last page
    pages.push(totalPages)
  }
  
  return pages
})
</script>

<style scoped>
.pagination-controls {
  display: flex;
  items-center: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  min-width: 2rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover:not(:disabled):not(.active) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.page-number.active {
  background: #1db954;
  color: white;
  border-color: #1db954;
}

.page-number:disabled {
  cursor: default;
  color: rgba(255, 255, 255, 0.5);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-selector label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.page-size-select {
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5rem 1.5rem;
}

.page-size-select:focus {
  outline: none;
  border-color: #1db954;
}

@media (max-width: 640px) {
  .pagination-controls {
    justify-content: center;
  }
  
  .pagination-info {
    width: 100%;
    text-align: center;
  }
  
  .page-size-selector {
    width: 100%;
    justify-content: center;
  }
}
</style>
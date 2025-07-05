// src/utils/pagination.js

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export class PaginationHelper {
  constructor(pageSize = DEFAULT_PAGE_SIZE) {
    this.pageSize = pageSize
    this.currentPage = 1
    this.totalItems = 0
    this.totalPages = 0
  }

  setTotalItems(total) {
    this.totalItems = total
    this.totalPages = Math.ceil(total / this.pageSize)
  }

  setPage(page) {
    this.currentPage = Math.max(1, Math.min(page, this.totalPages || 1))
  }

  setPageSize(size) {
    this.pageSize = size
    this.totalPages = Math.ceil(this.totalItems / this.pageSize)
    // Adjust current page if it's out of bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages)
    }
  }

  nextPage() {
    if (this.hasNextPage()) {
      this.currentPage++
    }
  }

  previousPage() {
    if (this.hasPreviousPage()) {
      this.currentPage--
    }
  }

  hasNextPage() {
    return this.currentPage < this.totalPages
  }

  hasPreviousPage() {
    return this.currentPage > 1
  }

  getOffset() {
    return (this.currentPage - 1) * this.pageSize
  }

  getRange() {
    const start = this.getOffset()
    const end = start + this.pageSize - 1
    return { start, end }
  }

  getPageInfo() {
    const start = this.totalItems === 0 ? 0 : this.getOffset() + 1
    const end = Math.min(this.getOffset() + this.pageSize, this.totalItems)
    
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      pageSize: this.pageSize,
      totalItems: this.totalItems,
      startItem: start,
      endItem: end,
      hasNext: this.hasNextPage(),
      hasPrevious: this.hasPreviousPage()
    }
  }
}

// Vue composable for pagination
import { ref, computed, watch } from 'vue'

export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const pageSize = ref(initialPageSize)
  const currentPage = ref(1)
  const totalItems = ref(0)

  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

  const offset = computed(() => (currentPage.value - 1) * pageSize.value)

  const range = computed(() => ({
    start: offset.value,
    end: offset.value + pageSize.value - 1
  }))

  const pageInfo = computed(() => {
    const start = totalItems.value === 0 ? 0 : offset.value + 1
    const end = Math.min(offset.value + pageSize.value, totalItems.value)
    
    return {
      currentPage: currentPage.value,
      totalPages: totalPages.value,
      pageSize: pageSize.value,
      totalItems: totalItems.value,
      startItem: start,
      endItem: end,
      hasNext: currentPage.value < totalPages.value,
      hasPrevious: currentPage.value > 1
    }
  })

  // Reset to page 1 when page size changes
  watch(pageSize, () => {
    currentPage.value = 1
  })

  const setTotalItems = (total) => {
    totalItems.value = total
  }

  const setPage = (page) => {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value || 1))
  }

  const nextPage = () => {
    if (pageInfo.value.hasNext) {
      currentPage.value++
    }
  }

  const previousPage = () => {
    if (pageInfo.value.hasPrevious) {
      currentPage.value--
    }
  }

  const reset = () => {
    currentPage.value = 1
    totalItems.value = 0
  }

  return {
    pageSize,
    currentPage,
    totalItems,
    totalPages,
    offset,
    range,
    pageInfo,
    setTotalItems,
    setPage,
    nextPage,
    previousPage,
    reset
  }
}
<template>
    <div class="ideas-page">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <h1 class="view-title">{{ title || 'Ideas & Notes' }}</h1>
          <p class="view-subtitle">{{ getAllNotes().length }} notes across {{ boards.length }} boards</p>
        </div>
        
        <div class="header-controls">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search notes..."
              class="search-input"
            >
          </div>
  
          <div class="view-controls">
            <div class="view-switcher">
              <button 
                class="view-btn"
                :class="{ active: viewMode === 'board' }"
                @click="viewMode = 'board'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
                </svg>
                Board
              </button>
              <button 
                class="view-btn"
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/>
                </svg>
                List
              </button>
              <button 
                class="view-btn"
                :class="{ active: viewMode === 'cards' }"
                @click="viewMode = 'cards'"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v10H3zm10 0h8v6h-8zm0 8h8v10h-8zM3 15h8v6H3z"/>
                </svg>
                Cards
              </button>
            </div>
  
            <select v-model="filterTag" class="filter-select">
              <option value="">All Tags</option>
              <option v-for="tag in allTags" :key="tag" :value="tag">
                {{ tag }}
              </option>
            </select>
          </div>
  
          <div class="header-actions">
            <button 
              v-if="selectedNotes.size > 0" 
              class="action-btn ghost"
              @click="archiveSelected"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
              </svg>
              Archive
            </button>
            <button 
              class="action-btn ghost"
              @click="createNewBoard"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
              </svg>
              New Board
            </button>
            <button 
              class="action-btn primary" 
              @click="createNewNote"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              New Note
            </button>
          </div>
        </div>
      </div>
  
      <!-- Content Container -->
      <div class="content-container">
        <!-- Board View (Kanban) -->
        <div v-if="viewMode === 'board'" class="board-view">
          <div class="boards-container">
            <div 
              v-for="board in filteredBoards" 
              :key="board.id"
              class="board-column"
              @dragover.prevent="handleDragOver(board.id)"
              @drop="handleDrop(board.id, $event)"
            >
              <div class="board-header">
                <h3 class="board-title">
                  <span v-if="!editingBoard || editingBoard !== board.id">{{ board.name }}</span>
                  <input 
                    v-else
                    v-model="board.name"
                    @blur="editingBoard = null"
                    @keydown.enter="editingBoard = null"
                    class="board-title-input"
                    autofocus
                  />
                </h3>
                <span class="board-count">{{ getBoardNotes(board.id).length }}</span>
                <button 
                  class="board-menu"
                  @click="showBoardMenu(board, $event)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
  
              <div class="board-notes">
                <div 
                  v-for="note in getBoardNotes(board.id)" 
                  :key="note.id"
                  class="note-card"
                  :class="{ 
                    selected: selectedNotes.has(note.id),
                    pinned: note.pinned,
                    [`priority-${note.priority}`]: note.priority
                  }"
                  :draggable="true"
                  @dragstart="handleDragStart(note, $event)"
                  @click="selectNote(note, $event)"
                  @dblclick="openNote(note)"
                >
                  <div v-if="note.pinned" class="pin-indicator">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
                    </svg>
                  </div>
  
                  <h4 class="note-title">{{ note.title }}</h4>
                  
                  <p class="note-content">{{ truncateContent(note.content) }}</p>
                  
                  <div v-if="note.attachments?.length" class="note-attachments">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                    </svg>
                    {{ note.attachments.length }}
                  </div>
  
                  <div v-if="note.tags?.length" class="note-tags">
                    <span 
                      v-for="tag in note.tags.slice(0, 3)" 
                      :key="tag"
                      class="tag"
                      :style="{ background: getTagColor(tag) }"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="note.tags.length > 3" class="tag more">
                      +{{ note.tags.length - 3 }}
                    </span>
                  </div>
  
                  <div class="note-meta">
                    <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
                    <div v-if="note.assignee" class="note-assignee">
                      <div class="assignee-avatar">
                        {{ note.assignee.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                </div>
  
                <!-- Add Note Button -->
                <button 
                  class="add-note-btn"
                  @click="createNewNote(board.id)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Note
                </button>
              </div>
            </div>
  
            <!-- Add Board Column -->
            <div class="board-column add-board">
              <button class="add-board-btn" @click="createNewBoard">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Board
              </button>
            </div>
          </div>
        </div>
  
        <!-- List View -->
        <div v-else-if="viewMode === 'list'" class="list-view">
          <table class="notes-table">
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="selectedNotes.size === filteredNotes.length && filteredNotes.length > 0"
                    @change="toggleSelectAll"
                  >
                </th>
                <th class="col-title">Title</th>
                <th class="col-board">Board</th>
                <th class="col-tags">Tags</th>
                <th class="col-updated">Updated</th>
                <th class="col-assignee">Assignee</th>
                <th class="col-priority">Priority</th>
                <th class="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="note in paginatedNotes" 
                :key="note.id"
                class="note-row"
                :class="{ 
                  selected: selectedNotes.has(note.id),
                  pinned: note.pinned
                }"
                @click="selectNote(note, $event)"
                @dblclick="openNote(note)"
              >
                <td class="col-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="selectedNotes.has(note.id)"
                    @click.stop
                    @change="toggleNoteSelection(note)"
                  >
                </td>
                <td class="col-title">
                  <div class="title-cell">
                    <svg v-if="note.pinned" class="pin-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
                    </svg>
                    {{ note.title }}
                  </div>
                </td>
                <td class="col-board">{{ getBoardName(note.boardId) }}</td>
                <td class="col-tags">
                  <div class="tags-cell">
                    <span 
                      v-for="tag in note.tags?.slice(0, 2)" 
                      :key="tag"
                      class="tag small"
                      :style="{ background: getTagColor(tag) }"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="note.tags?.length > 2" class="tag small more">
                      +{{ note.tags.length - 2 }}
                    </span>
                  </div>
                </td>
                <td class="col-updated">{{ formatDate(note.updatedAt) }}</td>
                <td class="col-assignee">
                  <div v-if="note.assignee" class="assignee-avatar small">
                    {{ note.assignee.charAt(0).toUpperCase() }}
                  </div>
                </td>
                <td class="col-priority">
                  <span v-if="note.priority" :class="`priority-badge priority-${note.priority}`">
                    {{ note.priority }}
                  </span>
                </td>
                <td class="col-actions">
                  <button @click.stop="showNoteMenu(note, $event)" class="action-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Cards View -->
        <div v-else class="cards-view">
          <div class="cards-grid">
            <div 
              v-for="note in paginatedNotes" 
              :key="note.id"
              class="note-card-full"
              :class="{ 
                selected: selectedNotes.has(note.id),
                pinned: note.pinned,
                [`priority-${note.priority}`]: note.priority
              }"
              @click="selectNote(note, $event)"
              @dblclick="openNote(note)"
            >
              <div class="card-header">
                <h3 class="card-title">{{ note.title }}</h3>
                <div class="card-actions">
                  <svg v-if="note.pinned" class="pin-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
                  </svg>
                  <button @click.stop="showNoteMenu(note, $event)" class="card-menu">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>
              </div>
  
              <p class="card-content">{{ note.content }}</p>
  
              <div class="card-footer">
                <div class="card-meta">
                  <span class="meta-board">{{ getBoardName(note.boardId) }}</span>
                  <span class="meta-date">{{ formatDate(note.updatedAt) }}</span>
                </div>
  
                <div v-if="note.tags?.length" class="card-tags">
                  <span 
                    v-for="tag in note.tags" 
                    :key="tag"
                    class="tag"
                    :style="{ background: getTagColor(tag) }"
                  >
                    {{ tag }}
                  </span>
                </div>
  
                <div class="card-bottom">
                  <div v-if="note.attachments?.length" class="card-attachments">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                    </svg>
                    {{ note.attachments.length }} files
                  </div>
                  <div v-if="note.assignee" class="assignee-info">
                    <div class="assignee-avatar small">
                      {{ note.assignee.charAt(0).toUpperCase() }}
                    </div>
                    {{ note.assignee }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Pagination -->
        <div v-if="totalPages > 1 && viewMode !== 'board'" class="pagination">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            Previous
          </button>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            Next
          </button>
        </div>
      </div>
  
      <!-- Quick Add Modal -->
      <div v-if="showQuickAdd" class="quick-add-modal" @click.self="closeQuickAdd">
        <div class="quick-add-content">
          <h3>Quick Add Note</h3>
          <input 
            v-model="newNote.title"
            placeholder="Note title..."
            class="quick-add-input"
            ref="quickAddTitle"
          >
          <textarea 
            v-model="newNote.content"
            placeholder="Start typing..."
            class="quick-add-textarea"
            rows="4"
          ></textarea>
          <div class="quick-add-footer">
            <select v-model="newNote.boardId" class="board-select">
              <option v-for="board in boards" :key="board.id" :value="board.id">
                {{ board.name }}
              </option>
            </select>
            <div class="quick-add-actions">
              <button @click="closeQuickAdd" class="btn-cancel">Cancel</button>
              <button @click="saveQuickNote" class="btn-save">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, reactive, watch, nextTick } from 'vue'
  
  export default {
    name: 'IdeasNotesTemplate',
    props: {
      title: String,
      initialBoards: {
        type: Array,
        default: () => [
          { id: 'ideas', name: 'Ideas', color: '#667eea' },
          { id: 'todo', name: 'To Do', color: '#f59e0b' },
          { id: 'in-progress', name: 'In Progress', color: '#3b82f6' },
          { id: 'done', name: 'Done', color: '#10b981' }
        ]
      },
      initialNotes: {
        type: Array,
        default: () => []
      },
      config: {
        type: Object,
        default: () => ({
          itemsPerPage: 20
        })
      }
    },
    emits: ['action'],
    setup(props, { emit }) {
      const boards = reactive([...props.initialBoards])
      const notes = reactive([...props.initialNotes])
      const selectedNotes = ref(new Set())
      const searchQuery = ref('')
      const filterTag = ref('')
      const viewMode = ref('board')
      const currentPage = ref(1)
      const editingBoard = ref(null)
      const showQuickAdd = ref(false)
      const quickAddTitle = ref(null)
      
      const newNote = reactive({
        title: '',
        content: '',
        boardId: boards[0]?.id || 'ideas'
      })
  
      // Tag colors (consistent palette)
      const tagColors = {
        'urgent': '#ef4444',
        'important': '#f59e0b',
        'review': '#3b82f6',
        'approved': '#10b981',
        'creative': '#8b5cf6',
        'technical': '#6366f1',
        'marketing': '#ec4899',
        'strategy': '#14b8a6'
      }
  
      // Computed
      const allTags = computed(() => {
        const tags = new Set()
        notes.forEach(note => {
          note.tags?.forEach(tag => tags.add(tag))
        })
        return Array.from(tags).sort()
      })
  
      const filteredNotes = computed(() => {
        let filtered = notes
  
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          filtered = filtered.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
          )
        }
  
        if (filterTag.value) {
          filtered = filtered.filter(note => 
            note.tags?.includes(filterTag.value)
          )
        }
  
        return filtered
      })
  
      const filteredBoards = computed(() => {
        if (viewMode.value !== 'board') return boards
        
        // Only show boards that have notes after filtering
        return boards.filter(board => 
          filteredNotes.value.some(note => note.boardId === board.id)
        )
      })
  
      const totalPages = computed(() => 
        Math.ceil(filteredNotes.value.length / props.config.itemsPerPage)
      )
  
      const paginatedNotes = computed(() => {
        if (viewMode.value === 'board') return filteredNotes.value
        
        const start = (currentPage.value - 1) * props.config.itemsPerPage
        const end = start + props.config.itemsPerPage
        return filteredNotes.value.slice(start, end)
      })
  
      const getAllNotes = () => notes
  
      const getBoardNotes = (boardId) => {
        return filteredNotes.value.filter(note => note.boardId === boardId)
      }
  
      const getBoardName = (boardId) => {
        return boards.find(b => b.id === boardId)?.name || 'Unknown'
      }
  
      const getTagColor = (tag) => {
        return tagColors[tag.toLowerCase()] || 'rgba(255, 255, 255, 0.1)'
      }
  
      const formatDate = (date) => {
        const d = new Date(date)
        const now = new Date()
        const diffMs = now - d
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
  
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
  
      const truncateContent = (content, maxLength = 100) => {
        if (content.length <= maxLength) return content
        return content.substring(0, maxLength) + '...'
      }
  
      // Note management
      const createNewNote = async (boardId = null) => {
        showQuickAdd.value = true
        if (boardId) {
          newNote.boardId = boardId
        }
        await nextTick()
        quickAddTitle.value?.focus()
      }
  
      const saveQuickNote = () => {
        if (!newNote.title.trim()) return
        
        const note = {
          id: Date.now(),
          title: newNote.title,
          content: newNote.content,
          boardId: newNote.boardId,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          pinned: false,
          priority: null,
          assignee: null,
          attachments: []
        }
        
        notes.unshift(note)
        
        // Reset form
        newNote.title = ''
        newNote.content = ''
        closeQuickAdd()
        
        emit('action', { type: 'note-created', note })
      }
  
      const closeQuickAdd = () => {
        showQuickAdd.value = false
        newNote.title = ''
        newNote.content = ''
      }
  
      const openNote = (note) => {
        emit('action', { type: 'open-note', note })
      }
  
      const selectNote = (note, event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
        const multiSelectKey = isMac ? event.metaKey : event.ctrlKey
        
        if (multiSelectKey) {
          toggleNoteSelection(note)
        } else {
          selectedNotes.value.clear()
          selectedNotes.value.add(note.id)
          selectedNotes.value = new Set(selectedNotes.value)
        }
      }
  
      const toggleNoteSelection = (note) => {
        if (selectedNotes.value.has(note.id)) {
          selectedNotes.value.delete(note.id)
        } else {
          selectedNotes.value.add(note.id)
        }
        selectedNotes.value = new Set(selectedNotes.value)
      }
  
      const toggleSelectAll = () => {
        if (selectedNotes.value.size === filteredNotes.value.length) {
          selectedNotes.value.clear()
        } else {
          filteredNotes.value.forEach(note => selectedNotes.value.add(note.id))
        }
        selectedNotes.value = new Set(selectedNotes.value)
      }
  
      const archiveSelected = () => {
        const selectedIds = Array.from(selectedNotes.value)
        const selectedItems = notes.filter(n => selectedIds.includes(n.id))
        emit('action', { type: 'archive-notes', notes: selectedItems })
        
        // Remove from current view
        notes.splice(0, notes.length, 
          ...notes.filter(n => !selectedIds.includes(n.id))
        )
        selectedNotes.value.clear()
      }
  
      // Board management
      const createNewBoard = () => {
        const boardName = prompt('Board name:')
        if (!boardName) return
        
        const board = {
          id: Date.now().toString(),
          name: boardName,
          color: '#' + Math.floor(Math.random()*16777215).toString(16)
        }
        
        boards.push(board)
        emit('action', { type: 'board-created', board })
      }
  
      const showBoardMenu = (board, event) => {
        editingBoard.value = board.id
      }
  
      const showNoteMenu = (note, event) => {
        emit('action', { type: 'context-menu', note, event })
      }
  
      // Drag and drop
      const draggedNote = ref(null)
  
      const handleDragStart = (note, event) => {
        draggedNote.value = note
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', note.id)
      }
  
      const handleDragOver = (boardId) => {
        // Visual feedback during drag
      }
  
      const handleDrop = (boardId, event) => {
        event.preventDefault()
        
        if (draggedNote.value && draggedNote.value.boardId !== boardId) {
          draggedNote.value.boardId = boardId
          draggedNote.value.updatedAt = new Date()
          emit('action', { 
            type: 'note-moved', 
            note: draggedNote.value,
            fromBoard: draggedNote.value.boardId,
            toBoard: boardId
          })
        }
        
        draggedNote.value = null
      }
  
      // Reset page when filters change
      watch([searchQuery, filterTag, viewMode], () => {
        currentPage.value = 1
      })
  
      return {
        boards,
        notes,
        selectedNotes,
        searchQuery,
        filterTag,
        viewMode,
        currentPage,
        editingBoard,
        showQuickAdd,
        quickAddTitle,
        newNote,
        allTags,
        filteredNotes,
        filteredBoards,
        totalPages,
        paginatedNotes,
        getAllNotes,
        getBoardNotes,
        getBoardName,
        getTagColor,
        formatDate,
        truncateContent,
        createNewNote,
        saveQuickNote,
        closeQuickAdd,
        openNote,
        selectNote,
        toggleNoteSelection,
        toggleSelectAll,
        archiveSelected,
        createNewBoard,
        showBoardMenu,
        showNoteMenu,
        handleDragStart,
        handleDragOver,
        handleDrop
      }
    }
  }
  </script>
  
  <style scoped>
  .ideas-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
  }
  
  /* Header */
  .view-header {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
  }
  
  .header-content {
    margin-bottom: 20px;
  }
  
  .view-title {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  
  .view-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .header-controls {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  
  .search-box {
    flex: 1;
    max-width: 400px;
    position: relative;
  }
  
  .search-box svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 10px 16px 10px 48px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    transition: all 0.15s ease;
  }
  
  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .search-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  /* View Controls */
  .view-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .view-switcher {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 4px;
  }
  
  .view-btn {
    padding: 8px 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .view-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .view-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .view-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .filter-select {
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .filter-select:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .filter-select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  /* Header Actions */
  .header-actions {
    display: flex;
    gap: 12px;
    margin-left: auto;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .action-btn.primary {
    background: white;
    color: black;
  }
  
  .action-btn.primary:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  .action-btn.ghost {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .action-btn.ghost:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  /* Content Container */
  .content-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  /* Board View (Kanban) */
  .board-view {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 24px;
  }
  
  .boards-container {
    display: flex;
    gap: 20px;
    height: 100%;
    min-width: max-content;
  }
  
  .board-column {
    width: 320px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    max-height: 100%;
  }
  
  .board-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .board-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
  }
  
  .board-title-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    padding: 4px 8px;
    width: 100%;
  }
  
  .board-count {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 12px;
  }
  
  .board-menu {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .board-menu:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .board-menu svg {
    width: 18px;
    height: 18px;
  }
  
  .board-notes {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  /* Note Card (Board View) */
  .note-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }
  
  .note-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
  
  .note-card.selected {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .note-card.pinned {
    border-color: rgba(255, 204, 0, 0.3);
  }
  
  .note-card.priority-high {
    border-left: 3px solid #ef4444;
  }
  
  .note-card.priority-medium {
    border-left: 3px solid #f59e0b;
  }
  
  .note-card.priority-low {
    border-left: 3px solid #3b82f6;
  }
  
  .pin-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  
  .pin-indicator svg,
  .pin-icon {
    width: 16px;
    height: 16px;
    color: rgba(255, 204, 0, 0.6);
  }
  
  .note-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    line-height: 1.3;
  }
  
  .note-content {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
    margin-bottom: 12px;
  }
  
  .note-attachments {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
  }
  
  .note-attachments svg {
    width: 14px;
    height: 14px;
  }
  
  .note-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  
  .tag {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    color: white;
  }
  
  .tag.small {
    padding: 1px 6px;
    font-size: 10px;
  }
  
  .tag.more {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
  }
  
  .note-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .note-assignee {
    display: flex;
    align-items: center;
  }
  
  .assignee-avatar {
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }
  
  .assignee-avatar.small {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
  
  /* Add Note Button */
  .add-note-btn {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .add-note-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .add-note-btn svg {
    width: 18px;
    height: 18px;
  }
  
  /* Add Board Column */
  .board-column.add-board {
    width: 280px;
    background: transparent;
    border: 2px dashed rgba(255, 255, 255, 0.1);
    justify-content: center;
  }
  
  .add-board-btn {
    width: 100%;
    height: 100%;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.15s ease;
  }
  
  .add-board-btn:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.02);
  }
  
  .add-board-btn svg {
    width: 32px;
    height: 32px;
  }
  
  /* List View */
  .list-view {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  
  .notes-table {
    width: 100%;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    overflow: hidden;
    border-collapse: collapse;
  }
  
  .notes-table thead {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .notes-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .col-checkbox {
    width: 40px;
  }
  
  .col-board {
    width: 120px;
  }
  
  .col-tags {
    width: 200px;
  }
  
  .col-updated {
    width: 100px;
  }
  
  .col-assignee {
    width: 80px;
  }
  
  .col-priority {
    width: 80px;
  }
  
  .col-actions {
    width: 50px;
  }
  
  .note-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    transition: all 0.15s ease;
    cursor: pointer;
  }
  
  .note-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .note-row.selected {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .note-row.pinned {
    background: rgba(255, 204, 0, 0.02);
  }
  
  .notes-table td {
    padding: 16px;
    font-size: 14px;
  }
  
  .title-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .tags-cell {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  
  .priority-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .priority-badge.priority-high {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .priority-badge.priority-medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  .priority-badge.priority-low {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }
  
  .action-icon {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .action-icon:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .action-icon svg {
    width: 18px;
    height: 18px;
  }
  
  /* Cards View */
  .cards-view {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
  
  .note-card-full {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
  }
  
  .note-card-full:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
  
  .note-card-full.selected {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .note-card-full.pinned {
    border-color: rgba(255, 204, 0, 0.3);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .card-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
    flex: 1;
  }
  
  .card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .card-menu {
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }
  
  .card-menu:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .card-menu svg {
    width: 18px;
    height: 18px;
  }
  
  .card-content {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin-bottom: 16px;
    flex: 1;
  }
  
  .card-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .card-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .meta-board {
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 12px;
  }
  
  .card-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-attachments {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .card-attachments svg {
    width: 14px;
    height: 14px;
  }
  
  .assignee-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .page-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .page-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .page-info {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Quick Add Modal */
  .quick-add-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .quick-add-content {
    background: rgba(18, 18, 18, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    width: 480px;
    max-width: 90vw;
  }
  
  .quick-add-content h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
  }
  
  .quick-add-input,
  .quick-add-textarea {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    margin-bottom: 16px;
    transition: all 0.15s ease;
  }
  
  .quick-add-input::placeholder,
  .quick-add-textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .quick-add-input:focus,
  .quick-add-textarea:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .quick-add-textarea {
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
  }
  
  .quick-add-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .board-select {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }
  
  .quick-add-actions {
    display: flex;
    gap: 12px;
  }
  
  .btn-cancel,
  .btn-save {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .btn-save {
    background: white;
    color: black;
  }
  
  .btn-save:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  /* Scrollbar */
  .board-notes::-webkit-scrollbar,
  .list-view::-webkit-scrollbar,
  .cards-view::-webkit-scrollbar {
    width: 8px;
  }
  
  .board-notes::-webkit-scrollbar-track,
  .list-view::-webkit-scrollbar-track,
  .cards-view::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .board-notes::-webkit-scrollbar-thumb,
  .list-view::-webkit-scrollbar-thumb,
  .cards-view::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
  }
  
  .board-notes::-webkit-scrollbar-thumb:hover,
  .list-view::-webkit-scrollbar-thumb:hover,
  .cards-view::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  
  .board-view::-webkit-scrollbar {
    height: 8px;
  }
  
  .board-view::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .board-view::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
  }
  
  .board-view::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  </style>
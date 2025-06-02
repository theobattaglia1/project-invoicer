<template>
  <aside class="sidebar">
    <div class="sidebar-content">
      <!-- App Header -->
      <div class="sidebar-header">
        <div class="app-logo">
          <svg
            class="logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path d="M10 16.5v-9l6 4.5-6 4.5z" fill="white" />
          </svg>
          <span class="logo-text">Music</span>
        </div>

        <!-- NEW: “Prefs” Gear Icon (emits open-prefs) -->
        <button @click="$emit('open-prefs')" class="prefs-toggle-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
            />
          </svg>
        </button>
      </div>

      <!-- Dynamic Navigation -->
      <nav class="sidebar-nav" @contextmenu.prevent="handleSidebarContextMenu">
        <draggable
          v-model="sections"
          :group="{ name: 'sections', pull: true, put: true }"
          handle=".section-handle"
          :animation="200"
          @change="saveSidebarConfig"
          item-key="id"
        >
          <template #item="{ element: section }">
            <div
              class="nav-section"
              :key="section.id"
              @contextmenu.prevent="handleSidebarContextMenu"
            >
              <!-- Section Header (if it has a name) -->
              <div v-if="section.name" class="section-header">
                <span
                  class="section-handle"
                  v-if="isEditMode && !isProtectedSection(section.id)"
                  >⋮⋮</span
                >
                <span class="section-title">{{ section.name }}</span>
                <button
                  v-if="isEditMode && !isProtectedSection(section.id)"
                  @click="editSection(section)"
                  class="edit-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                    />
                  </svg>
                </button>
                <!-- Add buttons for different sections -->
                <button
                  v-if="section.id === 'playlists-section'"
                  @click="$emit('open-add-modal', 'playlist')"
                  class="add-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
                <button
                  v-if="section.id === 'custom-pages-section'"
                  @click="showPageCreator = true"
                  class="add-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
              </div>

              <!-- Section Items -->
              <draggable
                v-model="section.items"
                :group="getDraggableGroup(section.id)"
                :move="(evt) => {
                  const element = evt.draggedContext.element;
                  // Prevent vuedraggable from moving playlist items into any section list
                  if (element.type === 'playlist') {
                    return false;
                  }
                  return true;
                }"
                :animation="200"
                @change="saveSidebarConfig"
                @start="handleDragStart"
                item-key="id"
              >
                <template #item="{ element: item }">
                  <div
                    :key="item.id"
                    class="nav-item"
                    :class="{
                      active: isItemActive(item),
                      'drag-over':
                        (item.type === 'playlist' && dragOverPlaylistId === item.playlistId) ||
                        dragOverItemId === item.id,
                      [`nested-${item.level}`]: item.level > 0
                    }"
                    @click="handleItemClick(item)"
                    @contextmenu.prevent="(e) => handleContextMenu(e, item)"
                    @dragenter.prevent="handleItemDragEnter(item, $event)"
                    @dragover.prevent="handleItemDragOver(item, $event)"
                    @dragleave="handleItemDragLeave(item, $event)"
                    @drop.prevent="handleItemDrop(item, $event)"
                    draggable="true"
                    @dragstart="handleItemDragStart(item, $event)"
                  >
                    <!-- Folder expand/collapse arrow -->
                    <button
                      v-if="
                        item.type === 'custom-page' &&
                        item.pageType === 'folder' &&
                        hasChildren(item)
                      "
                      @click.stop="toggleFolderExpansion(item.customPageId)"
                      class="folder-arrow"
                      :class="{ expanded: item.expanded }"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                      </svg>
                    </button>
                    <div
                      v-else-if="
                        item.type === 'custom-page' && item.pageType === 'folder'
                      "
                      class="folder-spacer"
                    ></div>

                    <component :is="getItemIcon(item)" class="nav-icon" />
                    <span>{{ item.label }}</span>
                    <button
                      v-if="isEditMode && !isProtectedItem(item)"
                      @click.stop="editingItem = { ...item }"
                      class="item-edit-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="item.type === 'custom-page' && !isProtectedItem(item)"
                      @click.stop="showDeleteConfirm(item)"
                      class="item-delete-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                        />
                      </svg>
                    </button>
                    <span v-if="item.count !== undefined" class="item-count">{{
                      item.count
                    }}</span>
                  </div>
                </template>
              </draggable>
            </div>
          </template>
        </draggable>

        <!-- Add Section Button (Edit Mode) -->
        <button v-if="isEditMode" @click="addSection" class="add-section-btn">
          + Add Section
        </button>
      </nav>
    </div>

    <!-- Page Creator Modal -->
    <Teleport to="body">
      <div v-if="showPageCreator" class="modal-overlay" @click="closePageCreator">
        <div class="modal-content page-creator" @click.stop>
          <h3>Create New Page</h3>

          <div class="page-types">
            <div
              v-for="type in pageTypes"
              :key="type.id"
              class="page-type-card"
              :class="{ selected: selectedPageType === type.id }"
              @click="selectedPageType = type.id"
            >
              <div class="page-type-icon">
                <component :is="type.icon" />
              </div>
              <h4>{{ type.name }}</h4>
              <p>{{ type.description }}</p>
            </div>
          </div>

          <input
            v-model="newPageTitle"
            placeholder="Page Title"
            class="page-title-input"
            @keydown.enter="createPage"
          />

          <div class="modal-actions">
            <button
              @click="createPage"
              class="save-btn"
              :disabled="!selectedPageType || !newPageTitle"
            >
              Create Page
            </button>
            <button @click="closePageCreator" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Section Editor Modal -->
    <Teleport to="body">
      <div v-if="editingSection" class="modal-overlay" @click="closeEditor">
        <div class="modal-content" @click.stop>
          <h3>Edit Section</h3>
          <input
            v-model="editingSection.name"
            placeholder="Section Name"
            class="section-name-input"
          />
          <div class="modal-actions">
            <button @click="saveSection" class="save-btn">Save</button>
            <button
              v-if="!isProtectedSection(editingSection.id)"
              @click="deleteSection"
              class="delete-btn"
            >
              Delete
            </button>
            <button @click="closeEditor" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Item Editor Modal -->
    <Teleport to="body">
      <div v-if="editingItem" class="modal-overlay" @click="closeItemEditor">
        <div class="modal-content" @click.stop>
          <h3>Edit Item</h3>
          <input
            v-model="editingItem.label"
            placeholder="Item Name"
            class="section-name-input"
          />
          <p class="edit-note">
            Note: This only changes the display name, not the functionality.
          </p>
          <div class="modal-actions">
            <button @click="saveItem" class="save-btn">Save</button>
            <button @click="resetItem" class="reset-btn">Reset to Default</button>
            <button @click="closeItemEditor" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Page Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deletingPage" class="modal-overlay" @click="cancelDeletePage">
        <div class="modal-content" @click.stop>
          <h3>Delete Page</h3>
          <p class="delete-warning">
            Are you sure you want to delete "{{ deletingPage.label }}"? This action cannot
            be undone.
          </p>
          <div class="modal-actions">
            <button @click="confirmDeletePage" class="delete-btn">Delete</button>
            <button @click="cancelDeletePage" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Custom Context Menu for Pages -->
    <Teleport to="body">
      <div
        v-if="contextMenuItem"
        class="context-menu-overlay"
        @click="closeContextMenu"
        @contextmenu.prevent
      >
        <div
          class="context-menu"
          :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
          @click.stop
        >
          <!-- Context menu for sidebar background -->
          <template v-if="contextMenuItem.type === 'sidebar-background'">
            <div class="context-menu-item" @click="handleCreateFolder(); closeContextMenu()">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"
                />
              </svg>
              New Folder
            </div>
            <div class="context-menu-item" @click="showPageCreator = true; closeContextMenu()">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                />
              </svg>
              New Page
            </div>
            <div class="context-menu-separator"></div>
            <div
              class="context-menu-item"
              @click="$emit('open-add-modal', 'import'); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Import Files
            </div>
          </template>

          <!-- Context menu for folders -->
          <template v-else-if="contextMenuItem.pageData && contextMenuItem.pageData.type === 'folder'">
            <div class="context-menu-item" @click="handleOpenFolder(contextMenuItem); closeContextMenu()">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M10 4H4c-1.1 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                />
              </svg>
              Open
            </div>
            <div
              class="context-menu-item"
              @click="handleCreateSubfolder(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                />
              </svg>
              New Subfolder
            </div>
            <div class="context-menu-separator"></div>
            <div
              class="context-menu-item"
              @click="editingItem = { ...contextMenuItem }; closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              Rename
            </div>
            <div
              class="context-menu-item danger"
              @click="showDeleteConfirm(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"
                />
              </svg>
              Delete Folder
            </div>
          </template>

          <!-- Context menu for other page types -->
          <template v-else>
            <div class="context-menu-item" @click="editingItem = { ...contextMenuItem }; closeContextMenu()">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              Edit Name
            </div>
            <div
              v-if="!isProtectedItem(contextMenuItem)"
              class="context-menu-item danger"
              @click="showDeleteConfirm(contextMenuItem); closeContextMenu()"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"
                />
              </svg>
              Delete Page
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue'
import draggable from 'vuedraggable'

// ─── PROPS & EMITS ───────────────────────────────────────────────────────────
const props = defineProps({
  activeView: String,
  activeArtistId: String,
  activePlaylistId: String,
  activeCustomPageId: String,
  songs: Array,
  artists: Array,
  playlists: Array,
  customPages: Array,
  dragOverPlaylistId: String
})

const emit = defineEmits([
  'set-active-view',
  'open-add-modal',
  'show-context-menu',
  'drag-enter',
  'drag-over',
  'drag-leave',
  'playlist-drop',
  'create-custom-page',
  'delete-custom-page',
  'create-folder',
  'action',
  'open-prefs'        // ← new event
])

// ─── STATE ───────────────────────────────────────────────────────────────────
const isEditMode = ref(false)
const editingSection = ref(null)
const editingItem = ref(null)
const showPageCreator = ref(false)
const selectedPageType = ref('')
const newPageTitle = ref('')
const deletingPage = ref(null)
const contextMenuItem = ref(null)
const contextMenuPosition = ref({ x: 0, y: 0 })
const expandedFolders = ref(new Set())
const dragOverItemId = ref(null)

// ─── PROTECTED IDS ───────────────────────────────────────────────────────────
const PROTECTED_SECTIONS = ['primary-nav', 'library-section', 'playlists-section']
const PROTECTED_ITEMS = ['home', 'search', 'songs', 'artists', 'playlists']

const isProtectedSection = sectionId => PROTECTED_SECTIONS.includes(sectionId)
const isProtectedItem = item =>
  PROTECTED_ITEMS.includes(item.id) || item.type === 'route'

// ─── PAGE TYPES CONFIG ──────────────────────────────────────────────────────
const pageTypes = [
  {
    id: 'folder',
    name: 'Folder',
    description: 'Organize content in hierarchical folders',
    icon: () =>
      h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z' }))
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Track tour dates, sessions, and deadlines',
    icon: () =>
      h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z' }))
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Visualize project milestones and career progression',
    icon: () =>
      h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.64 6.56l-3.54 3.54c-.78-.78-2.05-.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0l1.41 1.41 2.12-2.12c.78-.78 2.05-.78 2.83 0s.78 2.05 0 2.83z' }))
  },
  {
    id: 'assets',
    name: 'Asset Library',
    description: 'Organize press photos, artwork, and documents',
    icon: () =>
      h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z' }))
  },
  {
    id: 'moodboard',
    name: 'Mood Board',
    description: 'Create visual boards for creative planning',
    icon: () =>
      h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.19 0 .34-.16.34-.34 0-.09-.03-.17-.09-.25-.27-.44-.64-1.41-.64-2.41 0-1.66 1.34-3 3-3h3.5c3.03 0 5.5-2.47 5.5-5.5C22 5.81 17.19 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' }))
  },
  {
    id: 'ideas',
    name: 'Ideas & Notes',
    description: 'Capture song concepts, strategies, and notes',
    icon: () =>
      h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z' }))
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Custom overview with stats and widgets',
    icon: () =>
      h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' }))
  }
]

// Store original labels to reset
const originalLabels = {
  home: 'Home',
  search: 'Search',
  songs: 'Songs',
  artists: 'Artists',
  playlists: 'Playlists'
}

// Sanitize incoming sections (if saved or default) so they always have id, name, items
const sanitizeSections = (sectionsArray) => {
  return sectionsArray.map(section => ({
    id: section.id || `section-${Date.now()}-${Math.random()}`,
    name: section.name || null,
    items: Array.isArray(section.items) ? section.items : []
  }))
}

// ─── DEFAULT SIDEBAR CONFIG ─────────────────────────────────────────────────
const defaultSections = [
  {
    id: 'primary-nav',
    name: null,
    items: [
      { id: 'home', type: 'route', label: 'Home', icon: 'home', view: 'home' },
      { id: 'search', type: 'route', label: 'Search', icon: 'search', view: 'search' }
    ]
  },
  {
    id: 'library-section',
    name: 'LIBRARY',
    items: [
      { id: 'songs', type: 'route', label: 'Songs', icon: 'music', view: 'all-songs' },
      { id: 'artists', type: 'route', label: 'Artists', icon: 'artist', view: 'artists' },
      { id: 'playlists', type: 'route', label: 'Playlists', icon: 'playlist', view: 'playlists' }
    ]
  },
  {
    id: 'playlists-section',
    name: 'PLAYLISTS',
    items: []
  },
  {
    id: 'custom-pages-section',
    name: 'PAGES',
    items: []
  }
]

// Make `sections` reactive, initialize from defaultSections
const sections = ref(sanitizeSections(JSON.parse(JSON.stringify(defaultSections))))

// Utility to configure draggable group based on section
const getDraggableGroup = (sectionId) => {
  if (sectionId === 'playlists-section') {
    // Dragging from playlists → clone instead of move, and do not allow dropping back
    return { name: 'items', pull: 'clone', put: false }
  }
  if (sectionId === 'custom-pages-section') {
    // Allow moving/nesting pages among themselves
    return { name: 'items', pull: true, put: true }
  }
  // For other sections (primary-nav, library-section), disable drag-and-drop
  return { name: 'items', pull: false, put: false }
}

// ─── LOAD/SAVE SIDEBAR CONFIG ─────────────────────────────────────────────────
const loadSidebarConfig = async () => {
  try {
    const saved = localStorage.getItem('sidebarConfig')
    if (saved) {
      const loadedSections = JSON.parse(saved)

      // Ensure protected sections always exist
      const hasPlaylistsSection = loadedSections.some(s => s.id === 'playlists-section')
      const hasLibrarySection = loadedSections.some(s => s.id === 'library-section')
      const hasPrimaryNav = loadedSections.some(s => s.id === 'primary-nav')

      if (!hasPlaylistsSection) {
        loadedSections.splice(2, 0, {
          id: 'playlists-section',
          name: 'PLAYLISTS',
          items: []
        })
      }
      if (!hasLibrarySection) {
        loadedSections.splice(1, 0, {
          id: 'library-section',
          name: 'LIBRARY',
          items: [
            { id: 'songs', type: 'route', label: 'Songs', icon: 'music', view: 'all-songs' },
            { id: 'artists', type: 'route', label: 'Artists', icon: 'artist', view: 'artists' },
            { id: 'playlists', type: 'route', label: 'Playlists', icon: 'playlist', view: 'playlists' }
          ]
        })
      }
      if (!hasPrimaryNav) {
        loadedSections.splice(0, 0, {
          id: 'primary-nav',
          name: null,
          items: [
            { id: 'home', type: 'route', label: 'Home', icon: 'home', view: 'home' },
            { id: 'search', type: 'route', label: 'Search', icon: 'search', view: 'search' }
          ]
        })
      }

      sections.value = sanitizeSections(loadedSections)
    }
  } catch (error) {
    console.error('Failed to load sidebar config:', error)
    sections.value = sanitizeSections(JSON.parse(JSON.stringify(defaultSections)))
  }
}

const saveSidebarConfig = () => {
  try {
    localStorage.setItem('sidebarConfig', JSON.stringify(sections.value))
  } catch (error) {
    console.error('Failed to save sidebar config:', error)
  }
}

// ─── WATCH PROPS TO UPDATE COUNTS / ITEMS ────────────────────────────────────
watch(
  () => props.songs,
  () => updateCounts(),
  { deep: true }
)
watch(
  () => props.artists,
  () => updateCounts(),
  { deep: true }
)
watch(
  () => props.playlists,
  () => {
    updateCounts()
    updatePlaylistItems()
  },
  { deep: true }
)
watch(
  () => props.customPages,
  () => {
    updateCustomPageItems()
  },
  { deep: true }
)

// Also watch nested folder data changes
watch(
  () => props.customPages,
  (newPages, oldPages) => {
    if (newPages && oldPages) {
      const hasDataChanges = newPages.some((page, idx) => {
        if (page.type === 'folder' && oldPages[idx]) {
          return JSON.stringify(page.data) !== JSON.stringify(oldPages[idx].data)
        }
        return false
      })
      if (hasDataChanges) {
        console.log('Folder data changed, updating sidebar')
        updateCustomPageItems()
      }
    }
  },
  { deep: true }
)

const updateCounts = () => {
  sections.value.forEach(section => {
    if (Array.isArray(section.items)) {
      section.items.forEach(item => {
        if (item.id === 'songs') {
          item.count = props.songs?.length || 0
        } else if (item.id === 'artists') {
          item.count = props.artists?.length || 0
        } else if (item.id === 'playlists') {
          item.count = props.playlists?.length || 0
        }
      })
    }
  })
}

const updatePlaylistItems = () => {
  const playlistSection = sections.value.find(s => s.id === 'playlists-section')
  if (playlistSection && props.playlists) {
    if (!playlistSection.items) playlistSection.items = []

    const existingIds = new Set(playlistSection.items.map(item => item.playlistId))
    const newPlaylists = props.playlists.filter(p => !existingIds.has(p.id))

    newPlaylists.forEach(playlist => {
      playlistSection.items.push({
        id: `playlist-${playlist.id}`,
        type: 'playlist',
        label: playlist.name,
        playlistId: playlist.id,
        view: 'playlist'
      })
    })

    const currentIds = new Set(props.playlists.map(p => p.id))
    playlistSection.items = playlistSection.items.filter(item => currentIds.has(item.playlistId))

    playlistSection.items.forEach(item => {
      const playlist = props.playlists.find(p => p.id === item.playlistId)
      if (playlist) {
        item.label = playlist.name
      }
    })
  }
}

const updateCustomPageItems = () => {
  const pagesSection = sections.value.find(s => s.id === 'custom-pages-section')
  if (pagesSection && props.customPages) {
    if (!pagesSection.items) pagesSection.items = []

    // Build nested structure
    const rootPages = props.customPages.filter(page => !page.parentId)
    const nestedItems = rootPages.map(page => buildNestedItem(page))

    pagesSection.items = flattenItems(nestedItems)
  }
}

const flattenItems = (items, result = []) => {
  items.forEach(item => {
    result.push(item)
    if (item.children && item.expanded) {
      flattenItems(item.children, result)
    }
  })
  return result
}

const buildNestedItem = (page, level = 0) => {
  const item = {
    id: `custom-${page.id}`,
    type: 'custom-page',
    label: page.title,
    icon: getPageTypeIcon(page.type),
    customPageId: page.id,
    view: `custom-${page.id}`,
    pageType: page.type,
    pageData: page,
    level,
    expanded: expandedFolders.value.has(page.id)
  }
  if (page.type === 'folder') {
    const children = props.customPages.filter(p => p.parentId === page.id)
    if (children.length > 0) {
      item.children = children.map(child => buildNestedItem(child, level + 1))
    }
  }
  return item
}

const toggleFolderExpansion = (folderId) => {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  } else {
    expandedFolders.value.add(folderId)
  }
  expandedFolders.value = new Set(expandedFolders.value)
  updateCustomPageItems()
}

const getPageTypeIcon = (type) => {
  const typeMap = {
    calendar: 'calendar',
    timeline: 'timeline',
    assets: 'folder',
    moodboard: 'palette',
    ideas: 'lightbulb',
    dashboard: 'dashboard',
    folder: 'folder'
  }
  return typeMap[type] || 'document'
}

const isItemActive = (item) => {
  if (item.view === props.activeView) {
    if (item.type === 'playlist') {
      return item.playlistId === props.activePlaylistId
    } else if (item.type === 'custom-page') {
      return item.customPageId === props.activeCustomPageId
    }
    return true
  }
  return false
}

// Handle item click (route / playlist / custom-page)
const handleItemClick = (item) => {
  if (item.type === 'playlist') {
    emit('set-active-view', 'playlist', item.playlistId)
  } else if (item.type === 'custom-page') {
    emit('set-active-view', `custom-${item.customPageId}`)
  } else if (item.view) {
    emit('set-active-view', item.view)
  }
}

const handleContextMenu = (event, item) => {
  if (isEditMode.value) {
    event.preventDefault()
    if (!isProtectedItem(item)) {
      editingItem.value = { ...item }
    }
    return
  }
  if (item.type === 'playlist') {
    const playlist = props.playlists.find(p => p.id === item.playlistId)
    if (playlist) {
      emit('show-context-menu', event, [playlist], 'playlist')
    }
  } else if (item.type === 'custom-page') {
    event.preventDefault()
    const page = props.customPages.find(p => p.id === item.customPageId)
    if (page) {
      contextMenuItem.value = { ...item, pageData: page }
      contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    }
  }
}

const handleSidebarContextMenu = (event) => {
  if (
    event.target.classList.contains('sidebar-nav') ||
    event.target.classList.contains('nav-section')
  ) {
    event.preventDefault()
    contextMenuItem.value = { type: 'sidebar-background' }
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  }
}

const hasChildren = (item) => {
  if (item.type !== 'custom-page' || item.pageType !== 'folder') return false
  return props.customPages.some(p => p.parentId === item.customPageId)
}

// ─── DRAG & DROP ─────────────────────────────────────────────────────────────
const handleItemDragStart = (item, event) => {
  event.dataTransfer.effectAllowed = 'move'
  if (item.type === 'playlist') {
    const playlist = props.playlists.find(p => p.id === item.playlistId)
    if (playlist) {
      event.dataTransfer.setData(
        'application/x-music-player-playlist',
        JSON.stringify(playlist)
      )
    }
  }
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      type: 'sidebar-item',
      item: {
        ...item,
        pageType: item.pageType || null
      }
    })
  )
}

const handleItemDragEnter = (item, event) => {
  if (item.type === 'playlist') {
    emit('drag-enter', item.playlistId)
  } else if (item.type === 'custom-page' && item.pageType === 'folder') {
    dragOverItemId.value = item.id
  }
}

const handleItemDragOver = (item, event) => {
  event.preventDefault()
  if (item.type === 'playlist') {
    emit('drag-over', event)
  } else if (item.type === 'custom-page' && item.pageType === 'folder') {
    event.dataTransfer.dropEffect = 'move'
    event.currentTarget.classList.add('drop-ready')
  }
}

const handleItemDragLeave = (item, event) => {
  if (item.type === 'playlist') {
    emit('drag-leave', event)
  } else if (item.type === 'custom-page' && item.pageType === 'folder') {
    event.currentTarget.classList.remove('drop-ready')
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      if (dragOverItemId.value === item.id) {
        dragOverItemId.value = null
      }
    }
  }
}

const handleItemDrop = async (item, event) => {
  event.preventDefault()
  event.stopPropagation()
  if (dragOverItemId.value === item.id) {
    dragOverItemId.value = null
  }

  // If dropping onto a playlist row
  if (item.type === 'playlist') {
    emit('playlist-drop', event, item.playlistId)
    return
  }

  // If dropping onto a folder row
  if (item.type === 'custom-page' && item.pageType === 'folder') {
    const folderId = item.customPageId
    try {
      // 1) System file drops
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const files = Array.from(event.dataTransfer.files)
        const paths = files.map(f => f.path).filter(Boolean)
        if (paths.length === 0) {
          console.warn('No valid file paths found in drop')
          return
        }
        console.log('📁 Files dropped on folder:', { paths, folderId })
        try {
          const result = await invoke('import_music_files', { file_paths: paths })
          if (result.success && result.songs && result.songs.length > 0) {
            emit('action', {
              type: 'add-to-folder',
              items: result.songs,
              folderId: folderId
            })
            emit('action', {
              type: 'show-toast',
              message: `Added ${result.songs.length} songs to folder`,
              type: 'success'
            })
          } else if (result.imported_count > 0) {
            emit('action', { type: 'refresh-library' })
            emit('action', {
              type: 'show-toast',
              message: `Imported ${result.imported_count} songs. Add them from the Songs view.`,
              type: 'info'
            })
          }
        } catch (error) {
          console.error('Error importing dropped files:', error)
          emit('action', {
            type: 'show-error',
            message: `Failed to import files: ${error}`
          })
        }
        return
      }

      let handled = false

      // 2) Try song-specific data drop
      const songData = event.dataTransfer.getData('application/x-music-player-songs')
      if (songData && !handled) {
        try {
          const parsed = JSON.parse(songData)
          if (parsed.items) {
            emit('action', {
              type: 'add-to-folder',
              items: parsed.items,
              folderId: folderId
            })
            handled = true
          }
        } catch (err) {
          console.warn('Failed to parse song data:', err)
        }
      }

      // 3) Try playlist-specific data drop
      const playlistData = event.dataTransfer.getData('application/x-music-player-playlist')
      if (playlistData && !handled) {
        try {
          const playlist = JSON.parse(playlistData)
          emit('action', {
            type: 'add-playlist-to-folder',
            playlist: playlist,
            folderId: folderId
          })
          handled = true
        } catch (err) {
          console.warn('Failed to parse playlist data:', err)
        }
      }

      // 4) Try generic JSON drop
      const jsonData = event.dataTransfer.getData('application/json')
      if (jsonData && !handled) {
        try {
          const data = JSON.parse(jsonData)
          if (data.type === 'songs' && data.items) {
            emit('action', {
              type: 'add-to-folder',
              items: data.items,
              folderId: folderId
            })
            handled = true
          } else if (data.type === 'playlist' && data.item) {
            emit('action', {
              type: 'add-playlist-to-folder',
              playlist: data.item,
              folderId: folderId
            })
            handled = true
          } else if (data.type === 'folder-items' && data.items) {
            emit('action', {
              type: 'move-between-folders',
              items: data.items,
              sourceFolderId: data.sourceFolderId,
              targetFolderId: folderId
            })
            handled = true
          } else if (data.type === 'sidebar-item' && data.item) {
            if (data.item.type === 'playlist') {
              const playlist = props.playlists.find(p => p.id === data.item.playlistId)
              if (playlist) {
                emit('action', {
                  type: 'add-playlist-to-folder',
                  playlist: playlist,
                  folderId: folderId
                })
                handled = true
              }
            } else if (
              data.item.type === 'custom-page' &&
              data.item.customPageId !== folderId
            ) {
              if (
                data.item.pageType === 'folder' &&
                isChildOf(data.item.customPageId, folderId)
              ) {
                console.warn('Cannot move folder into its own child')
                return
              }
              emit('action', {
                type: 'move-page-to-folder',
                pageId: data.item.customPageId,
                folderId: folderId
              })
              handled = true
            }
          }
        } catch (err) {
          console.warn('Failed to parse JSON data:', err)
        }
      }

      // 5) Try legacy text drop
      const textData = event.dataTransfer.getData('text/plain')
      if (textData && !handled && textData.startsWith('internal-drag:')) {
        console.log('Legacy drag format detected:', textData)
      }

      if (!handled) {
        const types = Array.from(event.dataTransfer.types)
        if (types.length > 0 && types.some(t => t !== 'Files')) {
          console.warn('No valid drop data found. Available types:', types)
        }
      }
    } catch (error) {
      console.error('Drop parsing error:', error)
      emit('action', {
        type: 'show-error',
        message: 'Failed to process dropped items'
      })
    }
  }
}

const isChildOf = (sourceId, targetId) => {
  let current = props.customPages.find(p => p.id === targetId)
  while (current && current.parentId) {
    if (current.parentId === sourceId) return true
    current = props.customPages.find(p => p.id === current.parentId)
  }
  return false
}

// ─── CONTEXT-MENU ACTION HANDLERS ────────────────────────────────────────────
const closeContextMenu = () => {
  contextMenuItem.value = null
}

const handleOpenFolder = (item) => {
  if (item.type === 'custom-page') {
    emit('set-active-view', `custom-${item.customPageId}`)
  }
}

const handleCreateSubfolder = (item) => {
  if (item.type === 'custom-page') {
    emit('create-folder', {
      parentId: item.customPageId,
      parentType: 'folder'
    })
  }
}

const handleCreateFolder = () => {
  emit('create-folder', {})
}

const handleDragStart = (event) => {
  // No-op (vue-draggable hook)
}

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    saveSidebarConfig()
  }
}

// ─── SECTION MANAGEMENT ──────────────────────────────────────────────────────
const addSection = () => {
  const newSection = {
    id: `section-${Date.now()}`,
    name: 'New Section',
    items: []
  }
  sections.value.push(newSection)
  editingSection.value = { ...newSection }
}

const editSection = (section) => {
  editingSection.value = { ...section }
}

const saveSection = () => {
  const idx = sections.value.findIndex(s => s.id === editingSection.value.id)
  if (idx !== -1) {
    sections.value[idx].name = editingSection.value.name
    saveSidebarConfig()
  }
  closeEditor()
}

const deleteSection = () => {
  if (isProtectedSection(editingSection.value.id)) {
    alert('This section cannot be deleted.')
    return
  }
  const idx = sections.value.findIndex(s => s.id === editingSection.value.id)
  if (idx !== -1) {
    sections.value.splice(idx, 1)
    saveSidebarConfig()
  }
  closeEditor()
}

const closeEditor = () => {
  editingSection.value = null
}

// ─── ITEM EDITING ────────────────────────────────────────────────────────────
const saveItem = () => {
  const sectionIndex = sections.value.findIndex(sec =>
    sec.items && sec.items.some(it => it.id === editingItem.value.id)
  )
  if (sectionIndex !== -1) {
    const itemIndex = sections.value[sectionIndex].items.findIndex(
      it => it.id === editingItem.value.id
    )
    if (itemIndex !== -1) {
      sections.value[sectionIndex].items[itemIndex].label = editingItem.value.label
      saveSidebarConfig()
    }
  }
  closeItemEditor()
}

const resetItem = () => {
  if (editingItem.value && originalLabels[editingItem.value.id]) {
    editingItem.value.label = originalLabels[editingItem.value.id]
    saveItem()
  }
}

const closeItemEditor = () => {
  editingItem.value = null
}

// ─── DELETE PAGE FUNCTIONS ───────────────────────────────────────────────────
const showDeleteConfirm = (item) => {
  if (!isProtectedItem(item)) {
    deletingPage.value = item
  }
}

const confirmDeletePage = () => {
  if (deletingPage.value && !isProtectedItem(deletingPage.value)) {
    emit('delete-custom-page', deletingPage.value.customPageId)
    deletingPage.value = null
  }
}

const cancelDeletePage = () => {
  deletingPage.value = null
}

// ─── PAGE CREATOR FUNCTIONS ─────────────────────────────────────────────────
const createPage = () => {
  if (!selectedPageType.value || !newPageTitle.value.trim()) return

  const pageConfig = {
    type: selectedPageType.value,
    title: newPageTitle.value.trim(),
    icon: getPageTypeIcon(selectedPageType.value),
    data: getDefaultPageData(selectedPageType.value),
    config: getDefaultPageConfig(selectedPageType.value)
  }

  emit('create-custom-page', pageConfig)
  closePageCreator()
}

const closePageCreator = () => {
  showPageCreator.value = false
  selectedPageType.value = ''
  newPageTitle.value = ''
}

// ─── DEFAULT DATA/CONFIG FOR PAGE TYPES ─────────────────────────────────────
const getDefaultPageData = (type) => {
  switch (type) {
    case 'folder':
      return { items: [], name: 'New Folder' }
    case 'calendar':
      return { events: [] }
    case 'timeline':
      return { items: [] }
    case 'assets':
      return { assets: [] }
    case 'moodboard':
      return { elements: [] }
    case 'ideas':
      return {
        boards: [
          { id: 'ideas', name: 'Ideas', color: '#667eea' },
          { id: 'todo', name: 'To Do', color: '#f59e0b' },
          { id: 'in-progress', name: 'In Progress', color: '#3b82f6' },
          { id: 'done', name: 'Done', color: '#10b981' }
        ],
        notes: []
      }
    case 'dashboard':
      return {
        sections: [
          {
            id: 'quick-access',
            type: 'quick-access',
            title: 'Quick access',
            items: []
          },
          {
            id: 'recent',
            type: 'recent',
            title: 'Recently played',
            items: [],
            limit: 8
          },
          {
            id: 'stats',
            type: 'stats',
            title: 'Overview',
            stats: []
          }
        ]
      }
    default:
      return {}
  }
}

const getDefaultPageConfig = (type) => {
  switch (type) {
    case 'folder':
      return { viewMode: 'grid', sortBy: 'name', sortOrder: 'asc' }
    case 'calendar':
      return { defaultView: 'month' }
    case 'timeline':
      return { viewMode: 'stack' }
    case 'assets':
      return { itemsPerPage: 24 }
    case 'moodboard':
      return { canvasSize: 2000, gridSize: 20 }
    case 'ideas':
      return { itemsPerPage: 20 }
    default:
      return {}
  }
}

// ─── ICON COMPONENTS ─────────────────────────────────────────────────────────
const getItemIcon = (item) => {
  const icons = {
    home: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' })),
    search: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' })),
    music: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' })),
    artist: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' })),
    playlist: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z' })),
    calendar: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z' })),
    timeline: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.64 6.56l-3.54 3.54c-.78-.78-2.05-.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0l1.41 1.41 2.12-2.12c.78-.78 2.05-.78 2.83 0s.78 2.05 0 2.83z' })),
    folder: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' })),
    palette: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.19 0 .34-.16.34-.34 0-.09-.03-.17-.09-.25-.27-.44-.64-1.41-.64-2.41 0-1.66 1.34-3 3-3h3.5c3.03 0 5.5-2.47 5.5-5.5C22 5.81 17.19 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' })),
    lightbulb: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z' })),
    dashboard: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' })),
    document: h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' }))
  }
  return icons[item.icon] || icons.playlist
}

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
onMounted(() => {
  loadSidebarConfig()
  sections.value = sections.value.map(sec => ({ ...sec, items: sec.items || [] }))
  updateCounts()
  updatePlaylistItems()
  updateCustomPageItems()

  document.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: rgba(18, 18, 18, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  height: 100%;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.logo-icon {
  width: 30px;
  height: 30px;
  color: #1db954;
}

.logo-text {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

/* “Prefs” gear button in sidebar header */
.prefs-toggle-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prefs-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.prefs-toggle-btn svg {
  width: 18px;
  height: 18px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.05) transparent;
}

.nav-section {
  margin-bottom: 16px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
}

.nav-section:not(:last-child)::after {
  content: '';
  display: block;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 16px 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 8px;
  height: 32px;
}

.section-handle {
  cursor: move;
  opacity: 0.5;
  font-size: 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  height: 36px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

/* .nav-item.drag-over kept for drop feedback */
.nav-item.drag-over {
  background: rgba(255, 255, 255, 0.08) !important;
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.nav-item[draggable='true'] {
  transition: all 0.15s ease;
}

.nav-item.drag-over.nested-1,
.nav-item.drag-over.nested-2,
.nav-item.drag-over.nested-3,
.nav-item.drag-over.nested-4 {
  background: rgba(29, 185, 84, 0.1) !important;
  outline-color: #1db954;
}

.nav-item.nested-1 {
  padding-left: 32px;
}
.nav-item.nested-2 {
  padding-left: 48px;
}
.nav-item.nested-3 {
  padding-left: 64px;
}
.nav-item.nested-4 {
  padding-left: 80px;
}

.folder-arrow {
  width: 20px;
  height: 20px;
  padding: 0;
  margin-left: -4px;
  margin-right: -4px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
}

.folder-arrow:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.folder-arrow svg {
  width: 16px;
  height: 16px;
  transition: transform 0.15s ease;
}

.folder-arrow.expanded svg {
  transform: rotate(90deg);
}

.folder-spacer {
  width: 20px;
  flex-shrink: 0;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.8;
}

.item-count {
  margin-left: auto;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.add-btn,
.edit-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.add-btn:hover,
.edit-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.add-btn svg,
.edit-btn svg {
  width: 16px;
  height: 16px;
}

.add-section-btn {
  width: 100%;
  padding: 12px;
  margin: 16px 0;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.add-section-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.8);
}

.item-edit-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
  margin-left: auto;
  margin-right: 4px;
  opacity: 0;
}

.nav-item:hover .item-edit-btn {
  opacity: 1;
}

.item-edit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.item-edit-btn svg {
  width: 12px;
  height: 12px;
}

.item-delete-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
  margin-right: 4px;
  opacity: 0;
}

.nav-item:hover .item-delete-btn {
  opacity: 1;
}

.item-delete-btn:hover {
  background: rgba(255, 85, 85, 0.1);
  color: rgba(255, 85, 85, 0.8);
}

.item-delete-btn svg {
  width: 12px;
  height: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #282828;
  padding: 24px;
  border-radius: 8px;
  min-width: 300px;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #fff;
}

.section-name-input,
.page-title-input {
  width: 100%;
  padding: 8px 12px;
  background-color: #3e3e3e;
  border: 1px solid #535353;
  color: #fff;
  border-radius: 4px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn {
  background-color: #1db954;
  color: #fff;
}

.save-btn:disabled {
  background-color: #535353;
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #b91c1c;
  color: #fff;
}

.cancel-btn {
  background-color: #3e3e3e;
  color: #fff;
}

.edit-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 8px 0 16px 0;
}

.reset-btn {
  background-color: #535353;
  color: #fff;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.delete-warning {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  line-height: 1.4;
}

/* Page Creator Modal */
.page-creator {
  max-width: 600px;
  width: 90vw;
}

.page-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.page-type-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.page-type-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.page-type-card.selected {
  background: rgba(29, 185, 84, 0.1);
  border-color: #1db954;
}

.page-type-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: rgba(255, 255, 255, 0.6);
}

.page-type-icon svg {
  width: 100%;
  height: 100%;
}

.page-type-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #fff;
}

.page-type-card p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

/* Context Menu */
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.context-menu {
  position: fixed;
  background: rgba(40, 40, 40, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  min-width: 180px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  z-index: 1000;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.context-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.danger {
  color: #ff5555;
}

.context-menu-item.danger:hover {
  background: rgba(255, 85, 85, 0.1);
}

.context-menu-item svg {
  width: 16px;
  height: 16px;
  opacity: 0.8;
}

.context-menu-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 8px;
}

/* Drag styles */
.sortable-ghost {
  opacity: 0.5;
}

.sortable-drag {
  background-color: #282828;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Drop feedback */
.nav-item.drop-ready {
  background: rgba(29, 185, 84, 0.15) !important;
  outline: 2px dashed #1db954;
  transition: all 0.2s ease;
}

.nav-item.drop-ready::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px dashed #1db954;
  border-radius: 8px;
  opacity: 0.5;
  pointer-events: none;
}

/* Loading state */
.nav-item.dropping {
  opacity: 0.7;
  pointer-events: none;
}

.nav-item.dropping::before {
  content: '⟳';
  position: absolute;
  right: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

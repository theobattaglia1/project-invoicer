<template>
    <div class="user-management-view">
      <!-- Header -->
      <div class="view-header">
        <h1 class="view-title">User Management</h1>
        <button @click="showInviteModal = true" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Invite User
        </button>
      </div>
  
      <!-- Tabs -->
      <div class="tabs">
        <button 
          @click="activeTab = 'team'" 
          :class="['tab', { active: activeTab === 'team' }]"
        >
          Team Members
        </button>
        <button 
          @click="activeTab = 'artists'" 
          :class="['tab', { active: activeTab === 'artists' }]"
        >
          Artist Accounts
        </button>
        <button 
          @click="activeTab = 'pending'" 
          :class="['tab', { active: activeTab === 'pending' }]"
        >
          Pending Invites
          <span v-if="pendingInvites.length > 0" class="badge">{{ pendingInvites.length }}</span>
        </button>
      </div>
  
      <!-- Team Members Tab -->
      <div v-if="activeTab === 'team'" class="content-section">
        <div v-if="teamMembers.length === 0" class="empty-state">
          <p>No team members yet</p>
        </div>
        <div v-else class="user-grid">
          <div v-for="member in teamMembers" :key="member.id" class="user-card">
            <div class="user-info">
              <h3>{{ member.name }}</h3>
              <p>{{ member.email }}</p>
              <span class="role-badge">{{ member.role }}</span>
            </div>
            <div class="user-permissions">
              <h4>Artist Access</h4>
              <div v-if="member.role === 'editor'" class="permission-list">
                <div v-for="perm in getPermissionsForUser(member.id)" :key="perm.id" class="permission-item">
                  <span>{{ getArtistName(perm.artist_id) }}</span>
                  <button @click="removePermission(perm)" class="btn-remove">×</button>
                </div>
                <button @click="addPermissionForUser(member)" class="btn-add-permission">
                  + Add Artist
                </button>
              </div>
              <div v-else class="all-access">
                <span>Full access (Owner)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Artist Accounts Tab -->
      <div v-if="activeTab === 'artists'" class="content-section">
        <div v-if="artistAccounts.length === 0" class="empty-state">
          <p>No artist accounts yet</p>
        </div>
        <div v-else class="user-grid">
          <div v-for="artist in artistAccounts" :key="artist.id" class="user-card">
            <div class="user-info">
              <h3>{{ artist.name }}</h3>
              <p>{{ artist.email }}</p>
              <span class="role-badge artist">Artist</span>
            </div>
            <div class="linked-artist">
              <p>Linked to: <strong>{{ getArtistName(artist.artist_id) }}</strong></p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Pending Invites Tab -->
      <div v-if="activeTab === 'pending'" class="content-section">
        <div v-if="pendingInvites.length === 0" class="empty-state">
          <p>No pending invitations</p>
        </div>
        <div v-else class="invite-list">
          <div v-for="invite in pendingInvites" :key="invite.id" class="invite-item">
            <div class="invite-info">
              <h4>{{ invite.email }}</h4>
              <p>Role: {{ invite.role }}</p>
              <p v-if="invite.artist_id">Artist: {{ getArtistName(invite.artist_id) }}</p>
              <p class="invite-date">Sent: {{ formatDate(invite.created_at) }}</p>
            </div>
            <button @click="cancelInvite(invite)" class="btn-cancel">Cancel</button>
          </div>
        </div>
      </div>
  
      <!-- Invite Modal -->
      <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>Invite User</h2>
            <button @click="closeInviteModal" class="modal-close">×</button>
          </div>
          
          <form @submit.prevent="sendInvite" class="invite-form">
            <div class="form-group">
              <label>Email Address</label>
              <input 
                v-model="inviteForm.email" 
                type="email" 
                required
                placeholder="user@example.com"
              />
            </div>
            
            <div class="form-group">
              <label>User Type</label>
              <select v-model="inviteForm.userType" required>
                <option value="">Select type</option>
                <option value="editor">Team Member (Editor)</option>
                <option value="artist">Artist</option>
              </select>
            </div>
            
            <div v-if="inviteForm.userType === 'artist'" class="form-group">
              <label>Link to Artist</label>
              <select v-model="inviteForm.artistId" required>
                <option value="">Select artist</option>
                <option 
                  v-for="artist in availableArtists" 
                  :key="artist.id" 
                  :value="artist.id"
                >
                  {{ artist.name }}
                </option>
              </select>
            </div>
            
            <div v-if="inviteForm.userType === 'editor'" class="form-group">
              <label>Initial Artist Access</label>
              <div class="checkbox-list">
                <label class="checkbox-item">
                  <input 
                    type="checkbox" 
                    v-model="inviteForm.fullAccess"
                    @change="toggleFullAccess"
                  />
                  Grant access to all artists
                </label>
                <div v-if="!inviteForm.fullAccess" class="artist-checkboxes">
                  <label 
                    v-for="artist in artists" 
                    :key="artist.id"
                    class="checkbox-item"
                  >
                    <input 
                      type="checkbox" 
                      :value="artist.id"
                      v-model="inviteForm.selectedArtists"
                    />
                    {{ artist.name }}
                  </label>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeInviteModal" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="sending">
                {{ sending ? 'Sending...' : 'Send Invitation' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { supabase } from '@/lib/supabase'
  import { useArtistStore } from '@/store/artistStore'
  
  const artistStore = useArtistStore()
  
  // State
  const activeTab = ref('team')
  const showInviteModal = ref(false)
  const sending = ref(false)
  const users = ref([])
  const permissions = ref([])
  const pendingInvites = ref([])
  
  const inviteForm = ref({
    email: '',
    userType: '',
    artistId: '',
    fullAccess: false,
    selectedArtists: []
  })
  
  // Computed
  const artists = computed(() => artistStore.sortedArtists)
  
  const teamMembers = computed(() => 
    users.value.filter(u => ['owner', 'editor', 'invoicer'].includes(u.role))
  )
  
  const artistAccounts = computed(() => 
    users.value.filter(u => u.role === 'artist')
  )
  
  const availableArtists = computed(() => {
    const linkedArtistIds = artistAccounts.value.map(a => a.artist_id).filter(Boolean)
    return artists.value.filter(a => !linkedArtistIds.includes(a.id))
  })
  
  // Methods
  const getArtistName = (artistId) => {
    const artist = artistStore.getArtistById(artistId)
    return artist ? artist.name : 'Unknown Artist'
  }
  
  const getPermissionsForUser = (userId) => {
    return permissions.value.filter(p => p.user_id === userId)
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }
  
  const toggleFullAccess = () => {
    if (inviteForm.value.fullAccess) {
      inviteForm.value.selectedArtists = artists.value.map(a => a.id)
    } else {
      inviteForm.value.selectedArtists = []
    }
  }
  
  const closeInviteModal = () => {
    showInviteModal.value = false
    inviteForm.value = {
      email: '',
      userType: '',
      artistId: '',
      fullAccess: false,
      selectedArtists: []
    }
  }
  
  const sendInvite = async () => {
    sending.value = true
    
    try {
      // 1. Create the Supabase auth invitation
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        inviteForm.value.email,
        {
          data: {
            user_type: inviteForm.value.userType,
            artist_id: inviteForm.value.artistId,
            selected_artists: inviteForm.value.selectedArtists
          }
        }
      )
      
      if (authError) throw authError
      
      // 2. Store pending invite details
      const { error: inviteError } = await supabase
        .from('pending_invites')
        .insert({
          email: inviteForm.value.email,
          role: inviteForm.value.userType,
          artist_id: inviteForm.value.artistId,
          selected_artists: inviteForm.value.selectedArtists,
          invited_by: (await supabase.auth.getUser()).data.user.id
        })
      
      if (inviteError) throw inviteError
      
      showToast('Invitation sent successfully!', 'success')
      closeInviteModal()
      await loadData()
      
    } catch (error) {
      console.error('Failed to send invite:', error)
      showToast('Failed to send invitation', 'error')
    } finally {
      sending.value = false
    }
  }
  
  const loadData = async () => {
    try {
      // Load users
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('*')
      
      users.value = userData || []
      
      // Load permissions
      const { data: permData } = await supabase
        .from('user_artist_permissions')
        .select('*')
      
      permissions.value = permData || []
      
      // Load pending invites
      const { data: inviteData } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('accepted', false)
      
      pendingInvites.value = inviteData || []
      
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }
  
  const showToast = (message, type) => {
    // Use your toast component
    console.log(`${type}: ${message}`)
  }
  
  onMounted(() => {
    loadData()
  })
  </script>
  
  <style scoped>
  .user-management-view {
    padding: 32px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  
  .view-title {
    font-size: 18px;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  
  /* Tabs */
  .tabs {
    display: flex;
    gap: 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 32px;
  }
  
  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .tab:hover {
    color: white;
  }
  
  .tab.active {
    color: white;
  }
  
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #1db954;
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: rgba(29, 185, 84, 0.2);
    color: #1db954;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }
  
  /* User Cards */
  .user-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 24px;
  }
  
  .user-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
  }
  
  .user-info h3 {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin: 0 0 4px 0;
  }
  
  .user-info p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 12px 0;
  }
  
  .role-badge {
    display: inline-flex;
    padding: 4px 12px;
    background: rgba(29, 185, 84, 0.2);
    color: #1db954;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .role-badge.artist {
    background: rgba(156, 39, 176, 0.2);
    color: #9c27b0;
  }
  
  /* Modal */
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
    font-size: 18px;
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
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  /* Form */
  .invite-form {
    padding: 24px;
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
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: #1db954;
  }
  
  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .checkbox-item input[type="checkbox"] {
    width: auto;
    margin: 0;
  }
  
  .artist-checkboxes {
    margin-top: 12px;
    padding-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
  }
  
  /* Buttons */
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #1db954;
    color: white;
    border: none;
    border-radius: 24px;
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
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .empty-state p {
    font-size: 16px;
  }
  </style>
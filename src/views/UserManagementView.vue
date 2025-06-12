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
                      <span class="role-badge">{{ formatRole(member.role) }}</span>
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
                      <div v-else-if="member.role === 'owner'" class="all-access">
                          <span>Full access (Owner)</span>
                      </div>
                      <div v-else-if="member.role === 'invoicer'" class="all-access">
                          <span>Can create invoices for all artists</span>
                      </div>
                  </div>
                  <div class="user-actions">
                      <button v-if="member.role !== 'owner'" @click="editUser(member)" class="btn-icon">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                      </button>
                      <button v-if="member.role !== 'owner'" @click="deleteUser(member)" class="btn-icon danger">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                      </button>
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
                  <div class="user-actions">
                      <button @click="editUser(artist)" class="btn-icon">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                      </button>
                      <button @click="deleteUser(artist)" class="btn-icon danger">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                      </button>
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
                      <p>Role: {{ formatRole(invite.role) }}</p>
                      <p v-if="invite.artist_id">Artist: {{ getArtistName(invite.artist_id) }}</p>
                      <p class="invite-date">Sent: {{ formatDate(invite.created_at) }}</p>
                      <p class="invite-expiry">Expires: {{ formatDate(invite.expires_at) }}</p>
                  </div>
                  <div class="invite-actions">
                      <button @click="resendInvite(invite)" class="btn-resend">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                          </svg>
                          Resend
                      </button>
                      <button @click="cancelInvite(invite)" class="btn-cancel">Cancel</button>
                  </div>
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
                      <label>Email Address *</label>
                      <input 
                          v-model="inviteForm.email" 
                          type="email" 
                          required
                          placeholder="user@example.com"
                      />
                      <p class="form-hint">User will receive an email invitation to create their account</p>
                  </div>
                  
                  <div class="form-group">
                      <label>User Type *</label>
                      <select v-model="inviteForm.userType" required>
                          <option value="">Select type</option>
                          <option value="editor">Team Member (Editor)</option>
                          <option value="invoicer">Team Member (Invoicer)</option>
                          <option value="artist">Artist</option>
                      </select>
                  </div>
                  
                  <div v-if="inviteForm.userType === 'artist'" class="form-group">
                      <label>Link to Artist *</label>
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
import { showToast } from '@/utils/toast'
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

// Get site URL dynamically
const siteUrl = window.location.origin

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

const formatRole = (role) => {
  const roleMap = {
      owner: 'Owner',
      editor: 'Editor',
      invoicer: 'Invoicer',
      artist: 'Artist',
      viewer: 'Viewer'
  }
  return roleMap[role] || role
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
      // Get current user for invited_by
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // Generate a unique invitation token
      const inviteToken = crypto.randomUUID()
      
      // Create invitation record
      const inviteData = {
          email: inviteForm.value.email,
          role: inviteForm.value.userType,
          artist_id: inviteForm.value.artistId || null,
          selected_artists: inviteForm.value.selectedArtists,
          invited_by: currentUser?.id,
          invite_token: inviteToken,
          accepted: false,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
      
      const { data: invite, error: inviteError } = await supabase
          .from('pending_invites')
          .insert(inviteData)
          .select()
          .single()
      
      if (inviteError) throw inviteError
      
      // For now, in development, show the signup link
      const signupLink = `${siteUrl}/auth/signup?token=${inviteToken}`
      
      // In development, copy to clipboard and show alert
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          navigator.clipboard.writeText(signupLink)
          alert(`Invitation created!\n\nSignup link copied to clipboard:\n${signupLink}\n\nIn production, this would be sent via email to ${inviteForm.value.email}`)
      } else {
          // For production, call edge function to send email
          try {
              const { data: emailData, error: emailError } = await supabase.functions.invoke('invite-users', {
                  body: { inviteId: invite.id }
              })
              
              if (emailError) throw emailError
              
              if (emailData.signupUrl && !emailData.success) {
                  // Email service not configured, show manual link
                  showToast(`Email service not configured. Share this link: ${emailData.signupUrl}`, 'info')
              } else {
                  showToast('Invitation email sent successfully!', 'success')
              }
          } catch (err) {
              console.error('Email send error:', err)
              // Fallback to showing the link
              showToast(`Send this link to ${inviteForm.value.email}: ${signupLink}`, 'info')
          }
      }
      
      closeInviteModal()
      await loadData()
      
  } catch (error) {
      console.error('Failed to send invite:', error)
      showToast('Failed to send invitation: ' + error.message, 'error')
  } finally {
      sending.value = false
  }
}

const resendInvite = async (invite) => {
  try {
      // Generate a new invitation token and extend expiry
      const newToken = crypto.randomUUID()
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { error: updateError } = await supabase
          .from('pending_invites')
          .update({ 
              invite_token: newToken,
              expires_at: newExpiry,
              updated_at: new Date().toISOString()
          })
          .eq('id', invite.id)
      if (updateError) throw updateError
      
      // Send a new magic link via Supabase
      const { error: emailError } = await supabase.auth.signInWithOtp({
          email: invite.email,
          options: {
              shouldCreateUser: true,
              data: {
                  invite_token: newToken,
                  role: invite.role,
                  artist_id: invite.artist_id,
                  selected_artists: invite.selected_artists,
                  invited_by: invite.invited_by
              },
              emailRedirectTo: `${siteUrl}/auth/callback`
          }
      })
      if (emailError) throw emailError
      
      showToast('Invitation resent successfully!', 'success')
      await loadData()
  } catch (error) {
      console.error('Failed to resend invitation:', error)
      showToast('Failed to resend invitation', 'error')
  }
}

const cancelInvite = async (invite) => {
  if (confirm('Are you sure you want to cancel this invitation?')) {
      try {
          await supabase
              .from('pending_invites')
              .delete()
              .eq('id', invite.id)
          
          showToast('Invitation cancelled', 'success')
          await loadData()
      } catch (error) {
          showToast('Failed to cancel invitation', 'error')
      }
  }
}

const editUser = (user) => {
  // Implement edit functionality
  showToast('Edit functionality coming soon', 'info')
}

const deleteUser = async (user) => {
  if (confirm(`Are you sure you want to delete ${user.name}'s account?`)) {
      try {
          // Note: You'll need to set up a server-side function to delete users
          // as the client SDK doesn't support user deletion
          showToast('User deletion requires server-side implementation', 'info')
      } catch (error) {
          showToast('Failed to delete user', 'error')
      }
  }
}

const removePermission = async (permission) => {
  try {
      await supabase
          .from('user_artist_permissions')
          .delete()
          .eq('id', permission.id)
      
      showToast('Permission removed', 'success')
      await loadData()
  } catch (error) {
      showToast('Failed to remove permission', 'error')
  }
}

const addPermissionForUser = (user) => {
  // Implement add permission functionality
  showToast('Add permission functionality coming soon', 'info')
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
          .order('created_at', { ascending: false })
      pendingInvites.value = inviteData || []
      
  } catch (error) {
      console.error('Failed to load data:', error)
  }
}

const showToast = (message, type) => {
  showToast('Saved', 'success')}

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
  font-size: 48px;
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
  position: relative;
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

.user-permissions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-permissions h4 {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 12px 0;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.btn-remove {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  color: #f44336;
}

.btn-add-permission {
  padding: 8px 12px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-permission:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}

.all-access {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.linked-artist {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.linked-artist p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.linked-artist strong {
  color: white;
}

.user-actions {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
}

/* Invite List */
.invite-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.invite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.invite-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.invite-info p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 4px 0;
}

.invite-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.invite-expiry {
  font-size: 12px;
  color: #ff9800;
}

.invite-actions {
  display: flex;
  gap: 8px;
}

.btn-resend {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 8px;
  color: #2196f3;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-resend:hover {
  background: rgba(33, 150, 243, 0.3);
}

.btn-resend svg {
  width: 16px;
  height: 16px;
}

.btn-cancel {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: #f44336;
  color: #f44336;
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

/* Form */
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

.form-group select option {
  background: #1e1e1e;
}

.form-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
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
  max-height: 200px;
  overflow-y: auto;
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

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-icon.danger:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
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

/* Scrollbar */
.invite-form::-webkit-scrollbar,
.artist-checkboxes::-webkit-scrollbar {
  width: 8px;
}

.invite-form::-webkit-scrollbar-track,
.artist-checkboxes::-webkit-scrollbar-track {
  background: transparent;
}

.invite-form::-webkit-scrollbar-thumb,
.artist-checkboxes::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.invite-form::-webkit-scrollbar-thumb:hover,
.artist-checkboxes::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

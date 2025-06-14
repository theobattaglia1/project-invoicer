<template>
  <div class="user-management-view">
    <!-- Header -->
    <div class="view-header">
      <h1 class="view-title">User Management</h1>
      <button @click="showInviteModal = true" class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        Create User
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button @click="activeTab = 'team'" :class="['tab', { active: activeTab === 'team' }]">
        Team Members
      </button>
      <button @click="activeTab = 'artists'" :class="['tab', { active: activeTab === 'artists' }]">
        Artist Accounts
      </button>
    </div>

    <!-- Team Members -->
    <div v-if="activeTab === 'team'" class="content-section">
      <p v-if="teamMembers.length === 0" class="empty-state">No team members yet</p>

      <div v-else class="user-grid">
        <div v-for="member in teamMembers" :key="member.id" class="user-card">
          <div class="user-info">
            <h3>{{ member.name }}</h3>
            <p>{{ member.email }}</p>
            <span class="role-badge">{{ formatRole(member.role) }}</span>
          </div>

          <div class="user-permissions">
            <h4>Artist Access</h4>
            <template v-if="member.role === 'editor'">
              <div class="permission-list">
                <div
                  v-for="perm in getPermissionsForUser(member.id)"
                  :key="perm.id"
                  class="permission-item"
                >
                  <span>{{ getArtistName(perm.artist_id) }}</span>
                  <button @click="removePermission(perm)" class="btn-remove">×</button>
                </div>
              </div>
              <button @click="addPermissionForUser(member)" class="btn-add-permission">
                + Add Artist
              </button>
            </template>
            <p v-else-if="member.role === 'owner'" class="all-access">Full access (Owner)</p>
            <p v-else-if="member.role === 'invoicer'" class="all-access">Can invoice all artists</p>
          </div>

          <div class="user-actions">
            <button v-if="member.role !== 'owner'" @click="resetPassword(member)" class="btn-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
                />
              </svg>
            </button>
            <button v-if="member.role !== 'owner'" @click="deleteUser(member)" class="btn-icon danger">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Artist Accounts -->
    <div v-if="activeTab === 'artists'" class="content-section">
      <p v-if="artistAccounts.length === 0" class="empty-state">No artist accounts yet</p>

      <div v-else class="user-grid">
        <div v-for="artist in artistAccounts" :key="artist.id" class="user-card">
          <div class="user-info">
            <h3>{{ artist.name }}</h3>
            <p>{{ artist.email }}</p>
            <span class="role-badge artist">Artist</span>
          </div>

          <p class="linked-artist">Linked to: <strong>{{ getArtistName(artist.artist_id) }}</strong></p>

          <div class="user-actions">
            <button @click="resetPassword(artist)" class="btn-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
                />
              </svg>
            </button>
            <button @click="deleteUser(artist)" class="btn-icon danger">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create‑user modal -->
    <InviteModal
      v-if="showInviteModal"
      :artists="artists"
      :available-artists="availableArtists"
      :sending="sending"
      :form="inviteForm"
      @close="closeInviteModal"
      @submit="createUser"
    />

    <!-- Credentials modal -->
    <CredentialsModal
      v-if="showCredentialsModal"
      :creds="createdCredentials"
      @close="showCredentialsModal = false"
      @copy="copyCredentials"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useArtistStore } from '@/store/artistStore'
import { showToast } from '@/utils/toast'

import InviteModal from '@/components/InviteModal.vue'
import CredentialsModal from '@/components/CredentialsModal.vue'

/* ───────────────────────── stores */
const artistStore = useArtistStore()

/* ───────────────────────── reactive state */
const activeTab = ref('team')
const showInviteModal = ref(false)
const showCredentialsModal = ref(false)
const sending = ref(false)

const users = ref([])
const permissions = ref([])

const createdCredentials = ref({ email: '', password: '' })
const inviteForm = ref({
  email: '',
  userType: '',
  artistId: '',
  fullAccess: false,
  selectedArtists: []
})

/* ───────────────────────── computed */
const artists = computed(() => artistStore.sortedArtists)
const teamMembers = computed(() => users.value.filter(u => ['owner', 'editor', 'invoicer', 'viewer'].includes(u.role)))
const artistAccounts = computed(() => users.value.filter(u => u.role === 'artist'))
const availableArtists = computed(() => {
  const linked = artistAccounts.value.map(a => a.artist_id).filter(Boolean)
  return artists.value.filter(a => !linked.includes(a.id))
})

/* ───────────────────────── helpers */
const getArtistName = id => artistStore.getArtistById(id)?.name || 'Unknown Artist'
const getPermissionsForUser = uid => permissions.value.filter(p => p.user_id === uid)
const formatRole = r => ({ owner: 'Owner', editor: 'Editor', invoicer: 'Invoicer', artist: 'Artist', viewer: 'Viewer' }[r] || r)

const toggleFullAccess = () => {
  inviteForm.value.selectedArtists = inviteForm.value.fullAccess ? artists.value.map(a => a.id) : []
}

const closeInviteModal = () => {
  showInviteModal.value = false
  inviteForm.value = { email: '', userType: '', artistId: '', fullAccess: false, selectedArtists: [] }
}

/* ───────────────────────── generate temp pwd */
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pwd = 'Temp'
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

/* ───────────────────────── CREATE USER */
const createUser = async () => {
  sending.value = true
  try {
    const email = inviteForm.value.email.trim().toLowerCase()
    const tempPassword = generatePassword()

    /* 1 ‑ call edge function to create auth user */
    const { data: sess } = await supabase.auth.getSession()
    if (!sess.session) throw new Error('No admin session')

    const { data: resp, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email,
        password: tempPassword,
        user_metadata: { name: email.split('@')[0], role: inviteForm.value.userType }
      },
      headers: { Authorization: `Bearer ${sess.session.access_token}` }
    })

    if (error) throw error
    const newUser = resp.user
    if (!newUser) throw new Error('Edge function returned no user')

    /* 2 ‑ insert profile */
    const { error: profileErr } = await supabase.from('user_profiles').insert({
      id: newUser.id,
      email,
      name: email.split('@')[0],
      role: inviteForm.value.userType,
      artist_id: inviteForm.value.artistId || null,
      setup_complete: false
    })
    if (profileErr && profileErr.code !== '23505') throw profileErr

    /* 3 ‑ permissions for editors */
    if (inviteForm.value.userType === 'editor' && inviteForm.value.selectedArtists.length) {
      await supabase.from('user_artist_permissions').insert(
        inviteForm.value.selectedArtists.map(aid => ({ user_id: newUser.id, artist_id: aid, permission: 'edit' }))
      )
    }

    /* 4 ‑ show credentials */
    createdCredentials.value = { email, password: tempPassword }
    showInviteModal.value = false
    showCredentialsModal.value = true

    await loadData()
  } catch (err) {
    console.error('createUser error', err)
    showToast(`Failed to create user: ${err.message}`, 'error')
  } finally {
    sending.value = false
  }
}

/* ───────────────────────── other actions (reset, delete, etc.) */
const copyCredentials = () => {
  navigator.clipboard.writeText(`Email: ${createdCredentials.value.email}\nPassword: ${createdCredentials.value.password}`)
  showToast('Credentials copied!', 'success')
}

const resetPassword = async user => {
  if (!confirm(`Send password reset to ${user.email}?`)) return
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`
    })
    if (error) throw error
    showToast('Reset e-mail sent', 'success')
  } catch (err) {
    showToast('Failed to send reset', 'error')
  }
}

const deleteUser = async user => {
  if (!confirm(`Delete account for ${user.email}?`)) return
  try {
    const { error } = await supabase.from('user_profiles').delete().eq('id', user.id)
    if (error) throw error
    showToast('User deleted', 'success')
    await loadData()
  } catch (err) {
    showToast('Deletion failed', 'error')
  }
}

const removePermission = async perm => {
  try {
    await supabase.from('user_artist_permissions').delete().eq('id', perm.id)
    showToast('Permission removed', 'success')
    await loadData()
  } catch (err) {
    showToast('Remove failed', 'error')
  }
}

const addPermissionForUser = () => showToast('Coming soon', 'info')

/* ───────────────────────── initial load */
const loadData = async () => {
  const [{ data: u }, { data: p }] = await Promise.all([
    supabase.from('user_profiles').select('*'),
    supabase.from('user_artist_permissions').select('*')
  ])
  users.value = u || []
  permissions.value = p || []
}

onMounted(async () => {
  await artistStore.loadArtists()
  await loadData()
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

/* Credentials Modal */
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
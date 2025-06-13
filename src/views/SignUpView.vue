<template>
    <div class="signup-container">
      <div class="signup-card">
        <div class="signup-logo">
          <h1>All My Friends Accounting</h1>
        </div>
  
        <!-- ▸ LOADING -------------------------------------------------------------- -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Validating invitation...</p>
        </div>
  
        <!-- ▸ ERROR --------------------------------------------------------------- -->
        <div v-else-if="error" class="error-state">
          <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h2>{{ error }}</h2>
          <button @click="goToLogin" class="btn-secondary">Go to Login</button>
        </div>
  
        <!-- ▸ FORM ---------------------------------------------------------------- -->
        <div v-else-if="invite">
          <h2 class="signup-title">Create Your Account</h2>
          <p class="signup-subtitle">Welcome! Set up your password to get started.</p>
  
          <div class="invite-info">
            <p><strong>Email:</strong> {{ invite.email }}</p>
            <p><strong>Role:</strong> {{ formatRole(invite.role) }}</p>
            <p v-if="invite.artist_id"><strong>Artist:</strong> {{ getArtistName(invite.artist_id) }}</p>
          </div>
  
          <form @submit.prevent="createAccount" class="signup-form">
            <!-- name -->
            <div class="form-group">
              <label for="name">Your Name *</label>
              <input
                v-model="form.name"
                id="name"
                type="text"
                placeholder="Enter your full name"
                required
                class="form-input"
                :disabled="submitting"
              />
            </div>
  
            <!-- password -->
            <div class="form-group">
              <label for="password">Create Password *</label>
              <input
                v-model="form.password"
                id="password"
                type="password"
                placeholder="Choose a secure password"
                required
                minlength="8"
                class="form-input"
                :disabled="submitting"
                @input="checkPasswordStrength"
              />
              <div class="password-strength">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="passwordStrength.class"
                    :style="{ width: passwordStrength.percent + '%' }"
                  ></div>
                </div>
                <p class="strength-text">{{ passwordStrength.text }}</p>
              </div>
              <p class="form-hint">At least 8 characters with a mix of letters and numbers</p>
            </div>
  
            <!-- confirm -->
            <div class="form-group">
              <label for="confirmPassword">Confirm Password *</label>
              <input
                v-model="form.confirmPassword"
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                class="form-input"
                :disabled="submitting"
              />
              <p v-if="form.confirmPassword && form.password !== form.confirmPassword" class="error-text">
                Passwords do not match
              </p>
            </div>
  
            <!-- terms -->
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="form.acceptTerms" type="checkbox" required :disabled="submitting" />
                <span>I accept the terms of service and privacy policy</span>
              </label>
            </div>
  
            <!-- form‑level error -->
            <div v-if="formError" class="error-message">{{ formError }}</div>
  
            <!-- submit -->
            <button class="btn-submit" :disabled="submitting || !isFormValid">
              {{ submitting ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  /* ───────────────── imports ───────────────── */
  import { ref, computed, onMounted }  from 'vue'
  import { useRouter, useRoute }       from 'vue-router'
  import { supabase }                  from '@/lib/supabase'
  import { useArtistStore }            from '@/store/artistStore'
  
  /* ───────────────── state ─────────────────── */
  const router      = useRouter()
  const route       = useRoute()
  const artistStore = useArtistStore()
  
  const loading    = ref(true)
  const error      = ref('')
  const submitting = ref(false)
  const formError  = ref('')
  const invite     = ref(null)
  
  const form = ref({
    name: '', password: '', confirmPassword: '', acceptTerms: false
  })
  
  const passwordStrength = ref({ percent: 0, text: '', class: '' })
  
  /* ───────────────── computed ──────────────── */
  const isFormValid = computed(() =>
    form.value.name &&
    form.value.password &&
    form.value.password === form.value.confirmPassword &&
    form.value.password.length >= 8 &&
    form.value.acceptTerms
  )
  
  /* ───────────────── helpers ───────────────── */
  const formatRole = r => ({ owner:'Owner',editor:'Editor',invoicer:'Invoicer',
                             artist:'Artist',viewer:'Viewer' }[r] ?? r)
  const getArtistName = id => artistStore.getArtistById(id)?.name ?? 'Loading…'
  
  function checkPasswordStrength () {
    const pwd = form.value.password
    let s = 0
    if (pwd.length >=  8) s += 25
    if (pwd.length >= 12) s += 25
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s += 25
    if (/[0-9]/.test(pwd))                      s += 12.5
    if (/[^A-Za-z0-9]/.test(pwd))               s += 12.5
    passwordStrength.value = {
      percent: s,
      text : s<=25?'Weak' : s<=50?'Fair' : s<=75?'Good' : 'Strong',
      class: (s<=25?'weak':s<=50?'fair':s<=75?'good':'strong')
    }
  }
  
  /* ───────────────── 1. validate invite ────── */
  async function validateInvite () {
    try {
      const token = route.query.token
      if (!token) { error.value = 'Invalid invitation link'; return }
  
      console.log('[signup] querying invite, token =', token)
  
      const { data: inviteData, error: inviteErr } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('invite_token', token)
        .eq('accepted', false)
        .gte('expires_at', new Date().toISOString())
        .single()               // throws if not found
  
      if (inviteErr) throw inviteErr
  
      /* already signed-up with this e-mail? */
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', inviteData.email)
        .maybeSingle()
  
      if (existing) { error.value = 'An account already exists for this email'; return }
  
      invite.value = inviteData
      if (inviteData.artist_id) await artistStore.loadArtists()
    } catch (e) {
      console.error('[signup] validation error:', e)
      error.value = 'Invitation not found or has expired'
    } finally {
      loading.value = false
    }
  }
  
  /* ───────────────── 2. create account ─────── */
  /* (unchanged – left exactly as you had it) */
  async function createAccount () {
    formError.value = ''
    submitting.value = true
    try {
      /* sign-up */
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: invite.value.email,
        password: form.value.password,
        options: { data: {
          name: form.value.name,
          role: invite.value.role,
          artist_id: invite.value.artist_id ?? null,
          invited_by: invite.value.invited_by
        }}
      })
      if (authErr) throw authErr
  
      /* profile row */
      const { error: profileErr } = await supabase.from('user_profiles').insert({
        id: authData.user.id,
        email: invite.value.email,
        name: form.value.name,
        role: invite.value.role,
        artist_id: invite.value.artist_id ?? null,
        setup_complete: true
      })
      if (profileErr) throw profileErr
  
      /* editor perms */
      if (invite.value.role === 'editor' && invite.value.selected_artists?.length) {
        const perms = invite.value.selected_artists.map(a => ({
          user_id: authData.user.id, artist_id: a, permission: 'edit'
        }))
        await supabase.from('user_artist_permissions').insert(perms)
      }
  
      /* mark invite accepted */
      await supabase.from('pending_invites')
        .update({ accepted: true })
        .eq('id', invite.value.id)
  
      /* sign-in */
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: invite.value.email, password: form.value.password
      })
      if (signInErr) throw signInErr
  
      /* redirect */
      router.push(
        invite.value.role === 'artist' && invite.value.artist_id
          ? `/artist/${invite.value.artist_id}/overview`
          : '/'
      )
    } catch (e) {
      console.error('Account creation error:', e)
      formError.value = e.message ?? 'Failed to create account'
    } finally {
      submitting.value = false
    }
  }
  
  /* ───────────────── mount ─────────────────── */
  onMounted(validateInvite)
  </script>

<style scoped>
.signup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #000;
  position: relative;
  overflow: hidden;
}

/* Background gradient effect */
.signup-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 20% 80%,
    rgba(29, 185, 84, 0.1) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 80% 20%,
    rgba(29, 185, 84, 0.05) 0%,
    transparent 50%
  );
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-20px, -20px) rotate(180deg); }
}

.signup-card {
  position: relative;
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 48px;
  z-index: 1;
}

.signup-logo {
  text-align: center;
  margin-bottom: 32px;
}

.signup-logo h1 {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #1db954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #f44336;
  margin: 0 auto 16px;
}

.error-state h2 {
  font-size: 18px;
  color: white;
  margin-bottom: 24px;
}

.signup-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin: 0 0 8px 0;
}

.signup-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 0 0 32px 0;
}

.invite-info {
  background: rgba(29, 185, 84, 0.1);
  border: 1px solid rgba(29, 185, 84, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 32px;
}

.invite-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.invite-info p:last-child {
  margin-bottom: 0;
}

.invite-info strong {
  color: white;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.form-input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #1db954;
  background: rgba(255, 255, 255, 0.08);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak { background: #f44336; }
.strength-fill.fair { background: #ff9800; }
.strength-fill.good { background: #2196f3; }
.strength-fill.strong { background: #4caf50; }

.strength-text {
  font-size: 12px;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.6);
}

.form-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.error-text {
  font-size: 12px;
  color: #f44336;
  margin: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  padding: 12px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 8px;
  color: #f44336;
  font-size: 14px;
  text-align: center;
}

.btn-submit {
  padding: 14px 24px;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.btn-submit:hover:not(:disabled) {
  background: #1ed760;
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
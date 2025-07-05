/* ───────────── File: src/router/index.js ───────────── */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/authStore'

/* ── Views ─────────────────────────────────────────── */
import LoginView            from '@/components/auth/LoginView.vue'
import SignUpView           from '@/views/SignUpView.vue'
import MainLayout           from '@/layouts/MainLayout.vue'
import ArtistListView       from '@/views/ArtistListView.vue'
import ArtistLayout         from '@/layouts/ArtistLayout.vue'
import ArtistOverviewView   from '@/views/ArtistOverviewView.vue'
import ArtistProjectsView   from '@/views/ArtistProjectsView.vue'
import ArtistInvoicesView   from '@/views/ArtistInvoicesView.vue'
import ArtistArchivedView   from '@/views/ArtistArchivedView.vue'
import ArtistTrashView      from '@/views/ArtistTrashView.vue'
import AllProjectsView      from '@/views/AllProjectsView.vue'
import AllInvoicesView      from '@/views/AllInvoicesView.vue'
import UserManagementView   from '@/views/UserManagementView.vue'
import FirstTimeSetupView   from '@/views/FirstTimeSetupView.vue'
import AuthCallbackView     from '@/views/AuthCallbackView.vue'
import PasswordResetView    from '@/views/PasswordResetView.vue'
import ProjectBudgetsView   from '@/views/ProjectBudgetsView.vue'
import BudgetDetailView     from '@/views/BudgetDetailView.vue'

/* ── Route table ───────────────────────────────────── */
const routes = [
  { path: '/login',          name: 'Login',          component: LoginView,        meta: { public: true  }},
  { path: '/auth/signup',    name: 'SignUp',         component: SignUpView,       meta: { public: true  }},
  { path: '/reset-password', name: 'PasswordReset',  component: PasswordResetView,meta:{ public: true  }},
  { path: '/auth/callback',  name: 'AuthCallback',   component: AuthCallbackView, meta: { public: true, skipProfileCheck: true }},

  { path: '/setup', name: 'FirstTimeSetup', component: FirstTimeSetupView,
    meta: { requiresAuth: true, skipProfileCheck: true }},

  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '',          name: 'Artists',        component: ArtistListView,   meta: { requiresTeam: true }},
      { path: 'projects',  name: 'AllProjects',    component: AllProjectsView,  meta: { requiresTeam: true }},
      { path: 'invoices',  name: 'AllInvoices',    component: AllInvoicesView,  meta: { requiresTeam: true }},
      { path: 'users',     name: 'UserManagement', component: UserManagementView,
        meta: { requiresTeam: true, requiresOwner: true }},

      { path: 'artist/:artistId', component: ArtistLayout, props: true, children: [
          { path: 'overview',  name: 'ArtistOverview',  component: ArtistOverviewView, props: true },
          { path: 'projects',  name: 'ArtistProjects',  component: ArtistProjectsView, props: true },
          { path: 'invoices',  name: 'ArtistInvoices',  component: ArtistInvoicesView, props: true },
          { path: 'archived',  name: 'ArtistArchived',  component: ArtistArchivedView, props: true, meta:{ requiresTeam: true }},
          { path: 'trash',     name: 'ArtistTrash',     component: ArtistTrashView,    props: true, meta:{ requiresTeam: true }}
      ]},
      { path: 'projects/:projectId/budgets', name: 'ProjectBudgets', component: ProjectBudgetsView, props: true, meta: { requiresTeam: true }},
      { path: 'budgets/:budgetId',          name: 'BudgetDetail',   component: BudgetDetailView,   props: true, meta: { requiresTeam: true }}
    ]
  }
]

/* ── Router instance ───────────────────────────────── */
const router = createRouter({
  history: createWebHistory(),
  routes
})

/* ── Global navigation guard ───────────────────────── */
router.beforeEach(async (to, from, next) => {
  console.log('Router guard: navigating from', from.path, 'to', to.path)

  /* 1.  Public routes go straight through */
  if (to.meta.public) {
    console.log('Router guard: public route, skipping auth init')
    return next()
  }

  /* 2.  Initialise auth store only for protected routes */
  const authStore = useAuthStore()
  if (!authStore.initialized) {
    console.log('Router guard: initializing auth store')
    await authStore.initialize()
    console.log('Router guard: auth store ready, user =', authStore.user)
  }

  /* 3.  Auth required? */
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Router guard: not authenticated → /login')
    return next('/login')
  }

  /* 4.  First-time setup check (skip if flagged) */
  if (authStore.isAuthenticated && !to.meta.skipProfileCheck && authStore.profile) {
    const needsSetup = !authStore.profile.name ||
                       authStore.profile.name === authStore.profile.email.split('@')[0] ||
                       !authStore.profile.setup_complete
    if (needsSetup) {
      console.log('Router guard: profile incomplete → /setup')
      return next('/setup')
    }
  }

  /* 5.  Owner-only routes */
  if (to.meta.requiresOwner && !authStore.isOwner) {
    console.log('Router guard: owner access required')
    return next('/')
  }

  /* 6.  Team-only routes restriction for artists */
  if (to.meta.requiresTeam && authStore.isArtist) {
    console.log('Router guard: artist blocked from team route')
    return next(`/artist/${authStore.profile.artist_id}/overview`)
  }

  /* 7.  Artist-specific access */
  if (to.params.artistId && !authStore.canViewArtist(to.params.artistId)) {
    console.log('Router guard: no access to artist', to.params.artistId)
    return authStore.isArtist
      ? next(`/artist/${authStore.profile.artist_id}/overview`)
      : next('/')
  }

  console.log('Router guard: allowing navigation')
  next()
})

export default router

// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/authStore'

// Views
import LoginView from '@/components/auth/LoginView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import ArtistListView from '@/views/ArtistListView.vue'
import ArtistLayout from '@/layouts/ArtistLayout.vue'
import ArtistOverviewView from '@/views/ArtistOverviewView.vue'
import ArtistProjectsView from '@/views/ArtistProjectsView.vue'
import ArtistInvoicesView from '@/views/ArtistInvoicesView.vue'
import ArtistArchivedView from '@/views/ArtistArchivedView.vue'
import ArtistTrashView from '@/views/ArtistTrashView.vue'
import AllProjectsView from '@/views/AllProjectsView.vue'
import AllInvoicesView from '@/views/AllInvoicesView.vue'
import UserManagementView from '@/views/UserManagementView.vue'
import FirstTimeSetupView from '@/views/FirstTimeSetupView.vue'
import AuthCallbackView from '@/views/AuthCallbackView.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/setup',
    name: 'FirstTimeSetup',
    component: FirstTimeSetupView,
    meta: { requiresAuth: true, skipProfileCheck: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallbackView,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Artists',
        component: ArtistListView,
        meta: { requiresTeam: true }
      },
      {
        path: 'artist/:artistId',
        component: ArtistLayout,
        props: true,
        children: [
          {
            path: 'overview',
            name: 'ArtistOverview',
            component: ArtistOverviewView,
            props: true
          },
          {
            path: 'projects',
            name: 'ArtistProjects',
            component: ArtistProjectsView,
            props: true
          },
          {
            path: 'invoices',
            name: 'ArtistInvoices', 
            component: ArtistInvoicesView,
            props: true
          },
          {
            path: 'archived',
            name: 'ArtistArchived',
            component: ArtistArchivedView,
            props: true,
            meta: { requiresTeam: true }
          },
          {
            path: 'trash',
            name: 'ArtistTrash',
            component: ArtistTrashView,
            props: true,
            meta: { requiresTeam: true }
          }
        ]
      },
      {
        path: 'projects',
        name: 'AllProjects',
        component: AllProjectsView,
        meta: { requiresTeam: true }
      },
      {
        path: 'invoices',
        name: 'AllInvoices',
        component: AllInvoicesView,
        meta: { requiresTeam: true }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagementView,
        meta: { requiresTeam: true, requiresOwner: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Check for auth tokens at root and redirect to auth callback
router.beforeEach((to, from, next) => {
  // Check if we're at root path with auth tokens in hash
  if (to.path === '/' && to.hash && to.hash.includes('access_token')) {
    console.log('Found auth token at root, redirecting to auth callback')
    // Redirect to auth callback with the hash preserved
    next('/auth/callback' + to.hash)
    return
  }
  
  // Continue with normal navigation
  next()
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  console.log('Router guard: navigating from', from.path, 'to', to.path)
  
  const authStore = useAuthStore()
  
  // Initialize auth store if needed
  if (!authStore.initialized) {
    console.log('Router guard: initializing auth store')
    await authStore.initialize()
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Router guard: not authenticated, redirecting to login')
    next('/login')
    return
  }
  
  // Check if logged in user is trying to access login
  if (to.path === '/login' && authStore.isAuthenticated) {
    console.log('Router guard: already authenticated, redirecting from login')
    
    // Check if profile needs setup
    if (authStore.profile && (!authStore.profile.name || authStore.profile.name === authStore.profile.email.split('@')[0])) {
      next('/setup')
      return
    }
    
    // Redirect based on role
    if (authStore.isArtist) {
      next(`/artist/${authStore.profile.artist_id}/overview`)
    } else {
      next('/')
    }
    return
  }
  
  // Check if user needs to complete setup (unless going to setup page or auth callback)
  if (authStore.isAuthenticated && !to.meta.skipProfileCheck && authStore.profile) {
    const needsSetup = !authStore.profile.name || 
                       authStore.profile.name === authStore.profile.email.split('@')[0] ||
                       !authStore.profile.setup_complete
    
    if (needsSetup && to.path !== '/setup') {
      console.log('Router guard: profile incomplete, redirecting to setup')
      next('/setup')
      return
    }
  }
  
  // Check owner restriction
  if (to.meta.requiresOwner && !authStore.isOwner) {
    console.log('Router guard: owner access required')
    next('/')
    return
  }
  
  // Check team member restriction
  if (to.meta.requiresTeam && authStore.isArtist) {
    console.log('Router guard: artist trying to access team route')
    // Artists can't access team-only routes
    next(`/artist/${authStore.profile.artist_id}/overview`)
    return
  }
  
  // Check artist access
  if (to.params.artistId) {
    const canView = authStore.canViewArtist(to.params.artistId)
    console.log('Router guard: checking artist access', to.params.artistId, 'canView:', canView)
    if (!canView) {
      console.log('Router guard: no access to artist', to.params.artistId)
      // Redirect to their allowed area
      if (authStore.isArtist) {
        next(`/artist/${authStore.profile.artist_id}/overview`)
      } else {
        next('/')
      }
      return
    }
  }
  
  console.log('Router guard: allowing navigation')
  next()
})

export default router
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/authStore'

// Views
import LoginView from '@/components/auth/LoginView.vue'
import ArtistListView from '@/views/ArtistListView.vue'
import ArtistLayout from '@/layouts/ArtistLayout.vue'
import ArtistOverviewView from '@/views/ArtistOverviewView.vue'
import ArtistProjectsView from '@/views/ArtistProjectsView.vue'
import ArtistInvoicesView from '@/views/ArtistInvoicesView.vue'
import ArtistArchivedView from '@/views/ArtistArchivedView.vue'
import ArtistTrashView from '@/views/ArtistTrashView.vue'
import AllProjectsView from '@/views/AllProjectsView.vue'
import AllInvoicesView from '@/views/AllInvoicesView.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Artists',
    component: ArtistListView,
    meta: { requiresAuth: true, requiresTeam: true }
  },
  {
    path: '/artist/:artistId',
    component: ArtistLayout,
    meta: { requiresAuth: true },
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
    path: '/projects',
    name: 'AllProjects',
    component: AllProjectsView,
    meta: { requiresAuth: true, requiresTeam: true }
  },
  {
    path: '/invoices',
    name: 'AllInvoices',
    component: AllInvoicesView,
    meta: { requiresAuth: true, requiresTeam: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth store if needed
  if (!authStore.initialized) {
    await authStore.initialize()
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Check if logged in user is trying to access login
  if (to.path === '/login' && authStore.isAuthenticated) {
    // Redirect based on role
    if (authStore.isArtist) {
      next(`/artist/${authStore.profile.artist_id}/overview`)
    } else {
      next('/')
    }
    return
  }
  
  // Check team member restriction
  if (to.meta.requiresTeam && authStore.isArtist) {
    // Artists can't access team-only routes
    next(`/artist/${authStore.profile.artist_id}/overview`)
    return
  }
  
  // Check artist access
  if (to.params.artistId) {
    const canView = authStore.canViewArtist(to.params.artistId)
    if (!canView) {
      // Redirect to their allowed area
      if (authStore.isArtist) {
        next(`/artist/${authStore.profile.artist_id}/overview`)
      } else {
        next('/')
      }
      return
    }
  }
  
  next()
})

export default router
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Views
import ArtistListView from '@/views/ArtistListView.vue'
import ArtistProjectsView from '@/views/ArtistProjectsView.vue'
import ArtistInvoicesView from '@/views/ArtistInvoicesView.vue'
import AllProjectsView from '@/views/AllProjectsView.vue'
import AllInvoicesView from '@/views/AllInvoicesView.vue'

const routes = [
  {
    path: '/',
    name: 'Artists',
    component: ArtistListView
  },
  {
    path: '/artist/:artistId/projects',
    name: 'ArtistProjects',
    component: ArtistProjectsView,
    props: true
  },
  {
    path: '/artist/:artistId/invoices',
    name: 'ArtistInvoices',
    component: ArtistInvoicesView,
    props: true
  },
  {
    path: '/projects',
    name: 'AllProjects',
    component: AllProjectsView
  },
  {
    path: '/invoices',
    name: 'AllInvoices',
    component: AllInvoicesView
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
// File: src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import ArtistListView     from '@/views/ArtistListView.vue'
import ArtistProjectsView from '@/views/ArtistProjectsView.vue'
import ArtistInvoicesView from '@/views/ArtistInvoicesView.vue'

const routes = [
  {
    path: '/',
    name: 'ArtistList',
    component: ArtistListView
  },
  {
    path: '/artist/:artistId/projects',
    name: 'ArtistProjects',
    component: ArtistProjectsView,
    props: (route) => ({ artistId: route.params.artistId })
  },
  {
    path: '/artist/:artistId/invoices',
    name: 'ArtistInvoices',
    component: ArtistInvoicesView,
    props: (route) => ({ artistId: route.params.artistId })
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})

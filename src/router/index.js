// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Library    from '../pages/Library.vue'
import NowPlaying from '../pages/NowPlaying.vue'

const routes = [
  { path: '/',        name: 'Library',    component: Library },
  { path: '/playing', name: 'NowPlaying', component: NowPlaying },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

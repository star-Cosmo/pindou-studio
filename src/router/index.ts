import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/converter', name: 'Converter', component: () => import('../views/Converter.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  { path: '/history', name: 'History', component: () => import('../views/History.vue') },
  { path: '/gallery', name: 'Gallery', component: () => import('../views/Gallery.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
]

const router = createRouter({
  // GitHub Pages 必须使用 Hash 模式
  history: createWebHashHistory(),
  routes,
})

export default router
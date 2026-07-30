import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/converter', name: 'Converter', component: () => import('../views/Converter.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  { path: '/register-success', name: 'RegisterSuccess', component: () => import('../views/RegisterSuccess.vue') },
  { path: '/history', name: 'History', component: () => import('../views/History.vue') },
  { path: '/gallery', name: 'Gallery', component: () => import('../views/Gallery.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
  { path: '/admin', name: 'Admin', component: () => import('../views/Admin.vue') },
]

const router = createRouter({
  // GitHub Pages 必须使用 Hash 模式
  history: createWebHashHistory(),
  routes,
})

// 全局前置守卫：保护 /admin 路由
router.beforeEach((to) => {
  if (to.path === '/admin') {
    // 在守卫内调用 useAuthStore，避免 SSR 时机问题
    const auth = useAuthStore()
    // 未登录 → 重定向到登录页
    if (!auth.isLoggedIn) {
      return { path: '/login' }
    }
    // 已登录但非管理员 → 重定向到首页
    if (!auth.isAdmin) {
      return { path: '/' }
    }
    // 已登录且为管理员 → 放行
  }
  return true
})

export default router
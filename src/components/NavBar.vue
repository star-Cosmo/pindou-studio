<template>
  <nav class="navbar">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">
        <span class="logo-icon">🧩</span>
        <span class="logo-text">拼豆工坊</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/converter" class="nav-link">制作图纸</router-link>
        <router-link to="/gallery" class="nav-link">社区画廊</router-link>
        <template v-if="auth.isLoggedIn">
          <router-link to="/history" class="nav-link">我的图纸</router-link>
          <router-link to="/profile" class="nav-link nav-profile">
            <span class="avatar-small">{{ auth.user?.email?.charAt(0).toUpperCase() }}</span>
          </router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link nav-btn">登录</router-link>
          <router-link to="/register" class="nav-link nav-btn nav-btn-primary">注册</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>

<style scoped>
.navbar {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.95);
}
.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 18px;
  color: #333;
}
.logo-icon { font-size: 24px; }
.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-link {
  text-decoration: none;
  color: #555;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.2s;
}
.nav-link:hover {
  background: #f5f0ff;
  color: #7c4dff;
}
.nav-btn {
  border: 1px solid #ddd;
}
.nav-btn-primary {
  background: #7c4dff;
  color: #fff !important;
  border-color: #7c4dff;
}
.nav-btn-primary:hover {
  background: #6a3de8 !important;
}
.avatar-small {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #7c4dff;
  color: #fff;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}
</style>
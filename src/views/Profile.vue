<template>
  <div class="page-profile">
    <h1 class="page-title">👤 个人主页</h1>

    <div v-if="!auth.isLoggedIn" class="login-prompt">
      <p>请先登录</p>
      <router-link to="/login" class="btn-primary">去登录</router-link>
    </div>

    <div v-else class="profile-content">
      <div class="profile-card">
        <div class="profile-avatar">{{ auth.user?.email?.charAt(0).toUpperCase() }}</div>
        <div class="profile-detail">
          <h2>{{ auth.user?.email }}</h2>
          <p class="profile-id">用户 ID: {{ auth.user?.id?.slice(0, 8) }}...</p>
          <p class="profile-join">注册时间: {{ formatDate(auth.user?.created_at || '') }}</p>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-card">
          <span class="stat-num">{{ patternCount }}</span>
          <span class="stat-label">图纸数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">0</span>
          <span class="stat-label">获赞数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">0</span>
          <span class="stat-label">成就</span>
        </div>
      </div>

      <div class="profile-actions">
        <router-link v-if="auth.isAdmin" to="/admin" class="btn-outline btn-admin">⚙️ 进入管理后台</router-link>
        <router-link to="/history" class="btn-outline">📂 查看我的图纸</router-link>
        <button class="btn-outline btn-danger" @click="handleLogout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePatternStore } from '../stores/patterns'

const auth = useAuthStore()
const patternStore = usePatternStore()
const router = useRouter()
const patternCount = ref(0)

onMounted(async () => {
  if (auth.isLoggedIn && auth.user) {
    await patternStore.fetchMyPatterns(auth.user.id)
    patternCount.value = patternStore.patterns.length
  }
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function handleLogout() {
  await auth.signOut()
  router.push('/')
}
</script>

<style scoped>
.page-profile { max-width: 700px; margin: 0 auto; padding: 40px 20px; }
.page-title { font-size: 28px; font-weight: 700; color: #1a1a2e; }

.login-prompt { text-align: center; padding: 60px 20px; }
.login-prompt p { margin-bottom: 16px; color: #888; }
.btn-primary { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; }

.profile-card { display: flex; gap: 24px; align-items: center; padding: 32px; background: #fff; border: 1px solid #f0f0f0; border-radius: 16px; margin-top: 24px; }
.profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }
.profile-detail h2 { font-size: 18px; font-weight: 600; color: #1a1a2e; }
.profile-id, .profile-join { font-size: 13px; color: #999; margin-top: 4px; }

.profile-stats { display: flex; gap: 16px; margin-top: 24px; }
.stat-card { flex: 1; padding: 24px; background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; text-align: center; }
.stat-num { display: block; font-size: 28px; font-weight: 700; color: #7c4dff; }
.stat-label { display: block; font-size: 13px; color: #888; margin-top: 4px; }

.profile-actions { display: flex; gap: 12px; margin-top: 24px; }
.btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 12px 24px; border: 2px solid #7c4dff; color: #7c4dff; border-radius: 10px; text-decoration: none; font-weight: 600; background: #fff; cursor: pointer; font-size: 14px; }
.btn-outline:hover { background: #f5f0ff; }
.btn-danger { border-color: #e53935; color: #e53935; }
.btn-danger:hover { background: #fff0f0; }
.btn-admin { border-color: #b8860b; color: #b8860b; }
.btn-admin:hover { background: #fff8e7; }
</style>
<template>
  <div class="page-history">
    <h1 class="page-title">📂 我的图纸</h1>
    <p class="page-desc">你创建的拼豆图纸历史记录</p>

    <div v-if="!auth.isLoggedIn" class="login-prompt">
      <p>请先登录后查看图纸历史</p>
      <router-link to="/login" class="btn-primary">去登录</router-link>
    </div>

    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="patterns.length === 0" class="empty-state">
      <p class="empty-icon">📭</p>
      <p>还没有制作过图纸</p>
      <router-link to="/converter" class="btn-primary">开始制作</router-link>
    </div>

    <div v-else class="patterns-grid">
      <div v-for="p in patterns" :key="p.id" class="pattern-card">
        <div class="pattern-thumb">
          <img v-if="p.thumbnail_url" :src="p.thumbnail_url" :alt="p.title" />
          <div v-else class="thumb-placeholder">{{ p.grid_width }}×{{ p.grid_height }}</div>
        </div>
        <div class="pattern-info">
          <h3>{{ p.title }}</h3>
          <div class="pattern-meta">
            <span>{{ p.grid_width }}×{{ p.grid_height }}</span>
            <span>❤️ {{ p.likes_count || 0 }}</span>
            <span>{{ formatDate(p.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePatternStore } from '../stores/patterns'

const auth = useAuthStore()
const patternStore = usePatternStore()
const patterns = ref(patternStore.patterns)
const loading = ref(true)

onMounted(async () => {
  if (auth.isLoggedIn && auth.user) {
    await patternStore.fetchMyPatterns(auth.user.id)
    patterns.value = patternStore.patterns
  }
  loading.value = false
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.page-history { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
.page-title { font-size: 28px; font-weight: 700; color: #1a1a2e; }
.page-desc { color: #888; font-size: 14px; margin: 4px 0 32px; }

.login-prompt { text-align: center; padding: 60px 20px; }
.login-prompt p { margin-bottom: 16px; color: #888; }
.btn-primary { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; }

.loading-state { text-align: center; padding: 60px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #7c4dff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state p { color: #888; margin-bottom: 16px; }

.patterns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.pattern-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; transition: all 0.2s; }
.pattern-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); transform: translateY(-2px); }
.pattern-thumb { width: 100%; aspect-ratio: 1; background: #fafafa; display: flex; align-items: center; justify-content: center; }
.pattern-thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder { color: #ccc; font-size: 18px; }
.pattern-info { padding: 14px; }
.pattern-info h3 { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
.pattern-meta { display: flex; gap: 12px; font-size: 12px; color: #999; }
</style>
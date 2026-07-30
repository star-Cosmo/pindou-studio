<template>
  <div class="page-gallery">
    <h1 class="page-title">🖼️ 社区画廊</h1>
    <p class="page-desc">看看大家都在拼什么，为喜欢的作品点赞</p>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="patterns.length === 0" class="empty-state">
      <p class="empty-icon">🎨</p>
      <p>还没有人分享作品，快来成为第一个吧！</p>
      <router-link to="/converter" class="btn-primary">开始制作</router-link>
    </div>

    <div v-else class="gallery-grid">
      <div v-for="p in patterns" :key="p.id" class="gallery-card">
            <div class="gallery-thumb">
              <img v-if="p.thumbnail_url && !brokenImgs[p.id]" :src="p.thumbnail_url" :alt="p.title" @error="onImgError(p.id)" />
              <div v-else class="thumb-placeholder">{{ p.grid_width }}×{{ p.grid_height }}</div>
            </div>
        <div class="gallery-info">
          <h3>{{ p.title }}</h3>
          <div class="gallery-author">{{ p.author_username ?? '匿名' }}</div>
          <div class="gallery-meta">
            <span>{{ p.grid_width }}x{{ p.grid_height }}</span>
            <button
              :class="['like-btn', { liked: likedMap[p.id] }]"
              @click="handleLike(p.id)"
              :disabled="!auth.isLoggedIn"
            >
              {{ likedMap[p.id] ? '\u2764\uFE0F' : '\uD83E\uDD0D' }} {{ p.likes_count || 0 }}
            </button>
            <button
              v-if="p.grid_data"
              class="dl-btn"
              title="下载图纸"
              @click.stop="downloadFromGallery(p)"
            >
              下载
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!auth.isLoggedIn && patterns.length > 0" class="login-tip">
      <p>登录后可以点赞作品</p>
      <router-link to="/login" class="btn-outline">登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePatternStore } from '../stores/patterns'
import type { BeadPattern } from '../stores/patterns'
import { beadPalette } from '../lib/beadColors'

const auth = useAuthStore()
const patternStore = usePatternStore()
const patterns = ref<BeadPattern[]>([])
const loading = ref(true)
const likedMap = ref<Record<string, boolean>>({})
const brokenImgs = ref<Record<string, boolean>>({})

function onImgError(id: string) {
  brokenImgs.value[id] = true
}

onMounted(async () => {
  await patternStore.fetchPublicPatterns()
  patterns.value = patternStore.patterns
  loading.value = false
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function handleLike(patternId: string) {
  if (!auth.isLoggedIn || !auth.user) return
  await patternStore.toggleLike(patternId, auth.user.id)
  likedMap.value[patternId] = !likedMap.value[patternId]
  const p = patterns.value.find(p => p.id === patternId)
  if (p) {
    p.likes_count = (p.likes_count || 0) + (likedMap.value[patternId] ? 1 : -1)
  }
}

function isLightColor(rgb: [number, number, number]): boolean {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) > 140
}

/** 从 grid_data 下载图纸 PNG */
function downloadFromGallery(p: BeadPattern) {
  if (!p.grid_data) return

  try {
    const gridCodes: string[][] = JSON.parse(p.grid_data)
    const rows = gridCodes.length
    const cols = gridCodes[0].length
    const cellSize = 28
    const padding = 20

    const colorMap = new Map(beadPalette.map(c => [c.code, c]))
    const grid = gridCodes.map(row =>
      row.map(code => colorMap.get(code) ?? { code, hex: '#ccc', rgb: [200, 200, 200] as [number, number, number], name: '?' })
    )

    const canvas = document.createElement('canvas')
    canvas.width = cols * cellSize + padding * 2
    canvas.height = rows * cellSize + padding * 2
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const beadR = cellSize * 0.42
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const color = grid[y][x]
        const cx = padding + x * cellSize + cellSize / 2
        const cy = padding + y * cellSize + cellSize / 2

        ctx.beginPath()
        ctx.arc(cx, cy, beadR, 0, Math.PI * 2)
        ctx.fillStyle = color.hex
        ctx.fill()

        ctx.strokeStyle = 'rgba(0,0,0,0.15)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        ctx.fillStyle = isLightColor(color.rgb) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(color.code, cx, cy)
      }
    }

    const link = document.createElement('a')
    link.download = `拼豆图纸_${cols}x${rows}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch {
    // grid_data 解析失败，静默忽略
  }
}
</script>

<style scoped>
.page-gallery { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
.page-title { font-size: 28px; font-weight: 700; color: #1a1a2e; }
.page-desc { color: #888; font-size: 14px; margin: 4px 0 32px; }

.loading-state { text-align: center; padding: 60px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #7c4dff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state p { color: #888; margin-bottom: 16px; }
.btn-primary { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; }

.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.gallery-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; transition: all 0.2s; }
.gallery-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); transform: translateY(-2px); }
.gallery-thumb { width: 100%; aspect-ratio: 1; background: #fafafa; display: flex; align-items: center; justify-content: center; }
.gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder { color: #ccc; font-size: 18px; }
.gallery-info { padding: 14px; }
.gallery-info h3 { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 2px; }
.gallery-author { font-size: 12px; color: #aaa; margin-bottom: 6px; }
.gallery-meta { display: flex; gap: 12px; font-size: 12px; color: #999; align-items: center; }
.like-btn { background: none; border: none; cursor: pointer; font-size: 12px; color: #999; display: flex; align-items: center; gap: 2px; padding: 2px 4px; border-radius: 4px; }
.like-btn:hover:not(:disabled) { background: #f5f0ff; }
.like-btn:disabled { cursor: not-allowed; opacity: 0.5; }
.like-btn.liked { color: #e53935; }
.dl-btn { background: none; border: 1px solid #ddd; color: #7c4dff; font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer; margin-left: auto; font-weight: 600; }
.dl-btn:hover { background: #f5f0ff; border-color: #7c4dff; }

.login-tip { text-align: center; padding: 32px; margin-top: 24px; background: #fafafa; border-radius: 12px; }
.login-tip p { color: #888; margin-bottom: 12px; }
.btn-outline { display: inline-block; padding: 10px 24px; border: 2px solid #7c4dff; color: #7c4dff; border-radius: 10px; text-decoration: none; font-weight: 600; }
</style>
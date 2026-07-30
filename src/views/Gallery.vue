<template>
  <div class="page-gallery">
    <h1 class="page-title">社区画廊</h1>
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
      <div v-for="p in patterns" :key="p.id" class="gallery-card" @click="openPreview(p)">
        <div class="gallery-thumb">
          <img v-if="p.thumbnail_url && !brokenImgs[p.id]" :src="p.thumbnail_url" :alt="p.title" @error="onImgError(p.id)" />
          <div v-else class="thumb-placeholder">{{ p.grid_width }}x{{ p.grid_height }}</div>
        </div>
        <div class="gallery-info">
          <h3>{{ p.title }}</h3>
          <div class="gallery-author">{{ p.author_username ?? '匿名' }}</div>
          <div class="gallery-meta">
            <span>{{ p.grid_width }}x{{ p.grid_height }}</span>
            <button
              :class="['like-btn', { liked: likedMap[p.id] }]"
              @click.stop="handleLike(p.id)"
              :disabled="!auth.isLoggedIn"
            >
              {{ likedMap[p.id] ? '❤️' : '🤍' }} {{ p.likes_count || 0 }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!auth.isLoggedIn && patterns.length > 0" class="login-tip">
      <p>登录后可以点赞作品</p>
      <router-link to="/login" class="btn-outline">登录</router-link>
    </div>

    <!-- 预览弹窗 -->
    <div v-if="selectedPattern" class="modal-overlay" @click="closePreview">
      <div class="modal-card" @click.stop>
        <button class="modal-close" aria-label="关闭" @click="closePreview">x</button>

        <h2 class="modal-title">{{ selectedPattern.title }}</h2>

        <div class="modal-thumb">
          <img v-if="selectedPattern.thumbnail_url && !brokenImgs[selectedPattern.id]" :src="selectedPattern.thumbnail_url" :alt="selectedPattern.title" @error="onImgError(selectedPattern.id)" />
          <div v-else class="thumb-placeholder-large">
            {{ selectedPattern.grid_width }}x{{ selectedPattern.grid_height }}
          </div>
        </div>

        <div class="modal-meta">
          <span>作者：{{ selectedPattern.author_username ?? '匿名' }}</span>
          <span>尺寸：{{ selectedPattern.grid_width }}x{{ selectedPattern.grid_height }}</span>
          <span>创建：{{ formatDate(selectedPattern.created_at) }}</span>
        </div>

        <div class="modal-actions">
          <button
            class="btn-primary"
            :disabled="!selectedPattern.grid_data"
            @click="downloadFromGallery(selectedPattern)"
          >
            下载图纸
          </button>
          <button class="btn-outline" @click="closePreview">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
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
const selectedPattern = ref<BeadPattern | null>(null)

function onImgError(id: string) {
  brokenImgs.value[id] = true
}

function openPreview(p: BeadPattern) {
  selectedPattern.value = p
}

function closePreview() {
  selectedPattern.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedPattern.value) {
    closePreview()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  await patternStore.fetchPublicPatterns()
  patterns.value = patternStore.patterns
  loading.value = false
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
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
    // 静默忽略
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
.btn-primary { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; font-size: 14px; }
.btn-primary:hover { opacity: 0.92; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.gallery-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; transition: all 0.2s; cursor: pointer; }
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

.login-tip { text-align: center; padding: 32px; margin-top: 24px; background: #fafafa; border-radius: 12px; }
.login-tip p { color: #888; margin-bottom: 12px; }
.btn-outline { display: inline-block; padding: 10px 24px; border: 2px solid #7c4dff; color: #7c4dff; border-radius: 10px; text-decoration: none; font-weight: 600; background: #fff; font-size: 14px; cursor: pointer; }
.btn-outline:hover { background: #f5f0ff; }

/* 弹窗 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { position: relative; background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; animation: modal-in 0.18s ease-out; }
@keyframes modal-in { from { transform: translateY(12px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.modal-close { position: absolute; top: 12px; right: 14px; width: 32px; height: 32px; border: none; background: #f5f5f5; color: #666; font-size: 22px; line-height: 1; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.modal-close:hover { background: #eaeaea; }
.modal-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; padding-right: 32px; }
.modal-thumb { width: 100%; aspect-ratio: 1; background: #fafafa; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.modal-thumb img { width: 100%; height: 100%; object-fit: contain; }
.thumb-placeholder-large { color: #bbb; font-size: 28px; font-weight: 600; }
.modal-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 14px; color: #666; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 10px; }
.modal-actions button { flex: 1; padding: 12px; font-size: 15px; }

@media (max-width: 600px) {
  .modal-overlay { padding: 12px; }
  .modal-card { padding: 20px; }
}
</style>

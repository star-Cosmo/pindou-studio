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
      <div v-for="p in patterns" :key="p.id" class="pattern-card" @click="openPreview(p)">
        <div class="pattern-thumb">
          <img v-if="p.thumbnail_url && !brokenImgs[p.id]" :src="p.thumbnail_url" :alt="p.title" @error="onImgError(p.id)" />
          <div v-else class="thumb-placeholder">{{ p.grid_width }}×{{ p.grid_height }}</div>
          <span v-if="p.is_public" class="badge-public">已发布</span>
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

    <!-- 预览模态框 -->
    <div v-if="selectedPattern" class="modal-overlay" @click="closePreview">
      <div class="modal-card" @click.stop>
        <button class="modal-close" aria-label="关闭" @click="closePreview">×</button>

        <div class="modal-thumb">
          <img v-if="selectedPattern.thumbnail_url && !brokenImgs[selectedPattern.id]" :src="selectedPattern.thumbnail_url" :alt="selectedPattern.title" @error="onImgError(selectedPattern.id)" />
          <div v-else class="thumb-placeholder-large">
            {{ selectedPattern.grid_width }}×{{ selectedPattern.grid_height }}
          </div>
        </div>

        <h2 class="modal-title">{{ selectedPattern.title }}</h2>

        <div class="modal-meta">
          <span>尺寸：{{ selectedPattern.grid_width }}×{{ selectedPattern.grid_height }}</span>
          <span>创建：{{ formatDate(selectedPattern.created_at) }}</span>
          <span>❤️ {{ selectedPattern.likes_count || 0 }}</span>
        </div>

        <div class="modal-status">
          状态：<strong>{{ selectedPattern.is_public ? '已发布到社区' : '未发布' }}</strong>
        </div>

        <p v-if="actionError" class="action-error">{{ actionError }}</p>

        <div class="modal-actions">
          <button
            :class="selectedPattern.is_public ? 'btn-secondary' : 'btn-primary'"
            :disabled="actionLoading"
            @click="togglePublic"
          >
            <span v-if="actionLoading">处理中...</span>
            <span v-else-if="selectedPattern.is_public">取消发布</span>
            <span v-else>发布到社区</span>
          </button>

          <button
            class="btn-primary"
            :disabled="actionLoading || !selectedPattern.grid_data"
            @click="downloadFromHistory"
          >
            下载图纸
          </button>

          <button class="btn-danger" :disabled="actionLoading" @click="deleteCurrent">
            删除图纸
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePatternStore } from '../stores/patterns'
import type { BeadPattern } from '../stores/patterns'
import { beadPalette } from '../lib/beadColors'

const auth = useAuthStore()
const patternStore = usePatternStore()
// 直接 computed 引用 store，确保 store 内部 patterns 变更后视图响应式刷新
const patterns = computed<BeadPattern[]>(() => patternStore.patterns)
const loading = ref(true)

const selectedPattern = ref<BeadPattern | null>(null)
const actionLoading = ref(false)
const actionError = ref('')
const brokenImgs = ref<Record<string, boolean>>({})

function onImgError(id: string) {
  brokenImgs.value[id] = true
}

function openPreview(p: BeadPattern) {
  actionError.value = ''
  selectedPattern.value = p
}

function closePreview() {
  selectedPattern.value = null
  actionError.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedPattern.value) {
    closePreview()
  }
}

async function togglePublic() {
  if (!selectedPattern.value) return
  actionLoading.value = true
  actionError.value = ''
  const next = !selectedPattern.value.is_public
  const { error } = await patternStore.updatePatternVisibility(selectedPattern.value.id, next)
  actionLoading.value = false
  if (error) {
    actionError.value = error.message || '操作失败，请稍后重试'
    return
  }
  // 从 store 同步最新状态到选中项
  const updated = patternStore.patterns.find((p) => p.id === selectedPattern.value!.id)
  if (updated) selectedPattern.value = { ...updated }
}

async function deleteCurrent() {
  if (!selectedPattern.value) return
  if (!confirm('确定删除该图纸？此操作不可撤销')) return
  actionLoading.value = true
  actionError.value = ''
  const { error } = await patternStore.deletePattern(selectedPattern.value.id)
  actionLoading.value = false
  if (error) {
    actionError.value = error.message || '删除失败，请稍后重试'
    return
  }
  selectedPattern.value = null
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  if (auth.isLoggedIn && auth.user) {
    await patternStore.fetchMyPatterns(auth.user.id)
  }
  loading.value = false
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

function isLightColor(rgb: [number, number, number]): boolean {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) > 140
}

/** 从 grid_data 重建图纸 PNG 并下载 */
function downloadFromHistory() {
  const pattern = selectedPattern.value
  if (!pattern || !pattern.grid_data) return

  try {
    const gridCodes: string[][] = JSON.parse(pattern.grid_data)
    const rows = gridCodes.length
    const cols = gridCodes[0].length
    const cellSize = 28
    const padding = 20

    // 将颜色编码映射为 BeadColor
    const colorMap = new Map(beadPalette.map(c => [c.code, c]))
    const grid = gridCodes.map(row =>
      row.map(code => colorMap.get(code) ?? { code, hex: '#ccc', rgb: [200, 200, 200] as [number, number, number], name: 'unknown' })
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
  } catch (e) {
    actionError.value = '图纸数据异常，无法下载'
  }
}

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
.btn-primary { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.1s; }
.btn-primary:hover { opacity: 0.92; }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary { display: inline-block; padding: 12px 28px; background: #f1ecff; color: #7c4dff; border: 1px solid #d9ccff; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; }
.btn-secondary:hover { background: #e6dcff; }
.btn-secondary:active { transform: scale(0.98); }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-danger { display: inline-block; padding: 12px 24px; background: #fff; color: #e53935; border: 1px solid #ffcdd2; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; }
.btn-danger:hover { background: #fff5f5; }
.btn-danger:active { transform: scale(0.98); }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.loading-state { text-align: center; padding: 60px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #7c4dff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state p { color: #888; margin-bottom: 16px; }

.patterns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
.pattern-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; transition: all 0.2s; cursor: pointer; position: relative; }
.pattern-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); transform: translateY(-2px); }
.pattern-thumb { width: 100%; aspect-ratio: 1; background: #fafafa; display: flex; align-items: center; justify-content: center; position: relative; }
.pattern-thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder { color: #ccc; font-size: 18px; }
.badge-public { position: absolute; top: 8px; right: 8px; background: rgba(124, 77, 255, 0.9); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px; backdrop-filter: blur(2px); }
.pattern-info { padding: 14px; }
.pattern-info h3 { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
.pattern-meta { display: flex; gap: 12px; font-size: 12px; color: #999; flex-wrap: wrap; }

/* 模态框 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { position: relative; background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25); max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; animation: modal-in 0.18s ease-out; }
@keyframes modal-in { from { transform: translateY(12px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.modal-close { position: absolute; top: 12px; right: 14px; width: 32px; height: 32px; border: none; background: #f5f5f5; color: #666; font-size: 22px; line-height: 1; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.modal-close:hover { background: #eaeaea; color: #333; }
.modal-thumb { width: 100%; aspect-ratio: 1; background: #fafafa; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
.modal-thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder-large { color: #bbb; font-size: 28px; font-weight: 600; }
.modal-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; padding-right: 32px; }
.modal-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 14px; color: #666; margin-bottom: 12px; }
.modal-status { font-size: 14px; color: #555; padding: 10px 14px; background: #f8f6ff; border-radius: 8px; margin-bottom: 20px; }
.modal-status strong { color: #7c4dff; }
.action-error { color: #e53935; font-size: 13px; margin: 0 0 14px; padding: 8px 12px; background: #fff5f5; border: 1px solid #ffcdd2; border-radius: 8px; }
.modal-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.modal-actions button { flex: 1; min-width: 140px; }

@media (max-width: 600px) {
  .modal-overlay { padding: 12px; }
  .modal-card { width: 90vw; padding: 20px; }
  .modal-actions { flex-direction: column; }
  .modal-actions button { width: 100%; }
}
</style>

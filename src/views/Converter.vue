<template>
  <div class="page-converter">
    <div class="converter-container">
      <h1 class="page-title">🎨 制作拼豆图纸</h1>
      <p class="page-desc">上传图片，自动转换为拼豆图纸。无需登录即可使用，保存图纸需要登录账号。</p>

      <!-- 步骤 1：上传 -->
      <div v-if="step === 'upload'" class="converter-step">
        <div class="upload-zone" @drop.prevent="handleDrop" @dragover.prevent @click="triggerUpload">
          <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFile" />
          <div class="upload-placeholder">
            <div class="upload-icon">📤</div>
            <p class="upload-text">点击或拖拽图片到这里</p>
            <p class="upload-hint">支持 JPG、PNG、WebP 格式</p>
          </div>
        </div>

        <!-- 尺寸选择 -->
        <div class="size-selector">
          <h3>选择图纸尺寸</h3>
          <div class="size-options">
            <button
              v-for="preset in gridSizePresets"
              :key="preset.label"
              :class="['size-btn', { active: selectedSize.label === preset.label }]"
              @click="selectedSize = preset"
            >
              <span class="size-label">{{ preset.label }}</span>
              <span class="size-diff">{{ preset.difficulty }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 步骤 2：转换中 -->
      <div v-if="step === 'converting'" class="converter-step converting-step">
        <div class="spinner"></div>
        <p>正在转换图片...</p>
        <p class="converting-hint">正在分析颜色并匹配拼豆色板</p>
      </div>

      <!-- 步骤 3：结果展示 -->
      <div v-if="step === 'result'" class="converter-step">
        <div class="result-header">
          <h2>转换完成！</h2>
          <div class="result-info">
            <span>{{ gridSizePresets.find(s => s.width === gridWidth)?.label || `${gridWidth}×${gridHeight}` }}</span>
            <span>|</span>
            <span>{{ usedColors.length }} 种颜色</span>
          </div>
        </div>

        <!-- 图纸网格 -->
        <div class="bead-grid-wrapper" ref="gridWrapper">
          <div
            class="bead-grid"
            :style="{
              gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
              gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
            }"
          >
            <div
              v-for="(color, idx) in flatGrid"
              :key="idx"
              class="bead-cell"
              :style="{ backgroundColor: color.hex }"
              :title="`${color.name} (${color.hex})`"
            ></div>
          </div>
        </div>

        <!-- 色板清单 -->
        <div class="color-list">
          <h3>所需颜色清单</h3>
          <div class="color-chips">
            <div
              v-for="color in usedColors"
              :key="color.id"
              class="color-chip"
            >
              <span class="chip-swatch" :style="{ backgroundColor: color.hex }"></span>
              <span class="chip-name">{{ color.name }}</span>
              <span class="chip-count">{{ getColorCount(color.id) }} 颗</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="result-actions">
          <button class="btn-primary" @click="downloadImage">📥 下载图纸</button>
          <button class="btn-outline" @click="step = 'upload'">🔄 重新制作</button>
          <button v-if="auth.isLoggedIn" class="btn-outline" @click="saveToHistory">💾 保存到我的图纸</button>
          <router-link v-else to="/login" class="btn-outline">🔑 登录后可保存历史</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePatternStore } from '../stores/patterns'
import { beadPalette, convertToBeadGrid, gridSizePresets, type BeadColor } from '../lib/beadColors'

const auth = useAuthStore()
const patternStore = usePatternStore()

const fileInput = ref<HTMLInputElement>()
const gridWrapper = ref<HTMLDivElement>()
const step = ref<'upload' | 'converting' | 'result'>('upload')
const selectedSize = ref(gridSizePresets[1]) // 默认 32×32
const grid = ref<BeadColor[][]>([])
const gridWidth = ref(32)
const gridHeight = ref(32)
const originalImage = ref<HTMLImageElement>()

const flatGrid = computed(() => grid.value.flat())

const usedColors = computed(() => {
  const ids = new Set<number>()
  flatGrid.value.forEach(c => ids.add(c.id))
  return beadPalette.filter(c => ids.has(c.id))
})

function getColorCount(colorId: number) {
  return flatGrid.value.filter(c => c.id === colorId).length
}

function triggerUpload() {
  fileInput.value?.click()
}

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processImage(file)
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file) processImage(file)
}

function processImage(file: File) {
  if (!file.type.startsWith('image/')) return

  step.value = 'converting'
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      convertImage(img)
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function convertImage(img: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  gridWidth.value = selectedSize.value.width
  gridHeight.value = selectedSize.value.height

  // 模拟异步处理，避免卡顿
  setTimeout(() => {
    grid.value = convertToBeadGrid(imageData, gridWidth.value, gridHeight.value)
    step.value = 'result'
  }, 200)
}

function downloadImage() {
  const canvas = document.createElement('canvas')
  const cellSize = 20
  const padding = 16
  const cols = gridWidth.value
  const rows = gridHeight.value

  canvas.width = cols * cellSize + padding * 2
  canvas.height = rows * cellSize + padding * 2 + 40 // 底部留白

  const ctx = canvas.getContext('2d')!

  // 白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid.value[y][x]
      ctx.fillStyle = color.hex
      // 画圆角方块（模拟拼豆）
      const px = padding + x * cellSize
      const py = padding + y * cellSize
      const r = 2
      ctx.beginPath()
      ctx.roundRect(px, py, cellSize, cellSize, r)
      ctx.fill()
      // 加边框
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  }

  // 底部信息
  ctx.fillStyle = '#999'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`拼豆工坊 · ${cols}×${rows} · ${usedColors.value.length} 色`, canvas.width / 2, canvas.height - 8)

  const link = document.createElement('a')
  link.download = `拼豆图纸_${cols}x${rows}.png`
  link.href = canvas.toDataURL()
  link.click()
}

async function saveToHistory() {
  if (!auth.isLoggedIn || !auth.user) return

  const canvas = document.createElement('canvas')
  // 生成缩略图
  const cellSize = 4
  const size = Math.max(gridWidth.value, gridHeight.value) * cellSize
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const offsetX = Math.floor((size - gridWidth.value * cellSize) / 2)
  const offsetY = Math.floor((size - gridHeight.value * cellSize) / 2)

  for (let y = 0; y < gridHeight.value; y++) {
    for (let x = 0; x < gridWidth.value; x++) {
      ctx.fillStyle = grid.value[y][x].hex
      ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize)
    }
  }

  const thumbnailBlob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))

  // 上传缩略图到 Supabase Storage
  const fileName = `thumbnails/${auth.user.id}/${Date.now()}.png`
  const { data: uploadData } = await (await import('../lib/supabase')).supabase.storage
    .from('pattern-images')
    .upload(fileName, thumbnailBlob)

  const thumbnailUrl = uploadData?.path
    ? (await (await import('../lib/supabase')).supabase.storage.from('pattern-images').getPublicUrl(uploadData.path)).data.publicUrl
    : null

  await patternStore.savePattern({
    user_id: auth.user.id,
    title: `拼豆图纸 ${gridWidth.value}×${gridHeight.value}`,
    grid_width: gridWidth.value,
    grid_height: gridHeight.value,
    thumbnail_url: thumbnailUrl || undefined,
    is_public: false,
  })

  alert('已保存到「我的图纸」！')
}
</script>

<style scoped>
.page-converter {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}
.page-title { font-size: 28px; font-weight: 700; text-align: center; color: #1a1a2e; }
.page-desc { text-align: center; color: #888; font-size: 14px; margin: 8px 0 32px; }

/* Upload */
.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 16px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}
.upload-zone:hover {
  border-color: #7c4dff;
  background: #f5f0ff;
}
.upload-icon { font-size: 48px; margin-bottom: 12px; }
.upload-text { font-size: 16px; color: #333; font-weight: 500; }
.upload-hint { font-size: 13px; color: #aaa; margin-top: 4px; }

/* Size Selector */
.size-selector { margin-top: 24px; }
.size-selector h3 { font-size: 15px; color: #555; margin-bottom: 12px; }
.size-options { display: flex; gap: 12px; flex-wrap: wrap; }
.size-btn {
  flex: 1;
  min-width: 120px;
  padding: 14px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.size-btn:hover { border-color: #7c4dff; }
.size-btn.active {
  border-color: #7c4dff;
  background: #f5f0ff;
}
.size-label { display: block; font-weight: 600; font-size: 15px; color: #333; }
.size-diff { display: block; font-size: 12px; color: #999; margin-top: 2px; }

/* Converting */
.converting-step {
  text-align: center;
  padding: 80px 20px;
}
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #7c4dff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.converting-hint { font-size: 13px; color: #aaa; margin-top: 4px; }

/* Result */
.result-header { text-align: center; margin-bottom: 24px; }
.result-header h2 { font-size: 24px; color: #1a1a2e; }
.result-info { color: #888; font-size: 14px; margin-top: 4px; display: flex; gap: 8px; justify-content: center; }

.bead-grid-wrapper {
  overflow-x: auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #eee;
}
.bead-grid {
  display: grid;
  gap: 1px;
  min-width: fit-content;
  margin: 0 auto;
}
.bead-cell {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  transition: transform 0.1s;
}
.bead-cell:hover {
  transform: scale(1.5);
  z-index: 1;
  box-shadow: 0 0 0 2px #fff;
}

/* Color List */
.color-list { margin-top: 24px; }
.color-list h3 { font-size: 15px; color: #555; margin-bottom: 12px; }
.color-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.color-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #eee;
  border-radius: 20px;
  font-size: 13px;
  background: #fff;
}
.chip-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ddd;
}
.chip-name { color: #333; }
.chip-count { color: #999; font-size: 12px; }

/* Actions */
.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
  flex-wrap: wrap;
}
.btn-primary, .btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: all 0.3s;
}
.btn-primary {
  background: linear-gradient(135deg, #7c4dff, #651fff);
  color: #fff;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(124,77,255,0.3); }
.btn-outline {
  background: #fff;
  color: #7c4dff;
  border: 2px solid #7c4dff;
}
.btn-outline:hover { background: #f5f0ff; }
</style>
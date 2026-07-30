<template>
  <div class="page-converter">
    <div class="converter-container">
      <h1 class="page-title">🎨 制作拼豆图纸</h1>
      <p class="page-desc">上传图片，设置尺寸和比例，自动转换为带编码标注的拼豆图纸。无需登录即可使用。</p>

      <!-- ===== 步骤 1：上传 + 设置 ===== -->
      <div v-if="step === 'upload'" class="converter-step">
        <!-- 上传区域 -->
        <div
          :class="['upload-zone', { 'upload-zone-done': !!previewImage }]"
          @drop.prevent="handleDrop"
          @dragover.prevent
          @click="!previewImage && triggerUpload()"
        >
          <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFile" />

          <!-- 未上传：占位符 -->
          <div v-if="!previewImage" class="upload-placeholder">
            <div class="upload-icon">📤</div>
            <p class="upload-text">点击或拖拽图片到这里</p>
            <p class="upload-hint">支持 JPG、PNG、WebP 格式，最大 10MB</p>
          </div>

          <!-- 已上传：预览 -->
          <div v-else class="upload-preview">
            <img :src="previewImage" class="preview-img" alt="上传的图片" />
            <div class="preview-overlay">
              <span class="preview-badge">✅ 已上传</span>
              <span class="preview-size">{{ originalImage?.width }} × {{ originalImage?.height }}px</span>
            </div>
            <button class="preview-change-btn" @click.stop="triggerUpload">更换图片</button>
          </div>
        </div>

        <!-- 尺寸滑块 -->
        <div class="setting-card">
          <div class="setting-header">
            <h3>图纸尺寸</h3>
            <span class="setting-value">{{ previewWidth }} × {{ previewHeight }}</span>
          </div>
          <div class="slider-row">
            <span class="slider-label">20</span>
            <input
              type="range"
              min="20"
              max="200"
              v-model.number="sliderWidth"
              class="range-slider"
            />
            <span class="slider-label">200</span>
          </div>
          <div class="slider-info">
            宽度 <strong>{{ sliderWidth }}</strong> 颗珠
            <span v-if="previewHeight"> · 高度约 <strong>{{ previewHeight }}</strong> 颗珠</span>
          </div>
          <div class="bead-count-badge">
            🧮 约需 <strong>{{ beadCount }}</strong> 颗拼豆
          </div>
          <!-- 进度条视觉 -->
          <div class="bead-meter">
            <div class="meter-bar" :style="{ width: meterPercent + '%' }"></div>
          </div>
        </div>

        <!-- 比例选择 -->
        <div class="setting-card">
          <h3>图片比例</h3>
          <div class="ratio-options">
            <button
              v-for="opt in aspectRatioOptions"
              :key="opt.value"
              :class="['ratio-btn', { active: aspectRatio === opt.value }]"
              @click="aspectRatio = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 转换模式选择 -->
        <div class="setting-card">
          <h3>转换模式</h3>
          <div class="mode-options">
            <button
              :class="['mode-btn', { active: convertMode === 'dithering' }]"
              @click="convertMode = 'dithering'"
            >
              <span class="mode-icon">🔍</span>
              <span class="mode-label">细节优先</span>
              <span class="mode-desc">使用抖动算法，适合线条复杂的图片</span>
            </button>
            <button
              :class="['mode-btn', { active: convertMode === 'smooth' }]"
              @click="convertMode = 'smooth'"
            >
              <span class="mode-icon">🎨</span>
              <span class="mode-label">平滑自然</span>
              <span class="mode-desc">颜色过渡柔和，适合色块分明的图片</span>
            </button>
          </div>
        </div>

        <!-- 开始转换按钮 -->
        <button
          class="btn-primary btn-convert"
          @click="startConvert"
          :disabled="!previewImage"
        >
          🚀 生成拼豆图纸
        </button>
      </div>

      <!-- ===== 步骤 2：转换中 ===== -->
      <div v-if="step === 'converting'" class="converter-step converting-step">
        <div class="spinner"></div>
        <p>正在转换图片...</p>
        <p class="converting-hint">分析颜色并匹配拼豆色板 (MARD 编码)</p>
      </div>

      <!-- ===== 步骤 3：结果展示 ===== -->
      <div v-if="step === 'result'" class="converter-step">
        <div class="result-header">
          <h2>✅ 转换完成！</h2>
          <div class="result-info">
            <span>{{ gridWidth }}×{{ gridHeight }}</span>
            <span>·</span>
            <span>{{ usedColors.length }} 种颜色</span>
            <span>·</span>
            <span>🧮 {{ gridWidth * gridHeight }} 颗珠</span>
          </div>
        </div>

        <!-- 图纸网格 -->
        <div class="grid-section">
          <!-- 缩放控制 -->
          <div class="zoom-controls">
            <button class="zoom-btn" @click="zoomOut" :disabled="zoomLevel <= 0.2">−</button>
            <span class="zoom-label">{{ Math.round(zoomLevel * 100) }}%</span>
            <button class="zoom-btn" @click="zoomIn" :disabled="zoomLevel >= 3">+</button>
            <button class="zoom-btn zoom-fit" @click="zoomFit">适应窗口</button>
          </div>
          <div class="grid-viewport" ref="gridViewport">
            <div class="grid-wrapper" ref="gridWrapper" :style="{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }">
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
                  :title="`${color.code} ${color.name}`"
                >
                  <span class="bead-label">{{ color.code }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 物料清单 -->
        <div class="legend-section">
          <h3>📋 物料清单</h3>
          <p class="legend-hint">按 MARD 编码购买对应颜色的拼豆</p>
          <div class="legend-compact">
            <div
              v-for="item in legendItems"
              :key="item.color.code"
              class="legend-chip"
              :title="`${item.color.code}：${item.count} 颗 (${item.percent})`"
            >
              <span class="chip-swatch" :style="{ backgroundColor: item.color.hex }"></span>
              <span class="chip-code">{{ item.color.code }}</span>
              <span class="chip-count">{{ item.count }}</span>
            </div>
          </div>
          <div class="legend-total">合计：{{ legendItems.reduce((s, i) => s + i.count, 0) }} 颗 · {{ legendItems.length }} 种颜色</div>
        </div>

        <!-- 操作按钮 -->
        <div class="result-actions">
          <button class="btn-primary" @click="downloadImage">📥 下载图纸 (PNG)</button>
          <button class="btn-outline" @click="resetAll">🔄 重新制作</button>
          <button v-if="auth.isLoggedIn" class="btn-outline" @click="saveToHistory">💾 保存到我的图纸</button>
          <router-link v-else to="/login" class="btn-outline">🔑 登录后可保存历史</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePatternStore } from '../stores/patterns'
import {
  beadPalette,
  convertToBeadGrid,
  convertToBeadGridDithering,  // 新增
  calcGridSize,
  aspectRatioOptions,
  type BeadColor,
  type ConvertOptions
} from '../lib/beadColors'

const auth = useAuthStore()
const patternStore = usePatternStore()

const fileInput = ref<HTMLInputElement>()
const gridWrapper = ref<HTMLDivElement>()
const gridViewport = ref<HTMLDivElement>()
const zoomLevel = ref(1)

function zoomIn() {
  zoomLevel.value = Math.min(3, zoomLevel.value + 0.2)
}
function zoomOut() {
  zoomLevel.value = Math.max(0.2, zoomLevel.value - 0.2)
}
function zoomFit() {
  // 等待 DOM 更新后计算适应窗口的缩放比例
  nextTick(() => {
    const viewport = gridViewport.value
    const wrapper = gridWrapper.value
    if (!viewport || !wrapper) return
    const availW = viewport.clientWidth - 32
    const availH = viewport.clientHeight - 32
    const contentW = wrapper.scrollWidth
    const contentH = wrapper.scrollHeight
    const scaleW = availW / contentW
    const scaleH = availH / contentH
    zoomLevel.value = Math.min(scaleW, scaleH, 1)
  })
}
const step = ref<'upload' | 'converting' | 'result'>('upload')
const sliderWidth = ref(52)
const aspectRatio = ref<string>('original')
const previewImage = ref<string>('')
const originalImage = ref<HTMLImageElement>()

const convertMode = ref<'dithering' | 'smooth'>('dithering')

const grid = ref<BeadColor[][]>([])
const gridWidth = ref(0)
const gridHeight = ref(0)

// 预览计算
const previewWidth = computed(() => {
  if (!originalImage.value) return sliderWidth.value
  const opts: ConvertOptions = { aspectRatio: aspectRatio.value as any, gridWidth: sliderWidth.value }
  const result = calcGridSize(originalImage.value.width, originalImage.value.height, opts)
  return result.width
})

const previewHeight = computed(() => {
  if (!originalImage.value) return Math.round(sliderWidth.value)
  const opts: ConvertOptions = { aspectRatio: aspectRatio.value as any, gridWidth: sliderWidth.value }
  const result = calcGridSize(originalImage.value.width, originalImage.value.height, opts)
  return result.height
})

const beadCount = computed(() => previewWidth.value * previewHeight.value)

const meterPercent = computed(() => {
  // 最大 40000 珠 ≈ 200x200
  return Math.min(100, (beadCount.value / 40000) * 100)
})

const flatGrid = computed(() => grid.value.flat())

const usedColors = computed(() => {
  const ids = new Set<string>()
  flatGrid.value.forEach(c => ids.add(c.code))
  return beadPalette.filter(c => ids.has(c.code))
})

interface LegendItem {
  color: BeadColor
  count: number
  percent: string
}

const legendItems = computed(() => {
  const total = flatGrid.value.length
  const map = new Map<string, LegendItem>()
  flatGrid.value.forEach(c => {
    if (!map.has(c.code)) {
      map.set(c.code, { color: c, count: 0, percent: '0%' })
    }
    map.get(c.code)!.count++
  })
  const items = Array.from(map.values())
  items.forEach(item => {
    item.percent = ((item.count / total) * 100).toFixed(1) + '%'
  })
  // 按数量降序排序
  items.sort((a, b) => b.count - a.count)
  return items
})

// 当用户上传图片后，预览尺寸
watch(previewImage, (val) => {
  if (val) {
    // 图片已加载，预览尺寸会自动更新
  }
})

function triggerUpload() {
  fileInput.value?.click()
}

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadImage(file)
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file) loadImage(file)
}

function loadImage(file: File) {
  if (!file.type.startsWith('image/')) return
  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小超过 10MB 限制，请压缩后重试')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      previewImage.value = e.target?.result as string
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function startConvert() {
  if (!originalImage.value) return
  step.value = 'converting'

  const img = originalImage.value
  const opts: ConvertOptions = {
    aspectRatio: aspectRatio.value as any,
    gridWidth: sliderWidth.value,
  }
  const { width, height } = calcGridSize(img.width, img.height, opts)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  gridWidth.value = width
  gridHeight.value = height

  setTimeout(() => {
    if (convertMode.value === 'dithering') {
      grid.value = convertToBeadGridDithering(imageData, width, height)
    } else {
      grid.value = convertToBeadGrid(imageData, width, height)
    }
    step.value = 'result'
    // 转换完成后自动适应窗口，确保用户能看到所有边
    nextTick(() => {
      // 需要再等一帧让 DOM 渲染完成
      requestAnimationFrame(() => zoomFit())
    })
  }, 100)
}

function resetAll() {
  step.value = 'upload'
  grid.value = []
  previewImage.value = ''
  originalImage.value = undefined
}

// 判断颜色是否为浅色（用于决定标注文字用黑还是白）
function isLightColor(rgb: [number, number, number]): boolean {
  const [r, g, b] = rgb
  return (0.299 * r + 0.587 * g + 0.114 * b) > 140
}

function downloadImage() {
  const cellSize = 28
  const padding = 20
  const cols = gridWidth.value
  const rows = gridHeight.value
  const legendHeight = 40 + legendItems.value.length * 28 + 20

  const canvas = document.createElement('canvas')
  canvas.width = cols * cellSize + padding * 2
  canvas.height = rows * cellSize + padding * 2 + legendHeight

  const ctx = canvas.getContext('2d')!

  // 白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格
  const beadR = cellSize * 0.42
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid.value[y][x]
      const cx = padding + x * cellSize + cellSize / 2
      const cy = padding + y * cellSize + cellSize / 2

      // 拼豆圆形效果
      ctx.beginPath()
      ctx.arc(cx, cy, beadR, 0, Math.PI * 2)
      ctx.fillStyle = color.hex
      ctx.fill()

      // 描边
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      // 标注颜色代号
      ctx.fillStyle = isLightColor(color.rgb) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(color.code, cx, cy)
    }
  }

  // 图例标题
  const legendY = rows * cellSize + padding * 2 + 20
  ctx.fillStyle = '#333'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('物料清单', padding, legendY)

  ctx.fillStyle = '#999'
  ctx.font = '11px sans-serif'
  ctx.fillText('按 MARD 编码购买对应颜色的拼豆', padding, legendY + 18)

  // 图例表头
  const headerY = legendY + 36
  const colX = [padding, padding + 50, padding + 150]
  ctx.fillStyle = '#666'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('色块', colX[0], headerY)
  ctx.fillText('编码', colX[1], headerY)
  ctx.fillText('数量', colX[2], headerY)

  // 分隔线
  ctx.strokeStyle = '#eee'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, headerY + 4)
  ctx.lineTo(canvas.width - padding, headerY + 4)
  ctx.stroke()

  // 图例行
  legendItems.value.forEach((item, i) => {
    const y = headerY + 12 + i * 26
    // 色块
    ctx.beginPath()
    ctx.arc(colX[0] + 8, y - 4, 7, 0, Math.PI * 2)
    ctx.fillStyle = item.color.hex
    ctx.fill()
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 0.5
    ctx.stroke()

    // 编码
    ctx.fillStyle = '#333'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(item.color.code, colX[1], y)

    // 数量
    ctx.fillStyle = '#333'
    ctx.font = '12px sans-serif'
    ctx.fillText(item.count + ' 颗 (' + item.percent + ')', colX[2], y)
  })

  // 底部水印
  ctx.fillStyle = '#ccc'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    `拼豆工坊 · ${cols}×${rows} · ${usedColors.value.length} 色 · 共 ${cols * rows} 颗珠`,
    canvas.width / 2,
    canvas.height - 6
  )

  const link = document.createElement('a')
  link.download = `拼豆图纸_${cols}x${rows}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

async function saveToHistory() {
  if (!auth.isLoggedIn || !auth.user) return

  const canvas = document.createElement('canvas')
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

  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))

  const fileName = `thumbnails/${auth.user!.id}/${Date.now()}.png`
  const { data: uploadData } = await (await import('../lib/supabase')).supabase.storage
    .from('pattern-images')
    .upload(fileName, blob)

  const thumbnailUrl = uploadData?.path
    ? (await (await import('../lib/supabase')).supabase.storage.from('pattern-images').getPublicUrl(uploadData.path)).data.publicUrl
    : null

  await patternStore.savePattern({
    user_id: auth.user!.id,
    title: `拼豆图纸 ${gridWidth.value}×${gridHeight.value}`,
    grid_width: gridWidth.value,
    grid_height: gridHeight.value,
    thumbnail_url: thumbnailUrl || undefined,
    is_public: false,
  })

  alert('✅ 已保存到「我的图纸」！')
}
</script>

<style scoped>
.page-converter {
  max-width: 820px;
  margin: 0 auto;
  padding: 40px 20px;
}
.page-title { font-size: 28px; font-weight: 700; text-align: center; color: #1a1a2e; }
.page-desc { text-align: center; color: #888; font-size: 14px; margin: 8px 0 32px; }

/* ===== Upload ===== */
.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 16px;
  padding: 50px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
  position: relative;
  overflow: hidden;
}
.upload-zone:hover {
  border-color: #7c4dff;
  background: #f5f0ff;
}
.upload-zone-done {
  border-style: solid;
  border-color: #4caf50;
  background: #f6fef6;
  cursor: default;
  padding: 0;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-zone-done:hover {
  background: #f6fef6;
  border-color: #4caf50;
}
.upload-icon { font-size: 48px; margin-bottom: 8px; }
.upload-text { font-size: 16px; color: #333; font-weight: 500; }
.upload-hint { font-size: 13px; color: #aaa; margin-top: 4px; }

/* Preview */
.upload-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.preview-img {
  max-width: 100%;
  max-height: 260px;
  border-radius: 10px;
  object-fit: contain;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.preview-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}
.preview-badge {
  background: #4caf50;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}
.preview-size {
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
}
.preview-change-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.preview-change-btn:hover {
  background: rgba(0,0,0,0.8);
}

/* ===== Settings ===== */
.setting-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 24px;
  margin-top: 20px;
}
.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.setting-header h3 { font-size: 16px; font-weight: 600; color: #333; }
.setting-value {
  font-size: 18px;
  font-weight: 700;
  color: #7c4dff;
  background: #f5f0ff;
  padding: 4px 14px;
  border-radius: 8px;
}

/* Slider */
.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.slider-label { font-size: 12px; color: #999; min-width: 24px; }
.range-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #e0e0e0, #7c4dff);
  outline: none;
  cursor: pointer;
}
.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #7c4dff;
  box-shadow: 0 2px 6px rgba(124,77,255,0.3);
  cursor: pointer;
  transition: transform 0.15s;
}
.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}
.slider-info {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}
.bead-count-badge {
  margin-top: 14px;
  font-size: 15px;
  color: #333;
  background: #f0f9ff;
  border: 1px solid #d0e8ff;
  border-radius: 10px;
  padding: 10px 16px;
  display: inline-block;
}
.bead-meter {
  margin-top: 10px;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
}
.meter-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a, #ffeb3b, #ff9800, #e53935);
  border-radius: 2px;
  transition: width 0.2s;
}

/* Ratio */
.ratio-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.ratio-btn {
  flex: 1;
  min-width: 80px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}
.ratio-btn:hover { border-color: #7c4dff; color: #7c4dff; }
.ratio-btn.active {
  border-color: #7c4dff;
  background: #f5f0ff;
  color: #7c4dff;
}

/* Mode select */
.mode-options {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.mode-btn {
  flex: 1;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.mode-btn:hover {
  border-color: #7c4dff;
}
.mode-btn.active {
  border-color: #7c4dff;
  background: #f5f0ff;
}
.mode-icon { font-size: 24px; display: block; margin-bottom: 6px; }
.mode-label { font-size: 15px; font-weight: 600; color: #333; display: block; }
.mode-desc { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.mode-btn.active .mode-label { color: #7c4dff; }

/* Convert Button */
.btn-convert {
  display: block;
  width: 100%;
  margin-top: 24px;
  padding: 16px;
  font-size: 18px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  background: linear-gradient(135deg, #7c4dff, #651fff);
  color: #fff;
  transition: all 0.3s;
}
.btn-convert:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(124,77,255,0.35);
}
.btn-convert:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== Converting ===== */
.converting-step {
  text-align: center;
  padding: 100px 20px;
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

/* ===== Result ===== */
.result-header { text-align: center; margin-bottom: 20px; }
.result-header h2 { font-size: 24px; color: #1a1a2e; }
.result-info {
  color: #888;
  font-size: 14px;
  margin-top: 4px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* Grid */
.grid-section {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
}
.zoom-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}
.zoom-btn {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 14px;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
}
.zoom-btn:hover:not(:disabled) {
  background: #7c4dff;
  color: #fff;
  border-color: #7c4dff;
}
.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.zoom-fit {
  font-size: 12px;
  padding: 4px 10px;
}
.zoom-label {
  font-size: 13px;
  color: #888;
  min-width: 48px;
  text-align: center;
}
.grid-viewport {
  overflow: auto;
  max-height: 600px;
  display: flex;
  justify-content: center;
}
.grid-wrapper {
  min-width: fit-content;
  margin: 0 auto;
}
.bead-grid {
  display: grid;
  gap: 1px;
}
.bead-cell {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
  box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.06);
}
.bead-label {
  font-size: 7px;
  font-weight: 700;
  color: rgba(0,0,0,0.55);
  text-shadow:
    0 0 2px #fff,
    0 0 3px #fff;
  pointer-events: none;
  line-height: 1;
  user-select: none;
}
.bead-cell:hover {
  transform: scale(1.8);
  z-index: 2;
  box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.15);
}

/* ===== Legend ===== */
.legend-section {
  margin-top: 28px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 24px;
}
.legend-section h3 { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px; }
.legend-hint { font-size: 13px; color: #999; margin-bottom: 16px; }

.legend-compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}
.legend-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 13px;
}
.chip-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
}
.chip-code {
  font-weight: 700;
  color: #7c4dff;
}
.chip-count {
  color: #888;
  margin-left: auto;
  font-size: 12px;
}
.legend-total {
  margin-top: 12px;
  font-size: 13px;
  color: #999;
  text-align: right;
}

/* ===== Actions ===== */
.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 28px;
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

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .bead-cell { width: 16px; height: 16px; }
  .bead-label { display: none; }
  .legend-compact { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
}
</style>
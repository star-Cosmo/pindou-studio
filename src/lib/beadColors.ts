/**
 * MARD 拼豆标准色板（291 色）
 * 数据来源于 MARD 品牌官方色号
 * 每个颜色包含：MARD 编码、RGB 值
 */
import { mardColors, type MardColor } from '../data/mardColors'

export interface BeadColor {
  code: string   // 如 "A1", "B16"
  name: string
  hex: string
  rgb: [number, number, number]
}

export const beadPalette: BeadColor[] = mardColors

/**
 * RGB → Lab 色空间转换（D65 标准光源）
 * Lab 色空间是感知均匀的，Delta E 能更准确反映人眼感受的颜色差异
 */

// sRGB 线性化（去除伽马校正）
function linearize(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

// Linear RGB → XYZ（D65）
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const rL = linearize(r)
  const gL = linearize(g)
  const bL = linearize(b)
  return [
    0.4124564 * rL + 0.3575761 * gL + 0.1804375 * bL,
    0.2126729 * rL + 0.7151522 * gL + 0.0721750 * bL,
    0.0193339 * rL + 0.1191920 * gL + 0.9503041 * bL,
  ]
}

// XYZ → Lab（D65）
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const xn = 0.95047, yn = 1.0, zn = 1.08883
  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116
  return [
    116 * f(y / yn) - 16,
    500 * (f(x / xn) - f(y / yn)),
    200 * (f(y / yn) - f(z / zn)),
  ]
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b)
  return xyzToLab(x, y, z)
}

// 预计算色板的 Lab 值（避免重复计算）
const beadPaletteLab: [number, number, number][] = beadPalette.map(
  c => rgbToLab(c.rgb[0], c.rgb[1], c.rgb[2])
)

/**
 * 将 RGB 颜色映射到最近似的拼豆颜色
 * 使用 CIE76 Delta E 色差公式（Lab 色空间下的欧几里得距离）
 * 比 RGB 空间的距离更符合人眼感知
 */
export function findNearestBeadColor(r: number, g: number, b: number): BeadColor {
  const [l, a, bV] = rgbToLab(r, g, b)
  let nearest = beadPalette[0]
  let minDistance = Infinity

  for (let i = 0; i < beadPalette.length; i++) {
    const [pl, pa, pb] = beadPaletteLab[i]
    const dl = l - pl
    const da = a - pa
    const db = bV - pb
    const distance = dl * dl + da * da + db * db

    if (distance < minDistance) {
      minDistance = distance
      nearest = beadPalette[i]
    }
  }

  return nearest
}

export interface ConvertOptions {
  aspectRatio: 'original' | '1:1' | '3:4' | '4:3' | '16:9' | '9:16'
  gridWidth: number
}

export const aspectRatioOptions = [
  { value: 'original', label: '原比例' },
  { value: '1:1',      label: '1:1 方形' },
  { value: '3:4',      label: '3:4 竖版' },
  { value: '4:3',      label: '4:3 横版' },
  { value: '16:9',     label: '16:9 宽屏' },
  { value: '9:16',     label: '9:16 竖屏' },
]

function getAspectRatioValue(option: string): number {
  const map: Record<string, number> = {
    'original': 0,
    '1:1': 1,
    '3:4': 3/4,
    '4:3': 4/3,
    '16:9': 16/9,
    '9:16': 9/16,
  }
  return map[option] || 0
}

/**
 * 根据图片宽高和用户选项计算网格尺寸
 */
export function calcGridSize(
  imgWidth: number,
  imgHeight: number,
  options: ConvertOptions
): { width: number; height: number; totalBeads: number } {
  let w = options.gridWidth
  let h: number

  const ratio = getAspectRatioValue(options.aspectRatio)

  if (options.aspectRatio === 'original') {
    // 保持原比例
    h = Math.round(w * (imgHeight / imgWidth))
  } else {
    // 使用指定比例
    h = Math.round(w / ratio)
  }

  // 限制最大高度为 200
  if (h > 200) {
    h = 200
    w = Math.round(h * ratio)
  }

  return { width: w, height: h, totalBeads: w * h }
}

/**
 * 将图片像素数据转换为拼豆颜色网格
 */
export function convertToBeadGrid(
  imageData: ImageData,
  gridWidth: number,
  gridHeight: number
): BeadColor[][] {
  const { data, width, height } = imageData
  const grid: BeadColor[][] = []

  const stepX = width / gridWidth
  const stepY = height / gridHeight

  for (let gy = 0; gy < gridHeight; gy++) {
    grid[gy] = []
    for (let gx = 0; gx < gridWidth; gx++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0

      const startY = Math.floor(gy * stepY)
      const endY = Math.floor((gy + 1) * stepY)
      const startX = Math.floor(gx * stepX)
      const endX = Math.floor((gx + 1) * stepX)

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4
          sumR += data[idx]
          sumG += data[idx + 1]
          sumB += data[idx + 2]
          count++
        }
      }

      const avgR = Math.round(sumR / count)
      const avgG = Math.round(sumG / count)
      const avgB = Math.round(sumB / count)

      grid[gy][gx] = findNearestBeadColor(avgR, avgG, avgB)
    }
  }

  return grid
}

/**
 * 使用 Floyd-Steinberg 误差扩散抖动算法将图片像素数据转换为拼豆颜色网格
 * 步骤：1. 用像素区域平均法将原图缩放到网格尺寸（避免 canvas 插值产生假颜色）
 *       2. 逐像素匹配最近色并扩散误差到相邻像素
 */
export function convertToBeadGridDithering(
  imageData: ImageData,
  gridWidth: number,
  gridHeight: number
): BeadColor[][] {
  const { data, width, height } = imageData

  // 1. 用像素区域平均法缩放到 gridWidth × gridHeight
  //    不使用 canvas drawImage（双线性插值会产生原图中不存在的混合色）
  const scaledPixels: [number, number, number][] = []
  const stepX = width / gridWidth
  const stepY = height / gridHeight

  for (let gy = 0; gy < gridHeight; gy++) {
    for (let gx = 0; gx < gridWidth; gx++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0
      const startY = Math.floor(gy * stepY)
      const endY = Math.floor((gy + 1) * stepY)
      const startX = Math.floor(gx * stepX)
      const endX = Math.floor((gx + 1) * stepX)

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4
          sumR += data[idx]
          sumG += data[idx + 1]
          sumB += data[idx + 2]
          count++
        }
      }
      scaledPixels.push([
        Math.round(sumR / count),
        Math.round(sumG / count),
        Math.round(sumB / count),
      ])
    }
  }

  // 2. 初始化误差缓冲区
  const error: number[][][] = Array.from({ length: gridHeight }, () =>
    Array.from({ length: gridWidth }, () => [0, 0, 0])
  )

  const grid: BeadColor[][] = []

  // 3. 逐像素应用 Floyd-Steinberg 抖动
  for (let y = 0; y < gridHeight; y++) {
    grid[y] = []
    for (let x = 0; x < gridWidth; x++) {
      const [origR, origG, origB] = scaledPixels[y * gridWidth + x]

      // 原始像素值 + 累计误差
      const r = origR + error[y][x][0]
      const g = origG + error[y][x][1]
      const b = origB + error[y][x][2]

      // 裁剪到有效范围
      const clampedR = Math.max(0, Math.min(255, Math.round(r)))
      const clampedG = Math.max(0, Math.min(255, Math.round(g)))
      const clampedB = Math.max(0, Math.min(255, Math.round(b)))

      // 找到最近色
      const matchedColor = findNearestBeadColor(clampedR, clampedG, clampedB)
      grid[y][x] = matchedColor

      // 计算误差（裁剪后值 - 匹配色值）
      const er = clampedR - matchedColor.rgb[0]
      const eg = clampedG - matchedColor.rgb[1]
      const eb = clampedB - matchedColor.rgb[2]

      // Floyd-Steinberg 误差扩散
      if (x + 1 < gridWidth) {
        error[y][x + 1][0] += (er * 7) / 16
        error[y][x + 1][1] += (eg * 7) / 16
        error[y][x + 1][2] += (eb * 7) / 16
      }
      if (x - 1 >= 0 && y + 1 < gridHeight) {
        error[y + 1][x - 1][0] += (er * 3) / 16
        error[y + 1][x - 1][1] += (eg * 3) / 16
        error[y + 1][x - 1][2] += (eb * 3) / 16
      }
      if (y + 1 < gridHeight) {
        error[y + 1][x][0] += (er * 5) / 16
        error[y + 1][x][1] += (eg * 5) / 16
        error[y + 1][x][2] += (eb * 5) / 16
      }
      if (x + 1 < gridWidth && y + 1 < gridHeight) {
        error[y + 1][x + 1][0] += (er * 1) / 16
        error[y + 1][x + 1][1] += (eg * 1) / 16
        error[y + 1][x + 1][2] += (eb * 1) / 16
      }
    }
  }

  return grid
}
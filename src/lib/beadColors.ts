/**
 * 国产拼豆标准色板
 * 包含常见国产拼豆品牌的 40+ 种颜色
 * 每个颜色包含：名称、RGB 值、拼豆编号
 */

export interface BeadColor {
  id: number
  name: string
  hex: string
  rgb: [number, number, number] // [R, G, B]
}

export const beadPalette: BeadColor[] = [
  { id: 1, name: '白色', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { id: 2, name: '乳白色', hex: '#F5F5DC', rgb: [245, 245, 220] },
  { id: 3, name: '浅灰色', hex: '#D3D3D3', rgb: [211, 211, 211] },
  { id: 4, name: '灰色', hex: '#A9A9A9', rgb: [169, 169, 169] },
  { id: 5, name: '深灰色', hex: '#696969', rgb: [105, 105, 105] },
  { id: 6, name: '黑色', hex: '#1A1A1A', rgb: [26, 26, 26] },
  { id: 7, name: '红色', hex: '#E74C3C', rgb: [231, 76, 60] },
  { id: 8, name: '深红色', hex: '#C0392B', rgb: [192, 57, 43] },
  { id: 9, name: '酒红色', hex: '#8B1A1A', rgb: [139, 26, 26] },
  { id: 10, name: '粉红色', hex: '#FFB6C1', rgb: [255, 182, 193] },
  { id: 11, name: '玫红色', hex: '#E91E63', rgb: [233, 30, 99] },
  { id: 12, name: '橙色', hex: '#FF9800', rgb: [255, 152, 0] },
  { id: 13, name: '深橙色', hex: '#F57C00', rgb: [245, 124, 0] },
  { id: 14, name: '黄色', hex: '#FFEB3B', rgb: [255, 235, 59] },
  { id: 15, name: '金黄色', hex: '#FFD700', rgb: [255, 215, 0] },
  { id: 16, name: '浅黄色', hex: '#FFF9C4', rgb: [255, 249, 196] },
  { id: 17, name: '黄绿色', hex: '#CDDC39', rgb: [205, 220, 57] },
  { id: 18, name: '绿色', hex: '#4CAF50', rgb: [76, 175, 80] },
  { id: 19, name: '深绿色', hex: '#2E7D32', rgb: [46, 125, 50] },
  { id: 20, name: '浅绿色', hex: '#81C784', rgb: [129, 199, 132] },
  { id: 21, name: '草绿色', hex: '#8BC34A', rgb: [139, 195, 74] },
  { id: 22, name: '翠绿色', hex: '#009688', rgb: [0, 150, 136] },
  { id: 23, name: '青色', hex: '#00BCD4', rgb: [0, 188, 212] },
  { id: 24, name: '浅蓝色', hex: '#87CEEB', rgb: [135, 206, 235] },
  { id: 25, name: '天蓝色', hex: '#03A9F4', rgb: [3, 169, 244] },
  { id: 26, name: '蓝色', hex: '#2196F3', rgb: [33, 150, 243] },
  { id: 27, name: '深蓝色', hex: '#1565C0', rgb: [21, 101, 192] },
  { id: 28, name: '藏青色', hex: '#1A237E', rgb: [26, 35, 126] },
  { id: 29, name: '紫色', hex: '#9C27B0', rgb: [156, 39, 176] },
  { id: 30, name: '深紫色', hex: '#6A1B9A', rgb: [106, 27, 154] },
  { id: 31, name: '浅紫色', hex: '#CE93D8', rgb: [206, 147, 216] },
  { id: 32, name: '紫罗兰', hex: '#7B1FA2', rgb: [123, 31, 162] },
  { id: 33, name: '棕色', hex: '#795548', rgb: [121, 85, 72] },
  { id: 34, name: '深棕色', hex: '#4E342E', rgb: [78, 52, 46] },
  { id: 35, name: '浅棕色', hex: '#A1887F', rgb: [161, 136, 127] },
  { id: 36, name: '米色', hex: '#D7CCC8', rgb: [215, 204, 200] },
  { id: 37, name: '肤色', hex: '#FFCCBC', rgb: [255, 204, 188] },
  { id: 38, name: '珊瑚色', hex: '#FF7043', rgb: [255, 112, 67] },
  { id: 39, name: '薄荷色', hex: '#A5D6A7', rgb: [165, 214, 167] },
  { id: 40, name: '灰蓝色', hex: '#78909C', rgb: [120, 144, 156] },
  { id: 41, name: '靛蓝色', hex: '#3F51B5', rgb: [63, 81, 181] },
  { id: 42, name: '柠檬绿', hex: '#C0CA33', rgb: [192, 202, 51] },
  { id: 43, name: '桃色', hex: '#FFAB91', rgb: [255, 171, 145] },
  { id: 44, name: '薰衣草', hex: '#E1BEE7', rgb: [225, 190, 231] },
  { id: 45, name: '卡其色', hex: '#C0A080', rgb: [192, 160, 128] },
  { id: 46, name: '军绿色', hex: '#558B2F', rgb: [85, 139, 47] },
  { id: 47, name: '咖啡色', hex: '#6D4C41', rgb: [109, 76, 65] },
  { id: 48, name: '天青蓝', hex: '#0288D1', rgb: [2, 136, 209] },
  { id: 49, name: '荧光绿', hex: '#64DD17', rgb: [100, 221, 23] },
  { id: 50, name: '荧光粉', hex: '#FF4081', rgb: [255, 64, 129] },
]

/**
 * 将 RGB 颜色映射到最近似的拼豆颜色
 * 使用欧几里得距离算法
 */
export function findNearestBeadColor(r: number, g: number, b: number): BeadColor {
  let nearest = beadPalette[0]
  let minDistance = Infinity

  for (const color of beadPalette) {
    const dr = r - color.rgb[0]
    const dg = g - color.rgb[1]
    const db = b - color.rgb[2]
    // 加权欧几里得距离（人眼对绿色更敏感）
    const distance = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114

    if (distance < minDistance) {
      minDistance = distance
      nearest = color
    }
  }

  return nearest
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
      // 计算当前格子内像素的平均颜色
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
 * 可选的网格尺寸预设
 */
export const gridSizePresets = [
  { label: '小 (24×24)', width: 24, height: 24, difficulty: '入门' },
  { label: '中 (32×32)', width: 32, height: 32, difficulty: '初级' },
  { label: '大 (48×48)', width: 48, height: 48, difficulty: '中级' },
  { label: '超大 (64×64)', width: 64, height: 64, difficulty: '高级' },
]
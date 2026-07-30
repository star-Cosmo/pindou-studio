import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 部署时需要配置 base
  // 如果仓库名是 pindou-studio，则 base 为 '/pindou-studio/'
  base: '/pindou-studio/',
})
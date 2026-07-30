<template>
  <div id="app-root">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
    <footer class="app-footer">
      <p>拼豆工坊 v{{ version }} &copy; 2026 star-Cosmo &mdash; 用创意点亮每一颗豆</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import { useAuthStore } from './stores/auth'
import { version } from '../package.json'

const auth = useAuthStore()

onMounted(() => {
  auth.initialize()
})
</script>

<style scoped>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
}
.app-footer {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 13px;
  border-top: 1px solid #f0f0f0;
  margin-top: 60px;
}
</style>
<template>
  <div class="page-success">
    <div class="success-card">
      <div class="icon-wrapper">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7c4dff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <h1>注册成功！</h1>
      <p class="success-desc">
        我们已向你的注册邮箱发送了一封确认邮件，<br />
        请前往邮箱点击确认链接完成验证。
      </p>
      <p class="success-hint">确认完成后，点击下方按钮登录</p>
      <div class="action-group">
        <button class="btn-primary btn-full" @click="goLogin">我已确认邮箱地址</button>
        <button class="btn-ghost btn-full" @click="goHome">返回主页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goLogin() {
  router.push('/login')
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.page-success {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 40px 20px;
}
.success-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
}
.icon-wrapper {
  margin-bottom: 20px;
}
h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 16px;
}
.success-desc {
  color: #555;
  font-size: 15px;
  line-height: 1.7;
  margin: 0 0 8px;
}
.success-hint {
  color: #999;
  font-size: 13px;
  margin: 12px 0 28px;
}
.action-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.btn-full {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
}
.btn-primary {
  background: linear-gradient(135deg, #7c4dff, #651fff);
  color: #fff;
  font-weight: 600;
}
.btn-ghost {
  background: #fff;
  border: 1px solid #ddd;
  color: #666;
  font-weight: 500;
  transition: border-color 0.2s, color 0.2s;
}
.btn-ghost:hover {
  border-color: #7c4dff;
  color: #7c4dff;
}
</style>

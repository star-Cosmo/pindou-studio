<template>
  <div class="page-auth">
    <div class="auth-card">
      <h1>登录</h1>
      <p class="auth-desc">登录后可保存图纸历史、参与社区互动</p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="请输入邮箱" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" required />
        </div>
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        <button type="submit" class="btn-primary btn-full" :disabled="auth.loading">
          {{ auth.loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  const error = await auth.signIn(email.value, password.value)
  if (error) {
    errorMsg.value = error.message
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.page-auth {
  display: flex;
  justify-content: center;
  padding: 80px 20px;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 40px;
}
.auth-card h1 { font-size: 24px; font-weight: 700; text-align: center; color: #1a1a2e; }
.auth-desc { text-align: center; color: #888; font-size: 14px; margin: 8px 0 28px; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; color: #555; margin-bottom: 6px; }
.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-group input:focus { outline: none; border-color: #7c4dff; }
.error-msg { color: #e53935; font-size: 13px; text-align: center; }
.btn-full { width: 100%; padding: 14px; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; font-weight: 600; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-footer { text-align: center; color: #888; font-size: 14px; margin-top: 24px; }
.auth-footer a { color: #7c4dff; text-decoration: none; font-weight: 500; }
</style>
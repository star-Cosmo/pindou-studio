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
        <!-- 快速登录测试账号 -->
        <button type="button" class="btn-quick btn-full" :disabled="auth.loading" @click="quickLogin">
          🧪 快速登录测试账号
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

// 统一登录逻辑，failureMsg 与 successRoute 用于定制快速登录场景
async function handleLogin(opts?: { failureMsg?: string; successRoute?: string }) {
  errorMsg.value = ''
  const error = await auth.signIn(email.value, password.value)
  if (error) {
    errorMsg.value = opts?.failureMsg ?? error.message
  } else {
    router.push(opts?.successRoute ?? '/')
  }
}

// 快速登录测试账号：自动填入凭据并触发登录
async function quickLogin() {
  email.value = '1074245166@qq.com'
  password.value = 'chen1234'
  await handleLogin({
    failureMsg: '测试账号未创建，请先在注册页注册该账号一次',
    successRoute: '/history'
  })
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
.btn-quick {
  background: #fff;
  border: 1px dashed #bbb;
  color: #666;
  font-weight: 500;
  transition: border-color 0.2s, color 0.2s;
}
.btn-quick:hover:not(:disabled) { border-color: #7c4dff; color: #7c4dff; }
.btn-quick:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-footer { text-align: center; color: #888; font-size: 14px; margin-top: 24px; }
.auth-footer a { color: #7c4dff; text-decoration: none; font-weight: 500; }
</style>
<template>
  <div class="page-profile">
    <h1 class="page-title">个人主页</h1>

    <div v-if="!auth.isLoggedIn" class="login-prompt">
      <p>请先登录</p>
      <router-link to="/login" class="btn-primary">去登录</router-link>
    </div>

    <div v-else class="profile-content">
      <!-- 基本信息 -->
      <div class="profile-card">
        <div class="profile-avatar">{{ auth.user?.email?.charAt(0).toUpperCase() }}</div>
        <div class="profile-detail">
          <h2>{{ auth.user?.email }}</h2>
          <p class="profile-id">用户 ID: {{ auth.user?.id?.slice(0, 8) }}...</p>
          <p class="profile-join">注册时间: {{ formatDate(auth.user?.created_at || '') }}</p>
        </div>
      </div>

      <!-- 统计 -->
      <div class="profile-stats">
        <div class="stat-card">
          <span class="stat-num">{{ patternCount }}</span>
          <span class="stat-label">图纸数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">0</span>
          <span class="stat-label">获赞数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">0</span>
          <span class="stat-label">成就</span>
        </div>
      </div>

      <!-- 修改用户名 -->
      <div class="section-card">
        <h3 class="section-title">修改用户名</h3>
        <form @submit.prevent="handleChangeUsername" class="password-form">
          <div class="form-group">
            <label>当前用户名</label>
            <input :value="currentUsername" type="text" disabled class="input-disabled" />
          </div>
          <div class="form-group">
            <label>新用户名</label>
            <input v-model="usernameForm.newUsername" type="text" placeholder="输入新用户名" required minlength="2" />
          </div>
          <p v-if="usernameForm.error" class="form-error">{{ usernameForm.error }}</p>
          <p v-if="usernameForm.success" class="form-success">{{ usernameForm.success }}</p>
          <button type="submit" class="btn-primary" :disabled="usernameForm.loading">
            {{ usernameForm.loading ? '保存中...' : '保存用户名' }}
          </button>
        </form>
      </div>

      <!-- 修改密码 -->
      <div class="section-card">
        <h3 class="section-title">修改密码</h3>
        <form @submit.prevent="handleChangePassword" class="password-form">
          <div class="form-group">
            <label>新密码</label>
            <input v-model="passwordForm.newPassword" type="password" placeholder="至少 6 位" required minlength="6" />
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码" required minlength="6" />
          </div>
          <p v-if="passwordForm.error" class="form-error">{{ passwordForm.error }}</p>
          <p v-if="passwordForm.success" class="form-success">{{ passwordForm.success }}</p>
          <button type="submit" class="btn-primary" :disabled="passwordForm.loading">
            {{ passwordForm.loading ? '修改中...' : '修改密码' }}
          </button>
        </form>
      </div>

      <!-- 快捷操作 -->
      <div class="profile-actions">
        <router-link v-if="auth.isAdmin" to="/admin" class="btn-outline btn-admin">进入管理后台</router-link>
        <router-link to="/history" class="btn-outline">查看我的图纸</router-link>
        <button class="btn-outline btn-danger" @click="handleLogout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePatternStore } from '../stores/patterns'
import { supabase } from '../lib/supabase'

const auth = useAuthStore()
const patternStore = usePatternStore()
const router = useRouter()
const patternCount = ref(0)

const currentUsername = ref('')
const usernameForm = reactive({
  newUsername: '',
  loading: false,
  error: '',
  success: '',
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
  loading: false,
  error: '',
  success: '',
})

onMounted(async () => {
  if (auth.isLoggedIn && auth.user) {
    await patternStore.fetchMyPatterns(auth.user.id)
    patternCount.value = patternStore.patterns.length

    // 获取当前用户名
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', auth.user.id)
      .single()
    if (data?.username) {
      currentUsername.value = data.username
    }
  }
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function handleChangeUsername() {
  usernameForm.error = ''
  usernameForm.success = ''

  if (usernameForm.newUsername.length < 2) {
    usernameForm.error = '用户名至少 2 个字符'
    return
  }

  usernameForm.loading = true
  const { error } = await supabase
    .from('profiles')
    .update({ username: usernameForm.newUsername })
    .eq('user_id', auth.user!.id)
  usernameForm.loading = false

  if (error) {
    usernameForm.error = error.message
    return
  }

  currentUsername.value = usernameForm.newUsername
  usernameForm.success = '用户名修改成功'
  usernameForm.newUsername = ''
  setTimeout(() => { usernameForm.success = '' }, 3000)
}

async function handleChangePassword() {
  passwordForm.error = ''
  passwordForm.success = ''

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordForm.error = '两次密码不一致'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    passwordForm.error = '密码至少 6 位'
    return
  }

  passwordForm.loading = true
  const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
  passwordForm.loading = false

  if (error) {
    passwordForm.error = error.message
    return
  }

  passwordForm.success = '密码修改成功'
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  setTimeout(() => { passwordForm.success = '' }, 3000)
}

async function handleLogout() {
  await auth.signOut()
  router.push('/')
}
</script>

<style scoped>
.page-profile { max-width: 700px; margin: 0 auto; padding: 40px 20px; }
.page-title { font-size: 28px; font-weight: 700; color: #1a1a2e; }

.login-prompt { text-align: center; padding: 60px 20px; }
.login-prompt p { margin-bottom: 16px; color: #888; }
.btn-primary { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; font-size: 14px; }
.btn-primary:hover { opacity: 0.92; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.profile-card { display: flex; gap: 24px; align-items: center; padding: 32px; background: #fff; border: 1px solid #f0f0f0; border-radius: 16px; margin-top: 24px; }
.profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }
.profile-detail h2 { font-size: 18px; font-weight: 600; color: #1a1a2e; }
.profile-id, .profile-join { font-size: 13px; color: #999; margin-top: 4px; }

.profile-stats { display: flex; gap: 16px; margin-top: 24px; }
.stat-card { flex: 1; padding: 24px; background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; text-align: center; }
.stat-num { display: block; font-size: 28px; font-weight: 700; color: #7c4dff; }
.stat-label { display: block; font-size: 13px; color: #888; margin-top: 4px; }

/* 修改密码区块 */
.section-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 16px; padding: 28px; margin-top: 24px; }
.section-title { font-size: 17px; font-weight: 600; color: #1a1a2e; margin-bottom: 20px; }
.password-form { max-width: 380px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; color: #555; margin-bottom: 6px; }
.form-group input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.form-group input:focus { outline: none; border-color: #7c4dff; }
.input-disabled { background: #f5f5f5; color: #999; cursor: not-allowed; }
.form-error { color: #e53935; font-size: 13px; margin: 6px 0; }
.form-success { color: #2e8b57; font-size: 13px; margin: 6px 0; }

.profile-actions { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
.btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 12px 24px; border: 2px solid #7c4dff; color: #7c4dff; border-radius: 10px; text-decoration: none; font-weight: 600; background: #fff; cursor: pointer; font-size: 14px; }
.btn-outline:hover { background: #f5f0ff; }
.btn-danger { border-color: #e53935; color: #e53935; }
.btn-danger:hover { background: #fff0f0; }
.btn-admin { border-color: #b8860b; color: #b8860b; }
.btn-admin:hover { background: #fff8e7; }
</style>

<template>
  <div class="page-admin">
    <h1 class="page-title">管理后台</h1>
    <p class="page-desc">管理平台用户与图纸</p>

    <div class="tab-bar">
      <button :class="['tab-btn', { active: activeTab === 'users' }]" @click="activeTab = 'users'">
        用户管理
      </button>
      <button :class="['tab-btn', { active: activeTab === 'patterns' }]" @click="activeTab = 'patterns'">
        图纸管理
      </button>
    </div>

    <p v-if="errorMsg" class="action-error">{{ errorMsg }}</p>
    <p v-if="successMsg" class="action-success">{{ successMsg }}</p>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- ==================== 用户管理 ==================== -->
    <div v-else-if="activeTab === 'users'">
      <div class="toolbar">
        <button class="btn-primary btn-sm" @click="showCreateModal = true">新增用户</button>
        <span class="toolbar-info">共 {{ profiles.length }} 个用户</span>
      </div>

      <div v-if="profiles.length === 0" class="empty-state">
        <p>暂无用户数据</p>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>身份</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>图纸</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in profiles" :key="u.user_id">
              <td class="cell-username">{{ u.username || u.email?.split('@')[0] || '--' }}</td>
              <td class="cell-email">{{ u.email || '--' }}</td>
              <td>
                <span v-if="u.is_admin" class="badge badge-admin">管理员</span>
                <span v-else class="badge badge-normal">用户</span>
              </td>
              <td>
                <span :class="['badge', u.status === 'disabled' ? 'badge-disabled' : 'badge-active']">
                  {{ u.status === 'disabled' ? '已禁用' : '正常' }}
                </span>
              </td>
              <td class="cell-date">{{ formatDate(u.created_at) }}</td>
              <td>{{ u.pattern_count }}</td>
              <td>
                <div v-if="u.user_id === myUserId" class="self-label">当前账号</div>
                <div v-else class="row-actions">
                  <button class="btn-text" @click="openInfoModal(u)">查看</button>
                  <button class="btn-text" @click="openPasswordModal(u)">改密</button>
                  <button class="btn-text btn-text-danger" @click="openDeleteConfirm(u)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== 图纸管理 ==================== -->
    <div v-else>
      <div v-if="patterns.length === 0" class="empty-state">
        <p>暂无图纸数据</p>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>缩略图</th>
              <th>标题</th>
              <th>作者</th>
              <th>尺寸</th>
              <th>状态</th>
              <th>点赞</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in patterns" :key="p.id">
              <td>
                <div class="thumb-cell">
                  <img v-if="p.thumbnail_url" :src="p.thumbnail_url" :alt="p.title" />
                  <div v-else class="thumb-placeholder">{{ p.grid_width }}x{{ p.grid_height }}</div>
                </div>
              </td>
              <td class="cell-title">{{ p.title }}</td>
              <td class="cell-email">{{ p.author_email || '--' }}</td>
              <td>{{ p.grid_width }}x{{ p.grid_height }}</td>
              <td>
                <span v-if="p.is_public" class="badge badge-public">已发布</span>
                <span v-else class="badge badge-private">未发布</span>
              </td>
              <td>{{ p.likes_count || 0 }}</td>
              <td class="cell-date">{{ formatDate(p.created_at) }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn-text" :disabled="actionLoading" @click="togglePublic(p)">
                    {{ p.is_public ? '下架' : '上架' }}
                  </button>
                  <button class="btn-text btn-text-danger" :disabled="actionLoading" @click="deletePattern(p)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== 新增用户弹窗 ===== -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-card" @click.stop>
        <h2>新增用户</h2>
        <form @submit.prevent="handleCreateUser">
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="createForm.email" type="email" placeholder="user@example.com" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="createForm.password" type="password" placeholder="初始密码" required minlength="6" />
          </div>
          <div class="form-group">
            <label>用户名（可选）</label>
            <input v-model="createForm.username" type="text" placeholder="留空则使用邮箱前缀" />
          </div>
          <p v-if="createError" class="error-msg">{{ createError }}</p>
          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="createLoading">创建</button>
            <button type="button" class="btn-secondary" @click="showCreateModal = false">取消</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===== 修改密码弹窗 ===== -->
    <div v-if="showPasswordModal && passwordTarget" class="modal-overlay" @click="showPasswordModal = false">
      <div class="modal-card" @click.stop>
        <h2>修改密码</h2>
        <p class="modal-desc">用户：{{ passwordTarget.username || passwordTarget.email }}</p>
        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label>新密码</label>
            <input v-model="passwordForm.newPassword" type="password" placeholder="输入新密码" required minlength="6" />
          </div>
          <div class="form-group">
            <label>确认密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码" required minlength="6" />
          </div>
          <p v-if="passwordForm.passwordError" class="error-msg">{{ passwordForm.passwordError }}</p>
          <p v-if="passwordForm.passwordSuccess" class="success-msg">{{ passwordForm.passwordSuccess }}</p>
          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="passwordForm.loading">确认修改</button>
            <button type="button" class="btn-secondary" @click="showPasswordModal = false">取消</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===== 删除确认弹窗 ===== -->
    <div v-if="showDeleteConfirm && deleteTarget" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-card modal-card-sm" @click.stop>
        <h2>确认删除</h2>
        <p>确定要删除用户 <strong>{{ deleteTarget.username || deleteTarget.email }}</strong> 吗？</p>
        <p class="delete-warn">此操作将同时删除该用户的所有图纸和记录，不可撤销。</p>
        <div class="modal-actions">
          <button class="btn-danger" :disabled="deleteLoading" @click="handleDeleteUser">确认删除</button>
          <button class="btn-secondary" @click="showDeleteConfirm = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useAdminStore } from '../stores/admin'
import type { AdminProfile, AdminPattern } from '../stores/admin'

const auth = useAuthStore()
const adminStore = useAdminStore()

const myUserId = auth.user?.id || ''

const activeTab = ref<'users' | 'patterns'>('users')
const profiles = ref<AdminProfile[]>([])
const patterns = ref<AdminPattern[]>([])
const loading = ref(true)
const actionLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// 新增用户
const showCreateModal = ref(false)
const createForm = ref({ email: '', password: '', username: '' })
const createLoading = ref(false)
const createError = ref('')

// 修改密码
const showPasswordModal = ref(false)
const passwordTarget = ref<AdminProfile | null>(null)
const passwordForm = ref({ newPassword: '', confirmPassword: '', loading: false, passwordError: '', passwordSuccess: '' })

// 删除确认
const showDeleteConfirm = ref(false)
const deleteTarget = ref<AdminProfile | null>(null)
const deleteLoading = ref(false)

async function loadAll() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  const [p, pat] = await Promise.all([
    adminStore.fetchAllProfiles(),
    adminStore.fetchAllPatterns(),
  ])
  profiles.value = p
  patterns.value = pat
  loading.value = false
}

// 新增用户
async function handleCreateUser() {
  createLoading.value = true
  createError.value = ''
  const { error } = await adminStore.createUser(
    createForm.value.email,
    createForm.value.password,
    createForm.value.username || undefined,
  )
  createLoading.value = false
  if (error) {
    createError.value = error.message
    return
  }
  showCreateModal.value = false
  createForm.value = { email: '', password: '', username: '' }
  setSuccess('用户创建成功')
  await loadAll()
}

// 打开改密弹窗
function openPasswordModal(u: AdminProfile) {
  passwordTarget.value = u
  passwordForm.value = { newPassword: '', confirmPassword: '', loading: false, passwordError: '', passwordSuccess: '' }
  showPasswordModal.value = true
}

// 修改密码
async function handleChangePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordForm.value.passwordError = '两次密码不一致'
    return
  }
  passwordForm.value.loading = true
  passwordForm.value.passwordError = ''
  passwordForm.value.passwordSuccess = ''
  const { error } = await adminStore.updateUserPassword(
    passwordTarget.value!.user_id,
    passwordForm.value.newPassword,
  )
  passwordForm.value.loading = false
  if (error) {
    passwordForm.value.passwordError = error.message
    return
  }
  passwordForm.value.passwordSuccess = '密码修改成功'
}

// 打开删除确认
function openDeleteConfirm(u: AdminProfile) {
  deleteTarget.value = u
  showDeleteConfirm.value = true
}

// 删除用户
async function handleDeleteUser() {
  deleteLoading.value = true
  errorMsg.value = ''
  const { error } = await adminStore.deleteUser(deleteTarget.value!.user_id)
  deleteLoading.value = false
  if (error) {
    errorMsg.value = error.message
    showDeleteConfirm.value = false
    return
  }
  showDeleteConfirm.value = false
  setSuccess('用户已删除')
  await loadAll()
}

// 上架/下架图纸
async function togglePublic(p: AdminPattern) {
  actionLoading.value = true
  errorMsg.value = ''
  const { error } = await adminStore.adminTogglePatternPublic(p.id, !p.is_public)
  actionLoading.value = false
  if (error) {
    errorMsg.value = error.message
    return
  }
  const target = patterns.value.find((x) => x.id === p.id)
  if (target) target.is_public = !target.is_public
}

// 删除图纸
async function deletePattern(p: AdminPattern) {
  if (!confirm('确定删除该图纸？此操作不可撤销')) return
  actionLoading.value = true
  errorMsg.value = ''
  const { error } = await adminStore.adminDeletePattern(p.id)
  actionLoading.value = false
  if (error) {
    errorMsg.value = error.message
    return
  }
  patterns.value = patterns.value.filter((x) => x.id !== p.id)
}

// 查看用户信息（预留扩展）
function openInfoModal(u: AdminProfile) {
  alert([
    `用户信息`,
    `----------------`,
    `用户名: ${u.username || '--'}`,
    `邮箱: ${u.email || '--'}`,
    `身份: ${u.is_admin ? '管理员' : '普通用户'}`,
    `状态: ${u.status === 'disabled' ? '已禁用' : '正常'}`,
    `注册时间: ${formatDate(u.created_at)}`,
    `图纸数: ${u.pattern_count}`,
  ].join('\n'))
}

function setSuccess(msg: string) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

onMounted(() => { loadAll() })
</script>

<style scoped>
.page-admin { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
.page-title { font-size: 28px; font-weight: 700; color: #1a1a2e; }
.page-desc { color: #888; font-size: 14px; margin: 4px 0 28px; }

.tab-bar { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
.tab-btn { padding: 10px 22px; background: #fff; color: #666; border: 1px solid #e8e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { border-color: #d9ccff; color: #7c4dff; }
.tab-btn.active { background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(124, 77, 255, 0.25); }

.toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.toolbar-info { font-size: 13px; color: #999; }

.loading-state { text-align: center; padding: 60px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #7c4dff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 60px 20px; color: #888; }

.action-error { color: #e53935; font-size: 13px; margin: 0 0 14px; padding: 8px 12px; background: #fff5f5; border: 1px solid #ffcdd2; border-radius: 8px; }
.action-success { color: #2e8b57; font-size: 13px; margin: 0 0 14px; padding: 8px 12px; background: #e6f7ec; border: 1px solid #b8e6c8; border-radius: 8px; }
.error-msg { color: #e53935; font-size: 13px; margin: 8px 0; }
.success-msg { color: #2e8b57; font-size: 13px; margin: 8px 0; }

.table-wrap { overflow-x: auto; background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03); }
.data-table { width: 100%; border-collapse: collapse; min-width: 640px; }
.data-table th { text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: #999; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
.data-table td { padding: 14px 16px; font-size: 14px; color: #333; border-bottom: 1px solid #fafafa; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #faf9ff; }

.cell-username { font-weight: 600; color: #1a1a2e; }
.cell-email { color: #666; }
.cell-date { color: #999; font-size: 13px; white-space: nowrap; }
.cell-title { font-weight: 600; color: #1a1a2e; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.thumb-cell { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: #fafafa; display: flex; align-items: center; justify-content: center; }
.thumb-cell img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder { color: #ccc; font-size: 11px; font-weight: 600; }

.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.badge-admin { background: #f1ecff; color: #7c4dff; }
.badge-normal { background: #f5f5f5; color: #999; }
.badge-public { background: #e6f7ec; color: #2e8b57; }
.badge-private { background: #f5f5f5; color: #999; }
.badge-active { background: #e6f7ec; color: #2e8b57; }
.badge-disabled { background: #fff5f5; color: #e53935; }

.row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-text { background: none; border: none; color: #7c4dff; cursor: pointer; font-size: 13px; font-weight: 600; padding: 4px 8px; border-radius: 6px; transition: background 0.15s; }
.btn-text:hover { background: #f5f0ff; }
.btn-text:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-text-danger { color: #e53935; }
.btn-text-danger:hover { background: #fff5f5; }

.self-label { font-size: 12px; color: #ccc; font-style: italic; }

.btn-primary, .btn-secondary, .btn-danger { display: inline-flex; align-items: center; justify-content: center; padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s; }
.btn-primary { background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; }
.btn-primary:hover { opacity: 0.92; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 8px 16px; font-size: 13px; }
.btn-secondary { background: #f1ecff; color: #7c4dff; border: 1px solid #d9ccff; }
.btn-secondary:hover { background: #e6dcff; }
.btn-danger { background: #e53935; color: #fff; }
.btn-danger:hover { opacity: 0.92; }

/* 弹窗 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); max-width: 460px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; }
.modal-card-sm { max-width: 400px; }
.modal-card h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
.modal-desc { color: #888; font-size: 14px; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-actions button { flex: 1; }

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; color: #555; margin-bottom: 6px; }
.form-group input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.form-group input:focus { outline: none; border-color: #7c4dff; }

.delete-warn { color: #e53935; font-size: 13px; margin-top: 8px; }

@media (max-width: 600px) {
  .page-admin { padding: 28px 14px; }
  .data-table th, .data-table td { padding: 12px 10px; }
}
</style>

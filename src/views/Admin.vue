<template>
  <div class="page-admin">
    <h1 class="page-title">⚙️ 管理后台</h1>
    <p class="page-desc">管理平台用户与图纸</p>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'users' }]"
        @click="activeTab = 'users'"
      >
        👥 用户管理
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'patterns' }]"
        @click="activeTab = 'patterns'"
      >
        🖼️ 图纸管理
      </button>
    </div>

    <p v-if="errorMsg" class="action-error">{{ errorMsg }}</p>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 用户管理 -->
    <div v-else-if="activeTab === 'users'">
      <div v-if="profiles.length === 0" class="empty-state">
        <p class="empty-icon">👤</p>
        <p>暂无用户数据</p>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>邮箱</th>
              <th>注册时间</th>
              <th>角色</th>
              <th>图纸数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in profiles" :key="u.id">
              <td class="cell-email">{{ u.email || '—' }}</td>
              <td>{{ formatDate(u.created_at) }}</td>
              <td>
                <span v-if="u.is_admin" class="badge badge-admin">✅ 管理员</span>
                <span v-else class="badge badge-normal">普通用户</span>
              </td>
              <td>{{ u.pattern_count }}</td>
              <td>
                <button
                  class="btn-sm"
                  :class="u.is_admin ? 'btn-secondary' : 'btn-primary'"
                  :disabled="actionLoading"
                  @click="toggleAdmin(u)"
                >
                  {{ u.is_admin ? '取消管理员' : '设为管理员' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图纸管理 -->
    <div v-else>
      <div v-if="patterns.length === 0" class="empty-state">
        <p class="empty-icon">📭</p>
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
                  <div v-else class="thumb-placeholder">{{ p.grid_width }}×{{ p.grid_height }}</div>
                </div>
              </td>
              <td class="cell-title">{{ p.title }}</td>
              <td class="cell-email">{{ p.author_email || '—' }}</td>
              <td>{{ p.grid_width }}×{{ p.grid_height }}</td>
              <td>
                <span v-if="p.is_public" class="badge badge-public">🌍 已发布</span>
                <span v-else class="badge badge-private">🔒 未发布</span>
              </td>
              <td>❤️ {{ p.likes_count || 0 }}</td>
              <td>{{ formatDate(p.created_at) }}</td>
              <td>
                <div class="row-actions">
                  <button
                    class="btn-sm"
                    :class="p.is_public ? 'btn-secondary' : 'btn-primary'"
                    :disabled="actionLoading"
                    @click="togglePublic(p)"
                  >
                    {{ p.is_public ? '下架' : '上架' }}
                  </button>
                  <button
                    class="btn-sm btn-danger"
                    :disabled="actionLoading"
                    @click="deletePattern(p)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdminStore } from '../stores/admin'
import type { AdminProfile, AdminPattern } from '../stores/admin'

const adminStore = useAdminStore()

const activeTab = ref<'users' | 'patterns'>('users')
const profiles = ref<AdminProfile[]>([])
const patterns = ref<AdminPattern[]>([])
const loading = ref(true)
const actionLoading = ref(false)
const errorMsg = ref('')

// 并行加载用户与图纸数据
async function loadAll() {
  loading.value = true
  errorMsg.value = ''
  const [p, pat] = await Promise.all([
    adminStore.fetchAllProfiles(),
    adminStore.fetchAllPatterns(),
  ])
  profiles.value = p
  patterns.value = pat
  loading.value = false
}

// 切换管理员角色
async function toggleAdmin(u: AdminProfile) {
  actionLoading.value = true
  errorMsg.value = ''
  const { error } = await adminStore.setAdmin(u.user_id, !u.is_admin)
  actionLoading.value = false
  if (error) {
    errorMsg.value = error.message || '操作失败，请稍后重试'
    return
  }
  const target = profiles.value.find((x) => x.id === u.id)
  if (target) target.is_admin = !target.is_admin
}

// 上架/下架图纸
async function togglePublic(p: AdminPattern) {
  actionLoading.value = true
  errorMsg.value = ''
  const { error } = await adminStore.adminTogglePatternPublic(p.id, !p.is_public)
  actionLoading.value = false
  if (error) {
    errorMsg.value = error.message || '操作失败，请稍后重试'
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
    errorMsg.value = error.message || '删除失败，请稍后重试'
    return
  }
  patterns.value = patterns.value.filter((x) => x.id !== p.id)
}

// 日期格式化为 yyyy-MM-dd（复用 History.vue 的 formatDate 风格）
function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.page-admin { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
.page-title { font-size: 28px; font-weight: 700; color: #1a1a2e; }
.page-desc { color: #888; font-size: 14px; margin: 4px 0 28px; }

/* Tab 切换栏 */
.tab-bar { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
.tab-btn { padding: 10px 22px; background: #fff; color: #666; border: 1px solid #e8e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { border-color: #d9ccff; color: #7c4dff; }
.tab-btn.active { background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(124, 77, 255, 0.25); }

/* 通用按钮（小尺寸） */
.btn-sm { display: inline-flex; align-items: center; justify-content: center; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.1s, background 0.2s; white-space: nowrap; }
.btn-sm:active { transform: scale(0.97); }
.btn-sm:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary { background: linear-gradient(135deg, #7c4dff, #651fff); color: #fff; }
.btn-primary:hover:not(:disabled) { opacity: 0.92; }

.btn-secondary { background: #f1ecff; color: #7c4dff; border: 1px solid #d9ccff; }
.btn-secondary:hover:not(:disabled) { background: #e6dcff; }

.btn-danger { background: #fff; color: #e53935; border: 1px solid #ffcdd2; }
.btn-danger:hover:not(:disabled) { background: #fff5f5; }

/* 加载/空状态 */
.loading-state { text-align: center; padding: 60px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #7c4dff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state p { color: #888; margin-bottom: 8px; }

/* 错误提示 */
.action-error { color: #e53935; font-size: 13px; margin: 0 0 14px; padding: 8px 12px; background: #fff5f5; border: 1px solid #ffcdd2; border-radius: 8px; }

/* 表格容器：移动端横向滚动 */
.table-wrap { overflow-x: auto; background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03); }
.data-table { width: 100%; border-collapse: collapse; min-width: 640px; }
.data-table th { text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; color: #999; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
.data-table td { padding: 14px 16px; font-size: 14px; color: #333; border-bottom: 1px solid #fafafa; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #faf9ff; }

.cell-email { color: #666; }
.cell-title { font-weight: 600; color: #1a1a2e; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 缩略图 */
.thumb-cell { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: #fafafa; display: flex; align-items: center; justify-content: center; }
.thumb-cell img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder { color: #ccc; font-size: 11px; font-weight: 600; }

/* 徽章 */
.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.badge-admin { background: #f1ecff; color: #7c4dff; }
.badge-normal { background: #f5f5f5; color: #999; }
.badge-public { background: #e6f7ec; color: #2e8b57; }
.badge-private { background: #f5f5f5; color: #999; }

/* 行内操作按钮组 */
.row-actions { display: flex; gap: 8px; flex-wrap: wrap; }

@media (max-width: 600px) {
  .page-admin { padding: 28px 14px; }
  .data-table th, .data-table td { padding: 12px 10px; }
}
</style>

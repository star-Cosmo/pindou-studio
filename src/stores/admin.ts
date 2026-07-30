import { defineStore } from 'pinia'
import { supabase, getAdminClient } from '../lib/supabase'

export interface AdminProfile {
  id: string
  user_id: string
  email: string | null
  is_admin: boolean
  created_at: string
  pattern_count: number
  username: string | null
  nickname: string | null
  status: string | null
}

export interface AdminPattern {
  id: string
  created_at: string
  user_id: string
  title: string
  grid_width: number
  grid_height: number
  thumbnail_url: string | null
  is_public: boolean
  likes_count: number
  author_email: string | null
}

export const useAdminStore = defineStore('admin', () => {
  async function fetchAllProfiles(): Promise<AdminProfile[]> {
    try {
      const [{ data: profiles, error: profilesError }, { data: patterns, error: patternsError }] =
        await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('patterns').select('user_id'),
        ])

      if (profilesError || !profiles) return []
      if (patternsError) return []

      const countMap = new Map<string, number>()
      for (const p of patterns ?? []) {
        if (p.user_id == null) continue
        countMap.set(p.user_id, (countMap.get(p.user_id) ?? 0) + 1)
      }

      return profiles.map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email ?? null,
        is_admin: !!profile.is_admin,
        created_at: profile.created_at,
        pattern_count: countMap.get(profile.user_id) ?? 0,
        username: profile.username ?? null,
        nickname: profile.nickname ?? null,
        status: profile.status ?? 'active',
      }))
    } catch {
      return []
    }
  }

  async function setAdmin(userId: string, isAdmin: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('user_id', userId)
    return { error }
  }

  /** 管理员新增用户 */
  async function createUser(email: string, password: string, username?: string) {
    const admin = getAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) return { data: null, error }

    // 同步创建 profile
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        email,
        username: username || email.split('@')[0],
        is_admin: false,
      })
      if (profileError) return { data: null, error: profileError }
    }

    return { data, error: null }
  }

  /** 管理员删除用户 */
  async function deleteUser(userId: string) {
    const admin = getAdminClient()
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { error }

    await supabase.from('profiles').delete().eq('user_id', userId)
    return { error: null }
  }

  /** 管理员修改用户密码 */
  async function updateUserPassword(userId: string, newPassword: string) {
    const admin = getAdminClient()
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
    return { error }
  }

  /** 管理员修改用户状态 */
  async function updateUserStatus(userId: string, status: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('user_id', userId)
    return { error }
  }

  async function fetchAllPatterns(): Promise<AdminPattern[]> {
    try {
      const { data: patterns, error: patternsError } = await supabase
        .from('patterns')
        .select('*')
        .order('created_at', { ascending: false })

      if (patternsError || !patterns) return []

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')

      if (profilesError) return []

      const emailMap = new Map<string, string | null>()
      for (const p of profiles ?? []) {
        emailMap.set(p.user_id, p.email ?? null)
      }

      return patterns.map((pattern) => ({
        id: pattern.id,
        created_at: pattern.created_at,
        user_id: pattern.user_id,
        title: pattern.title,
        grid_width: pattern.grid_width,
        grid_height: pattern.grid_height,
        thumbnail_url: pattern.thumbnail_url ?? null,
        is_public: !!pattern.is_public,
        likes_count: pattern.likes_count ?? 0,
        author_email: emailMap.get(pattern.user_id) ?? null,
      }))
    } catch {
      return []
    }
  }

  async function adminDeletePattern(patternId: string) {
    const { error } = await supabase.from('patterns').delete().eq('id', patternId)
    return { error }
  }

  async function adminTogglePatternPublic(patternId: string, isPublic: boolean) {
    const { error } = await supabase
      .from('patterns')
      .update({ is_public: isPublic })
      .eq('id', patternId)
    return { error }
  }

  return {
    fetchAllProfiles,
    setAdmin,
    createUser,
    deleteUser,
    updateUserPassword,
    updateUserStatus,
    fetchAllPatterns,
    adminDeletePattern,
    adminTogglePatternPublic,
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const isAdmin = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function loadProfile() {
    if (!user.value) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.value.id)
        .single()

      if (data) {
        isAdmin.value = data.is_admin
      } else {
        // 无记录，插入一条新 profile（is_admin 默认 false）
        await supabase.from('profiles').insert({
          user_id: user.value.id,
          email: user.value.email,
          is_admin: false,
        })
        isAdmin.value = false
      }
    } catch {
      // 查询失败时保持 isAdmin=false，不抛异常
      isAdmin.value = false
    }
  }

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null

    if (user.value) {
      await loadProfile()
    }

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  async function signUp(email: string, password: string) {
    loading.value = true
    const { error } = await supabase.auth.signUp({ email, password })
    loading.value = false
    return error
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      await loadProfile()
    }
    loading.value = false
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
    isAdmin.value = false
  }

  return { user, session, loading, isLoggedIn, isAdmin, initialize, signUp, signIn, signOut, loadProfile }
})
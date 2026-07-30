import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null

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
    loading.value = false
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
  }

  return { user, session, loading, isLoggedIn, initialize, signUp, signIn, signOut }
})
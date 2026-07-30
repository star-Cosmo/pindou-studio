import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export interface BeadPattern {
  id: string
  created_at: string
  user_id: string
  title: string
  grid_width: number
  grid_height: number
  thumbnail_url: string | null
  is_public: boolean
  likes_count: number
  grid_data: string | null
}

export const usePatternStore = defineStore('patterns', () => {
  const patterns = ref<BeadPattern[]>([])
  const loading = ref(false)

  async function fetchMyPatterns(userId: string) {
    loading.value = true
    const { data } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) patterns.value = data
    loading.value = false
  }

  async function fetchPublicPatterns() {
    loading.value = true
    const { data } = await supabase
      .from('patterns')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    if (data) patterns.value = data
    loading.value = false
  }

  async function savePattern(pattern: {
    user_id: string
    title: string
    grid_width: number
    grid_height: number
    thumbnail_url?: string
    is_public: boolean
    grid_data?: string
  }) {
    const { data, error } = await supabase.from('patterns').insert(pattern).select().single()
    return { data, error }
  }

  async function toggleLike(patternId: string, userId: string) {
    // 检查是否已点赞
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('pattern_id', patternId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id)
      await supabase.rpc('decrement_likes', { pattern_id: patternId })
    } else {
      await supabase.from('likes').insert({ pattern_id: patternId, user_id: userId })
      await supabase.rpc('increment_likes', { pattern_id: patternId })
    }
  }

  async function deletePattern(patternId: string) {
    const { error } = await supabase.from('patterns').delete().eq('id', patternId)
    if (!error) {
      patterns.value = patterns.value.filter((p) => p.id !== patternId)
    }
    return { error }
  }

  async function updatePatternVisibility(patternId: string, isPublic: boolean) {
    const { error } = await supabase
      .from('patterns')
      .update({ is_public: isPublic })
      .eq('id', patternId)
    if (!error) {
      patterns.value = patterns.value.map((p) =>
        p.id === patternId ? { ...p, is_public: isPublic } : p,
      )
    }
    return { error }
  }

  return {
    patterns,
    loading,
    fetchMyPatterns,
    fetchPublicPatterns,
    savePattern,
    toggleLike,
    deletePattern,
    updatePatternVisibility,
  }
})
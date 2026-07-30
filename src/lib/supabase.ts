import { createClient } from '@supabase/supabase-js'

// 这些值需要你在 Supabase 后台创建项目后获取
// 教程：https://supabase.com/dashboard 注册 → 新建项目 → 复制 URL 和 anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
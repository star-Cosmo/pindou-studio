import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** 使用 service_role 密钥的管理员客户端（仅管理后台使用） */
export function getAdminClient() {
  const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  if (!key || key === 'your-service-role-key') {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY 未配置，请在 .env 中添加')
  }
  return createClient(supabaseUrl, key)
}
-- 拼豆工坊 v2 数据库迁移
-- 在 Supabase SQL Editor 中运行

-- 1. profiles 表补充字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. patterns 表添加 grid_data（存储完整网格颜色编码）
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS grid_data TEXT;

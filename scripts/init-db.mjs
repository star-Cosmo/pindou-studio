/**
 * Supabase 数据库初始化脚本
 * 运行: node scripts/init-db.mjs
 */
import pg from 'pg'

const { Client } = pg

const client = new Client({
  host: 'db.mxjcmlolfwlpmwojfqtx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'star@Cosmo91',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    await client.connect()
    console.log('✅ 已连接到 Supabase 数据库')

    // 创建 patterns 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS patterns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT now(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        grid_width INT NOT NULL,
        grid_height INT NOT NULL,
        thumbnail_url TEXT,
        is_public BOOLEAN DEFAULT false,
        likes_count INT DEFAULT 0
      );
    `)
    console.log('✅ patterns 表创建成功')

    // 创建 likes 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT now(),
        pattern_id UUID REFERENCES patterns(id) NOT NULL,
        user_id UUID NOT NULL,
        UNIQUE(pattern_id, user_id)
      );
    `)
    console.log('✅ likes 表创建成功')

    // 创建 profiles 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE,
        email TEXT,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `)
    console.log('✅ profiles 表创建成功')

    // 创建 increment_likes 函数
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_likes(pattern_id UUID)
      RETURNS void AS $$
      BEGIN
        UPDATE patterns SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = pattern_id;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ increment_likes 函数创建成功')

    // 创建 decrement_likes 函数
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_likes(pattern_id UUID)
      RETURNS void AS $$
      BEGIN
        UPDATE patterns SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = pattern_id;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ decrement_likes 函数创建成功')

    // 创建存储桶
    try {
      await client.query(`
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('pattern-images', 'pattern-images', true)
        ON CONFLICT (id) DO NOTHING;
      `)
      console.log('✅ pattern-images 存储桶创建成功')
    } catch (e) {
      console.log('⚠️  存储桶可能已存在，跳过')
    }

    // 创建 RLS 策略
    await client.query(`
      ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    `)
    console.log('✅ RLS 已启用')

    // 为 patterns 添加策略
    await client.query(`
      DROP POLICY IF EXISTS "Users can insert their own patterns" ON patterns;
      CREATE POLICY "Users can insert their own patterns" ON patterns
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Users can view their own patterns" ON patterns;
      CREATE POLICY "Users can view their own patterns" ON patterns
        FOR SELECT USING (auth.uid() = user_id);
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can view public patterns" ON patterns;
      CREATE POLICY "Anyone can view public patterns" ON patterns
        FOR SELECT USING (is_public = true);
    `)
    console.log('✅ patterns RLS 策略已创建')

    // 为 patterns 添加管理员策略
    await client.query(`
      DROP POLICY IF EXISTS "Admins can view all patterns" ON patterns;
      CREATE POLICY "Admins can view all patterns" ON patterns
        FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Admins can delete any pattern" ON patterns;
      CREATE POLICY "Admins can delete any pattern" ON patterns
        FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Admins can update any pattern" ON patterns;
      CREATE POLICY "Admins can update any pattern" ON patterns
        FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
    `)
    console.log('✅ patterns 管理员策略已创建')

    // 为 likes 添加策略
    await client.query(`
      DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
      CREATE POLICY "Users can insert their own likes" ON likes
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
      CREATE POLICY "Users can delete their own likes" ON likes
        FOR DELETE USING (auth.uid() = user_id);
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
      CREATE POLICY "Anyone can view likes" ON likes
        FOR SELECT USING (true);
    `)
    console.log('✅ likes RLS 策略已创建')

    // 为 profiles 添加策略
    await client.query(`
      DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
      CREATE POLICY "Users can view profiles" ON profiles
        FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
      CREATE POLICY "Users can insert their own profiles" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
      CREATE POLICY "Users can update their own profiles" ON profiles
        FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
    `)
    console.log('✅ profiles RLS 策略已创建')

    // 为 profiles 添加列级保护触发器，防止普通用户自行修改 is_admin 提权
    await client.query(`
      CREATE OR REPLACE FUNCTION protect_is_admin()
      RETURNS TRIGGER AS $$
      BEGIN
        -- 仅当 is_admin 字段发生变更时检查
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
          -- 当前用户不是管理员则拒绝
          IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true) THEN
            RAISE EXCEPTION '只有管理员可以修改 is_admin 字段';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    await client.query(`
      DROP TRIGGER IF EXISTS trg_protect_is_admin ON profiles;
      CREATE TRIGGER trg_protect_is_admin
        BEFORE UPDATE OF is_admin ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION protect_is_admin();
    `)
    console.log('✅ profiles is_admin 列级保护触发器已创建')

    console.log('\n📋 一次性操作：为测试账号设置管理员权限')
    console.log('在 Supabase Dashboard SQL Editor 执行：')
    console.log("UPDATE profiles SET is_admin = true WHERE email = '1074245166@qq.com';")

    console.log('\n🎉 数据库初始化完成！')
  } catch (err) {
    console.error('❌ 错误:', err.message)
  } finally {
    await client.end()
  }
}

main()
-- 拼豆工坊 (pindou-studio) — Supabase 完整建表脚本
-- 在 Supabase SQL Editor 中运行一次即可

-- 1. 安全辅助函数（SECURITY DEFINER 绕过 RLS 递归）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

-- 2. profiles 表（用户档案 + 管理员标志）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
CREATE POLICY "Users can insert their own profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
CREATE POLICY "Users can update their own profiles" ON profiles
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- is_admin 字段保护：只有管理员能修改
CREATE OR REPLACE FUNCTION public.protect_is_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION '只有管理员可以修改 is_admin 字段';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_is_admin ON profiles;
CREATE TRIGGER trg_protect_is_admin
  BEFORE UPDATE OF is_admin ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_is_admin();

-- 3. patterns 表（拼豆图纸）
CREATE TABLE IF NOT EXISTS patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  grid_width INTEGER NOT NULL,
  grid_height INTEGER NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0
);

ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own patterns" ON patterns;
CREATE POLICY "Users can view own patterns" ON patterns
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_public = true
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own patterns" ON patterns;
CREATE POLICY "Users can insert own patterns" ON patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own patterns" ON patterns;
CREATE POLICY "Users can update own patterns" ON patterns
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own patterns" ON patterns;
CREATE POLICY "Users can delete own patterns" ON patterns
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 4. likes 表（点赞记录）
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  pattern_id UUID NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  UNIQUE(pattern_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. RPC 函数：点赞/取消点赞计数器
CREATE OR REPLACE FUNCTION public.increment_likes(pattern_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE patterns
  SET likes_count = likes_count + 1
  WHERE id = pattern_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes(pattern_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE patterns
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = pattern_id;
END;
$$;

-- 6. 存储桶 pattern-images（图纸缩略图）
INSERT INTO storage.buckets (id, name, public)
VALUES ('pattern-images', 'pattern-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view pattern images" ON storage.objects;
CREATE POLICY "Public can view pattern images" ON storage.objects
  FOR SELECT USING (bucket_id = 'pattern-images');

DROP POLICY IF EXISTS "Users can upload pattern images" ON storage.objects;
CREATE POLICY "Users can upload pattern images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pattern-images'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update own pattern images" ON storage.objects;
CREATE POLICY "Users can update own pattern images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pattern-images'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete own pattern images" ON storage.objects;
CREATE POLICY "Users can delete own pattern images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pattern-images'
    AND auth.role() = 'authenticated'
  );

-- 7. 设置管理员（注册后执行，替换邮箱）
-- UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';

-- ① 创建 posts 表
CREATE TABLE IF NOT EXISTS posts (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email   text,
  title        text        NOT NULL,
  content      text        NOT NULL,
  summary      text        DEFAULT '',
  tags         text[]      DEFAULT '{}',
  search_vector tsvector,
  created_at   timestamptz DEFAULT now()
);

-- ② 全文搜索索引
CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN(search_vector);

-- ③ 自动更新 search_vector 的触发器函数
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'simple',
    COALESCE(NEW.title, '')   || ' ' ||
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(NEW.summary, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_vector_trigger
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_posts_search_vector();

-- ④ 开启 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 所有人可以读
CREATE POLICY "allow public read"
  ON posts FOR SELECT USING (true);

-- 已登录用户可以发帖（只能写自己的）
CREATE POLICY "allow auth insert"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 只有本人可以更新/删除
CREATE POLICY "allow owner update"
  ON posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "allow owner delete"
  ON posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

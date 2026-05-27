-- ============================================================
-- 作品34：社内物品借出管理 - 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. items 表（物品主表）
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('PC', '显示器', '办公设备', '其他')),
  asset_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'borrowed', 'repairing', 'scrapped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);

-- 2. borrow_records 表（借出历史）
CREATE TABLE borrow_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_return_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  note TEXT
);

CREATE INDEX idx_borrow_records_item_id ON borrow_records(item_id);
CREATE INDEX idx_borrow_records_unreturned ON borrow_records(item_id) WHERE returned_at IS NULL;

-- 3. 启用 RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略（内部工具，对 anon 开放全部 CRUD）
CREATE POLICY "anon all on items" ON items
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon all on borrow_records" ON borrow_records
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. RPC：借出物品（原子操作 - 插记录 + 改状态）
CREATE OR REPLACE FUNCTION borrow_item(
  p_item_id UUID,
  p_borrower_name TEXT,
  p_expected_return_at TIMESTAMPTZ,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_status TEXT;
  v_record_id UUID;
BEGIN
  -- 行锁防并发
  SELECT status INTO v_status FROM items WHERE id = p_item_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION '物品不存在';
  END IF;

  IF v_status <> 'available' THEN
    RAISE EXCEPTION '物品当前状态不可借出（%）', v_status;
  END IF;

  INSERT INTO borrow_records (item_id, borrower_name, expected_return_at, note)
  VALUES (p_item_id, p_borrower_name, p_expected_return_at, p_note)
  RETURNING id INTO v_record_id;

  UPDATE items SET status = 'borrowed' WHERE id = p_item_id;

  RETURN v_record_id;
END;
$$;

-- 6. RPC：归还物品（原子操作 - 写归还时间 + 改状态）
CREATE OR REPLACE FUNCTION return_item(p_record_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_item_id UUID;
  v_already_returned TIMESTAMPTZ;
BEGIN
  SELECT item_id, returned_at INTO v_item_id, v_already_returned
  FROM borrow_records WHERE id = p_record_id FOR UPDATE;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION '借出记录不存在';
  END IF;

  IF v_already_returned IS NOT NULL THEN
    RAISE EXCEPTION '该记录已归还';
  END IF;

  UPDATE borrow_records SET returned_at = now() WHERE id = p_record_id;
  UPDATE items SET status = 'available' WHERE id = v_item_id;
END;
$$;

-- 7. 授权 anon 调用 RPC
GRANT EXECUTE ON FUNCTION borrow_item TO anon;
GRANT EXECUTE ON FUNCTION return_item TO anon;

-- ============================================================
-- 作品34：种子数据（可选执行）
-- 用于 Step 3 验证列表页的各种状态显示
-- 想清空时执行：TRUNCATE items CASCADE;
-- ============================================================

INSERT INTO items (name, category, asset_code, status) VALUES
  ('ThinkPad X1 Carbon Gen 11', 'PC', 'PC-001', 'borrowed'),
  ('MacBook Pro 14 (M3)', 'PC', 'PC-002', 'available'),
  ('Dell U2723QE 27" 4K', '显示器', 'MON-001', 'borrowed'),
  ('LG 24" FHD', '显示器', 'MON-002', 'available'),
  ('Logitech MX Master 3S', '办公设备', 'OFC-001', 'available'),
  ('HP LaserJet Pro M404', '办公设备', 'OFC-099', 'repairing'),
  ('旧 ThinkPad T440', 'PC', 'PC-999', 'scrapped');

-- 给 PC-001 一个已超期 5 天的借出记录
INSERT INTO borrow_records (item_id, borrower_name, borrowed_at, expected_return_at, note)
SELECT id, '田中太郎', now() - interval '10 days', now() - interval '5 days', '出差用'
FROM items WHERE asset_code = 'PC-001';

-- 给 MON-001 一个 5 天后到期的借出记录
INSERT INTO borrow_records (item_id, borrower_name, borrowed_at, expected_return_at)
SELECT id, '佐藤花子', now() - interval '2 days', now() + interval '5 days'
FROM items WHERE asset_code = 'MON-001';

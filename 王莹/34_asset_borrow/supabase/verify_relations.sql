-- ============================================================
-- 作品34：关联关系验证脚本
--
-- 用途：验证 items → borrow_records 一对多外键关系的完整性
-- 用法：在 Supabase Dashboard → SQL Editor 中【分段执行】
--       每段以 -- ① / -- ② 开头，单独选中运行观察结果
-- 说明：第 ④ 部分会创建临时数据并清理，不会影响生产数据
-- ============================================================


-- ============================================================
-- ① 验证 1:N 关系 - 每个物品被借出过几次
--
-- 期望：能看到一个物品对应多条借出记录，证明 1:N 关系成立
-- ============================================================
SELECT
  i.asset_code AS 资产编号,
  i.name AS 物品名称,
  COUNT(br.id) AS 总借出次数,
  COUNT(br.id) FILTER (WHERE br.returned_at IS NULL) AS 未归还次数
FROM items i
LEFT JOIN borrow_records br ON br.item_id = i.id
GROUP BY i.id, i.asset_code, i.name
ORDER BY 总借出次数 DESC, i.asset_code;


-- ============================================================
-- ② JOIN 查询 - 某个物品的完整借出历史
--
-- 期望：通过 JOIN 把两表关联，看到该物品的全部借出明细
-- 提示：把 WHERE 中的资产编号改成你想查的
-- ============================================================
SELECT
  i.name AS 物品,
  br.borrower_name AS 借用人,
  br.borrowed_at AS 借出时间,
  br.expected_return_at AS 预计归还,
  br.returned_at AS 实际归还,
  br.note AS 备注
FROM items i
JOIN borrow_records br ON br.item_id = i.id
WHERE i.asset_code = 'OFC-001'
ORDER BY br.borrowed_at DESC;


-- ============================================================
-- ③ 验证外键约束 - 不能插入指向"不存在物品"的借出记录
--
-- 期望：执行报错
--   "insert or update on table 'borrow_records'
--    violates foreign key constraint"
-- 含义：数据库帮我们挡住了脏数据，保证引用完整性
-- ============================================================
INSERT INTO borrow_records (item_id, borrower_name, expected_return_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- 这个 UUID 不存在于 items 表
  '幽灵借用人',
  now() + interval '1 day'
);


-- ============================================================
-- ④ 验证 ON DELETE CASCADE - 删父表时子表自动级联删除
--
-- 流程：插入一对测试数据 → 查看 → 删父表 → 再查看（应为 0）
-- 注意：4.1/4.2/4.3/4.4 分别单独运行，便于观察每步变化
-- ============================================================

-- 4.1 插入一对测试数据（一个物品 + 一条借出记录）
INSERT INTO items (name, category, asset_code, status)
VALUES ('CASCADE 测试物品', 'PC', 'CASCADE-TEST-001', 'borrowed');

INSERT INTO borrow_records (item_id, borrower_name, expected_return_at)
SELECT id, '__CASCADE_TEST__', now() + interval '7 days'
FROM items WHERE asset_code = 'CASCADE-TEST-001';

-- 4.2 确认两表各有 1 条相关记录
SELECT 'items' AS 表, COUNT(*) AS 数量
FROM items WHERE asset_code = 'CASCADE-TEST-001'
UNION ALL
SELECT 'borrow_records', COUNT(*)
FROM borrow_records WHERE borrower_name = '__CASCADE_TEST__';

-- 4.3 只删除父表（items）那一条，不去碰 borrow_records
DELETE FROM items WHERE asset_code = 'CASCADE-TEST-001';

-- 4.4 再查：两张表都应该是 0 条
--      borrow_records 那条会被 CASCADE 自动删除，无需手动 DELETE
SELECT 'items' AS 表, COUNT(*) AS 数量
FROM items WHERE asset_code = 'CASCADE-TEST-001'
UNION ALL
SELECT 'borrow_records', COUNT(*)
FROM borrow_records WHERE borrower_name = '__CASCADE_TEST__';

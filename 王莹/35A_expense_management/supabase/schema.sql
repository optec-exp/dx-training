-- ============================================================
-- 作品 40A 费用申请管理 - 数据库 Schema
-- 复用作品34的 Supabase 项目（gpfrwjpdetlhqkgvsmhx）
-- 所有对象使用 expense_ 前缀避免与作品34冲突
-- ============================================================

-- ============================================================
-- 1. 主表：费用申请
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_name text NOT NULL,
    category text NOT NULL CHECK (category IN (
        'business_activity',     -- 业务活动费
        'business_maintenance',  -- 业务维持费
        'hr_it_investment',      -- 人才与IT投资
        'labor_cost',            -- 人工费
        'tax'                    -- 税费
    )),
    amount numeric(12, 2) NOT NULL CHECK (amount > 0),
    summary text NOT NULL,
    receipt_url text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',      -- 草稿
        'submitted',  -- 申请中
        'reviewing',  -- 审批中
        'approved',   -- 完成
        'rejected'    -- 拒绝
    )),
    applied_at timestamptz,    -- 提交时填写（status: draft -> submitted 时由 RPC 写入）
    approved_at timestamptz,   -- 审批完成时填写（status -> approved 时由 RPC 写入，用于月度汇总）
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. 子表：状态变更历史（1:N 关联）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES public.expense_applications(id) ON DELETE CASCADE,
    from_status text,  -- 首次创建时为 NULL
    to_status text NOT NULL,
    operator_name text NOT NULL,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_history_app_id
    ON public.expense_status_history(application_id, created_at DESC);

-- ============================================================
-- 3. 月度汇总视图（按 approved_at 月份 + 类别）
-- 只统计 approved 状态
-- ============================================================
CREATE OR REPLACE VIEW public.expense_monthly_summary AS
SELECT
    to_char(approved_at, 'YYYY-MM') AS month,
    category,
    COUNT(*) AS application_count,
    SUM(amount) AS total_amount
FROM public.expense_applications
WHERE status = 'approved' AND approved_at IS NOT NULL
GROUP BY to_char(approved_at, 'YYYY-MM'), category
ORDER BY month DESC, category;

-- ============================================================
-- 4. RPC: 状态变更（原子化：UPDATE + INSERT history）
-- ============================================================
-- 允许的状态转移：
--   draft      -> submitted  (申请人提交)
--   submitted  -> reviewing  (审批人受理)
--   reviewing  -> approved   (审批通过)
--   reviewing  -> rejected   (审批驳回)
-- 任何其他转移视为非法，抛异常
-- ============================================================
CREATE OR REPLACE FUNCTION public.expense_change_status(
    p_application_id uuid,
    p_new_status text,
    p_operator_name text,
    p_comment text DEFAULT NULL
) RETURNS public.expense_applications
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_status text;
    v_now timestamptz := now();
    v_result public.expense_applications;
BEGIN
    -- 锁行防并发
    SELECT status INTO v_current_status
    FROM public.expense_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION '申请单不存在: %', p_application_id;
    END IF;

    -- 校验状态转移合法性
    IF NOT (
        (v_current_status = 'draft' AND p_new_status = 'submitted') OR
        (v_current_status = 'submitted' AND p_new_status = 'reviewing') OR
        (v_current_status = 'reviewing' AND p_new_status = 'approved') OR
        (v_current_status = 'reviewing' AND p_new_status = 'rejected')
    ) THEN
        RAISE EXCEPTION '非法状态转移: % -> %', v_current_status, p_new_status;
    END IF;

    -- 更新主表
    UPDATE public.expense_applications
    SET status = p_new_status,
        updated_at = v_now,
        applied_at = CASE WHEN p_new_status = 'submitted' THEN v_now ELSE applied_at END,
        approved_at = CASE WHEN p_new_status = 'approved' THEN v_now ELSE approved_at END
    WHERE id = p_application_id
    RETURNING * INTO v_result;

    -- 写历史记录
    INSERT INTO public.expense_status_history (
        application_id, from_status, to_status, operator_name, comment
    ) VALUES (
        p_application_id, v_current_status, p_new_status, p_operator_name, p_comment
    );

    RETURN v_result;
END;
$$;

-- ============================================================
-- 5. RPC: 创建草稿（INSERT 主表 + INSERT 首条历史）
-- 首条历史 from_status=NULL, to_status='draft'
-- ============================================================
CREATE OR REPLACE FUNCTION public.expense_create_draft(
    p_applicant_name text,
    p_category text,
    p_amount numeric,
    p_summary text,
    p_receipt_url text DEFAULT NULL
) RETURNS public.expense_applications
LANGUAGE plpgsql
AS $$
DECLARE
    v_result public.expense_applications;
BEGIN
    INSERT INTO public.expense_applications (
        applicant_name, category, amount, summary, receipt_url, status
    ) VALUES (
        p_applicant_name, p_category, p_amount, p_summary, p_receipt_url, 'draft'
    ) RETURNING * INTO v_result;

    INSERT INTO public.expense_status_history (
        application_id, from_status, to_status, operator_name, comment
    ) VALUES (
        v_result.id, NULL, 'draft', p_applicant_name, '创建草稿'
    );

    RETURN v_result;
END;
$$;

-- ============================================================
-- 6. RLS 策略（学习作品，anon 全开）
-- ============================================================
ALTER TABLE public.expense_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expense_applications_all ON public.expense_applications;
CREATE POLICY expense_applications_all
    ON public.expense_applications
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS expense_status_history_all ON public.expense_status_history;
CREATE POLICY expense_status_history_all
    ON public.expense_status_history
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 视图自动继承底表权限，无需单独 RLS
GRANT SELECT ON public.expense_monthly_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expense_change_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expense_create_draft TO anon, authenticated;

-- ============================================================
-- 7. Storage RLS：允许 anon 对 expense-receipts bucket 做所有操作
-- 注意：bucket 的"Public" 选项只控制读，写入仍需 policy 授权
-- ============================================================
DROP POLICY IF EXISTS expense_receipts_anon_all ON storage.objects;
CREATE POLICY expense_receipts_anon_all
    ON storage.objects
    FOR ALL
    TO anon, authenticated
    USING (bucket_id = 'expense-receipts')
    WITH CHECK (bucket_id = 'expense-receipts');

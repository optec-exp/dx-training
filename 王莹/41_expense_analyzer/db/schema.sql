-- 作品41 费用分析 AI 工具 — 数据库 schema
-- 在 Supabase SQL Editor 中整段执行。所有表带 ex41_ 前缀，与本项目其它表（通讯录等）隔离。

-- 可重复执行：先删后建（仅删本作品的 ex41_ 表，不影响其它表）
drop table if exists ex41_analysis_reports cascade;
drop table if exists ex41_expenses cascade;
drop table if exists ex41_budgets cascade;
drop table if exists ex41_categories cascade;

-- ① 费用类目（固定4类，承载"定义"与预算关联）
create table ex41_categories (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,           -- maintenance / activity / personnel / talent_it
  name        text not null,                  -- 业务维持费 / 业务活动费 / 人件费 / 人才·IT投资
  description text not null,                   -- 口径定义（会喂给 AI）
  sort_order  int  not null default 0
);

-- ② 月度预算（按 类目 × 月）
create table ex41_budgets (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references ex41_categories(id) on delete cascade,
  period        date not null,                -- 当月第一天，如 2025-06-01
  budget_amount numeric not null check (budget_amount >= 0),
  unique (category_id, period)                -- 同类目同月只允许一条预算
);

-- ③ 费用明细（外键到类目；不含税金类目）
create table ex41_expenses (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references ex41_categories(id) on delete restrict,
  expense_date date not null,
  department   text not null,
  vendor       text,
  amount       numeric not null check (amount >= 0),
  description  text,
  created_at   timestamptz not null default now()
);
create index ex41_expenses_date_idx     on ex41_expenses (expense_date);
create index ex41_expenses_category_idx on ex41_expenses (category_id);

-- ④ 分析报告（保存 AI 结果 + Google Doc 链接）
create table ex41_analysis_reports (
  id              uuid primary key default gen_random_uuid(),
  period_start    date not null,
  period_end      date not null,
  summary         text,                       -- AI 总体摘要
  anomalies       jsonb,                      -- 异常列表
  trends          jsonb,                      -- 趋势分析
  recommendations jsonb,                      -- 成本削减建议
  stats           jsonb,                      -- 代码侧算出的统计快照（备查）
  ai_model        text,
  raw_ai_output   text,                       -- AI 原始返回（备查）
  google_doc_id   text,
  google_doc_url  text,
  created_at      timestamptz not null default now()
);

-- RLS：开启行级安全。数据表对外只读；报告表可读；写入由服务端 service_role 完成（service_role 自动绕过 RLS）。
alter table ex41_categories       enable row level security;
alter table ex41_budgets          enable row level security;
alter table ex41_expenses         enable row level security;
alter table ex41_analysis_reports enable row level security;

create policy "ex41 read categories" on ex41_categories       for select using (true);
create policy "ex41 read budgets"    on ex41_budgets          for select using (true);
create policy "ex41 read expenses"   on ex41_expenses         for select using (true);
create policy "ex41 read reports"    on ex41_analysis_reports for select using (true);

-- ============================================================================
-- 月度结算支援系统 · Supabase / Postgres Schema
-- 说明：
--   1) kc_* 为 Kintone 只读镜像表（手动同步落库；Kintone 本身绝不回写）。
--   2) 其余为本系统读写的业务表。
--   3) 金额一律存"原币种"金额；Kintone 已换算的日元/人民币仅毛利核算用。
--   4) company: 'EXPRESS'(空+海) | 'TRADING'(EC)；region: '日本'|'中国'|'EC'。
--   5) 全部对象建在独立 schema `settlement`，与同 project 内其它作品(33/41)隔离；
--      将来上生产可一条 `pg_dump --schema=settlement` 整体迁出。
--      ⚠ 请在 Supabase SQL Editor 中【一次性整段执行本文件】(search_path 为会话级)。
-- ============================================================================

create schema if not exists settlement;
create extension if not exists pgcrypto;            -- gen_random_uuid()（PG13+ 已内置，留作兼容）
set search_path to settlement, public;              -- 以下所有表/索引均落在 settlement schema

-- ============================================================================
-- 一、Kintone 只读镜像表（快照）
-- ============================================================================

-- 案件（AIR/SEA/EC 三个案件 App 合并）
create table if not exists kc_cases (
  id                uuid primary key default gen_random_uuid(),
  opt_no            text not null,                 -- OPT 编号（全局唯一关联键）
  company           text not null check (company in ('EXPRESS','TRADING')),
  business_line     text check (business_line in ('AIR','SEA','EC')),
  source_app        text,                          -- 来源 Kintone App 标识
  納品完了日        date,
  利润月            text,                          -- YYYY-MM（= 纳品完了日所在月）
  对应小组          text,
  服务类型          text,                          -- ECO / NFO / OBC ...
  business_scope    text,                          -- Aerospace / Ship Spares / Other
  business_scope_sub text,                         -- AOG / Parts Procurement ... (级联子级)
  obc_within_6h     boolean,                       -- OBC 是否 6 小时内提货（加成率审查用）
  国别              text,
  顾客              text,
  mode              text,
  出发              text,
  到达              text,
  見積team          text,                          -- 見積チーム（按分:見積維度）
  輸出team          text,                          -- 輸出対応チーム（按分:输出维度）
  輸入team          text,                          -- 輸入対応チーム（按分:输入维度）
  自社通関費_日元   numeric(18,2),                 -- 請求合計（已含在毛利内，先分给通关小组）
  自社通関費_人民币 numeric(18,2),                 -- 元換算請求合計
  売上_日元         numeric(18,2),                 -- 円換算売上合計
  売上_人民币       numeric(18,2),                 -- 元換算売上合計
  成本_日元         numeric(18,2),                 -- 円換算費用合計
  成本_人民币       numeric(18,2),                 -- 元換算費用合計
  毛利_日元         numeric(18,2),                 -- 円換算粗利益
  毛利_人民币       numeric(18,2),                 -- 元換算粗利益
  synced_at         timestamptz default now(),
  unique (opt_no)
);
create index if not exists idx_cases_company on kc_cases(company);
create index if not exists idx_cases_month on kc_cases(利润月);
create index if not exists idx_cases_group on kc_cases(对应小组);

-- 案件成本明细行（按供应商/费用科目分行）
create table if not exists kc_cost_lines (
  id          uuid primary key default gen_random_uuid(),
  opt_no      text not null,
  供应商      text,
  费用科目    text,
  原币种      text,
  金额_原币   numeric(18,2),
  金额_日元   numeric(18,2),
  金额_人民币 numeric(18,2),
  synced_at   timestamptz default now()
);
create index if not exists idx_cost_opt on kc_cost_lines(opt_no);
create index if not exists idx_cost_opt_supplier on kc_cost_lines(opt_no, 供应商);

-- 案件收入明细行
create table if not exists kc_revenue_lines (
  id          uuid primary key default gen_random_uuid(),
  opt_no      text not null,
  收款人科目  text,
  原币种      text,
  金额_原币   numeric(18,2),
  金额_日元   numeric(18,2),
  金额_人民币 numeric(18,2),
  synced_at   timestamptz default now()
);
create index if not exists idx_rev_opt on kc_revenue_lines(opt_no);

-- 请求入金（EXP/EC 合并）。1案件:N账单(OPTxxx-N):N入金
create table if not exists kc_receipts (
  id          uuid primary key default gen_random_uuid(),
  opt_no      text not null,
  company     text check (company in ('EXPRESS','TRADING')),
  账单编号    text,                                -- OPTxxx-1 / -2 ...
  收款人      text,
  原币种      text,
  入金额      numeric(18,2),
  入金日      date,
  银行        text,
  synced_at   timestamptz default now()
);
create index if not exists idx_receipts_opt on kc_receipts(opt_no);
create index if not exists idx_receipts_date on kc_receipts(入金日);

-- 支付（EXP/EC 合并，按供应商/明细）。1案件:N账单:N出金
create table if not exists kc_payments (
  id          uuid primary key default gen_random_uuid(),
  opt_no      text not null,
  company     text check (company in ('EXPRESS','TRADING')),
  账单编号    text,
  供应商      text,
  费用科目    text,
  原币种      text,
  出金额      numeric(18,2),
  出金日      date,
  银行        text,
  synced_at   timestamptz default now()
);
create index if not exists idx_payments_opt on kc_payments(opt_no);
create index if not exists idx_payments_opt_supplier on kc_payments(opt_no, 供应商);
create index if not exists idx_payments_date on kc_payments(出金日);

-- 贩管费（日本/中国/EC 三个 App 合并）。非业务入出金
create table if not exists kc_pankanfei (
  id          uuid primary key default gen_random_uuid(),
  company     text check (company in ('EXPRESS','TRADING')),
  region      text check (region in ('日本','中国','EC')),
  部署        text,                                -- 部门（按部署字段归小组/部门）
  类型        text check (类型 in ('入金','出金')),
  费用类型    text,                                -- 人件費/事業活動費/事業維持費/人材·IT投資/役員関連費用
  是否除外    boolean default false,               -- 税金/对象外 = true
  原币种      text,
  金额        numeric(18,2),
  发生日      date,
  银行        text,
  摘要        text,
  synced_at   timestamptz default now()
);
create index if not exists idx_pankanfei_region on kc_pankanfei(region);
create index if not exists idx_pankanfei_dept on kc_pankanfei(部署);

-- 银行残高（已自动算差额）
create table if not exists kc_bank_balance (
  id          uuid primary key default gen_random_uuid(),
  银行        text,
  币种        text,
  月份        text,                                -- YYYY-MM
  期初残高    numeric(18,2),
  期末残高    numeric(18,2),
  残高差额    numeric(18,2),
  synced_at   timestamptz default now()
);
create index if not exists idx_bank_period on kc_bank_balance(月份, 币种);

-- ============================================================================
-- 二、系统业务表
-- ============================================================================

-- 模块① 上传的成本账单
create table if not exists bills (
  id            uuid primary key default gen_random_uuid(),
  类型          text check (类型 in ('单票','SOA')),
  供应商        text,
  账单号        text,
  账单日期      date,
  原始文件URL   text,
  原币种        text,
  账单总额_原币 numeric(18,2),
  利润月        text,
  解析状态      text default '待解析' check (解析状态 in ('待解析','解析中','已解析','失败')),
  created_at    timestamptz default now()
);

-- 模块① AI 解析产出的账单明细行
create table if not exists bill_lines (
  id          uuid primary key default gen_random_uuid(),
  bill_id     uuid references bills(id) on delete cascade,
  opt_no      text,                                -- 可空（部分 SOA 无 OPT，走提单号兜底）
  提单号      text,
  供应商      text,
  费用科目    text,
  原币种      text,
  金额_原币   numeric(18,2),
  ai置信度    numeric(5,2),
  匹配状态    text default '未匹配'
);
create index if not exists idx_billlines_bill on bill_lines(bill_id);
create index if not exists idx_billlines_opt on bill_lines(opt_no);

-- 模块② 对账结果（N:N 中间表，聚合键 opt_no+供应商）
create table if not exists reconciliations (
  id            uuid primary key default gen_random_uuid(),
  opt_no        text,
  company       text,
  供应商        text,
  kintone金额_原币 numeric(18,2),
  账单金额_原币    numeric(18,2),
  差额          numeric(18,2),
  差异类型      text check (差异类型 in ('匹配','金额差异','缺账单','漏录或同步异常','无OPT待人工')),
  状态          text default '待复核' check (状态 in ('待复核','确认无误','待代理改单','已解决')),
  复核人        text,
  复核备注      text,
  利润月        text,
  updated_at    timestamptz default now()
);
create index if not exists idx_recon_opt on reconciliations(opt_no);
create index if not exists idx_recon_month on reconciliations(利润月, company);

-- 模块② 重复检测（重复账单/重复付款）
create table if not exists duplicate_flags (
  id          uuid primary key default gen_random_uuid(),
  类型        text check (类型 in ('重复账单','重复付款')),
  供应商      text,
  票号        text,
  金额        numeric(18,2),
  币种        text,
  关联记录ids text,
  状态        text default '待复核',
  created_at  timestamptz default now()
);

-- 模块③ 关账/锁账期
create table if not exists close_periods (
  id            uuid primary key default gen_random_uuid(),
  利润月        text not null,
  company       text not null,
  锁定状态      text default '进行中' check (锁定状态 in ('进行中','月结','正式锁账')),
  齐全率        numeric(5,2) default 0,
  软关账时间    timestamptz,
  正式锁账日    date,                              -- M 月 → M+2 月 1 日
  锁账时间      timestamptz,
  unique (利润月, company)
);

-- 模块④ 三 App 同步排查（逐行 by OPT）
create table if not exists sync_checks (
  id          uuid primary key default gen_random_uuid(),
  opt_no      text,
  company     text,
  利润月      text,
  案件收入    numeric(18,2),
  入金合计    numeric(18,2),
  收入差异    numeric(18,2),
  案件成本    numeric(18,2),
  支付合计    numeric(18,2),
  成本差异    numeric(18,2),
  状态        text default '待处理',
  created_at  timestamptz default now()
);
create index if not exists idx_sync_month on sync_checks(利润月, company);

-- 模块⑥ 月度决算·银行残高勾稽（按币种）
create table if not exists settlement_checks (
  id          uuid primary key default gen_random_uuid(),
  利润月      text,
  币种        text,
  残高差额    numeric(18,2),
  入金合计    numeric(18,2),
  出金合计    numeric(18,2),
  现金净额    numeric(18,2),
  差异        numeric(18,2),
  状态        text default '待复核',
  created_at  timestamptz default now()
);

-- 模块⑤ 多维利润汇总快照
create table if not exists profit_snapshots (
  id          uuid primary key default gen_random_uuid(),
  期间        text,                                -- YYYY 或 YYYY-MM
  报表对象    text check (报表对象 in ('全社','中国','日本','小组')),
  维度类型    text,                                -- 对应小组/服务类型/国别/顾客/Business Scope/业务范围/Mode/出发/到达
  维度值      text,
  指标        text check (指标 in ('收入','成本','毛利','贩管费','净利','加成率')),
  金额        numeric(18,2),
  是否按分    boolean default false,
  created_at  timestamptz default now()
);
create index if not exists idx_profit_period on profit_snapshots(期间, 报表对象);

-- 模块⑤ 贩管费归一明细
create table if not exists sg_a_lines (
  id          uuid primary key default gen_random_uuid(),
  source_app  text,
  期间        text,                                -- YYYY-MM
  region      text check (region in ('日本','中国','EC')),
  部门        text,
  费用类型    text,                                -- 5 类
  是否除外    boolean default false,               -- 税金/对象外
  金额        numeric(18,2),
  分摊到小组  text,
  created_at  timestamptz default now()
);
create index if not exists idx_sga_period on sg_a_lines(期间, region);

-- 模块⑤ 预算（手工录入）
create table if not exists budgets (
  id          uuid primary key default gen_random_uuid(),
  期间        text,                                -- YYYY 或 YYYY-MM
  报表对象    text check (报表对象 in ('全社','中国','日本','小组')),
  对象值      text,                                -- 具体部门/小组名（报表对象=小组时）
  项目        text,                                -- 毛利 / 净利 / 贩管费类(人件費...)
  金额        numeric(18,2),
  created_at  timestamptz default now()
);
create index if not exists idx_budget_period on budgets(期间, 报表对象);

-- 月度人数（手工录入；JP DESK 中日拆分 + 未来人均指标）
create table if not exists headcounts (
  id          uuid primary key default gen_random_uuid(),
  期间        text,                                -- YYYY-MM
  部门小组    text,
  region      text check (region in ('日本','中国','EC')),
  人数        numeric(8,2),
  来源        text default '手工',
  created_at  timestamptz default now()
);
create index if not exists idx_headcount_period on headcounts(期间);

-- 模块⑤/⑧ 加成率审查
create table if not exists markup_reviews (
  id            uuid primary key default gen_random_uuid(),
  opt_no        text,
  company       text,
  利润月        text,
  business_scope text,
  服务类型      text,
  实际加成率    numeric(8,4),
  标准加成率    numeric(8,4),
  偏离          numeric(8,4),
  是否需审查    boolean default false,
  审查状态      text default '待审查',
  created_at    timestamptz default now()
);
create index if not exists idx_markup_month on markup_reviews(利润月);

-- 模块⑦ 应收/应付账龄
create table if not exists ar_ap_aging (
  id          uuid primary key default gen_random_uuid(),
  期间        text,
  类型        text check (类型 in ('应收','应付')),
  客户供应商  text,
  金额        numeric(18,2),
  账龄桶      text check (账龄桶 in ('0-30','31-60','61-90','90+')),
  是否超期    boolean default false,
  created_at  timestamptz default now()
);

-- 模块⑦ 客户信用额度
create table if not exists credit_limits (
  id          uuid primary key default gen_random_uuid(),
  客户        text,
  授信额度    numeric(18,2),
  已用        numeric(18,2),
  占用率      numeric(5,2),
  是否超限    boolean default false,
  updated_at  timestamptz default now()
);

-- 模块⑦ 闲置资金投资台账（手工；折算字段为汇率预留）
create table if not exists investments (
  id          uuid primary key default gen_random_uuid(),
  品种        text,
  投资额      numeric(18,2),
  币种        text,
  收益率      numeric(8,4),
  起始日      date,
  到期日      date,
  流动性      text,
  状态        text,
  已实现收益  numeric(18,2),
  来源        text default '手工',                 -- 手工 / 将来系统化
  折算币种    text,                                -- 汇率预留
  折算额      numeric(18,2),                       -- 汇率预留
  created_at  timestamptz default now()
);

-- 内控 · 审计日志
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  时间        timestamptz default now(),
  用户        text,
  动作        text,                                -- 差异裁决/复核/关账/解锁/预算录入/人数录入...
  对象类型    text,
  对象id      text,
  变更前      jsonb,
  变更后      jsonb,
  利润月      text
);
create index if not exists idx_audit_time on audit_logs(时间);

-- 内控 · 关账期快照冻结（正式锁账时冻结，保证报表可复现）
create table if not exists period_snapshots (
  id          uuid primary key default gen_random_uuid(),
  利润月      text,
  company     text,
  聚合快照    jsonb,
  冻结时间    timestamptz default now()
);

-- 内控 · 解锁记录
create table if not exists unlock_logs (
  id          uuid primary key default gen_random_uuid(),
  利润月或记录id text,
  申请人      text,
  理由        text,
  解锁时间    timestamptz default now(),
  再锁时间    timestamptz
);

-- 多币种/汇兑（P2）预留表
create table if not exists exchange_rates (
  id          uuid primary key default gen_random_uuid(),
  期间        text,                                -- YYYY-MM
  币种        text,
  对日元汇率  numeric(18,6),
  对人民币汇率 numeric(18,6)
);
create index if not exists idx_rate_period on exchange_rates(期间, 币种);

-- ============================================================================
-- 三、授权（自建 schema 需手动授权；本系统仅用 service_role 访问）
--   只授权 service_role，anon/authenticated 完全不开放（财务数据，纵深防御）。
--   表已启用 RLS，service_role 绕过 RLS，故服务端读写不受影响。
-- ============================================================================
grant usage on schema settlement to service_role;
grant all privileges on all tables in schema settlement to service_role;
grant all privileges on all sequences in schema settlement to service_role;
-- 将来新建的表/序列也自动授权
alter default privileges in schema settlement grant all on tables to service_role;
alter default privileges in schema settlement grant all on sequences to service_role;

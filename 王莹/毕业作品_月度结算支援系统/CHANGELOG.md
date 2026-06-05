# 变更记录 CHANGELOG

> 每次改动追加一条：**改了什么 / 涉及文件 / 如何验证**。最新在最上。

---

## 2026-06-05

### 统一月份选择器
- **改了什么**：/sync、/reconciliation 的月份文本框 → 原生月份选择器 `<input type="month">`（/profit 已有 MonthPicker）。
- **文件**：`app/sync/page.tsx`、`app/reconciliation/page.tsx`
- **验证**：两页 HTTP 200，HTML 含 `type="month"`。✅

### 协作规则确立
- 约定：改动前先讲计划；改完记录到本文件；能自动验证的直接验证、需人工的给出验证方法。

### 对账增强：两级匹配 + 利润月选择器 + Gemini 健壮性 (`8a129931`)
- **改了什么**：
  - 对账无供应商名时，二级兜底「OPT+币种内按金额唯一匹配」推定供应商，多候选标「待人工核对」；工作台显示匹配到的 Kintone 供应商。
  - /profit 加月份选择器 + 空月提示。
  - Gemini 503/429 自动重试 + 降级备用模型。
- **文件**：`lib/reconcile.ts`、`lib/gemini.ts`、`app/profit/page.tsx`、`app/reconciliation/page.tsx`、`app/_components/MonthPicker.tsx`
- **验证**：重测 SOA → 17匹配/1差异/2缺，匹配供应商正确显示；/profit?month=2026-04 显示空月提示。✅

### ②对账模块 in-app (`3cc4e3c6` + 前置 `cc69752a`/`e5dd666d`)
- **改了什么**：上传账单 PDF → Gemini 解析 → 按 OPT+供应商+币种 比对 Kintone 成本 → 差异工作台 + 持久化。
- **文件**：`lib/gemini.ts`、`lib/reconcile.ts`、`app/api/reconcile/route.ts`、`app/reconciliation/page.tsx`；支付明细同步 `scripts/sync-payments.mjs`→`kc_cost_lines`。
- **验证**：上传 SOA → {匹配17/差异1/缺2}，与脚本验证一致。✅

### ↻同步页面 (`309c1f89`)
- **改了什么**：网页一键同步案件/贩管费。
- **文件**：`lib/sync.ts`、`app/api/sync/route.ts`、`app/sync/page.tsx`。
- **验证**：POST /api/sync all 2026-05 = 209案件+224贩管费行。✅

### ⑤利润报表：毛利+贩管费+净利 (`4d9d699e`→`0ab3a52a`)
- **改了什么**：案件同步→kc_cases；利润按分(移植马拉松+自社通関+4维度+JP DESK中日13:11拆分)；贩管费同步(部署按分→sg_a_lines,役員5/5)；经营概览(全社/中/日 毛利-贩管费=净利)。
- **文件**：`lib/profit.ts`、`lib/sga.ts`、`lib/data.ts`、`app/profit/page.tsx`；脚本 `sync-cases.mjs`/`calc-profit.mjs`/`sync-sga.mjs`。
- **验证**：2026-05 全社净利 ¥40,610,728，守恒(已按分+未分配=Σ毛利)。✅
- **已知坑修复**：利润月口径改 JST；PostgREST 默认 1000 行→分页拉全量。

### 基建：设计定稿 + 骨架 + Supabase 接入 (`7d8ddd26`/`0cbf7e62`)
- **改了什么**：DESIGN.md 定稿(9模块)；Next.js 15.3.9+TS 骨架；Supabase `settlement` 独立 schema(隔离+授权 service_role)。
- **验证**：26 张表建成；连接自测 settlement.bills 可访问。✅

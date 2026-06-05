# 变更记录 CHANGELOG

> 每次改动追加一条：**改了什么 / 涉及文件 / 如何验证**。最新在最上。

---

## 2026-06-05

### ④三App同步排查（/sync-check）
- **改了什么**：按 OPT 比对 案件App收入/成本 vs 请求入金/支付App合计，检测同步bug；总额概览+逐票差异(差异排前标红)。
- **文件**：`scripts/sync-check.mjs`(新)、`lib/sync-check-data.ts`(新)、`app/sync-check/page.tsx`(新)
- **验证**：2026-05 排查209票；收入不一致1票、成本不一致56票(未月结正常)；/sync-check 200。✅

### ⑥决算·银行残高（/settlement）
- **改了什么**：同步银行残高→kc_bank_balance；/settlement 按币种汇总残高差额 + 银行×币种明细。
- **文件**：`scripts/sync-bank.mjs`(新)、`lib/settlement.ts`(新)、`app/settlement/page.tsx`(新)
- **验证**：银行残高 2026-05 同步25条；/settlement 200，按币种(JPY+5.96M/CNY-901,620等)显示。✅
- **范围说明**：现金净额(入金−出金)勾稽列 P1，本页先做银行残高侧监控。

### 专业仪表盘主题 + 加成率6月生效
- **改了什么**：
  - 主题升级为专业财务仪表盘风格（白卡片+柔和阴影+靛蓝强调+表格悬停/卡片化+留白+字号层级）。
  - 加成率审查仅 **2026-06** 起生效；之前月份 /risk 显示提示、不审查。
- **文件**：`app/globals.css`(整体重写)、`lib/markup-review.ts`(MARKUP_ACTIVE_FROM)、`app/risk/page.tsx`(未生效提示)
- **验证**：全部页面 200；/risk?month=2026-05 显示"标准自2026-06生效不审查"。✅

### AI 洞察·月度经营点评（/insights）
- **改了什么**：新增 /insights——汇总利润/净利/贩管费/加成率数据 → Gemini 生成中日双语经营点评(代码算数,AI解读)。
- **文件**：`lib/gemini.ts`(加 generateText+降级)、`app/api/insights/route.ts`(新)、`app/insights/page.tsx`(新)
- **验证**：/insights 200，生成专业中日双语点评，AI 自动抓出"事業活動費负值"异常+加成率风险+管理建议。✅

### 加成率审查（风控页 /risk）
- **改了什么**：新增 /risk 风控页——单票加成率(利润/成本) vs 标准表(Business Scope×服务类型,±10%相对容差)标红；各大类月度平均加成率。
- **文件**：`lib/markup.ts`(键改真实服务类型,OBC缺6h挂起)、`lib/markup-review.ts`(新)、`app/risk/page.tsx`(新)
- **验证**：/risk 200，2026-05：标准内26票/需审查25/总209；平均 Other22.2%/Aerospace407.8%。✅
- **发现**：单票加成率方差大+容差紧→几乎都标红；实务或宜在月均/大类层面审查（待王莹定）。

### JP DESK 折叠明细
- **改了什么**：小组表 JP DESK 行可点击折叠/展开中日明细。
- **文件**：`app/_components/GroupTable.tsx`(新,客户端)、`app/profit/page.tsx`(改用 GroupTable)
- **验证**：/profit 200，▾ 折叠图标在，点击可收起 JP DESK中国/日本。✅

### 利润报表小组显示重组（OS / JP DESK展开中日 / 通関）
- **改了什么**：小组×4维度表从原始 team 列表，重组为 OS / JP DESK(展开 JP DESK中国=GC+EC+JapanDesk×13/24、JP DESK日本=TCC+JapanDesk×11/24) / 通関 / 其它独立小组。
- **文件**：`lib/profit.ts`(新增 buildGroups + GroupRow + groups 字段)、`app/profit/page.tsx`(表格按 groups 渲染，缩进展开)
- **验证**：/profit 200，结构正确；数值守恒(OS+JP DESK+通関=全社56,786,247)，与经营概览中/日一致。✅
- **待办**：整体改浅色主题（王莹要求，最后再做）。

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

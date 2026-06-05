# 变更记录 CHANGELOG

> 每次改动追加一条：**改了什么 / 涉及文件 / 如何验证**。最新在最上。

---

## 逐页细节优化

### ②对账页修正（标签误导：账单单号非OPT被标"缺账单"）
- **问题**：账单单号是货代自有号(如STYAE26050423/205-33595601)非OPT，按OPT匹配不到Kintone成本，却被标"缺账单"(语义应为Kintone有成本无账单)。
- **改了什么**：差异状态"缺账单或漏录"→**"Kintone无对应"**；持久化差异类型"缺账单"→"漏录或同步异常"；note提示"可能漏录,或账单单号非OPT"；一次性脚本清理旧标签7行。
- **文件**：`lib/reconcile.ts`、`app/reconciliation/page.tsx`、`scripts/fix-recon-label.mjs`
- **验证**：工作台类型分布 金额差异1+漏录或同步异常7，不再出现"缺账单"。✅
- **待定**：提单号(MAWB/HAWB)兜底匹配——需确认账单与Kintone是否都有提单号。

### ②对账页优化-批3b（供应商映射记忆）
- **改了什么**：新表 supplier_mappings(王莹建)；对账匹配时除模糊匹配外，命中映射也算匹配；提供"供应商映射记忆"折叠区(列表+手动登记 账单供应商→Kintone供应商)。
- **文件**：`lib/reconcile.ts`(getSupplierMappings/addSupplierMapping+reconcileBill集成)、`app/api/supplier-mappings`、`app/_components/SupplierMappings.tsx`、`app/reconciliation/page.tsx`
- **验证**：登记AGX EXPRESS→AGX EXPRESS PHILS.,INC.读取OK。✅ → **②对账页优化全部完成**。

### ②对账页优化-批3a（账单历史/差异钻取）
- **改了什么**：① **已上传账单历史**(从bills读,折叠,带Storage原件签名链接📄) ② **差异钻取**(工作台点OPT→展开该票Kintone成本明细)。
- **文件**：`lib/reconcile.ts`(getUploadedBills+签名URL/getCostLinesByOpt)、`app/api/bills`、`app/_components/{BillHistory,ReconWorkbench}.tsx`、`app/reconciliation/page.tsx`
- **验证**：5张账单带原件链接;OPT2606708钻取18笔成本。✅（供应商映射记忆需新表,待王莹建表）

### ②对账页优化-批2（Excel/批量/拖拽/进度）
- **改了什么**：① 支持 **Excel(.xlsx)** 账单(SheetJS解析→文本→Gemini parseBillText) ② **批量上传**多张(客户端逐个POST) ③ **拖拽上传**区 ④ **逐文件进度**(等待/解析中/完成/失败)+多结果折叠展示+全局AI解读差异。
- **文件**：`lib/gemini.ts`(parseBillText+callParse重构)、`app/api/reconcile/route.ts`(多文件+Excel)、`lib/reconcile.ts`(uploadBillFile通用)、`app/reconciliation/page.tsx`(重写上传UI)、package.json(xlsx)
- **验证**：单/多PDF对账OK；造测试.xlsx解析成功(Lau Chun Wah/HKD/2行全匹配)。✅

### ②对账页优化-批1（缺账单清单/去重/工作台折叠筛选备注）
- **改了什么**：① **缺账单清单**(放对账页,可折叠,按供应商分组+展开明细,显示齐全率/缺账单笔数金额)——即遗漏账单提醒 ② **去重**(持久化时同月同OPT先删再插+清理现有21条重复) ③ **差异工作台**改可折叠+月/状态筛选+复核备注(prompt)+撤销按钮(已标记行显示)。
- **文件**：`lib/reconcile.ts`(getMissingBills+持久化去重)、`app/api/missing-bills`、`app/_components/{Collapsible,MissingBills,ReconWorkbench}.tsx`、`app/api/reconcile/review`(收备注)、`app/reconciliation/page.tsx`
- **验证**：缺账单齐全率3%/缺669行¥45M(税関/IATA/paild);工作台折叠+筛选+撤销;重复清理41→20。✅

### 首页经营驾驶舱优化
- **改了什么**：① KPI 环比箭头(净利最新月vs上月) ② 趋势图加净利率双轴(右轴) ③ 关键预警行(负毛利/超期应收/对账待处理) ④ KPI 图标+万元单位 ⑤ **期间选择器**：默认**财年累计(4月起)**，支持单月/多月/季度(Q1-Q4)。
- **文件**：`lib/dashboard.ts`(重写:财年/期间聚合/环比/预警)、`app/_components/PeriodPicker.tsx`(新)、`app/_components/DashboardCharts.tsx`(净利率双轴)、`app/page.tsx`(重写)
- **验证**：默认累计 FY2026=04+05两月净利¥8,180万/环比↓1.5%；单月05=¥4,059万；2026-03属FY2025正确排除。✅

## 2026-06-05

### 图表可视化 + 现代仪表盘样式（样板：首页经营驾驶舱）
- **改了什么**：引入 recharts(免费开源)；首页改为经营驾驶舱——渐变/彩色 KPI 卡 + 经营趋势折线(3月) + 中日净利环形 + 小组利润柱状 + 贩管费5类环形。同步 2026-03/04 供趋势。
- **文件**：`lib/dashboard.ts`(新)、`app/_components/DashboardCharts.tsx`(新)、`app/page.tsx`(重写)、`app/globals.css`(渐变KPI)、package.json(recharts)
- **验证**：首页 200，4 图表渲染无错误。✅
- **铺开**：图表加到 /profit(中日净利环形+业务小组净利柱状)、/treasury(账龄柱状)、/settlement(币种残高柱状)；**表格全部保留**（图表是增加）。通用组件 `app/_components/Charts.tsx`(BarCard/PieCard)。验证三页 200+图表渲染。✅

### 对照设计补缺口（进行中）
- **⑤业务范围维度**：kc_cases 加列 业务范围(王莹跑ALTER)，sync映射 業務範囲→业务范围，全社多维度加业务范围；重同步3月。文件 `scripts/sync-cases.mjs`、`lib/sync.ts`、`lib/profit.ts`。验证 DOOR TO DOOR74/DOOR TO PORT54 等。✅ → 全社9维度齐全。
- **②对账 复核状态 + 原件存档**：差异工作台从持久化 reconciliations 读待复核，人工标记(无误/代理改单/撤销,留审计)；账单 PDF 存入 Storage 桶 settlement-bills，路径记入 bills.原始文件url。文件 `lib/reconcile.ts`(getPending/setReviewStatus/uploadBillFile)、`app/api/reconcile/review`、`app/_components/ReconWorkbench.tsx`、`app/api/reconcile/route.ts`。验证6条待处理可标记+原件存档成功。✅
- **⑨累计YTD+部门汇报+对账差异疑因**：insights 加 范围(全社/中/日)选择 + 累计YTD(同年≤当月汇总)；对账页加"AI解读差异"按钮(/api/reconcile/explain 给疑因+建议)。文件 `app/api/insights/route.ts`、`app/insights/page.tsx`、`app/api/reconcile/explain/route.ts`、`app/reconciliation/page.tsx`。验证中国区YTD汇报+差异疑因(金额录入错误/漏录)。✅（导出Doc/Slack按王莹要求暂放）
- **⑥决算现金净额勾稽**：入金/出金/贩管费出金 按币种现金口径(实际收付款日,遍历子表)→现金净额 vs 残高差额 → settlement_checks；/settlement 加现金勾稽区(差异提示药丸)。文件 `scripts/sync-settlement-cash.mjs`、`lib/settlement.ts`(getCashRecon)、`app/settlement/page.tsx`。2026-05 EUR平/其余有差异(提示用)。✅
- **内控·快照冻结**：正式锁账时冻结该期利润聚合(全社/中/日 毛利贩管费净利)到 period_snapshots，保证历史可复现；/close 显示"❄快照已冻结"。文件 `lib/close.ts`(setCloseStatus+getSnapshot)、`app/api/close`、`app/close/page.tsx`。验证锁账冻结全社净利4061万。✅
- **内控·审计日志**：关账/解锁/预算/人数等写操作记入 audit_logs；/close 页显示近 15 条。文件 `lib/audit.ts`、`app/api/{close,budget,headcount}/route.ts`、`app/close/page.tsx`。验证"关账→月结"已记录。✅（快照冻结仍 P1）
- **⑦资金 净头寸+投资台账**：/treasury 加 资金净头寸(应收−应付,按账龄,KPI+表) + 闲置投资台账(手工录入品种/金额/收益率/到期/流动性)。文件 `app/treasury/page.tsx`、`app/_components/InvestmentPanel.tsx`、`app/api/investment/route.ts`。✅（信用额度需授信数据,P1）
- **⑦应付账龄**：支付未払→ar_ap_aging(类型=应付)；/treasury 同时展示 应收+应付(账龄柱状+超期+Top10)。文件 `scripts/sync-ap.mjs`、`lib/treasury.ts`(getPayablesAging)、`app/treasury/page.tsx`。应付759笔¥99M/超期194笔¥38M。✅（预测/信用/投资仍P1）
- **⑤利润报表 全社多维度**：服务类型/国别/顾客/Business Scope/Mode/出发/到达 7 维直接按案件毛利汇总(各取Top)。文件 `lib/profit.ts`(computeDimensions)、`app/profit/page.tsx`。✅（业务范围字段未同步，暂缺）
- **⑤小组损益P&L**：业务部门(OS/JP DESK中/JP DESK日/通関)毛利−自身贩管费=净利；管理部门(成本中心)单独列只贩管费；部门→小组映射可调(GC課→JP DESK中国等);役員不计入小组。文件 `lib/sga.ts`(getSgaByDept)、`lib/profit.ts`(buildGroupPL)、`app/profit/page.tsx`。验证净利 OS1488万/JPDESK中647万/JPDESK日2430万/通関50万。✅
- **⑧风控异常面板**：从"仅加成率"扩展为统一面板——负毛利/异常大额(>3×均值)/重复成本/长期挂账(90+)+加成率。文件 `lib/risk-panel.ts`(新)、`app/risk/page.tsx`。验证2026-05检出 负毛利3/异常大额13/重复3/挂账6客户。✅

### 补齐占位模块（人数/预算/关账录入）+ 移除重复①账单
- **改了什么**：
  - 移除导航重复的"①账单"（对账页已覆盖账单解析）。
  - **人数录入** /headcount：JP DESK 中日人数录入→利润报表拆分读取（去掉硬编码 13/11）。
  - **预算录入** /budget：全社/中/日 毛利·贩管费·净利预算→利润报表"预实对比+达成率"。
  - **关账** /close：对账齐全率/同步差异/关账状态(进行中→月结→正式锁账,M+2月1日)+月结/锁账/解锁。
- **文件**：`lib/modules.ts`、`lib/headcount.ts`+`lib/budget.ts`+`lib/close.ts`、`app/{headcount,budget,close}/page.tsx`、`app/api/{headcount,budget,close}/*`、`app/profit/page.tsx`(预实+人数接入)
- **验证**：三页 200；人数/预算 POST ok；利润页出现预实对比+达成率；关账状态(对账40/缺4/同步差异57,正式锁账日2026-07-01)。✅

### 主题优化：数据简洁易读 + 异常一眼可见
- **改了什么**：refine 配色(中性底/白卡片/蓝强调)；新增状态药丸(.pill-green/amber/red)、异常整行高亮(.flag 红底+左色条)、负数自动红(.neg)、表格斑马纹+等宽数字。对账/风控/同步排查状态改药丸+异常整行。
- **文件**：`app/globals.css`(重写+工具类)、`app/reconciliation/page.tsx`、`app/risk/page.tsx`、`app/sync-check/page.tsx`
- **验证**：全部页面 200；sync-check 异常整行(flag)生效。✅（风控药丸需2026-06数据,2026-05在加成率生效前不显示）

### ⑦资金·应收账龄（/treasury）
- **改了什么**：请求入金未入金→ar_ap_aging，按账龄分桶+超期+Top10客户。应付/预测/投资 P1。
- **文件**：`scripts/sync-ar.mjs`(新)、`lib/treasury.ts`(新)、`app/treasury/page.tsx`(新)
- **验证**：应收352笔¥266M、超期145笔¥126.65M；/treasury 200。✅

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

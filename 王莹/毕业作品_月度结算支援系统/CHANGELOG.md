# 变更记录 CHANGELOG

> 每次改动追加一条：**改了什么 / 涉及文件 / 如何验证**。最新在最上。

---

## 逐页细节优化

### ⑤利润报表：JP DESK 中日拆分口径修正（EC全额中国，其余按人数拆）
- **王莹指出**：JP DESK 下只有 EC 完全归中国，TCC+GC+Japan Desk 都要按中日人数拆分（原逻辑 GC全额中国/TCC全额日本/仅JapanDesk拆，错）。
- **改了什么**：
  - `computeProfitReport` china/japan：池=TCC+GC+Japan Desk 按 cn:jp(13:11) 拆；EC/OS/Project/物流開発=纯中国；通関=纯日本。`report.jpdesk` 改为池口径(profit=pool,cn=poolCn,jp=poolJp)。
  - `buildGroups`：JP DESK中国=EC全额 + 池×cn/heads；JP DESK日本=池×jp/heads。
  - 页面拆分说明文案 + scripts/calc-profit.mjs 同步改。
  - CHINA_TEAMS/JAPAN_TEAMS 仍保留(用于 normTeam 团队归一,line 83-84)。
- **影响(2026-05)**：中国毛利 23,980,341→**33,233,499**(+925万)、日本毛利 24,852,679→**15,599,521**(−925万)，全社不变(48,833,020 守恒)。主因 TCC ¥2087万原全额日本→约¥1130万移中国。
- **文件**：lib/profit.ts、app/profit/page.tsx、scripts/calc-profit.mjs
- **验证**：calc-profit 守恒;profit.ts tsc 0错误;/profit 200。✅

### ⑤利润报表：Project 独立业务部门 + 4维度移入 + 管理部门拆分
- **王莹指出**：业务部门损益毛利之和 ≠ 全社毛利，少了 Project 利润（Project 在 CHINA_TEAMS 计入全社毛利，但 BIZ_GROUPS 不含→被丢弃）。
- **改了什么**：
  - **Project 独立成业务部门一行**（不并 JP DESK）：`BIZ_GROUPS` 加 "Project"（buildGroups 已生成 Project 组，自动列出）。
  - **Project 贩管费移出管理部门**：`DEPT_TO_GROUP` 加 `Project室→Project`，凑完整 P&L（毛利−贩管费=净利）。
  - **4维度利润按分移入业务部门损益区 + 默认展开**：GroupTable 从独立折叠区移进「业务部 P&L」Collapsible(defaultOpen)，列 OS/JP DESK(中/日)/通関/Project。
  - **管理部门单独成区**：GroupPLTable 加 `part: biz|mgmt|both` prop，业务部门损益只渲染业务部，管理部门拆成独立 Sec。
  - **物流開発不动**（已取消、无数据，王莹确认）。预实对比口径不变：Project 仍计中国(地域口径)，与独立业务部门不冲突(两种切法)。
  - bizFYFull 加 Project 全年累计行。
- **文件**：lib/profit.ts、app/profit/page.tsx、app/_components/GroupPLTable.tsx
- **验证(2026-05)**：全社毛利 48,833,020 = 业务部门毛利之和 48,833,020，**缺口 0**；Project 行 毛利/净利 1,120；Project室已不在管理部门；tsc 无新错误。✅

### ⑤贩管费口径修正：支払日(现金)→取引日(权责发生制)
- **王莹指出**：利润报表贩管费原按 販管キー(=支払日,现金口径)归月,错;P&L贩管费应按权责发生制=取引日(费用实际发生日)。取引日是记录级必填字段(王莹确认无空值)。
- **改了什么**：syncSga 抓取 query 从 `販管キー = "YYYYMM"` 改为 `取引日 >= "YYYY-MM-01" and 取引日 <= "YYYY-MM-末"`,期间=取引日月;部署按分/役員5-5/地域映射等其余不变。lib/sync.ts + scripts/sync-sga.mjs 同步改。已重新同步 2026-03/04/05。
- **验证(Kintone只读交叉诊断)**：旧口径「販管キー=202605」批次里,实际取引日分布=3月¥2618万+4月¥1346万+5月仅¥555万→证明旧口径把3/4月发生的费用错算进5月。新口径月度贩管费:03=¥45,426,608(中41.3M/日4.1M)、04=¥26,564,158、05=¥7,461,829(旧16.8M)。3月暴增=FY2025年度末费用(年末計上)归位。
- **数据提醒(王莹Kintone侧待查,非代码问题)**：诊断中发现 販管キー=197001(1970,疑录入typo)、少量取引日填到2026-06~2027(疑预付摊销,权责制会各归其月,正确)。
- **文件**：lib/sync.ts、scripts/sync-sga.mjs
- **验证**：取引日交叉诊断闭环;profit页200;改动tsc无新错误。✅

### ⑦应收应付账龄：拆未到期+实时重算+点桶下钻分页
- **王莹需求**：账龄默认Top10,点分布图某时间档→切换显示该档全部记录(10条/页);确认账龄=逾期口径(基于支払期日);未到期单独拆一档显示金额。
- **口径确认**：账龄=今天−支払期日的逾期天数(非开票日);只算未结清(差額未入/付金>1)。**实时重算**(读Supabase镜像现算,不碰Kintone,零负担;账龄随今天滚动,金额仍是上次同步快照)。
- **改了什么**：
  - **lib/treasury.ts**：getAging改实时重算(liveBucket用今天JST零点);5档=未到期(days≤0或无到期日)+0-30/31-60/61-90/90+;AgingReport加records[](name/金额/bucket/超期/due/原币),按金额降序。
  - **Charts.tsx BarCard**：加onBarClick(点柱回调,从payload取xKey)+activeCat(非选中柱dim 0.35)+colors(按桶上色)。
  - **AgingBlock客户端组件(新)**：默认Top10;点桶→该桶全部记录(名称/金额/状态药丸/预计收付日),10条/页+上下页+"返回Top10";桶配色 未到期绿→90+暗红。treasury页改用之,删原服务端AgingBlock。
- **文件**：lib/treasury.ts、app/_components/{Charts,AgingBlock}.tsx、app/treasury/page.tsx
- **验证**：实时分桶 应收372(未到期226/超期146)、应付890(未到期695);页面200,改动文件tsc无新错误。✅

### ⑦投资建议保守口径：应付全额预留，应收不计入(回款不确定)
- **王莹指示**：可投要考虑现金是否真正流入——应付是真实必付,应收不确定何时收回。原逻辑应收−应付对冲(净流入),把不确定应收当可用现金,太乐观。
- **改了什么**：getInvestmentAdvice 可投 = HSBC余额 − 在投 − **USD应付(全额预留)**,应收只展示不计入;状态去掉"需留存"(应付恒预留),只剩充裕/不足;文案说明应收回款后另有加投空间。面板中间KPI"未来净流入"→"需预留USD应付(应收回款不定·不计入)"。
- **文件**：lib/treasury.ts、app/_components/InvestmentPanel.tsx
- **验证**：可投=10.93M−10M−应付0.157M=$773,881(<$1M,不足),应收$1.09M不计入。✅

### ⑦投资建议修正：已投只算未到期(避免与HSBC余额重复计算)
- **王莹指出**：建议可投额度显示$0不对;补充说明"HSBC USD余额已包含在投总额"。根因:getInvestmentAdvice的已投USD把全部12笔(含7笔已到期回流)都算→已投$23M>HSBC余额$10.93M→可投负→0。
- **改了什么**：getInvestmentAdvice 已投USD 改为只算**未到期(到期日≥今日或无到期日)**的USD投资;面板"已投资(USD)"标签改"在投(USD·未到期)"。
- **文件**：lib/treasury.ts、app/_components/InvestmentPanel.tsx
- **验证**：HSBC$10.93M−在投$10M=可投$930,645(<$1M门槛,状态"不足"文案合理),不再是$0。✅

### ⑦投资台账：加起息日/预计收益 + 在投口径 + 删除
- **王莹指示**：投资加起息日+预计收益(生效后已知,手工录);投资总额改为只显未到期(在投);每条记录加删除应对填错。
- **改了什么**：
  - **新字段**：ALTER investments 加 `起息日 date`/`预计收益 numeric`(王莹跑);表单加起息日+预计收益,预计收益按 投资额×年化×(到期−起息)/365 自动估算占位(留空用估算);表格加两列;API insert 带新字段。
  - **在投口径**：投资总额→"在投总额(未到期)",加权收益率/预计收益/笔数同步只算 active(到期日≥今日);已到期行半透明+标"已到期";表尾保留"合计(全部)"。
  - **删除**：/api/investment 加 DELETE(by id+审计);表格每行删除按钮+confirm。
- **文件**：app/_components/InvestmentPanel.tsx、app/api/investment/route.ts
- **验证**：POST/DELETE闭环✓;新字段写入读回✓;王莹已录12笔(5在投/$10M);页面200,tsc干净。✅

### 全局视觉优化：低饱和度配色 + 侧栏固定 + 去圈号 + 录入折叠
- **王莹指示**：①已录入改可折叠(防页面过长)②所有①②③数据标签删掉③左侧导航固定不随右侧滚动④换低饱和度风格。(Supabase清理仍等全部改完再做)
- **改了什么**：
  - **低饱和度配色**：globals.css 主题改静谧灰蓝——accent #2563eb→#5f7896,green/amber/red 全部降饱和(沙绿/赭黄/暗玫瑰),bg/border/text 同步柔化;kpi.primary 渐变、btn.primary hover、warn-box 边框色一并调和。
  - **侧栏固定**：.sidebar 加 position:sticky;top:0;height:100vh;overflow-y:auto → 右侧滚动时导航不动。
  - **去圈号**：9个页面h1前缀(②③④⑤⑥⑦⑧⑨✎)、Nav的no span、首页卡片no div、data-entry卡片①②③ + 同步按钮"排查④/决算⑥"的圈号全删。
  - **录入折叠**：data-entry 已录入预算/已录入人数 改 <details> 折叠(默认收起),页面不再变长。
  - 顺带:insights 分部点评标题"业务小组"→"业务部门";profit/modules 链接与描述同步。
- **文件**：app/globals.css、app/layout相关、app/_components/Nav.tsx、app/page.tsx、app/data-entry/page.tsx、9个page.tsx的h1、app/insights/page.tsx
- **验证**：全部10+页面200,改动文件tsc干净。✅

### 数据录入三页合一 + 预算报表对象扩展(全部门)
- **王莹问**：数据录入下的3个页面(Kintone同步/预算/月度人数)能合并吗,看起来有些空。→ 合并。
- **改了什么**：
  - **三页合一**：新建/data-entry,顶部共享"目标月份",3个卡片区块(①Kintone同步②预算录入③月度人数录入);modules.ts 3项→1项「✎ 数据录入」;旧路由/sync /budget /headcount 改为redirect("/data-entry")(307,保旧书签);利润报表内"同步页/预算录入页"链接改指/data-entry。
  - **预算报表对象扩展**：/api/budget GET额外返objects候选(从最近月buildGroupPL推导:全社/中国/日本+4业务部门+9管理部门=16个);录入表单报表对象由3选项<select>改为<input list=datalist>(可选可输);填齐后利润报表/综合汇报达成率全维度铺满。
- **文件**：app/data-entry/page.tsx(新)、app/{sync,budget,headcount}/page.tsx(改redirect)、app/api/budget/route.ts、lib/modules.ts、app/profit/page.tsx(链接)
- **验证**：/data-entry 200,旧3路由307重定向,首页200;budget候选16个对象;改动文件tsc干净。✅

### ⑤利润报表"小组"改"业务部门" + ⑨综合补全部门 + 通用达成率
- **王莹指示**：①全社外没预算只是没填,填了就完整→达成率做成通用;②利润报表"小组"→"业务部门"(说小组总遗漏管理部门,实指所有部门=业务部+管理部);③综合经营情况把所有部门(含管理部门)都加进去。
- **改了什么**：
  - **通用达成率**：insights重写,buildAchievements()按对象在"有预算月份"对齐累计→任意报表对象(全社/中国/日本/各业务部门/各管理部门)有预算就显达成率,无则"无预算"(王莹填了自动出)。法人/业务部门看净利达成,管理部门看贩管费达成。
  - **综合补全部门**：monthAll()补管理部门(buildGroupPL.mgmt);综合facts新增【管理部门 贩管费】(各部门+地域+达成);segments提示AI覆盖全社/中日/各业务部门/各管理部门(实测16分部:3法人+4业务+9管理)。
  - **⑤利润报表术语**：可见标签"小组"→"业务部门"(Sec/图表标题/折叠标题/表头/全年达成/未分配提示/映射说明);内部属性名小组保留(无害)。
- **文件**：app/api/insights/route.ts(重写)、app/profit/page.tsx、app/_components/GroupPLTable.tsx
- **验证**：综合单月→16分部全覆盖,全社净利达成102%其余无预算;利润报表/insights页200,改动文件tsc无新错误。✅

### ⑨AI洞察-增加综合范围(全社+中日法人+业务小组)
- **王莹要求**：同时生成全社+中国+日本,包含小组经营情况。→ 数据现实:预算表仅"全社"且仅2026-05有,中日/小组无预算→综合汇报只有全社能算达成率,中日/小组展示金额+占比+趋势。
- **改了什么**：
  - **范围加"综合"(默认)**：monthAll()一次算全社/中国/日本+各业务小组(buildGroupPL,OS/JP DESK中/JP DESK日/通関)。综合facts=三法人(毛利/贩管费/净利+中日占全社净利%)+各法人环比/趋势+全社预实+业务小组P&L+全社风控/资金。单法人模式保留。
  - **结构化加segments**：schema加segments[](name/zh/ja),综合模式AI给全社/中国/日本/每个小组各一句双语点评(实测7个分部全覆盖);前端"分部点评"卡片网格;复制全文含分部。
- **文件**：app/api/insights/route.ts(重写,monthAll/addPL/综合分支)、app/insights/page.tsx(综合选项+segments渲染)
- **验证**：综合单月→全社¥3993万/中国46%(环比-27.9%)/日本54%(环比+15.6%)/4小组P&L/segments7个;财年累计→累计¥8113万/趋势04→05;页面200,tsc无错误。✅

### ⑨AI洞察-增加财年累计期间筛选 + 修正YTD财年口径
- **王莹问**：经营汇报能加全年筛选吗？有数据可分析吗？→ 数据现实：财年4月起,FY2026仅同步04(248案)+05(209案),FY2025仅03(320案);所谓"全年"实为"财年累计至今(2月)",够做累计+趋势分析,如实标注样本月数。
- **改了什么**：
  - **加期间下拉**：单月/财年累计。财年累计=聚合财年内各月(毛利/贩管费/净利累计+月均+案件)+各月净利趋势序列+累计预实+全社风控各月汇总(负毛利/异常/重复/超标计数累加,挂账/坏账取最新时点)+资金最新;AI写"财年累计经营汇报"并提示样本仅N月勿臆测未同步月。
  - **修正YTD财年口径bug**：原单月YTD用自然年(m.startsWith("2026"))会把FY2025的2026-03算进2026累计,错;改用fyOf()按财年(4月起)聚合,与⑤利润报表口径一致。fyMonthsUpTo()取财年内≤当月的已同步月。
  - **累计达成率对齐**：达成率只在"有预算的月份"上算(分子同月实际/分母同月预算),标注"预算覆盖N/M月",避免2月实际比1月预算得出208%失真。
- **文件**：app/api/insights/route.ts、app/insights/page.tsx
- **验证**：财年累计FY2026=119.5M毛利/81.1M净利(457案,月均4057万),趋势04→05,达成"覆盖1/2月102%";单月YTD修正为仅04+05不含03;页面200,tsc无错误。✅

### ⑨AI洞察全优化(富化事实/环比/预实/结构化双语/月份下拉/复制)
- **王莹指示**：5项全做(①富化事实②环比上月③结构化呈现④月份下拉⑤复制导出)。
- **改了什么**：
  - **① 富化事实**：facts 从只有三大指标+YTD,扩为 当月+环比上月(±%)+当月预实达成率(getBudget)+YTD+【全社风控】(负毛利/异常大额/重复/长期挂账户数金额/坏账)+【加成率审查】+【资金】(现金流预测净额/HSBC可投美金)。中日法人口径只附预实+环比+YTD,风控/资金仅全社附(不分法人)。
  - **② 环比**：prevMonth()算上月,毛利/净利环比金额+百分比。
  - **③ 结构化双语**：gemini新增generateJson(responseSchema);schema=摘要/概述/亮点[]/风险[]/建议[]各中日双语;前端摘要卡(accent边)+概述卡+亮点/风险/建议三栏BiList。
  - **④ 月份下拉**：GET /api/insights返available months,裸input改下拉。
  - **⑤ 复制全文**：plainText()拼中日报告→navigator.clipboard,按钮"✓已复制"。
- **文件**：lib/gemini.ts(generateJson)、app/api/insights/route.ts、app/insights/page.tsx
- **验证**：GET返3月;POST全社2026-05→facts含环比-9.6%/预实103%/挂账6户/资金充裕,结构化报告(摘要+3亮点+3风险+2建议);页面200;tsc无错误。✅

### ⑧风控-王莹反馈三修(OPT改案件番号/趋势图去¥/下钻不移位)
- **王莹反馈**：①页面所有"OPT"改"案件番号";②多月异常趋势是案件数,用¥羊角符号不合适;③案件展开下钻时表头标记位置移位。
- **改了什么**：① risk页所有列头/说明 OPT→案件番号(加成率超标/负毛利/异常大额/重复成本/审查明细);② GroupedBarCard加count prop(Tooltip"N件"+Y轴纯整数allowDecimals=false),趋势图传count;③ RiskAnomalies下钻改为整行colSpan明细行(原塞在第一td致列宽重算移位)+表tableLayout:fixed固定列宽,DrillRow用useEffect取数。
- **文件**：app/risk/page.tsx、app/_components/{Charts,RiskAnomalies}.tsx
- **验证**：/risk 200;下钻API OPT2606708返18条明细+案件概要;改动文件tsc无新错误。✅

### ⑧风控异常面板全优化(加成率汇入/海外代理差异趋势/重复账单/异常下钻/多月趋势/坏账处理)
- **王莹指示**：5项全优化 + 长期挂账增加坏账处理(Kintone无此功能,本系统实现,标记坏账的从挂账剔除进坏账卡片)。
- **改了什么**：
  - **A 加成率超标汇入面板**：加成率flagged并进顶部KPI(🚩加成率超标,2026-06起生效)+专属卡片(偏离标准明细),不再孤立于页底。
  - **B 海外代理差异趋势**：getAgentDiffTrend()从reconciliations按供应商×月统计差异笔数/差额(仅列有差异代理),表格展示;当前全匹配→显示✓无差异。
  - **C 重复账单检测增强**：getRiskPanel加重复账单(账单层bill_lines 同供应商+提单号+金额+币种多次),与Kintone成本层重复成本并列双卡。
  - **D 异常下钻**：负毛利/异常大额表格点OPT展开成本明细(/api/risk/drill→kc_cost_lines+案件概要 売上−成本=毛利),RiskAnomalies客户端组件。
  - **E 多月异常趋势+折叠**：getRiskTrend()按月统计负毛利/异常大额→GroupedBarCard;加成率审查明细收进<details>折叠。
  - **坏账处理**：新表settlement.bad_debts(王莹建);/api/bad-debt POST标记/DELETE恢复;BadDebtCards长期挂账「标记坏账」(可填备注)→写入并从挂账Set剔除→坏账卡片(合计+恢复)。
- **文件**：lib/risk-panel.ts(重复账单/坏账排除/getAgentDiffTrend/getRiskTrend)、app/risk/page.tsx、app/_components/{RiskAnomalies,BadDebtCards}.tsx、app/api/{bad-debt,risk/drill}/route.ts
- **建表(王莹跑)**：`create table settlement.bad_debts(id uuid pk default gen_random_uuid(),客户 text not null,金额 numeric,备注 text,标记时间 timestamptz default now())`。
- **验证**：/risk 2026-05/06 均200;坏账POST/DELETE闭环✓(标记写入→读回→恢复删除);改动文件tsc无错误。✅

### ⑦资金管理-投资建议(HSBC USD账户+起投$100万,联动应收应付)
- **王莹信息**：投资只用 HSBC USD 账户、起投 $100万；建议要联动应收应付。
- **改了什么**：getInvestmentAdvice:HSBC USD余额(kc_bank_balance最新月)+已投USD+未来应收应付净流入(getCashflowForecast按汇率折USD)→净流入正=流动性充裕可投全部,净流出=扣减留存→建议可投额度+笔数(每$100万)+状态(充裕/需留存/不足)+文案;/api/investment GET返回advice;InvestmentPanel加投资能力卡(余额/已投/净流入/建议可投+文案),录入币种默认USD。
- **文件**：lib/treasury.ts(getInvestmentAdvice)、app/api/investment、app/_components/InvestmentPanel.tsx
- **验证**：HSBC USD $10,930,644,未来净流入+$1.13M→充裕,建议可投$10.93M≈10笔。✅

### ⑦资金管理优化(现金流滚动预测/投资增强/AR-AP双栏柱状/网页同步)
- **王莹定2/3/4**：现金流预测、投资台账增强、应收应付双栏+柱状+网页同步。建列(王莹跑):ar_ap_aging 加 预计收付日 date。
- **改了什么**：① syncAging(AR+AP含预计收付日=支払期日)+/api/sync type=aging(refDate)+AgingSyncButton网页同步;② getCashflowForecast按预计收付日归月(已逾期/各月/未定),应收−应付=净流入+累计→表+LineCard;③ 应收/应付双栏(AgingBlock账龄柱状+Top10);④ InvestmentPanel加汇总卡(总额/加权收益率/近30天到期)+到期高亮。
- **文件**：lib/sync.ts、lib/treasury.ts、app/api/sync、app/_components/{AgingSyncButton,InvestmentPanel}.tsx、app/treasury/page.tsx
- **验证**：同步应收362(超期146)/应付777(超期199);预测已逾期净+88.8M/06月+76.6M/07月+13.9M累计正确。✅

### ⑤利润报表优化-批1(折叠分区/贩管费5类图/毛利净利趋势/预实扩展中日)
- **改了什么**：⑥ 长页折叠(小组×4维度/小组损益+管理部门/全社8维度 用 Collapsible)；⑤ 贩管费5类饼图(Math.max(0)夹负值)；④ 毛利/净利月度趋势 LineCard(多月,Promise.all算各月);② 预实对比扩展为 全社/中国/日本(getBudget各对象,中日未录显—)。
- **文件**：app/profit/page.tsx、app/_components/Charts.tsx(LineCard已有)
- **验证**：/profit 200;贩管费5类构成/毛利净利趋势/预实(全社中国日本)/小组4维度/全社8维度 均渲染。✅ 预算源=budgets表手工录入(/budget),当前全社为占位测试值。
- **待续**：③ 期间选择(财年累计/季度)。

### ⑤修Bug-贩管费部署名空(实为部署キー)漏抓 + 全年达成移表格旁/管理按部门
- **王莹质疑**：未填部署名的数据是没按指示抓取吗？→ **确认是我读错字段**：部署按分子表 `部署名` 对部分行为空，部门实际在 `部署キー`(如"日本総務課")。
- **修Bug**：syncSga/sync-sga.mjs 部署名空时回退 `部署キー`(去日本/中国前缀);物流開発室加入CN_DEPTS。重新同步后未映射清零,各月贩管费recovered(2026-05 16,175,518→16,813,340)。
- **布局**：业务小组全年累计达成移到小组损益P&L表**右侧空白**(GroupPLTable内flex);管理部门全年达成改**按部门**(原中国/日本聚合)移到管理表右侧;bullet移入GroupPLTable;页面传bizFY/mgmtFYDept。
- **文件**：lib/sync.ts、scripts/sync-sga.mjs、lib/profit.ts、app/_components/GroupPLTable.tsx、app/profit/page.tsx
- **验证**：未映射[],无空部门;业务/管理达成在表右侧渲染。✅

### ⑤利润报表-小组区4项调整(业务小组全指标达成/去越低越好/分组柱状/管理柱状)
- **王莹反馈**：① 各业务小组要毛利/贩管费/净利全年达成(原只净利);② 删"越低越好",贩管费看预算精度;③ 净利柱状改为当期各小组毛利/贩管费/净利同图;④ 管理部门加当期贩管费柱状。
- **改了什么**：① bizFYFull 每小组(OS/JP DESK合并/通関)出毛利/贩管费/净利卡(各3 bullet);② bullet 去 lowerBetter 改 mode(higher绿/neutral蓝),贩管费用neutral,删越低越好文案;③ Charts加 GroupedBarCard,小组柱状改毛利/贩管费/净利分组;④ 加管理部门当期贩管费 BarCard。
- **文件**：app/_components/Charts.tsx(GroupedBarCard)、app/profit/page.tsx
- **验证**：分组柱状+管理柱状+OS/JP DESK/通関各3指标全年达成卡+管理达成 均渲染(200)。✅

### ⑤利润报表-全年累计达成率(子弹图,毛利/贩管费/净利)
- **王莹需求**：看毛利/贩管费/净利全年累计达成率，可视化。
- **改了什么**：【全社】区预实对比上方加「全年累计达成率」卡片=3条横向进度条(子弹图):累计实绩(财年初~最新月,不随期间下拉变)vs全年预算(财年12月预算之和)，达成率%。贩管费 lowerBetter(≤100%绿>100%红),毛利/净利反之。trend加贩管费字段;fyYtd从trend按财年到月累加;fyBudget=sumBudget财年各月全社。
- **文件**：app/profit/page.tsx
- **验证**：2026-05视图 毛利累计¥119,508,078(04+05)/全年¥55,000,000=217%,贩管费236%红,净利绿。✅ 注:全年预算仅录05月→偏高,录全12月才准。
- **待录入页**：可加"全年一次性预算"入口。

### ⑤利润报表-期间选择改下拉菜单(单选,替代易混的toggle多选)
- **王莹反馈**：原PeriodPicker点月份是toggle增删(想看单月反而从累计里去掉),且月份倒序,不方便→改下拉单选。
- **改了什么**：新建 PeriodSelect 下拉组件(累计财年/Q1-Q4/各月单选,月份正序),profit页替换PeriodPicker。点一下直接切到该期间。首页仍用PeriodPicker。
- **文件**：app/_components/PeriodSelect.tsx、app/profit/page.tsx
- **验证**：默认/单月/多月 均200;下拉显 累计(FY2026)/Q1/各月单月。✅

### ⑤利润报表-管理部门按中日分组(総務課/営業課归日本)
- **王莹反馈**：管理部门按中日区分开（総務課/営業課属日本）。
- **改了什么**：profit.ts 加 mgmtRegion()(JP_MGMT={総務課,営業課,業務課,通関課,TCC課}=日本,其余中国,与同步层JP_DEPTS一致);GroupPL.mgmt 加地域字段;GroupPLTable 管理部门表按中国/日本分组,每组小计(贩管费实绩/预算/差异/达成率)+部门明细缩进。
- **文件**：lib/profit.ts、app/_components/GroupPLTable.tsx
- **验证**：管理部门表 中国管理部门小计/日本管理部门小计两组,総務課/営業課在日本组。✅

### ⑤利润报表优化-批5(三级重排版 全社/中日/小组 + 全指标预实含管理部门)
- **王莹反馈**：① 毛利/贩管费/净利都加预实(含管理部门)；② 整页按 全社/中日/小组 三级重排(原来三类穿插混乱)。
- **改了什么**：① 整页重排为**三大段**(彩色分隔标题 Sec):【全社】预实+贩管费5类图+趋势+加成率+8维度+守恒；【中国/日本】中日预实+净利占比饼+JP DESK拆分；【小组】小组净利柱状+小组损益P&L+管理部门+4维度。合并冗余的"经营概览"(并入预实)。② GroupPLTable 改**行-指标式**(毛利/贩管费/净利各一行,实绩/预算/差异/达成率),JP DESK合并展开中日；管理部门加贩管费预实。groupBudgets取全量BudgetData,新增mgmtBudgets。
- **文件**：app/profit/page.tsx、app/_components/GroupPLTable.tsx
- **验证**：/profit 三段标题(全社/中国日本/小组)+管理部门含预实+贩管费实绩列均渲染。✅

### ⑤利润报表优化-批4(贩管费5类改横向柱状/小组损益加净利预实+JP DESK合并展开)
- **王莹反馈**：贩管费5类饼图不适合(一大多小+负数,小切片饼图和图例都看不见)→改横向柱状;小组损益加预实;JP DESK合并再展开中日。
- **改了什么**：① 贩管费5类 饼图→**横向柱状图HBarCard**(带金额标签,负数显红反向条,删重复的5类文字行);② 小组损益P&L改客户端 **GroupPLTable**:加 净利预算/差异/达成率列(getBudget各小组,未录显—),**JP DESK中国+日本合并成"JP DESK"行、点击展开中日子行**;③ Charts加HBarCard(LabelList金额)。
- **文件**：app/_components/{Charts,GroupPLTable}.tsx、app/profit/page.tsx
- **验证**：/profit P&L显示 OS/JP DESK(合并展开)/通関 + 净利预实列;贩管费横向柱状含负数事業活動費;5类文字行已删。✅

### ⑤利润报表优化-批3(期间选择 财年累计/季度/多选,全页聚合)
- **改了什么**：③ 用 PeriodPicker(加basePath)替代单月选择，支持 财年累计(默认,4月起)/季度Q1-Q4/单月/多选;整页按选定月份**聚合**——合并各月案件后 computeProfitReport/computeDimensions(按分天然累计),sumSga/sumBudget/mergeDept 求和合并,getMarkupReport 改接受月份数组(.in查询),JP DESK人数用最新选定月,趋势仍按财年各月。
- **文件**：app/profit/page.tsx、app/_components/PeriodPicker.tsx(basePath)、lib/markup-review.ts(月份数组)
- **验证**：默认财年累计(FY2026=04/05,03属上财年正确排除);单月净利¥40,572,980→03+04+05累计¥160,270,656正确聚合;季度/多选/单月均200。✅ **⑤利润报表6项优化全部完成**。

### ⑤利润报表优化-批2(加成率审查纳入本页)
- **改了什么**：① 加成率审查概览折叠区(各大类平均加成率+案件数,超标数药丸,链接⑧风控明细);② markup-review.getMarkupReport 改为**平均加成率始终计算**(全部案件,设计§202),审查超标标记才受生效月(2026-06)门禁——2026-05也能看平均、⑧风控同样受益。
- **文件**：app/profit/page.tsx、lib/markup-review.ts
- **验证**：/profit 加成率审查区显示平均+「审查2026-06起生效」;/risk 200。✅

### ③关账锁账-重新定位(去解锁/门禁强制/锁后变更侦测)
- **定位澄清(王莹确认)**：记录级解锁=Kintone审批流执行,本系统**只读+只侦测**,不做解锁(原"解锁流程+unlock_logs"欠账作废)。本系统价值=Kintone做不到的3件:缺账单门禁/快照冻结基线/锁后变更侦测。
- **改了什么**：① **门禁强制**:setCloseStatus 月结/关账前校验齐全(缺账单=0且金额差异=0)否则抛错;UI不齐全禁用月结按钮+提示去对账;② 去掉解锁按钮;"正式锁账"UI改称"已关账·冻结快照"(状态值不变);③ **锁后变更侦测** detectPostCloseChange:仅已正式锁账时,对比当前聚合vs冻结快照(全社/中/日 毛利/贩管费/净利),变动>1则红色告警列出 快照基线→当前→变动,并可"重新冻结快照"接受为新基线;④ 快照基线表展示;computeAggregate抽公共函数(快照+侦测共用)。
- **文件**：lib/close.ts、app/api/close/route.ts、app/close/page.tsx
- **验证**：2026-05齐全→月结/关账通过;关账冻结快照;旧孤儿快照(状态进行中)不误触发(绑定正式锁账);真实侦测到早期快照vs再同步后数据 全社毛利56,786,247→56,748,498。✅

### ⑥月度决算-现金勾稽钻取按银行账户拆 + 资金移动转入/转出分列
- **王莹要求**：钻取按每个银行账户分别显示；资金移动分转入/转出。
- **数据限制(已确认)**：入金/支付App的口座字段全空、子表无账户字段→**入金/出金无法按银行账户拆**(只能到法人×币种);残高差额+资金移动可按账户。
- **改了什么**：syncSettlementCash 资金移动改记 转入/转出分列(不只net)+按账户(口座番号→银行/法人,acctMove);构成加{转入,转出,账户[{银行,口座番号,转入,转出}]}。SettlementView 钻取重做两栏：① 现金流构成(入金/业务出金/贩管费/转入/转出→残高差额→差异);② 各银行账户(残高差额 from rep.rows 按法人×币种过滤 + 资金移动转入/转出 by 口座番号合并 + 账户残差)。
- **文件**：lib/sync.ts、lib/settlement.ts(AcctMove)、app/_components/SettlementView.tsx
- **验证**：EXP CNY 钻取9账户各残高差额(上海浦东-1.37M等);2026-05无移动转入转出显示—;构成含转入/转出/账户。✅

### ⑥月度决算-现金勾稽纳入内部资金移动(资金移动App,换汇取实际到账额)
- **王莹反馈**：另有资金移动App(EXP/TRD各一)记录账户间移动,能区分从哪个银行到哪个银行;换汇有实际入金额。⚠️TRD token有编辑权限,**只读绝不写**。EXP token暂未拿到(占位符)。
- **改了什么**：syncSettlementCash 读资金移动App(EXP+TRD,只GET),筛`支払種別=資金移動`+`計算`月在本月;口座串(银行+口座番号+币种+用途)用kc_bank_balance`口座番号→法人`映射(匹配最长被包含的口座番号);内部移动净额=Σ转入(移動先口座換算金額,换汇实际到账)−Σ转出(移動元支払額),by法人×币种;**差异=残高差额−现金净额−内部移动**;构成加内部移动。占位符token严格跳过(id非纯数字/token含非ASCII)。
- **文件**：lib/sync.ts、lib/settlement.ts、app/_components/SettlementView.tsx;.env.local加KINTONE_APP_FUND_MOVE_EXP/TRD_ID/TOKEN(EXP待补)。
- **验证**：口座→法人映射正确(みずほ3124917/楽天7082721→TRD);TRD历史移动全TRD JPY↔TRD JPY(同法人币种净零);2026-05移动0条(EXP待token)。现金勾稽表加「内部移动」列+钻取显示。✅ EXP token补上后EXP差异将收窄。

### ⑥月度决算-现金勾稽改按法人×币种(贩管费分法人) + 银行明细加口座番号
- **王莹反馈**：① 现金勾稽要区分法人各自显示；② 贩管费不是共通的、要分法人；③ 银行明细加口座番号便于区分账户。
- **建列(王莹跑)**：kc_bank_balance 加 口座番号；settlement_checks 加 法人。
- **改了什么**：syncSettlementCash 改为按 **法人(EXP/TRD)×币种** 勾稽——入金/业务出金/残高差额按法人(請求入金/支付EXP+银行対象法人=EXP, EC=TRD)，**贩管费按App来源分法人(日本+中国→EXP, EC→TRD)**；构成改{业务出金,贩管费出金};syncBank加口座番号。getCashRecon加法人(法人→币种排序,不平置顶);BankRow加口座番号。SettlementView:现金勾稽加法人列+点行看出金构成(入金−业务出金−贩管费),银行明细加口座番号列。
- **文件**：lib/sync.ts、lib/settlement.ts、app/_components/SettlementView.tsx
- **验证**：现金勾稽7行法人×币种(EXP CNY/HKD/JPY/USD/EUR+TRD JPY/USD);EXP JPY贩管费14,295,810/TRD JPY贩管费0;口座番号显示。✅

### ⑥月度决算优化(改名+网页刷新/法人/円換算残高/构成钻取/趋势) + ⑦円換算残高趋势
- **改名**：模块⑥「月度决算勾稽」→「月度决算」(modules.ts + 页标题)。
- **建列(王莹跑)**：kc_bank_balance 加 円換算残高/対象法人；settlement_checks 加 构成 jsonb。
- **⑥优化(1/2/4/5/6/7+删图)**：① 网页「↻重新同步」(银行残高+现金勾稽搬进lib syncBank/syncSettlementCash)；② 现金勾稽点币种钻取构成(入金/业务出金各EXP-TRD+贩管费出金,不再实时拉)；④ 残高差额/现金净额按月趋势LineCard(≥2月显示)；⑤ 差异说明强化(银行未必全覆盖业务现金/汇率/跨币种调拨)；⑥ 空数据→刷新按钮引导；⑦ 法人维度(EXP/TRD,円換算残高+残高差额按法人KPI,银行明细带法人药丸+円換算残高)；**删掉残高差额柱状图**(与KPI重复)；现金勾稽不平置顶。页重建为客户端 SettlementView + /api/settlement(GET月报+勾稽+趋势)。
- **⑦资金管理**：加「円換算残高」按月趋势(所有账户合计,getBankBalanceTrend);1月时显KPI,≥2月显折线。
- **新增折线图组件** Charts.tsx LineCard。/sync页加「同步决算⑥」按钮。
- **文件**：lib/sync.ts(syncBank/syncSettlementCash)、lib/settlement.ts(byLegal/円換算残高合计/getSettlementTrend/getBankBalanceTrend/构成)、app/api/settlement、app/_components/{SettlementView,Charts}.tsx、app/settlement/page.tsx、app/treasury/page.tsx、app/sync/page.tsx、lib/modules.ts、app/api/sync。
- **验证**：同步→银行25账户/现金勾稽5币种4差异；円換算残高合计¥21.86亿(EXP22账户20.5亿/TRD3账户1.33亿);构成齐全;趋势3月(03¥22.9亿/04¥24.1亿/05¥21.86亿)。✅ 注:2026-05仅25账户(3/4月31),月底数据可能未全。

### ④同步排查页优化-网页刷新/默认差异展开一致折叠/筛选/分类/法人/钻取
- **优化点(王莹定1-6+默认差异展开·一致折叠)**：① 网页一键「↻重新排查」(原需终端跑脚本)；② 筛选(法人EXPRESS/TRADING+搜OPT)；③ 点OPT钻取入金/支付明细(实时读Kintone定位差异在哪条)；④ 法人区分(空海/EC药丸)；⑤ 差异分类(🔴收入差异=需排查 / 🟠成本差异=未月结正常)；⑥ 折叠布局；默认只展开差异、一致行折叠进Collapsible(去掉旧的120条硬上限)。
- **改了什么**：lib/sync.ts 加 syncCheck()(移植sync-check.mjs逻辑:案件売上/成本 vs Kintone入金/支付按OPT) + getSyncCheckDetail()(钻取)；/api/sync 加 type=check；新建 /api/sync-check(GET月报/GET?opt钻取)；sync-check页重建为客户端 SyncCheckView 组件；/sync页加「同步排查④」按钮。
- **文件**：`lib/sync.ts`、`app/api/sync/route.ts`、`app/api/sync-check/route.ts`、`app/_components/SyncCheckView.tsx`、`app/sync-check/page.tsx`、`app/sync/page.tsx`
- **验证**：重新排查→209票/收入差异1/成本差异54；钻取OPT2607070→11条(5入金+6支付,见负数冲销)。✅ 120条问题=旧版slice(0,120)硬上限,已随折叠去除。

### ②对账页修三Bug-供应商取错/运单号没提/品名OPT错未纠正（基于真实账单样本)
- **根因(读真实账单 山东上星5.xlsx + OPT2606046.PDF 确认)**：① AI 供应商取了"TO/开票抬头/客户"(山东上星)而非"出具方/FROM"(上海天艳=真承运商=与Kintone一致)；② 账单有"运单号"列(205-...)但AI没提取为提单号；③ 账单品名OPT可能填错(R3品名写OPT2606046,但运单号205-33595601实属OPT2606164)，旧逻辑先按品名OPT聚合→把1980错并入OPT2606046成假差异3650。
- **改了什么**：①提示词:供应商取出具方/落款/FROM(非TO/抬头/客户);opt_no按"OPT+数字"规律从任意列(含品名)识别;提单号含"运单号/MAWB列";单票表头OPT/MAWB应用到每行;opt_no改可空。②reconcileBill:改**逐行解析**,运单号(提单号)命中MAWB→OPT**优先**(可纠正写错的品名OPT),再按真实OPT聚合(替代旧的先按品名OPT聚合)。
- **文件**：`lib/gemini.ts`、`lib/reconcile.ts`
- **验证(真实账单)**：山东上星5.xlsx 4行全匹配(OPT2606046=1670/**OPT2606164=1980经运单号纠正**/OPT2606237/OPT2606158),假差异3650消失;OPT2606046.PDF→供应商上海天艳,业务编号非OPT靠MAWB定位OPT2606046匹配。✅

### ②对账页优化-AI解读回写工作台 + 对账后自动刷新
- **问题**：①对账完成后,缺账单/工作台/账单历史不自动刷新(挂载时拉一次,上传后仍是旧数据);②AI解读差异只飘在顶部面板,没同步进工作台对应行。
- **改了什么**：①页面加 `refresh` 计数,run()/explain() 后自增,传入三个子组件作 useEffect 依赖→自动重拉;②`saveAiExplanation()` 把AI疑因/建议回写到该OPT待复核行的复核备注;explain路由带month并回写。
- **文件**：`lib/reconcile.ts`、`app/api/reconcile/explain/route.ts`、`app/reconciliation/page.tsx`、`app/_components/{ReconWorkbench,MissingBills,BillHistory}.tsx`
- **验证**：上传产生3650漏录→工作台即时出现→AI解读→工作台备注变"🤖AI疑因：Kintone漏录；建议…" ✅

### ②对账页修Bug-币种字符串不一致(RMB≠CNY)导致漏匹配
- **问题**：账单解析币种为"RMB"，Kintone成本原币种为"CNY"(同一货币不同写法)，reconcileBill 用 `.eq(原币种,账单币种)` 精确过滤→取不到成本→全部上海天艳RMB账单误判"漏录或同步异常"。
- **改了什么**：加 `normCur()` 币种归一(RMB/人民币/元↔CNY；円/日元↔JPY；港币↔HKD等)；kc_cost_lines 不在DB端按币种过滤，改取回后用归一比较。
- **文件**：`lib/reconcile.ts`
- **验证**：上海天艳RMB1980账单(提单号205-33595601)→桥接OPT2606164→匹配KintoneCNY1980 ✅。
- **另查实**：OPT2606046显示3650=账单两行(1670+1980)加总，非编造(bill_lines实有两行);但1980行OPT被AI标错(实为OPT2606164)→属AI解析串号,待定。

### ②对账页修两Bug-原件无法查看 + 单票/SOA误判
- **Bug1 原件无法查看**：① 上传路径含中文供应商名→Supabase Storage 报 InvalidKey(不接受非ASCII key)，原始文件url 存成 null；② 即便ASCII，签名时 `encodeURIComponent(path)` 把 `/` 编码成 `%2F`，签进URL导致下载400。
  - 修：上传文件名只取供应商英文/数字(无则"bill")；上传与签名都用 raw path(不整体编码,路径已ASCII安全)。
  - 文件：`lib/reconcile.ts`(uploadBillFile safe名 + getUploadedBills签名)。验证：中文供应商上传→路径ASCII→下载200 ✅。
- **Bug2 单票/SOA误判**：旧版靠AI按Job No数量猜，不准。改为**确定性判定**：账单覆盖的不同 OPT/提单号 >1→SOA，否则单票。
  - 文件：`app/api/reconcile/route.ts`。验证：2个OPT账单→SOA ✅。

### ②对账页修Bug-成本同步口径错误（漏成本导致账单对不上）
- **问题**：kc_cost_lines 旧版接「支付App·取引日(付款日)」现金口径，只覆盖"当月已付款"成本→利润月在本月但付款日不在本月/未付款的成本缺失，账单对不上。量化：旧726行 vs 案件支払テーブル(利润月)874行，漏约148行。
- **根因排查**：kc_payments 表无人读写(死表)；kc_cost_lines 仅②对账+⑧风控读，改源安全。
- **改了什么**：sync-payments.mjs 改为读「案件App(AIR/SEA/EC)的支払テーブル子表 · 按利润月(請求日/纳品完了日)」権責口径，覆盖全部应付成本(不论是否已付)。字段：支払先_0/支払項目/支払通貨/支払額_税込/円換算·元換算支払額；排除項目種別≠支払的行。
- **文件**：`scripts/sync-payments.mjs`
- **验证**：重跑 2026-05 → 874行/202票(AIR778+SEA53+EC43)，比旧版多148行。✅ 已清空全部bills/bill_lines/reconciliations/Storage 供重传测试。

### ②对账页优化-提单号兜底匹配（账单单号非OPT时用MAWB桥接）
- **改了什么**：① kc_cases 加列 `提单号`(同步自 Kintone `MAWB`，王莹已建列) ② sync-cases 灌 MAWB ③ 账单 AI 解析多提取 `提单号`(MAWB/HAWB/AWB/BL) ④ reconcileBill 建 `提单号→OPT` 映射，账单单号非OPT时用账单单号/提单号解析真实OPT再比成本，标注"经提单号匹配(账单号X)"。
- **文件**：`db/schema.sql`、`scripts/sync-cases.mjs`、`lib/gemini.ts`、`lib/reconcile.ts`(norm归一+blToOpt桥+resolved解析)
- **验证**：造账单行 205-33595601(非OPT)→解析到 OPT2606164→账单1980=KT1980 **匹配**，note"经提单号匹配"✅；真实SOA(全OPT)17/1/2无回归。HAWB/AWB_NO多被填成OPT故只用MAWB。
- **注**：清理测试数据时误删3条上海天艳账单历史(对账结果在工作台无损)，建议重传相关账单复跑提单号匹配。

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

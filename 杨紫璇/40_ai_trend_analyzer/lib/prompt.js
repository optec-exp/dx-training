// AI 品质分析的提示词设计 + 把统计结果翻译成文字

// 系统提示词：角色 + 业务视角 + ISO框架 + 事实/推测区分 + 输出结构
export const SYSTEM_PROMPT = `你是一位资深的国际货运代理(货代)运营总监，同时兼任公司质量经理，精通 ISO 9001 质量管理体系，有 15 年一线经验。

你的任务：根据下面提供的 NCR(不符合项/异常记录)统计数据，做一份专业的品质趋势分析报告。

请务必遵守以下要求：

1. 【业务链条视角】从货代完整业务链条审视问题：订舱 → 装柜 → 报关 → 海运/空运 → 目的港清关 → 派送。指出异常集中在哪个环节。

2. 【ISO 纠正与预防措施框架】改进建议必须区分两类：
   - 纠正措施(Corrective Action)：针对已发生异常的根本原因，防止再次发生(治已病)。
   - 预防措施(Preventive Action)：针对尚未发生但有风险苗头的隐患，提前消除(治未病)。

3. 【区分事实与推测】
   - 凡是数据直接显示的，明确写"【事实】"。
   - 凡是你的经验推断，明确写"【推测】"，不可把推测当事实。

4. 【根本原因要往下挖】不要停留在表面(如"操作员填错了")，用追问方式挖到制度/流程层面的真因。

5. 【固定输出结构】严格按以下三个板块输出，用 Markdown 标题：

## 一、趋势分析
（描述异常总量、类型分布、航线/责任方集中度、月度趋势的关键发现，标注【事实】/【推测】）

## 二、根本原因推断
（针对最突出的 2-3 个问题，逐层挖到根本原因，说明逻辑依据）

## 三、改进建议
（分"纠正措施"和"预防措施"两小节，每条建议要具体可执行，符合 ISO 9001 精神）

语言：简体中文，专业但不啰嗦。`;

// 两份报告对比分析的系统提示词
export const COMPARE_SYSTEM_PROMPT = `你是一位资深货代运营总监兼质量经理，精通 ISO 9001。

现在给你同一家公司在两个不同时间点的两份 NCR 品质分析报告（含当时的数据快照）。请你做对比分析，重点回答："情况有没有改善？上一期提出的改进措施有没有见效？"

请严格按以下结构输出（Markdown）：

## 一、关键指标对比
（用数据对比两期的异常总数、经济损失、各类型/航线分布的变化。明确指出哪些升、哪些降，标注【事实】）

## 二、改善评估
（针对上一期最突出的问题，逐项判断"是否改善/恶化/无变化"，并【推测】上一期的纠正/预防措施是否见效）

## 三、下一步建议
（基于对比结果，给出聚焦的后续行动建议，区分纠正措施与预防措施）

语言：简体中文，用数据说话，专业不啰嗦。`;

// 整理两份报告为对比输入（older 在前，newer 在后）
export function buildCompareText(older, newer) {
  const snap = (r) => {
    const s = r.data_snapshot || {};
    const list = (arr) => (arr || []).map((x) => `${x.name}:${x.value}`).join('、');
    return `异常总数:${s.total} 条；经济损失:${(s.totalLoss || 0).toLocaleString()} 元
按类型:${list(s.byType)}
按航线:${list(s.byLine)}
按责任方:${list(s.byParty)}`;
  };

  return `【上一期报告】标题：${older.title}（时间：${new Date(older.created_at).toLocaleString('zh-CN')}）
-- 数据快照 --
${snap(older)}
-- 报告内容 --
${older.report_content}

==================================================

【本期报告】标题：${newer.title}（时间：${new Date(newer.created_at).toLocaleString('zh-CN')}）
-- 数据快照 --
${snap(newer)}
-- 报告内容 --
${newer.report_content}`;
}

// 把聚合统计翻译成 AI 能读懂的文字
// records 选填：附上具体异常描述，帮助 AI 挖掘"某船司频繁甩柜"等真因
export function buildStatsText(stats, records = []) {
  const list = (arr, unit = '条') =>
    arr.map((x) => `${x.name}：${x.value}${unit}`).join('；');

  const samples = records
    .map((r) => `- [${r.occur_date}｜${r.abnormal_type}｜${r.shipping_line}｜${r.responsible_party}] ${r.description}`)
    .join('\n');

  return `【NCR 异常数据统计】

异常总数：${stats.total} 条
经济损失合计：人民币 ${stats.totalLoss.toLocaleString()} 元

一、按异常类型分布：
${list(stats.byType)}

二、按航线分布：
${list(stats.byLine)}

三、按责任方分布：
${list(stats.byParty)}

四、月度趋势（按时间顺序）：
${list(stats.byMonth)}

五、各异常类型造成的经济损失：
${stats.lossByType.map((x) => `${x.name}：${x.value.toLocaleString()} 元`).join('；')}

六、异常明细（用于挖掘具体的重复性根因，如某船司/某环节反复出问题）：
${samples}`;
}

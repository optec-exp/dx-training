// 系统模块注册表 —— 首页驾驶舱 + 侧边导航共用。
export interface ModuleDef {
  slug: string;
  no: string;       // 模块编号
  title: string;
  desc: string;
  group: "核心闭环" | "经营分析" | "数据录入";
}

export const MODULES: ModuleDef[] = [
  // 核心闭环
  { slug: "bills",          no: "①", title: "账单 AI 解析",   desc: "上传成本账单 PDF/Excel → 结构化入库", group: "核心闭环" },
  { slug: "reconciliation", no: "②", title: "对账 / 差异工作台", desc: "Kintone 成本 vs 账单自动比对 + 重复检测", group: "核心闭环" },
  { slug: "close",          no: "③", title: "关账 / 锁账",     desc: "缺账单门禁 + 月结→正式锁账状态机", group: "核心闭环" },
  { slug: "sync-check",     no: "④", title: "三 App 同步排查", desc: "案件 ⟷ 入金/支付 逐票核对", group: "核心闭环" },
  { slug: "settlement",     no: "⑥", title: "月度决算勾稽",     desc: "银行残高 ⟷ 现金流（按币种）", group: "核心闭环" },
  // 经营分析
  { slug: "profit",         no: "⑤", title: "利润报表 / 看板", desc: "全社/中/日/小组 · 毛利·贩管费·净利·预实·加成率", group: "经营分析" },
  { slug: "treasury",       no: "⑦", title: "资金管理",         desc: "应收应付账龄 · 资金预测 · 信用 · 投资", group: "经营分析" },
  { slug: "risk",           no: "⑧", title: "风控异常面板",     desc: "负毛利/加成率超标/异常大额/重复/挂账", group: "经营分析" },
  { slug: "insights",       no: "⑨", title: "AI 洞察 / 经营汇报", desc: "中日双语月度·累计经营汇报自动生成", group: "经营分析" },
  // 数据录入
  { slug: "sync",           no: "↻", title: "Kintone 同步",    desc: "手动触发：拉取 11 个 App 最新快照（只读）", group: "数据录入" },
  { slug: "budget",         no: "¥", title: "预算录入",         desc: "毛利/贩管费/净利 预算手工录入", group: "数据录入" },
  { slug: "headcount",      no: "人", title: "月度人数录入",     desc: "JP DESK 中日拆分 + 人均指标用", group: "数据录入" },
];

export const MODULE_GROUPS = ["核心闭环", "经营分析", "数据录入"] as const;

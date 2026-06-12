// 利润按分计算（移植自马拉松「月度利润分配」+ 自社通関 + 4 维度 + JP DESK 中日拆分）。
// 与 scripts/calc-profit.mjs 同一套逻辑，已对 2026-05 验证守恒。

export const TEAMS = ["TCC", "OS", "EC", "GC", "Japan Desk", "Project", "物流開発", "通关"] as const;
export type Team = (typeof TEAMS)[number];

const CHINA_TEAMS: string[] = ["OS", "EC", "GC", "Japan Desk", "Project", "物流開発"];
const JAPAN_TEAMS: string[] = ["TCC", "通关"];
const KAN_KEYWORDS = ["通関", "通关"];
const NO_OP = ["操作なし", "操作无", ""];
const RULES = { mitsumori: 0.2, country: 0.35, exportOp: 0.27, importOp: 0.18 };

export type Dim = "見積" | "国别" | "输出" | "输入" | "自社通関費";

export interface CaseRow {
  opt_no: string;
  business_line: string; // AIR/SEA/EC
  国别: string | null;
  輸出team: string | null;
  輸入team: string | null;
  見積team: string | null;
  毛利_日元: number | null;
  自社通関費_日元: number | null;
  // 全社多维度直接汇总用（非按分）
  服务类型?: string | null;
  business_scope?: string | null;
  顾客?: string | null;
  mode?: string | null;
  出发?: string | null;
  到达?: string | null;
  业务范围?: string | null;
}

// 全社多维度明细（其余维度直接按案件毛利汇总，非按分）。
export interface DimBreakdown { dim: string; rows: { value: string; 毛利: number; count: number }[] }
const DIM_FIELDS: [string, keyof CaseRow][] = [
  ["服务类型", "服务类型"], ["国别", "国别"], ["顾客", "顾客"],
  ["Business Scope", "business_scope"], ["业务范围", "业务范围"], ["Mode", "mode"], ["出发", "出发"], ["到达", "到达"],
];
export function computeDimensions(rows: CaseRow[]): DimBreakdown[] {
  return DIM_FIELDS.map(([dim, field]) => {
    const m = new Map<string, { 毛利: number; count: number }>();
    for (const r of rows) {
      const key = String((r[field] as string) || "(空)");
      const gp = Number(r.毛利_日元) || 0;
      const e = m.get(key) || { 毛利: 0, count: 0 };
      e.毛利 += gp; e.count++; m.set(key, e);
    }
    return { dim, rows: [...m].map(([value, v]) => ({ value, ...v })).sort((a, b) => b.毛利 - a.毛利).slice(0, 12) };
  });
}

interface Case {
  opt_no: string;
  appType: string;
  country: string;
  expTeam: string;
  impTeam: string;
  mitsumoriTeam: string | null;
  gpJpy: number;
  kanJpy: number;
}

const stripDir = (raw: string) =>
  (raw || "").replace(/輸出$/, "").replace(/輸入$/, "").replace(/\s*Team$/i, "").trim();
const isKan = (raw: string) => KAN_KEYWORDS.includes(stripDir(raw));
const isEmpty = (raw: string) => NO_OP.includes(stripDir(raw));

function normTeam(raw: string | null): Team | null {
  const s = stripDir(raw || "");
  if (!s) return null;
  if (KAN_KEYWORDS.includes(s)) return "通关";
  if ((TEAMS as readonly string[]).includes(s)) return s as Team;
  if (/^japan desk$/i.test(s)) return "Japan Desk";
  if (["物流開発", "物流开发"].includes(s)) return "物流開発";
  return null;
}

function decideCountryTeam(c: Case, expT: Team | null, impT: Team | null): Team | null {
  const country = (c.country || "").toUpperCase().trim();
  if (country === "JP") return "TCC";
  if (country === "CN") {
    if (expT && CHINA_TEAMS.includes(expT)) return expT;
    if (impT && CHINA_TEAMS.includes(impT)) return impT;
    return expT ?? impT;
  }
  return expT ?? impT;
}

interface Alloc {
  team: Team;
  jpy: number;
  dim: Dim;
}

function distribute(c: Case): Alloc[] {
  const out: Alloc[] = [];
  if (c.appType === "ec") {
    out.push({ team: "EC", jpy: c.gpJpy * RULES.mitsumori, dim: "見積" });
    out.push({ team: "EC", jpy: c.gpJpy * RULES.country, dim: "国别" });
    out.push({ team: "EC", jpy: c.gpJpy * RULES.exportOp, dim: "输出" });
    out.push({ team: "EC", jpy: c.gpJpy * RULES.importOp, dim: "输入" });
    return out;
  }
  const expKan = isKan(c.expTeam), impKan = isKan(c.impTeam);
  if (expKan || impKan) {
    // 参考马拉松：通関整票利润按 4 维度铺开（見積→見積team或通関；国别/输出/输入→通関）
    const mt = c.mitsumoriTeam ? normTeam(c.mitsumoriTeam) : null;
    out.push({ team: (!mt || mt === "通关") ? "通关" : mt, jpy: c.gpJpy * RULES.mitsumori, dim: "見積" });
    out.push({ team: "通关", jpy: c.gpJpy * RULES.country, dim: "国别" });
    out.push({ team: "通关", jpy: c.gpJpy * RULES.exportOp, dim: "输出" });
    out.push({ team: "通关", jpy: c.gpJpy * RULES.importOp, dim: "输入" });
    return out;
  }
  if (c.kanJpy !== 0) out.push({ team: "通关", jpy: c.kanJpy, dim: "自社通関費" });
  const remain = c.gpJpy - c.kanJpy;
  const mt = c.mitsumoriTeam ? normTeam(c.mitsumoriTeam) : null;
  if (mt) out.push({ team: mt, jpy: remain * RULES.mitsumori, dim: "見積" });
  const expEmpty = isEmpty(c.expTeam), impEmpty = isEmpty(c.impTeam);
  const expT = expEmpty ? null : normTeam(c.expTeam);
  const impT = impEmpty ? null : normTeam(c.impTeam);
  const ct = decideCountryTeam(c, expT, impT);
  if (ct) out.push({ team: ct, jpy: remain * RULES.country, dim: "国别" });
  if (expEmpty && impT) {
    out.push({ team: impT, jpy: remain * RULES.exportOp, dim: "输出" });
    out.push({ team: impT, jpy: remain * RULES.importOp, dim: "输入" });
  } else if (impEmpty && expT) {
    out.push({ team: expT, jpy: remain * RULES.exportOp, dim: "输出" });
    out.push({ team: expT, jpy: remain * RULES.importOp, dim: "输入" });
  } else {
    if (expT) out.push({ team: expT, jpy: remain * RULES.exportOp, dim: "输出" });
    if (impT) out.push({ team: impT, jpy: remain * RULES.importOp, dim: "输入" });
  }
  return out;
}

export interface TeamProfit {
  team: Team;
  total: number;
  見積: number;
  国别: number;
  输出: number;
  输入: number;
  自社通関費: number;
}
// 小组报表展示分组：OS / JP DESK(展开中日) / 通関 / 其它独立。
export interface GroupRow {
  name: string;
  total: number;
  見積: number;
  国别: number;
  输出: number;
  输入: number;
  自社通関費: number;
  indent?: boolean; // JP DESK 中日明细行缩进
}

export interface ProfitReport {
  month: string;
  caseCount: number;
  teams: TeamProfit[];
  groups: GroupRow[];
  china: number;
  japan: number;
  total: number;
  jpdesk: { profit: number; cn: number; jp: number; cnHeads: number; jpHeads: number };
  sumGrossProfit: number;
  unallocated: { amount: number; cases: { opt_no: string; short: number; reason: string }[] };
}

const JPDESK_TEAMS = ["TCC", "GC", "EC", "Japan Desk"]; // 归入 JP DESK 分组

// 小组损益（业务部门 P&L + 管理部门只贩管费）。部门→利润小组映射（可调）。
const DEPT_TO_GROUP: Record<string, string> = {
  OS課: "OS", 物流開発室: "OS", // 物流開発=OS的子分支,贩管费并入OS,无独立预算
  GC課: "JP DESK中国", "Japan Desk課": "JP DESK中国", EC室: "JP DESK中国",
  TCC課: "JP DESK日本", 業務課: "JP DESK日本",
  通関課: "通関",
  Project室: "Project", // Project 独立成业务部门,贩管费归 Project(不入管理部门)
};
const BIZ_GROUPS = ["OS", "JP DESK中国", "JP DESK日本", "通関", "Project"];
// 管理部门→地域（与同步层 JP_DEPTS 一致：総務課/営業課/業務課/通関課/TCC課=日本；其余=中国）
const JP_MGMT = new Set(["TCC課", "通関課", "営業課", "業務課", "総務課"]);
function mgmtRegion(dept: string): "中国" | "日本" {
  if (JP_MGMT.has(dept)) return "日本";
  return "中国";
}

export interface GroupPL {
  business: { 小组: string; 毛利: number; 贩管费: number; 净利: number }[];
  mgmt: { 部门: string; 贩管费: number; 地域: "中国" | "日本" }[];
}
export function buildGroupPL(groups: GroupRow[], sgaByDept: Map<string, number>): GroupPL {
  const gp = new Map<string, number>();
  for (const g of groups) {
    const name = g.name.replace(/^├ /, "");
    if (BIZ_GROUPS.includes(name)) gp.set(name, g.total);
  }
  const sgaByGroup = new Map<string, number>();
  const mgmt: { 部门: string; 贩管费: number; 地域: "中国" | "日本" }[] = [];
  for (const [dept, amt] of sgaByDept) {
    const grp = DEPT_TO_GROUP[dept];
    if (grp) sgaByGroup.set(grp, (sgaByGroup.get(grp) || 0) + amt);
    else mgmt.push({ 部门: dept.trim() || "(未分配部门)", 贩管费: amt, 地域: mgmtRegion(dept) }); // 空部署名=Kintone未填，标出待修
  }
  const business = BIZ_GROUPS.map((小组) => {
    const 毛利 = gp.get(小组) || 0, 贩管费 = sgaByGroup.get(小组) || 0;
    return { 小组, 毛利, 贩管费, 净利: 毛利 - 贩管费 };
  });
  mgmt.sort((a, b) => b.贩管费 - a.贩管费);
  return { business, mgmt };
}

// 贩管费 × 费用类型：按 DEPT_TO_GROUP 汇到业务部门 + 管理部门保留（部门级，不含役員）。
export interface SgaCatRow { name: string; byCat: Record<string, number>; total: number; 地域?: "中国" | "日本" }
export function buildSgaByCategory(deptByCat: Map<string, Record<string, number>>): { business: SgaCatRow[]; mgmt: SgaCatRow[] } {
  const groupCat = new Map<string, Record<string, number>>();
  const mgmt: SgaCatRow[] = [];
  for (const [dept, cats] of deptByCat) {
    const grp = DEPT_TO_GROUP[dept];
    if (grp) {
      let g = groupCat.get(grp); if (!g) { g = {}; groupCat.set(grp, g); }
      for (const [c, a] of Object.entries(cats)) g[c] = (g[c] || 0) + a;
    } else {
      mgmt.push({ name: dept.trim() || "(未分配部门)", byCat: cats, total: Object.values(cats).reduce((s, a) => s + a, 0), 地域: mgmtRegion(dept) });
    }
  }
  const business: SgaCatRow[] = BIZ_GROUPS.map((小组) => {
    const byCat = groupCat.get(小组) || {};
    return { name: 小组, byCat, total: Object.values(byCat).reduce((s, a) => s + a, 0) };
  });
  mgmt.sort((a, b) => b.total - a.total);
  return { business, mgmt };
}

// 构建小组展示分组：OS / JP DESK(中/日) / 通関 / 其它
function buildGroups(map: Map<Team, TeamProfit>, cn: number, jp: number): GroupRow[] {
  const z = (): GroupRow => ({ name: "", total: 0, 見積: 0, 国别: 0, 输出: 0, 输入: 0, 自社通関費: 0 });
  const addInto = (g: GroupRow, t?: TeamProfit, f = 1) => {
    if (!t) return;
    g.total += t.total * f; g.見積 += t.見積 * f; g.国别 += t.国别 * f; g.输出 += t.输出 * f; g.输入 += t.输入 * f; g.自社通関費 += t.自社通関費 * f;
  };
  const heads = cn + jp || 1;
  const out: GroupRow[] = [];

  // OS
  if (map.get("OS")) { const g = z(); g.name = "OS"; addInto(g, map.get("OS")); out.push(g); }

  // JP DESK：EC 全额→中国；TCC+GC+Japan Desk 池 按中日人数(cn:jp)拆分
  const cnRow = z(); cnRow.name = "├ JP DESK中国"; cnRow.indent = true;
  const jpRow = z(); jpRow.name = "├ JP DESK日本"; jpRow.indent = true;
  addInto(cnRow, map.get("EC")); // EC 全额中国，不拆
  for (const t of [map.get("TCC"), map.get("GC"), map.get("Japan Desk")]) {
    addInto(cnRow, t, cn / heads);
    addInto(jpRow, t, jp / heads);
  }
  if (cnRow.total || jpRow.total) {
    const parent = z(); parent.name = "JP DESK";
    for (const k of ["total", "見積", "国别", "输出", "输入", "自社通関費"] as const) parent[k] = cnRow[k] + jpRow[k];
    out.push(parent, cnRow, jpRow);
  }

  // 通関
  if (map.get("通关")) { const g = z(); g.name = "通関"; addInto(g, map.get("通关")); out.push(g); }

  // 其它独立小组（Project / 物流開発 等）
  for (const t of map.values()) {
    if (t.team === "OS" || t.team === "通关" || JPDESK_TEAMS.includes(t.team)) continue;
    const g = z(); g.name = t.team; addInto(g, t); out.push(g);
  }
  return out;
}

// jpdeskHeads：JP DESK 中日人数（月度，将来从 headcounts 表读）。
export function computeProfitReport(
  rows: CaseRow[],
  month: string,
  jpdeskHeads = { cn: 13, jp: 11 }
): ProfitReport {
  const cases: Case[] = rows.map((r) => ({
    opt_no: r.opt_no,
    appType: r.business_line === "EC" ? "ec" : r.business_line.toLowerCase(),
    country: r.国别 || "",
    expTeam: r.輸出team || "",
    impTeam: r.輸入team || "",
    mitsumoriTeam: r.見積team,
    gpJpy: Number(r.毛利_日元) || 0,
    kanJpy: Number(r.自社通関費_日元) || 0,
  }));

  const map = new Map<Team, TeamProfit>();
  const ensure = (t: Team) => {
    let v = map.get(t);
    if (!v) { v = { team: t, total: 0, 見積: 0, 国别: 0, 输出: 0, 输入: 0, 自社通関費: 0 }; map.set(t, v); }
    return v;
  };
  const unallocCases: { opt_no: string; short: number; reason: string }[] = [];
  for (const c of cases) {
    let alloc = 0;
    for (const a of distribute(c)) {
      const v = ensure(a.team);
      v.total += a.jpy;
      v[a.dim] += a.jpy;
      alloc += a.jpy;
    }
    const short = c.gpJpy - alloc;
    if (Math.abs(short) > 1) {
      const bad: string[] = [];
      if (c.mitsumoriTeam !== null && !normTeam(c.mitsumoriTeam)) bad.push("見積team空/无法识别");
      if (!isEmpty(c.expTeam) && !normTeam(c.expTeam)) bad.push("輸出team无法识别");
      if (!isEmpty(c.impTeam) && !normTeam(c.impTeam)) bad.push("輸入team无法识别");
      unallocCases.push({ opt_no: c.opt_no, short, reason: bad.join("、") || "团队字段缺失" });
    }
  }

  const teams = (TEAMS as readonly Team[]).map((t) => map.get(t)).filter((v): v is TeamProfit => !!v);
  const heads = jpdeskHeads.cn + jpdeskHeads.jp || 1;
  // JP DESK：EC 全额→中国；TCC+GC+Japan Desk 池 按中日人数(cn:jp)拆分
  const pool = (map.get("TCC")?.total ?? 0) + (map.get("GC")?.total ?? 0) + (map.get("Japan Desk")?.total ?? 0);
  const poolCn = (pool * jpdeskHeads.cn) / heads;
  const poolJp = (pool * jpdeskHeads.jp) / heads;
  // 纯中国：OS/EC/Project/物流開発；纯日本：通关
  const pureChina = ["OS", "EC", "Project", "物流開発"].reduce((s, t) => s + (map.get(t as Team)?.total ?? 0), 0);
  const china = pureChina + poolCn;
  const japan = (map.get("通关")?.total ?? 0) + poolJp;
  const sumGP = cases.reduce((s, c) => s + c.gpJpy, 0);
  const unalloc = unallocCases.reduce((s, u) => s + u.short, 0);

  return {
    month,
    caseCount: cases.length,
    teams,
    groups: buildGroups(map, jpdeskHeads.cn, jpdeskHeads.jp),
    china,
    japan,
    total: china + japan,
    jpdesk: { profit: pool, cn: poolCn, jp: poolJp, cnHeads: jpdeskHeads.cn, jpHeads: jpdeskHeads.jp },
    sumGrossProfit: sumGP,
    unallocated: { amount: unalloc, cases: unallocCases },
  };
}

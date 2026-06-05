// 利润按分计算（移植自马拉松「月度利润分配」+ 自社通関 + 4 维度 + JP DESK 中日拆分）。
// 与 scripts/calc-profit.mjs 同一套逻辑，已对 2026-05 验证守恒。

export const TEAMS = ["TCC", "OS", "EC", "GC", "Japan Desk", "Project", "物流開発", "通关"] as const;
export type Team = (typeof TEAMS)[number];

const CHINA_TEAMS: string[] = ["OS", "EC", "GC", "Japan Desk", "Project", "物流開発"];
const JAPAN_TEAMS: string[] = ["TCC", "通关"];
const KAN_KEYWORDS = ["通関", "通关"];
const NO_OP = ["操作なし", "操作无", ""];
const RULES = { mitsumori: 0.2, country: 0.35, exportOp: 0.27, importOp: 0.18 };

export type Dim = "見積" | "国别" | "输出" | "输入";

export interface CaseRow {
  opt_no: string;
  business_line: string; // AIR/SEA/EC
  国别: string | null;
  輸出team: string | null;
  輸入team: string | null;
  見積team: string | null;
  毛利_日元: number | null;
  自社通関費_日元: number | null;
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
    const kanDim: Dim = expKan && !impKan ? "输出" : "输入";
    const mt = c.mitsumoriTeam ? normTeam(c.mitsumoriTeam) : null;
    if (!mt || mt === "通关") out.push({ team: "通关", jpy: c.gpJpy, dim: kanDim });
    else {
      out.push({ team: mt, jpy: c.gpJpy * RULES.mitsumori, dim: "見積" });
      out.push({ team: "通关", jpy: c.gpJpy * (1 - RULES.mitsumori), dim: kanDim });
    }
    return out;
  }
  if (c.kanJpy !== 0) out.push({ team: "通关", jpy: c.kanJpy, dim: "输入" });
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
}
export interface ProfitReport {
  month: string;
  caseCount: number;
  teams: TeamProfit[];
  china: number;
  japan: number;
  total: number;
  jpdesk: { profit: number; cn: number; jp: number; cnHeads: number; jpHeads: number };
  sumGrossProfit: number;
  unallocated: { amount: number; cases: { opt_no: string; short: number; reason: string }[] };
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
    if (!v) { v = { team: t, total: 0, 見積: 0, 国别: 0, 输出: 0, 输入: 0 }; map.set(t, v); }
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
  const jd = map.get("Japan Desk")?.total ?? 0;
  const heads = jpdeskHeads.cn + jpdeskHeads.jp || 1;
  const jdCn = (jd * jpdeskHeads.cn) / heads;
  const jdJp = (jd * jpdeskHeads.jp) / heads;
  const china = CHINA_TEAMS.reduce((s, t) => s + (t === "Japan Desk" ? jdCn : map.get(t as Team)?.total ?? 0), 0);
  const japan = JAPAN_TEAMS.reduce((s, t) => s + (map.get(t as Team)?.total ?? 0), 0) + jdJp;
  const sumGP = cases.reduce((s, c) => s + c.gpJpy, 0);
  const unalloc = unallocCases.reduce((s, u) => s + u.short, 0);

  return {
    month,
    caseCount: cases.length,
    teams,
    china,
    japan,
    total: china + japan,
    jpdesk: { profit: jd, cn: jdCn, jp: jdJp, cnHeads: jpdeskHeads.cn, jpHeads: jpdeskHeads.jp },
    sumGrossProfit: sumGP,
    unallocated: { amount: unalloc, cases: unallocCases },
  };
}

// 利润按分计算（B.2）：读 settlement.kc_cases → 移植马拉松 distributeProfit → 汇总。
// 输出：全社/中国/日本 总利润 + 小组×4维度。验证：全社 = Σ毛利_日元。
// 运行：node scripts/calc-profit.mjs 2026-05

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL, SKEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ym = process.argv[2] || "2026-05";

// ===== 马拉松 constants 移植 =====
const TEAMS = ["TCC", "OS", "EC", "GC", "Japan Desk", "Project", "物流開発", "通关"];
const CHINA_TEAMS = ["OS", "EC", "GC", "Japan Desk", "Project", "物流開発"];
const JAPAN_TEAMS = ["TCC", "通关"];
const KAN_KEYWORDS = ["通関", "通关"];
const NO_OP = ["操作なし", "操作无", ""];
const RULES = { mitsumori: 0.2, country: 0.35, exportOp: 0.27, importOp: 0.18 };

const stripDir = (raw) => (raw || "").replace(/輸出$/, "").replace(/輸入$/, "").replace(/\s*Team$/i, "").trim();
const isKan = (raw) => KAN_KEYWORDS.includes(stripDir(raw));
const isEmpty = (raw) => NO_OP.includes(stripDir(raw));
function normTeam(raw) {
  const s = stripDir(raw);
  if (!s) return null;
  if (KAN_KEYWORDS.includes(s)) return "通关";
  if (TEAMS.includes(s)) return s;
  if (/^japan desk$/i.test(s)) return "Japan Desk";
  if (["物流開発", "物流开发"].includes(s)) return "物流開発";
  return null;
}
function decideCountryTeam(c, expT, impT) {
  const country = (c.country || "").toUpperCase().trim();
  if (country === "JP") return "TCC";
  if (country === "CN") {
    if (expT && CHINA_TEAMS.includes(expT)) return expT;
    if (impT && CHINA_TEAMS.includes(impT)) return impT;
    return expT ?? impT;
  }
  return expT ?? impT;
}

// 返回 allocations: [{team, jpy, dim}]，dim ∈ 見積/国别/输出/输入
function distribute(c) {
  const out = [];
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
  if (c.kanJpy !== 0) out.push({ team: "通关", jpy: c.kanJpy, dim: "自社通関費" }); // kan_fee→自社通関費(单独列)
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

// ===== 读 kc_cases =====
const res = await fetch(`${SUPA}/rest/v1/kc_cases?select=*&利润月=eq.${ym}&limit=2000`, {
  headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Accept-Profile": "settlement" },
});
const rows = await res.json();
const cases = rows.map((r) => ({
  opt_no: r.opt_no,
  appType: r.business_line === "EC" ? "ec" : r.business_line.toLowerCase(),
  country: r["国别"],
  expTeam: r["輸出team"] || "",
  impTeam: r["輸入team"] || "",
  mitsumoriTeam: r["見積team"],
  gpJpy: Number(r["毛利_日元"]) || 0,
  kanJpy: Number(r["自社通関費_日元"]) || 0,
}));

// ===== 汇总 =====
const team = {}; // team → {total, 見積,国别,输出,输入}
const ensure = (t) => (team[t] ??= { total: 0, 見積: 0, 国别: 0, 输出: 0, 输入: 0, 自社通関費: 0 });
let totalAlloc = 0, unalloc = 0, unallocCases = 0;
const offenders = [];
for (const c of cases) {
  let caseAlloc = 0;
  for (const a of distribute(c)) {
    ensure(a.team).total += a.jpy;
    ensure(a.team)[a.dim] += a.jpy;
    totalAlloc += a.jpy;
    caseAlloc += a.jpy;
  }
  const short = c.gpJpy - caseAlloc;
  if (Math.abs(short) > 1) {
    unalloc += short; unallocCases += 1;
    offenders.push({
      opt: c.opt_no, gp: c.gpJpy, alloc: caseAlloc, short,
      見積: `${c.mitsumoriTeam}→${normTeam(c.mitsumoriTeam) ?? "✗无法识别"}`,
      輸出: `${c.expTeam}→${isEmpty(c.expTeam) ? "(空)" : normTeam(c.expTeam) ?? "✗无法识别"}`,
      輸入: `${c.impTeam}→${isEmpty(c.impTeam) ? "(空)" : normTeam(c.impTeam) ?? "✗无法识别"}`,
      国别: c.country,
    });
  }
}
const sumGP = cases.reduce((s, c) => s + c.gpJpy, 0);
const fmt = (n) => Math.round(n).toLocaleString("ja-JP");

console.log(`\n=== 利润按分 ${ym}（${cases.length} 票，单位:日元）===\n`);
console.log("小组            合计       見積       国别       输出       输入     自社通関費");
for (const t of TEAMS) {
  if (!team[t]) continue;
  const v = team[t];
  console.log(
    `${t.padEnd(12)} ${fmt(v.total).padStart(10)} ${fmt(v.見積).padStart(10)} ${fmt(v.国别).padStart(10)} ${fmt(v.输出).padStart(10)} ${fmt(v.输入).padStart(10)} ${fmt(v.自社通関費).padStart(10)}`
  );
}
// JP DESK：EC 全额→中国；TCC+GC+Japan Desk 池 按中日人数拆分（月度手动，将来从 headcounts 表读）。
const JPDESK = { cn: 13, jp: 11 }; // 2026-05：中国侧13人 / 日本侧(TCC課+業務課)11人
const pool = (team["TCC"]?.total || 0) + (team["GC"]?.total || 0) + (team["Japan Desk"]?.total || 0);
const poolCn = (pool * JPDESK.cn) / (JPDESK.cn + JPDESK.jp);
const poolJp = (pool * JPDESK.jp) / (JPDESK.cn + JPDESK.jp);
const pureChina = ["OS", "EC", "Project", "物流開発"].reduce((s, t) => s + (team[t]?.total || 0), 0);
const china = pureChina + poolCn;
const japan = (team["通关"]?.total || 0) + poolJp;
console.log(`\nJP DESK 拆分(13:11)：TCC+GC+Japan Desk ${fmt(pool)} → 中国 ${fmt(poolCn)} + 日本 ${fmt(poolJp)}（EC 全额中国）`);
console.log(`中国合计: ${fmt(china)}   日本合计: ${fmt(japan)}   全社: ${fmt(china + japan)}`);
console.log(`\n验证：Σ毛利_日元 = ${fmt(sumGP)}   已按分 = ${fmt(totalAlloc)}   未分配 = ${fmt(unalloc)}（${unallocCases} 票，team字段无法识别）`);
const gap = sumGP - totalAlloc - unalloc;
console.log(Math.abs(gap) < 1 ? "✅ 守恒：已按分 + 未分配 = Σ毛利（未分配=数据质量提示，非算法丢钱）" : `⚠️ 仍有缺口 ${fmt(gap)}，需检查`);
if (offenders.length) {
  console.log(`\n=== 未分配明细（${offenders.length} 票）===`);
  for (const o of offenders) {
    console.log(`OPT ${o.opt}  毛利 ${fmt(o.gp)}  已分 ${fmt(o.alloc)}  未分配 ${fmt(o.short)}  国别=${o.国别}`);
    console.log(`   見積:${o.見積}  輸出:${o.輸出}  輸入:${o.輸入}`);
  }
}

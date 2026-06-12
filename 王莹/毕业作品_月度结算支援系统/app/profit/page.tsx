import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport, computeDimensions, buildGroupPL, buildSgaByCategory, type ProfitReport, type DimBreakdown, type GroupPL, type SgaCatRow } from "@/lib/profit";
import { getSgaForMonth, getSgaByDept, getSgaByDeptCategory, type SgaAgg } from "@/lib/sga";
import { getJpdeskHeads } from "@/lib/headcount";
import { getBudgetsByObject, type BudgetData } from "@/lib/budget";
import { getMarkupReport, type MarkupReport } from "@/lib/markup-review";
import PeriodSelect from "@/app/_components/PeriodSelect";
import GroupTable from "@/app/_components/GroupTable";
import GroupPLTable from "@/app/_components/GroupPLTable";
import SgaCategoryTable from "@/app/_components/SgaCategoryTable";
import Collapsible from "@/app/_components/Collapsible";
import { PieCard, BarCard, LineCard, HBarCard, GroupedBarCard } from "@/app/_components/Charts";

export const dynamic = "force-dynamic";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const FEE5 = ["人件費", "事業活動費", "事業維持費", "人材·IT投資", "役員関連費用"] as const;

// 多月聚合辅助
function sumSga(list: SgaAgg[]): SgaAgg {
  const byCategory: Record<string, number> = {}; const unmapped = new Map<string, number>();
  let total = 0, china = 0, japan = 0, yakuin = 0;
  for (const s of list) {
    total += s.total; china += s.china; japan += s.japan; yakuin += s.yakuin;
    for (const [k, v] of Object.entries(s.byCategory)) byCategory[k] = (byCategory[k] || 0) + v;
    for (const u of s.unmappedNonZero) unmapped.set(u.部门, (unmapped.get(u.部门) || 0) + u.金额);
  }
  return { total, china, japan, yakuin, byCategory, unmappedNonZero: [...unmapped].map(([部门, 金额]) => ({ 部门, 金额 })) };
}
function mergeDept(list: Map<string, number>[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of list) for (const [k, v] of m) out.set(k, (out.get(k) || 0) + v);
  return out;
}
function mergeDeptCat(list: Map<string, Record<string, number>>[]): Map<string, Record<string, number>> {
  const out = new Map<string, Record<string, number>>();
  for (const m of list) for (const [dept, cats] of m) {
    let e = out.get(dept); if (!e) { e = {}; out.set(dept, e); }
    for (const [c, a] of Object.entries(cats)) e[c] = (e[c] || 0) + a;
  }
  return out;
}

export default async function ProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string; month?: string }>;
}) {
  const available = await getAvailableMonths(); // 最新在前
  const sp = await searchParams;
  const latest = available[0] || "2026-05";
  // 财年(4月起)月份
  const fyOf = (m: string) => { const [y, mm] = m.split("-").map(Number); return mm >= 4 ? y : y - 1; };
  const fy = fyOf(latest);
  const fyMonths = Array.from({ length: 12 }, (_, i) => { const mo = 4 + i, y = mo <= 12 ? fy : fy + 1, mm = mo <= 12 ? mo : mo - 12; return `${y}-${String(mm).padStart(2, "0")}`; });
  const defaultMonths = fyMonths.filter((m) => available.includes(m) && m <= latest);
  const selected = ((sp.months ? sp.months.split(",").filter(Boolean) : sp.month ? [sp.month] : defaultMonths)).filter((m) => available.includes(m)).sort();
  const periodLabel = selected.length === 0 ? "无" : selected.length === 1 ? selected[0] : `${selected[0]} ~ ${selected[selected.length - 1]}（${selected.length}个月累计）`;
  const headMonth = selected[selected.length - 1] || latest;

  let report: ProfitReport | null = null;
  let sga: SgaAgg | null = null;
  let budget: BudgetData | null = null;
  let dims: DimBreakdown[] | null = null;
  let groupPL: GroupPL | null = null;
  let sgaCat: { business: SgaCatRow[]; mgmt: SgaCatRow[] } | null = null;
  let budgetCN: BudgetData | null = null, budgetJP: BudgetData | null = null;
  const groupBudgets: Record<string, BudgetData> = {};
  const mgmtBudgets: Record<string, number | null> = {};
  let markup: MarkupReport | null = null;
  let trend: { 月份: string; 毛利: number; 贩管费: number; 净利: number }[] = [];
  type M3 = { 毛利: number; 贩管费: number; 净利: number };
  const Z3 = (): M3 => ({ 毛利: 0, 贩管费: 0, 净利: 0 });
  const NB: BudgetData = { 毛利: null, 贩管费: null, 净利: null };
  let fyYtd: M3 | null = null; const fyYtdCN = Z3(), fyYtdJP = Z3();
  const fyGroups = new Map<string, M3>(); const fyMgmt = new Map<string, { 贩管费: number; 地域: "中国" | "日本" }>();
  let fyBudget: BudgetData | null = null, fyBudgetCN: BudgetData | null = null, fyBudgetJP: BudgetData | null = null;
  const fyGroupBudgets: Record<string, BudgetData> = {};
  const fyMgmtBudgets: Record<string, number | null> = {};
  const BIZ = ["OS", "JP DESK中国", "JP DESK日本", "通関", "JP DESK"];
  let err: string | null = null;
  try {
    const cases = (await Promise.all(selected.map(getCasesForMonth))).flat();
    report = computeProfitReport(cases, headMonth, await getJpdeskHeads(headMonth));
    dims = computeDimensions(cases);
    sga = sumSga(await Promise.all(selected.map(getSgaForMonth)));
    groupPL = buildGroupPL(report.groups, mergeDept(await Promise.all(selected.map(getSgaByDept))));
    sgaCat = buildSgaByCategory(mergeDeptCat(await Promise.all(selected.map(getSgaByDeptCategory))));
    markup = await getMarkupReport(selected);
    // 本期间预算（批量一次查）
    const selBud = await getBudgetsByObject(selected);
    budget = selBud["全社"] ?? null; budgetCN = selBud["中国"] ?? null; budgetJP = selBud["日本"] ?? null;
    for (const g of BIZ) groupBudgets[g] = selBud[g] ?? NB;
    for (const m of groupPL.mgmt) mgmtBudgets[m.部门] = selBud[m.部门]?.贩管费 ?? null;

    // 综合月度循环（趋势 + 各层级 FY 累计）
    type Mo = { 月份: string; 全社: M3; 中国: M3; 日本: M3; business: { 小组: string; 毛利: number; 贩管费: number; 净利: number }[]; mgmt: { 部门: string; 贩管费: number; 地域: "中国" | "日本" }[] };
    const monthly = (await Promise.all(available.map(async (m): Promise<Mo | null> => {
      try {
        const cs = await getCasesForMonth(m);
        const rp = computeProfitReport(cs, m, await getJpdeskHeads(m));
        const sg = await getSgaForMonth(m);
        const gpl = buildGroupPL(rp.groups, await getSgaByDept(m));
        return { 月份: m, 全社: { 毛利: rp.total, 贩管费: sg.total, 净利: rp.total - sg.total }, 中国: { 毛利: rp.china, 贩管费: sg.china, 净利: rp.china - sg.china }, 日本: { 毛利: rp.japan, 贩管费: sg.japan, 净利: rp.japan - sg.japan }, business: gpl.business, mgmt: gpl.mgmt };
      } catch { return null; }
    }))).filter((x): x is Mo => x != null);
    trend = monthly.map((x) => ({ 月份: x.月份, 毛利: Math.round(x.全社.毛利), 贩管费: Math.round(x.全社.贩管费), 净利: Math.round(x.全社.净利) })).sort((a, b) => a.月份.localeCompare(b.月份));
    const fyToDate = fyMonths.filter((m) => available.includes(m) && m <= latest);
    const fyM = monthly.filter((x) => fyToDate.includes(x.月份));
    const add3 = (s: M3, v: M3) => { s.毛利 += v.毛利; s.贩管费 += v.贩管费; s.净利 += v.净利; };
    fyYtd = Z3();
    for (const x of fyM) {
      add3(fyYtd, x.全社); add3(fyYtdCN, x.中国); add3(fyYtdJP, x.日本);
      for (const b of x.business) { const e = fyGroups.get(b.小组) || Z3(); add3(e, b); fyGroups.set(b.小组, e); }
      for (const mm of x.mgmt) { const e = fyMgmt.get(mm.部门) || { 贩管费: 0, 地域: mm.地域 }; e.贩管费 += mm.贩管费; fyMgmt.set(mm.部门, e); }
    }
    // FY 预算（批量一次查）
    const fyBud = await getBudgetsByObject(fyMonths);
    fyBudget = fyBud["全社"] ?? null; fyBudgetCN = fyBud["中国"] ?? null; fyBudgetJP = fyBud["日本"] ?? null;
    for (const g of BIZ) fyGroupBudgets[g] = fyBud[g] ?? NB;
    for (const [dept] of fyMgmt) fyMgmtBudgets[dept] = fyBud[dept]?.贩管费 ?? null;
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  const Sec = (txt: string) => (
    <div style={{ marginTop: 32, marginBottom: 6, paddingBottom: 6, borderBottom: "2px solid var(--accent)", fontSize: 17, fontWeight: 700, color: "var(--accent)" }}>{txt}</div>
  );
  const predict = (rows: [string, { 毛利: number; 贩管费: number; 净利: number }, BudgetData | null][]) => (
    <table className="report-table" style={{ maxWidth: 760 }}>
      <thead><tr><th>报表对象</th><th>项目</th><th className="num">实绩</th><th className="num">预算</th><th className="num">差异</th><th className="num">达成率</th></tr></thead>
      <tbody>{rows.flatMap(([obj, act, bud]) => (["毛利", "贩管费", "净利"] as const).map((项, i) => {
        const a = act[项], b = bud?.[项] ?? null;
        return (<tr key={obj + 项} style={i === 0 ? { borderTop: "2px solid var(--border)" } : undefined}>
          <td style={{ color: i === 0 ? "var(--text)" : "transparent" }}>{i === 0 ? obj : "·"}</td><td>{项}</td>
          <td className="num">{yen(a)}</td><td className="num">{b == null ? "—" : yen(b)}</td>
          <td className={"num" + (b != null && a - b < 0 ? " neg" : "")}>{b == null ? "—" : yen(a - b)}</td>
          <td className="num">{b ? ((a / b) * 100).toFixed(0) + "%" : "—"}</td>
        </tr>);
      }))}</tbody>
    </table>
  );

  const bullet = (label: string, actual: number, budget: number | null, mode: "higher" | "neutral" = "higher") => {
    const rate = budget ? actual / budget : null;
    const fillW = rate == null ? 0 : Math.min(100, Math.max(0, rate * 100));
    const color = rate == null ? "var(--border)" : mode === "neutral" ? "linear-gradient(90deg,#8b96c8,#7079b3)" : rate >= 1 ? "linear-gradient(90deg,#5fb08a,#4e9d77)" : "linear-gradient(90deg,#d3a866,#c2925a)";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 56, fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{label}</div>
        <div style={{ flex: 1, minWidth: 120, position: "relative", height: 18, background: "var(--panel-2)", borderRadius: 9, overflow: "hidden" }}>
          <div style={{ width: `${fillW}%`, height: "100%", background: color, borderRadius: 9 }} />
        </div>
        <div style={{ width: 260, fontSize: 12, color: "var(--muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          累计 {yen(actual)} / 全年 {budget == null ? "—" : yen(budget)}
          {rate != null && <b style={{ color, marginLeft: 6 }}>{(rate * 100).toFixed(0)}%</b>}
        </div>
      </div>
    );
  };

  // 业务小组 全年累计（毛利/贩管费/净利 · JP DESK 合并中日）
  const jpAct: M3 = { 毛利: (fyGroups.get("JP DESK中国")?.毛利 || 0) + (fyGroups.get("JP DESK日本")?.毛利 || 0), 贩管费: (fyGroups.get("JP DESK中国")?.贩管费 || 0) + (fyGroups.get("JP DESK日本")?.贩管费 || 0), 净利: (fyGroups.get("JP DESK中国")?.净利 || 0) + (fyGroups.get("JP DESK日本")?.净利 || 0) };
  const mergeBud = (k: keyof BudgetData) => fyGroupBudgets["JP DESK"]?.[k] ?? ((fyGroupBudgets["JP DESK中国"]?.[k] != null || fyGroupBudgets["JP DESK日本"]?.[k] != null) ? (fyGroupBudgets["JP DESK中国"]?.[k] || 0) + (fyGroupBudgets["JP DESK日本"]?.[k] || 0) : null);
  const bizFYFull: { 小组: string; act: M3; bud: BudgetData }[] = [
    { 小组: "OS", act: fyGroups.get("OS") || Z3(), bud: fyGroupBudgets["OS"] ?? NB },
    { 小组: "JP DESK", act: jpAct, bud: { 毛利: mergeBud("毛利"), 贩管费: mergeBud("贩管费"), 净利: mergeBud("净利") } },
    { 小组: "通関", act: fyGroups.get("通関") || Z3(), bud: fyGroupBudgets["通関"] ?? NB },
    { 小组: "Project", act: fyGroups.get("Project") || Z3(), bud: fyGroupBudgets["Project"] ?? NB },
  ];
  // 管理部门贩管费 全年累计（按部门）
  const mgmtFYDept = [...fyMgmt].map(([部门, m]) => ({ 部门, 实绩: m.贩管费, 预算: fyMgmtBudgets[部门] ?? null, 地域: m.地域 }));

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>利润报表</h1>
      <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <PeriodSelect available={available} selected={selected} basePath="/profit" />
        <span style={{ color: "var(--muted)", fontSize: 12 }}>期间：<b>{periodLabel}</b></span>
      </div>

      {err && <div className="placeholder">读取失败：{err}</div>}

      {report && report.caseCount === 0 && (
        <div className="warn-box">
          {periodLabel} 暂无案件数据。请先到 <a href="/data-entry" style={{ color: "var(--accent)" }}>数据录入页</a> 同步。
        </div>
      )}

      {report && (
        <>
          <div className="kpi-row">
            <Kpi label="全社 净利" value={report.total - (sga?.total ?? 0)} accent />
            <Kpi label="全社 毛利" value={report.total} />
            <Kpi label="全社 贩管费" value={sga?.total ?? 0} />
            <Kpi label="案件数" value={report.caseCount} raw />
          </div>

          {/* ═══════════ 全社 ═══════════ */}
          {Sec("全社")}
          {fyYtd && (
            <div className="card" style={{ padding: 16, marginTop: 4 }}>
              <div style={{ fontWeight: 650, marginBottom: 4 }}>全年累计达成率 <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 400 }}>· 财年初~最新月 累计实绩 vs 全年预算（不随上方期间变）</span></div>
              {bullet("毛利", fyYtd.毛利, fyBudget?.毛利 ?? null)}
              {bullet("贩管费", fyYtd.贩管费, fyBudget?.贩管费 ?? null, "neutral")}
              {bullet("净利", fyYtd.净利, fyBudget?.净利 ?? null)}
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>毛利/净利 达标≥100%绿；贩管费看与预算的精度（蓝）。全年预算 = 财年各月预算之和，未录全则不准。</div>
            </div>
          )}
          {sga && (<><h3 style={{ marginTop: 16 }}>预实对比（本期间）</h3>{predict([["全社", { 毛利: report.total, 贩管费: sga.total, 净利: report.total - sga.total }, budget]])}<p style={{ color: "var(--muted)", fontSize: 12 }}>预算手工录入（<a href="/data-entry" style={{ color: "var(--accent)" }}>数据录入页</a>）；未录显 —。</p></>)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginTop: 8 }}>
            {sga && <HBarCard title="贩管费 5 类（金额 · 负数=退费）" data={FEE5.map((f) => ({ 类别: f, 金额: Math.round(sga!.byCategory[f] || 0) }))} catKey="类别" valKey="金额" />}
            {trend.length >= 2 && <LineCard title="毛利 / 净利 月度趋势" data={trend as unknown as Record<string, unknown>[]} xKey="月份" lines={[{ key: "毛利", name: "毛利", color: "#2563eb" }, { key: "净利", name: "净利", color: "#34d399" }]} />}
          </div>
          {sga && sga.unmappedNonZero.length > 0 && (<div className="warn-box" style={{ marginTop: 12 }}>⚠️ 未映射地域的贩管费（未计入中/日，请确认归属）：{sga.unmappedNonZero.map((u) => `${u.部门} ${yen(u.金额)}`).join("、")}</div>)}
          {markup && markup.avgByScope.length > 0 && (
            <div style={{ marginTop: 16 }}>
            <Collapsible title="加成率审查（Markup = 利润 / 成本）" defaultOpen={false}
              right={markup.active ? <span className={`pill ${markup.counts.flagged ? "pill-red" : "pill-green"}`}>{markup.counts.flagged ? `${markup.counts.flagged} 超标` : "✓ 无超标"}</span> : <span className="pill pill-gray">审查 2026-06 起生效</span>}>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 0 }}>全部案件都算加成率与平均；仅标准表范围内（{markup.counts.inScope} 票）做 ±{(markup.tolerance * 100).toFixed(0)}% 偏离审查。{!markup.active && "（本月在生效月前，只算平均、不标超标）"} 明细见 <a href={`/risk?month=${headMonth}`} style={{ color: "var(--accent)" }}>⑧ 风控</a>。</p>
              <table className="report-table" style={{ maxWidth: 520, boxShadow: "none", margin: 0 }}>
                <thead><tr><th>Business Scope（大类）</th><th className="num">平均加成率</th><th className="num">案件数</th></tr></thead>
                <tbody>{markup.avgByScope.sort((a, b) => b.avg - a.avg).map((s) => (<tr key={s.scope}><td>{s.scope}</td><td className="num strong">{(s.avg * 100).toFixed(0)}%</td><td className="num">{s.count}</td></tr>))}</tbody>
              </table>
            </Collapsible>
            </div>
          )}
          {dims && (
            <div style={{ marginTop: 16 }}><Collapsible title="全社多维度（服务类型 / 国别 / 顾客 / Business Scope / 业务范围 / Mode / 出发 / 到达 · 毛利直接汇总）" defaultOpen={false}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {dims.map((d) => (<div key={d.dim} className="card" style={{ padding: 14 }}><div style={{ fontWeight: 650, marginBottom: 6 }}>{d.dim}</div><table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}><tbody>{d.rows.map((r) => (<tr key={r.value}><td style={{ padding: "3px 0", color: "var(--text)" }}>{r.value}</td><td style={{ padding: "3px 0", textAlign: "right", fontWeight: 600 }}>{yen(r.毛利)}</td><td style={{ padding: "3px 0 3px 10px", textAlign: "right", color: "var(--muted)", fontSize: 12 }}>{r.count}</td></tr>))}</tbody></table></div>))}
              </div>
            </Collapsible></div>
          )}
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>校验：Σ毛利 {yen(report.sumGrossProfit)} ＝ 已按分 {yen(report.total)} ＋ 未分配 {yen(report.unallocated.amount)}{Math.abs(report.sumGrossProfit - report.total - report.unallocated.amount) < 1 ? " ✅ 守恒" : " ⚠️"}</p>
          {report.unallocated.cases.length > 0 && (<div className="warn-box">⚠️ 未分配 {yen(report.unallocated.amount)}（{report.unallocated.cases.length} 票，团队字段缺失，不计入业务部门）：<ul>{report.unallocated.cases.map((c) => (<li key={c.opt_no}>{c.opt_no} — {yen(c.short)}（{c.reason}）</li>))}</ul></div>)}

          {/* ═══════════ 中国 / 日本 ═══════════ */}
          {Sec("中国 / 日本（地域）")}
          {sga && (
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginTop: 4, alignItems: "start" }}>
              <div><h3 style={{ marginTop: 0 }}>预实对比（本期间）</h3>{predict([["中国", { 毛利: report.china, 贩管费: sga.china, 净利: report.china - sga.china }, budgetCN], ["日本", { 毛利: report.japan, 贩管费: sga.japan, 净利: report.japan - sga.japan }, budgetJP]])}</div>
              <PieCard title="净利 · 中日占比" data={[{ name: "中国", value: Math.round(report.china - (sga?.china ?? 0)) }, { name: "日本", value: Math.round(report.japan - (sga?.japan ?? 0)) }]} />
            </div>
          )}
          {fyYtd && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>
              <div className="card" style={{ padding: 14 }}><div style={{ fontWeight: 650, marginBottom: 6 }}>🇨🇳 中国 · 全年累计达成</div>{bullet("毛利", fyYtdCN.毛利, fyBudgetCN?.毛利 ?? null)}{bullet("贩管费", fyYtdCN.贩管费, fyBudgetCN?.贩管费 ?? null, "neutral")}{bullet("净利", fyYtdCN.净利, fyBudgetCN?.净利 ?? null)}</div>
              <div className="card" style={{ padding: 14 }}><div style={{ fontWeight: 650, marginBottom: 6 }}>🇯🇵 日本 · 全年累计达成</div>{bullet("毛利", fyYtdJP.毛利, fyBudgetJP?.毛利 ?? null)}{bullet("贩管费", fyYtdJP.贩管费, fyBudgetJP?.贩管费 ?? null, "neutral")}{bullet("净利", fyYtdJP.净利, fyBudgetJP?.净利 ?? null)}</div>
            </div>
          )}
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>JP DESK 拆分（{report.jpdesk.cnHeads}:{report.jpdesk.jpHeads}）：TCC+GC+Japan Desk {yen(report.jpdesk.profit)} → 中国 {yen(report.jpdesk.cn)} + 日本 {yen(report.jpdesk.jp)}（EC 全额归中国，不拆）{sga && sga.yakuin > 0 && <> ｜ 役員関連費用 {yen(sga.yakuin)} 按中日 5/5 分</>}</p>

          {/* ═══════════ 业务部门损益 ═══════════ */}
          {Sec("业务部门损益")}
          {groupPL && (
            <div style={{ marginTop: 8, maxWidth: 780 }}>
              <GroupedBarCard title="业务部门 毛利/贩管费/净利（本期间）" data={groupPL.business.map((b) => ({ 小组: b.小组, 毛利: Math.round(b.毛利), 贩管费: Math.round(b.贩管费), 净利: Math.round(b.净利) })) as unknown as Record<string, unknown>[]} xKey="小组" bars={[{ key: "毛利", name: "毛利", color: "#2563eb" }, { key: "贩管费", name: "贩管费", color: "#fbbf24" }, { key: "净利", name: "净利", color: "#34d399" }]} />
            </div>
          )}
          {groupPL && (
            <div style={{ marginTop: 16 }}><Collapsible title="业务部 P&amp;L（毛利/贩管费/净利 · 本期间预实 + 全年累计达成）+ 4 维度利润按分" defaultOpen right={<span style={{ color: "var(--muted)", fontSize: 12 }}>点 JP DESK 展开中日</span>}>
              <GroupPLTable business={groupPL.business} budgets={groupBudgets} mgmt={groupPL.mgmt} mgmtBudgets={mgmtBudgets} bizFY={bizFYFull} mgmtFY={mgmtFYDept} part="biz" />
              <h4 style={{ marginTop: 20, marginBottom: 4 }}>业务部门 × 维度利润按分（見積 / 国别 / 输出 / 输入 / 自社通関費）<span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 400 }}> · 点 JP DESK 折叠中日</span></h4>
              <GroupTable groups={report.groups} />
              <p style={{ color: "var(--muted)", fontSize: 12 }}>部门→业务部门映射可调（OS課/物流開発室→OS、GC課/Japan Desk課/EC室→JP DESK中国、TCC課/業務課→JP DESK日本、通関課→通関、Project室→Project）；役員関連費用不计入业务部门。预算未录显 —。</p>
              {sgaCat && <SgaCategoryTable title="业务部门 贩管费 × 费用类型" rows={sgaCat.business} nameLabel="业务部门" />}
            </Collapsible></div>
          )}

          {/* ═══════════ 管理部门 ═══════════ */}
          {Sec("管理部门")}
          {groupPL && groupPL.mgmt.length > 0 && (
            <div style={{ marginTop: 8, maxWidth: 780 }}>
              <BarCard title="管理部门贩管费（本期间）" data={groupPL.mgmt.map((m) => ({ 部门: m.部门, 贩管费: Math.round(m.贩管费) })) as unknown as Record<string, unknown>[]} xKey="部门" barKey="贩管费" tilt />
            </div>
          )}
          {groupPL && (
            <div style={{ marginTop: 16 }}>
              <GroupPLTable business={groupPL.business} budgets={groupBudgets} mgmt={groupPL.mgmt} mgmtBudgets={mgmtBudgets} bizFY={bizFYFull} mgmtFY={mgmtFYDept} part="mgmt" />
              {sgaCat && <SgaCategoryTable title="管理部门 贩管费 × 费用类型" rows={sgaCat.mgmt} nameLabel="管理部门" />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, accent, raw }: { label: string; value: number; accent?: boolean; raw?: boolean }) {
  return (
    <div className="kpi" style={accent ? { borderColor: "var(--accent)" } : undefined}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={accent ? { color: "var(--accent)" } : undefined}>
        {raw ? value.toLocaleString() : yen(value)}
      </div>
    </div>
  );
}

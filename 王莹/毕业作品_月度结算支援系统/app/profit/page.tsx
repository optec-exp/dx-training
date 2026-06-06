import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport, computeDimensions, buildGroupPL, type ProfitReport, type DimBreakdown, type GroupPL } from "@/lib/profit";
import { getSgaForMonth, getSgaByDept, type SgaAgg } from "@/lib/sga";
import { getJpdeskHeads } from "@/lib/headcount";
import { getBudget, type BudgetData } from "@/lib/budget";
import { getMarkupReport, type MarkupReport } from "@/lib/markup-review";
import PeriodPicker from "@/app/_components/PeriodPicker";
import GroupTable from "@/app/_components/GroupTable";
import GroupPLTable from "@/app/_components/GroupPLTable";
import Collapsible from "@/app/_components/Collapsible";
import { PieCard, BarCard, LineCard, HBarCard } from "@/app/_components/Charts";

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
function sumBudget(list: BudgetData[]): BudgetData {
  const out: BudgetData = { 毛利: null, 贩管费: null, 净利: null };
  for (const b of list) for (const k of ["毛利", "贩管费", "净利"] as const) if (b[k] != null) out[k] = (out[k] || 0) + (b[k] as number);
  return out;
}
function mergeDept(list: Map<string, number>[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of list) for (const [k, v] of m) out.set(k, (out.get(k) || 0) + v);
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
  let budgetCN: BudgetData | null = null, budgetJP: BudgetData | null = null;
  const groupBudgets: Record<string, number | null> = {};
  let markup: MarkupReport | null = null;
  let trend: { 月份: string; 毛利: number; 净利: number }[] = [];
  let err: string | null = null;
  try {
    const cases = (await Promise.all(selected.map(getCasesForMonth))).flat();
    report = computeProfitReport(cases, headMonth, await getJpdeskHeads(headMonth));
    dims = computeDimensions(cases);
    sga = sumSga(await Promise.all(selected.map(getSgaForMonth)));
    budget = sumBudget(await Promise.all(selected.map((m) => getBudget(m, "全社"))));
    budgetCN = sumBudget(await Promise.all(selected.map((m) => getBudget(m, "中国"))));
    budgetJP = sumBudget(await Promise.all(selected.map((m) => getBudget(m, "日本"))));
    groupPL = buildGroupPL(report.groups, mergeDept(await Promise.all(selected.map(getSgaByDept))));
    // 业务小组 净利预算（手工录入，未录显—）
    for (const g of ["OS", "JP DESK中国", "JP DESK日本", "通関", "JP DESK"]) {
      groupBudgets[g] = sumBudget(await Promise.all(selected.map((m) => getBudget(m, g)))).净利;
    }
    markup = await getMarkupReport(selected);
    // 多月趋势：财年各月 毛利/净利
    trend = (await Promise.all(available.map(async (m) => {
      try {
        const cs = await getCasesForMonth(m);
        const rp = computeProfitReport(cs, m, await getJpdeskHeads(m));
        const sg = await getSgaForMonth(m);
        return { 月份: m, 毛利: Math.round(rp.total), 净利: Math.round(rp.total - sg.total) };
      } catch { return { 月份: m, 毛利: 0, 净利: 0 }; }
    }))).sort((a, b) => a.月份.localeCompare(b.月份));
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑤ 利润报表</h1>
      <div style={{ marginBottom: 16 }}>
        <PeriodPicker available={available} selected={selected} basePath="/profit" />
        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>期间：<b>{periodLabel}</b>（默认财年累计，可选季度/单月/多选）</div>
      </div>

      {err && <div className="placeholder">读取失败：{err}</div>}

      {report && report.caseCount === 0 && (
        <div className="warn-box">
          {periodLabel} 暂无案件数据。请先到 <a href="/sync" style={{ color: "var(--accent)" }}>同步页</a> 同步。
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

          <h3>经营概览（毛利 − 贩管费 = 净利，日元）</h3>
          <table className="report-table">
            <thead>
              <tr><th>口径</th><th className="num">毛利</th><th className="num">贩管费</th><th className="num">净利</th></tr>
            </thead>
            <tbody>
              {([
                ["全社", report.total, sga?.total ?? 0],
                ["中国", report.china, sga?.china ?? 0],
                ["日本", report.japan, sga?.japan ?? 0],
              ] as [string, number, number][]).map(([k, gp, ex]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="num">{yen(gp)}</td>
                  <td className="num">{yen(ex)}</td>
                  <td className="num strong">{yen(gp - ex)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginTop: 16 }}>
            <PieCard title="净利 · 中日占比" data={[{ name: "中国", value: Math.round(report.china - (sga?.china ?? 0)) }, { name: "日本", value: Math.round(report.japan - (sga?.japan ?? 0)) }]} />
            {groupPL && <BarCard title="业务小组净利" data={groupPL.business.map((b) => ({ 小组: b.小组, 净利: Math.round(b.净利) })) as unknown as Record<string, unknown>[]} xKey="小组" barKey="净利" colorByValue />}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginTop: 16 }}>
            {sga && <HBarCard title="贩管费 5 类（金额 · 负数=退费）" data={FEE5.map((f) => ({ 类别: f, 金额: Math.round(sga!.byCategory[f] || 0) }))} catKey="类别" valKey="金额" />}
            {trend.length >= 2 && <LineCard title="毛利 / 净利 月度趋势" data={trend as unknown as Record<string, unknown>[]} xKey="月份" lines={[{ key: "毛利", name: "毛利", color: "#2563eb" }, { key: "净利", name: "净利", color: "#34d399" }]} />}
          </div>

          {sga && (
            <div style={{ marginTop: 16 }}>
            <Collapsible title="预实对比（全社 / 中国 / 日本）" defaultOpen>
              <table className="report-table" style={{ maxWidth: 760, boxShadow: "none", margin: 0 }}>
                <thead><tr><th>报表对象</th><th>项目</th><th className="num">实绩</th><th className="num">预算</th><th className="num">差异</th><th className="num">达成率</th></tr></thead>
                <tbody>
                  {([
                    ["全社", { 毛利: report.total, 贩管费: sga.total, 净利: report.total - sga.total }, budget],
                    ["中国", { 毛利: report.china, 贩管费: sga.china, 净利: report.china - sga.china }, budgetCN],
                    ["日本", { 毛利: report.japan, 贩管费: sga.japan, 净利: report.japan - sga.japan }, budgetJP],
                  ] as [string, { 毛利: number; 贩管费: number; 净利: number }, BudgetData | null][]).flatMap(([obj, act, bud]) =>
                    (["毛利", "贩管费", "净利"] as const).map((项, i) => {
                      const a = act[项], b = bud?.[项] ?? null;
                      return (
                        <tr key={obj + 项} style={i === 0 ? { borderTop: "2px solid var(--border)" } : undefined}>
                          <td style={{ color: i === 0 ? "var(--text)" : "transparent" }}>{i === 0 ? obj : "·"}</td>
                          <td>{项}</td>
                          <td className="num">{yen(a)}</td>
                          <td className="num">{b == null ? "—" : yen(b)}</td>
                          <td className={"num" + (b != null && a - b < 0 ? " neg" : "")}>{b == null ? "—" : yen(a - b)}</td>
                          <td className="num">{b ? ((a / b) * 100).toFixed(0) + "%" : "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>预算手工录入（<a href="/budget" style={{ color: "var(--accent)" }}>预算录入页</a>）；中国/日本未录则显示 —。</p>
            </Collapsible>
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            JP DESK 拆分（{report.jpdesk.cnHeads}:{report.jpdesk.jpHeads}）：Japan Desk 課{" "}
            {yen(report.jpdesk.profit)} → 中国 {yen(report.jpdesk.cn)} + 日本 {yen(report.jpdesk.jp)}
            {sga && sga.yakuin > 0 && <> ｜ 役員関連費用 {yen(sga.yakuin)} 按中日 5/5 分</>}
          </p>

          {sga && sga.unmappedNonZero.length > 0 && (
            <div className="warn-box">
              ⚠️ 未映射地域的贩管费（未计入中/日，请确认归属）：
              {sga.unmappedNonZero.map((u) => `${u.部门} ${yen(u.金额)}`).join("、")}
            </div>
          )}

          {markup && markup.avgByScope.length > 0 && (
            <div style={{ marginTop: 16 }}>
            <Collapsible title="加成率审查（Markup = 利润 / 成本）" defaultOpen={false}
              right={markup.active ? <span className={`pill ${markup.counts.flagged ? "pill-red" : "pill-green"}`}>{markup.counts.flagged ? `${markup.counts.flagged} 超标` : "✓ 无超标"}</span> : <span className="pill pill-gray">审查 2026-06 起生效</span>}>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 0 }}>全部案件都算加成率与平均；仅标准表范围内（{markup.counts.inScope} 票）做 ±{(markup.tolerance * 100).toFixed(0)}% 偏离审查。{!markup.active && "（本月在生效月前，只算平均、不标超标）"} 明细见 <a href={`/risk?month=${headMonth}`} style={{ color: "var(--accent)" }}>⑧ 风控</a>。</p>
              <table className="report-table" style={{ maxWidth: 520, boxShadow: "none", margin: 0 }}>
                <thead><tr><th>Business Scope（大类）</th><th className="num">平均加成率</th><th className="num">案件数</th></tr></thead>
                <tbody>
                  {markup.avgByScope.sort((a, b) => b.avg - a.avg).map((s) => (
                    <tr key={s.scope}><td>{s.scope}</td><td className="num strong">{(s.avg * 100).toFixed(0)}%</td><td className="num">{s.count}</td></tr>
                  ))}
                </tbody>
              </table>
              {markup.active && markup.flagged.length > 0 && (
                <p style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>⚠ {markup.flagged.length} 票加成率超标（偏离标准 ±{(markup.tolerance * 100).toFixed(0)}%），到风控页逐票核对。</p>
              )}
            </Collapsible>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Collapsible title="小组 × 4 维度（見積 / 国别 / 输出 / 输入）" defaultOpen right={<span style={{ color: "var(--muted)", fontSize: 12 }}>点 JP DESK 折叠中日</span>}>
              <GroupTable groups={report.groups} />
            </Collapsible>
          </div>

          {groupPL && (
            <div style={{ marginTop: 16 }}><Collapsible title="小组损益 · 业务部门 P&amp;L（净利 = 毛利 − 自身贩管费 · 含净利预实）+ 管理部门" defaultOpen={false} right={<span style={{ color: "var(--muted)", fontSize: 12 }}>点 JP DESK 展开中日</span>}>
              <GroupPLTable business={groupPL.business} budgets={groupBudgets} />
              {groupPL.mgmt.length > 0 && (
                <>
                  <h3>管理部门（成本中心 · 只列贩管费）</h3>
                  <table className="report-table" style={{ maxWidth: 520 }}>
                    <thead><tr><th>部门</th><th className="num">贩管费</th></tr></thead>
                    <tbody>
                      {groupPL.mgmt.map((m) => (<tr key={m.部门}><td>{m.部门}</td><td className="num strong neg">{yen(m.贩管费)}</td></tr>))}
                    </tbody>
                  </table>
                </>
              )}
              <p style={{ color: "var(--muted)", fontSize: 12 }}>部门→业务小组映射可调（OS課→OS、GC課/Japan Desk課/EC室→JP DESK中国、TCC課/業務課→JP DESK日本、通関課→通関）；役員関連費用不计入小组。</p>
            </Collapsible></div>
          )}

          {dims && (
            <div style={{ marginTop: 16 }}><Collapsible title="全社多维度（服务类型 / 国别 / 顾客 / Business Scope / 业务范围 / Mode / 出发 / 到达 · 毛利直接汇总）" defaultOpen={false}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {dims.map((d) => (
                  <div key={d.dim} className="card" style={{ padding: 14 }}>
                    <div style={{ fontWeight: 650, marginBottom: 6 }}>{d.dim}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
                      <tbody>
                        {d.rows.map((r) => (
                          <tr key={r.value}>
                            <td style={{ padding: "3px 0", color: "var(--text)" }}>{r.value}</td>
                            <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 600 }}>{yen(r.毛利)}</td>
                            <td style={{ padding: "3px 0 3px 10px", textAlign: "right", color: "var(--muted)", fontSize: 12 }}>{r.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </Collapsible></div>
          )}

          {report.unallocated.cases.length > 0 && (
            <div className="warn-box">
              ⚠️ 未分配 {yen(report.unallocated.amount)}（{report.unallocated.cases.length} 票，团队字段缺失，不计入小组）：
              <ul>
                {report.unallocated.cases.map((c) => (
                  <li key={c.opt_no}>
                    {c.opt_no} — {yen(c.short)}（{c.reason}）
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 16 }}>
            校验：Σ毛利 {yen(report.sumGrossProfit)} ＝ 已按分 {yen(report.total)} ＋ 未分配{" "}
            {yen(report.unallocated.amount)}
            {Math.abs(report.sumGrossProfit - report.total - report.unallocated.amount) < 1
              ? " ✅ 守恒"
              : " ⚠️"}
          </p>
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

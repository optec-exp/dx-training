import { getMarkupReport } from "@/lib/markup-review";
import { getRiskPanel, getAgentDiffTrend, getRiskTrend, type RiskPanel, type AgentDiffTrend, type RiskTrendRow } from "@/lib/risk-panel";
import { getAvailableMonths } from "@/lib/data";
import MonthPicker from "@/app/_components/MonthPicker";
import { NegTable, BigTable } from "@/app/_components/RiskAnomalies";
import BadDebtCards from "@/app/_components/BadDebtCards";
import { GroupedBarCard } from "@/app/_components/Charts";

export const dynamic = "force-dynamic";

const pct = (n: number | null) => (n == null ? "—" : (n * 100).toFixed(1) + "%");
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default async function RiskPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const months = await getAvailableMonths();
  const month = (await searchParams).month || months[0] || "2026-05";
  let report = null, panel: RiskPanel | null = null, agent: AgentDiffTrend | null = null, trend: RiskTrendRow[] = [], err: string | null = null;
  try {
    report = await getMarkupReport(month);
    panel = await getRiskPanel(month);
    agent = await getAgentDiffTrend();
    trend = await getRiskTrend();
  } catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑧ 风控异常面板</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <MonthPicker value={month} basePath="/risk" />
        <span style={{ color: "var(--muted)", fontSize: 13 }}>负毛利 / 加成率超标 / 异常大额 / 重复成本 / 重复账单 / 长期挂账·坏账 / 海外代理差异</span>
      </div>
      {err && <div className="placeholder">读取失败：{err}</div>}

      {panel && (
        <>
          <div className="kpi-row">
            <Kpi label="🔴 负毛利票" value={panel.负毛利.length} color={panel.负毛利.length ? "var(--red)" : undefined} />
            <Kpi label="🚩 加成率超标" value={report?.active ? report.flagged.length : 0} color={report?.active && report.flagged.length ? "var(--red)" : undefined} sub={report?.active ? undefined : "2026-06起"} />
            <Kpi label="🟠 异常大额(>3×均值)" value={panel.异常大额.length} color={panel.异常大额.length ? "var(--amber)" : undefined} />
            <Kpi label="🔁 重复成本" value={panel.重复成本.length} color={panel.重复成本.length ? "var(--amber)" : undefined} />
            <Kpi label="🧾 重复账单" value={panel.重复账单.length} color={panel.重复账单.length ? "var(--amber)" : undefined} />
            <Kpi label="⏳ 长期挂账" value={panel.长期挂账.length} color={panel.长期挂账.length ? "var(--red)" : undefined} sub={panel.坏账.length ? `坏账${panel.坏账.length}` : undefined} />
          </div>

          {trend.length > 1 && (
            <div style={{ marginTop: 12, maxWidth: 560 }}>
              <GroupedBarCard title="多月异常趋势（案件数）" data={trend as unknown as Record<string, unknown>[]} xKey="month" count
                bars={[{ key: "负毛利", name: "负毛利", color: "#ef4444" }, { key: "异常大额", name: "异常大额", color: "#f59e0b" }]} h={200} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginTop: 12 }}>
            {report?.active && report.flagged.length > 0 && (
              <Section title="🚩 加成率超标（偏离标准）">
                <MiniTable head={["案件番号", "大类", "加成率", "标准", "偏离"]} rows={report.flagged.slice(0, 12).map((r) => [r.opt_no, r.business_scope, pct(r.加成率), pct(r.标准), <span key="d" className="neg">{r.偏离 == null ? "—" : (r.偏离 * 100).toFixed(0) + "%"}</span>])} empty={false} />
              </Section>
            )}
            <Section title="负毛利票（毛利 < 0 · 点案件番号下钻）"><NegTable rows={panel.负毛利} /></Section>
            <Section title="异常大额（成本 > 3× 当月均值 · 点案件番号下钻）"><BigTable rows={panel.异常大额} /></Section>
            <Section title="重复成本（Kintone 成本层 · 同 案件番号+供应商+金额）">
              <MiniTable head={["案件番号", "供应商", "金额", "次数"]} rows={panel.重复成本.slice(0, 12).map((r) => [r.opt_no, r.供应商, yen(r.金额), <span key="n" className="neg">{r.次数}</span>])} empty={panel.重复成本.length === 0} />
            </Section>
            <Section title="重复账单（账单层 · 同 供应商+提单号+金额+币种）">
              <MiniTable head={["供应商", "提单号", "金额", "币", "次数"]} rows={panel.重复账单.slice(0, 12).map((r) => [r.供应商, r.提单号, Math.round(r.金额).toLocaleString(), r.币种, <span key="n" className="neg">{r.次数}</span>])} empty={panel.重复账单.length === 0} />
            </Section>
          </div>

          <h3 style={{ marginTop: 28 }}>长期挂账 · 坏账处理</h3>
          <BadDebtCards 长期挂账={panel.长期挂账} 坏账={panel.坏账} />

          <h3 style={{ marginTop: 28 }}>海外代理对账差异趋势</h3>
          {agent && (agent.hasDiff ? (
            <table className="report-table" style={{ maxWidth: 720 }}>
              <thead><tr><th>供应商（代理）</th>{agent.months.map((m) => <th key={m} className="num">{m}</th>)}<th className="num">总差异笔数</th></tr></thead>
              <tbody>
                {agent.rows.map((r) => (
                  <tr key={r.供应商}>
                    <td>{r.供应商}</td>
                    {agent.months.map((m) => { const c = r.byMonth[m]; return <td key={m} className="num">{c && c.差异笔数 ? <span className="neg">{c.差异笔数}笔/{yen(c.差额)}</span> : "—"}</td>; })}
                    <td className="num strong">{r.总差异}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "var(--green)", fontSize: 13 }}>✓ 各海外代理对账无差异（{agent.months.join("、") || "暂无对账数据"}）</div>
          ))}

          <details style={{ marginTop: 28 }}>
            <summary style={{ cursor: "pointer", fontWeight: 650, fontSize: 16 }}>加成率审查明细（展开）</summary>
            {report && !report.active && (
              <div className="warn-box" style={{ marginTop: 12 }}>加成率标准自 <b>2026-06</b> 起生效，{month} 在此之前，不进行加成率审查。请选择 2026-06 及之后的月份。</div>
            )}
            {report && report.active && (
              <>
                <div className="kpi-row" style={{ marginTop: 12 }}>
                  <Kpi label="🚩 需审查" value={report.counts.flagged} color="var(--red)" />
                  <Kpi label="标准内案件" value={report.counts.inScope} />
                  <Kpi label="案件总数" value={report.counts.total} />
                </div>
                <h4>各大类月度平均加成率</h4>
                <table className="report-table" style={{ maxWidth: 480 }}>
                  <thead><tr><th>Business Scope</th><th className="num">平均加成率</th><th className="num">案件数</th></tr></thead>
                  <tbody>
                    {report.avgByScope.map((s) => (<tr key={s.scope}><td>{s.scope || "(空)"}</td><td className="num strong">{pct(s.avg)}</td><td className="num">{s.count}</td></tr>))}
                    {report.avgByScope.length === 0 && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>本月无落在标准表范围内的案件</td></tr>}
                  </tbody>
                </table>
                <h4>审查明细（按偏离排序，🚩=超标）</h4>
                <table className="report-table">
                  <thead><tr><th>案件番号</th><th>大类</th><th>服务类型</th><th className="num">收入</th><th className="num">成本</th><th className="num">加成率</th><th className="num">标准</th><th className="num">偏离</th><th>状态</th></tr></thead>
                  <tbody>
                    {report.rows.map((r) => (
                      <tr key={r.opt_no} className={r.需审查 ? "flag" : undefined}>
                        <td>{r.opt_no}</td><td>{r.business_scope}</td><td>{r.服务类型}</td>
                        <td className="num">{yen(r.收入)}</td><td className="num">{yen(r.成本)}</td>
                        <td className="num strong">{pct(r.加成率)}</td><td className="num">{pct(r.标准)}</td>
                        <td className={"num" + (r.需审查 ? " neg" : "")}>{r.偏离 == null ? "—" : (r.偏离 * 100).toFixed(0) + "%"}</td>
                        <td><span className={`pill ${r.需审查 ? "pill-red" : "pill-green"}`}>{r.需审查 ? "🚩 需审查" : "✓ 正常"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>注：Business Scope 不在标准表（Aerospace/Ship Spares/Other）的案件、及 OBC（缺&quot;6小时内提货&quot;字段）暂不审查。</p>
              </>
            )}
          </details>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, color, sub }: { label: string; value: number; color?: string; sub?: string }) {
  return <div className="kpi"><div className="kpi-label">{label}</div><div className="kpi-value" style={color ? { color } : undefined}>{value}{sub && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6, fontWeight: 400 }}>{sub}</span>}</div></div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontWeight: 650, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function MiniTable({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: boolean }) {
  if (empty) return <div style={{ color: "var(--green)", fontSize: 13 }}>✓ 无异常</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
      <thead><tr>{head.map((h, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "right", color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "2px 6px" }}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} style={{ textAlign: j === 0 ? "left" : "right", padding: "3px 6px" }}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

import { getReceivablesAging, getPayablesAging, type AgingReport } from "@/lib/treasury";
import { BarCard } from "@/app/_components/Charts";
import InvestmentPanel from "@/app/_components/InvestmentPanel";

export const dynamic = "force-dynamic";
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default async function TreasuryPage() {
  let ar: AgingReport | null = null, ap: AgingReport | null = null, err: string | null = null;
  try { ar = await getReceivablesAging(); ap = await getPayablesAging(); }
  catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑦ 资金管理 · 应收 / 应付账龄</h1>
      <p style={{ color: "var(--muted)" }}>未收/未付按账龄分桶（基准日 2026-06-05）。资金预测 / 信用额度 / 闲置投资为 P1。</p>
      {err && <div className="placeholder">读取失败：{err}</div>}
      {ar && ap && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>资金净头寸（应收 − 应付）</h3>
          <div className="kpi-row">
            <div className="kpi primary"><div className="kpi-label">净头寸</div><div className="kpi-value">{yen(ar.total - ap.total)}</div></div>
            <div className="kpi tinted"><div className="kpi-label">应收合计</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--accent)" }}>{yen(ar.total)}</div></div>
            <div className="kpi"><div className="kpi-label">应付合计</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--amber)" }}>{yen(ap.total)}</div></div>
            <div className="kpi"><div className="kpi-label">超期净敞口</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--red)" }}>{yen(ar.overdueAmt - ap.overdueAmt)}</div></div>
          </div>
          <table className="report-table" style={{ maxWidth: 600 }}>
            <thead><tr><th>账龄</th><th className="num">应收</th><th className="num">应付</th><th className="num">净头寸</th></tr></thead>
            <tbody>
              {ar.buckets.map((b, i) => {
                const apAmt = ap.buckets[i]?.amt || 0;
                return <tr key={b.bucket}><td>{b.bucket}</td><td className="num">{yen(b.amt)}</td><td className="num">{yen(apAmt)}</td><td className={"num strong" + (b.amt - apAmt < 0 ? " neg" : "")}>{yen(b.amt - apAmt)}</td></tr>;
              })}
            </tbody>
          </table>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>按账龄估算现金流入(应收)减流出(应付)。</p>
        </div>
      )}
      <InvestmentPanel />
    </div>
  );
}

function AgingBlock({ title, report, labelName, accent }: { title: string; report: AgingReport; labelName: string; accent: string }) {
  if (report.count === 0) return <div className="warn-box" style={{ marginTop: 20 }}>{title}：暂无数据（运行 sync-ar.mjs / sync-ap.mjs）。</div>;
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="kpi-row">
        <div className="kpi"><div className="kpi-label">{title}总额</div><div className="kpi-value" style={{ fontSize: 20 }}>{yen(report.total)}</div></div>
        <div className="kpi"><div className="kpi-label">超期金额</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--red)" }}>{yen(report.overdueAmt)}</div></div>
        <div className="kpi"><div className="kpi-label">超期笔数</div><div className="kpi-value" style={{ color: "var(--red)" }}>{report.overdueCount}</div></div>
        <div className="kpi"><div className="kpi-label">总笔数</div><div className="kpi-value">{report.count}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14, alignItems: "start" }}>
        <BarCard title="账龄分布（金额）" data={report.buckets as unknown as Record<string, unknown>[]} xKey="bucket" barKey="amt" />
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 650, marginBottom: 8 }}>Top 10 {labelName}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
            <tbody>
              {report.topCustomers.map((c) => (
                <tr key={c.name}><td style={{ padding: "3px 0" }}>{c.name}</td><td style={{ padding: "3px 0", textAlign: "right", fontWeight: 600, color: accent }}>{yen(c.amt)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

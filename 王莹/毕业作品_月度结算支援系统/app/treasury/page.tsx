import { getReceivablesAging, getPayablesAging, type AgingReport } from "@/lib/treasury";
import { BarCard } from "@/app/_components/Charts";

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
      {ar && <AgingBlock title="应收账龄" report={ar} labelName="客户" accent="var(--accent)" />}
      {ap && <AgingBlock title="应付账龄" report={ap} labelName="供应商" accent="var(--amber)" />}
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

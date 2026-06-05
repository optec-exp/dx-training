import { getReceivablesAging } from "@/lib/treasury";

export const dynamic = "force-dynamic";
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default async function TreasuryPage() {
  let report = null, err: string | null = null;
  try { report = await getReceivablesAging(); } catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑦ 资金管理 · 应收账龄</h1>
      <p style={{ color: "var(--muted)" }}>未入金应收按账龄分桶（基准日 2026-06-05）。应付账龄 / 资金预测 / 闲置投资为 P1。</p>
      {err && <div className="placeholder">读取失败：{err}</div>}
      {report && report.count === 0 && (
        <div className="warn-box">暂无应收数据。请在终端运行 <code>node scripts/sync-ar.mjs 2026-06-05</code>。</div>
      )}
      {report && report.count > 0 && (
        <>
          <div className="kpi-row">
            <Kpi label="应收总额" value={yen(report.total)} />
            <Kpi label="超期金额" value={yen(report.overdueAmt)} color="var(--red)" />
            <Kpi label="超期笔数" value={String(report.overdueCount)} color="var(--red)" />
            <Kpi label="应收笔数" value={String(report.count)} />
          </div>

          <h3>账龄分布</h3>
          <table className="report-table" style={{ maxWidth: 560 }}>
            <thead><tr><th>账龄（天）</th><th className="num">金额</th><th className="num">笔数</th><th style={{ width: "30%" }}>占比</th></tr></thead>
            <tbody>
              {report.buckets.map((b) => {
                const max = Math.max(...report!.buckets.map((x) => x.amt), 1);
                return (
                  <tr key={b.bucket}>
                    <td>{b.bucket}</td>
                    <td className="num strong">{yen(b.amt)}</td>
                    <td className="num">{b.count}</td>
                    <td><div className="bar" style={{ width: `${(b.amt / max) * 100}%`, background: b.bucket === "90+" ? "var(--red)" : "var(--accent)" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h3>应收 Top 10 客户</h3>
          <table className="report-table" style={{ maxWidth: 640 }}>
            <thead><tr><th>客户</th><th className="num">应收金额</th></tr></thead>
            <tbody>
              {report.topCustomers.map((c) => (
                <tr key={c.name}><td>{c.name}</td><td className="num strong">{yen(c.amt)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div className="kpi"><div className="kpi-label">{label}</div><div className="kpi-value" style={color ? { color, fontSize: 20 } : { fontSize: 20 }}>{value}</div></div>;
}

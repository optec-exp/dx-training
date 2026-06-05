import { getSyncCheck } from "@/lib/sync-check-data";
import { getAvailableMonths } from "@/lib/data";
import MonthPicker from "@/app/_components/MonthPicker";

export const dynamic = "force-dynamic";
const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");

export default async function SyncCheckPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const months = await getAvailableMonths();
  const month = (await searchParams).month || months[0] || "2026-05";
  let report = null, err: string | null = null;
  try { report = await getSyncCheck(month); } catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>④ 三 App 同步排查</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <MonthPicker value={month} basePath="/sync-check" />
        <span style={{ color: "var(--muted)", fontSize: 13 }}>案件App 收入/成本 vs 请求入金/支付App 合计（按 OPT，日元）</span>
      </div>
      {err && <div className="placeholder">读取失败：{err}</div>}
      {report && report.rows.length === 0 && (
        <div className="warn-box">{month} 暂无排查数据。请在终端运行 <code>node scripts/sync-check.mjs {month}</code>。</div>
      )}
      {report && report.rows.length > 0 && (
        <>
          <div className="kpi-row">
            <Kpi label="🔴 收入不一致" value={report.summary.收入差异数} color="var(--red)" />
            <Kpi label="🔴 成本不一致" value={report.summary.成本差异数} color="var(--red)" />
            <Kpi label="排查票数" value={report.summary.total} />
          </div>
          <h3>总额概览</h3>
          <table className="report-table" style={{ maxWidth: 560 }}>
            <thead><tr><th></th><th className="num">案件App</th><th className="num">入金/支付App</th><th className="num">差异</th></tr></thead>
            <tbody>
              <tr><td>收入</td><td className="num">{fmt(report.summary.案件收入)}</td><td className="num">{fmt(report.summary.入金)}</td><td className="num strong">{fmt(report.summary.案件收入 - report.summary.入金)}</td></tr>
              <tr><td>成本</td><td className="num">{fmt(report.summary.案件成本)}</td><td className="num">{fmt(report.summary.支付)}</td><td className="num strong">{fmt(report.summary.案件成本 - report.summary.支付)}</td></tr>
            </tbody>
          </table>

          <h3>逐票明细（差异排前）</h3>
          <table className="report-table">
            <thead><tr><th>OPT 编号</th><th className="num">案件收入</th><th className="num">入金合计</th><th className="num">收入差异</th><th className="num">案件成本</th><th className="num">支付合计</th><th className="num">成本差异</th></tr></thead>
            <tbody>
              {report.rows.slice(0, 120).map((r) => {
                const rb = Math.abs(Number(r.收入差异)) > 1, cb = Math.abs(Number(r.成本差异)) > 1;
                return (
                  <tr key={r.opt_no} className={rb || cb ? "flag" : undefined}>
                    <td>{r.opt_no}</td>
                    <td className="num">{fmt(r.案件收入)}</td><td className="num">{fmt(r.入金合计)}</td>
                    <td className={"num" + (rb ? " neg" : "")}>{fmt(r.收入差异)}</td>
                    <td className="num">{fmt(r.案件成本)}</td><td className="num">{fmt(r.支付合计)}</td>
                    <td className={"num" + (cb ? " neg" : "")}>{fmt(r.成本差异)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {report.rows.length > 120 && <p style={{ color: "var(--muted)", fontSize: 12 }}>仅显示前 120 票。</p>}
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>注：未月结月份成本未录全，成本差异属正常；收入差异通常指向同步异常，需排查。</p>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div className="kpi"><div className="kpi-label">{label}</div><div className="kpi-value" style={color ? { color } : undefined}>{value}</div></div>;
}

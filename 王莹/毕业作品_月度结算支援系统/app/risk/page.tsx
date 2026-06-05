import { getMarkupReport } from "@/lib/markup-review";
import { getAvailableMonths } from "@/lib/data";
import MonthPicker from "@/app/_components/MonthPicker";

export const dynamic = "force-dynamic";

const pct = (n: number | null) => (n == null ? "—" : (n * 100).toFixed(1) + "%");
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default async function RiskPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const months = await getAvailableMonths();
  const month = (await searchParams).month || months[0] || "2026-05";
  let report = null, err: string | null = null;
  try { report = await getMarkupReport(month); } catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑧ 风控 · 加成率审查</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <MonthPicker value={month} basePath="/risk" />
        <span style={{ color: "var(--muted)", fontSize: 13 }}>加成率 = 利润 / 成本；相对标准偏离超 ±{report ? (report.tolerance * 100).toFixed(0) : 10}% 标红</span>
      </div>
      {err && <div className="placeholder">读取失败：{err}</div>}
      {report && (
        <>
          <div className="kpi-row">
            <Kpi label="🚩 需审查" value={report.counts.flagged} color="var(--red)" />
            <Kpi label="标准内案件" value={report.counts.inScope} />
            <Kpi label="案件总数" value={report.counts.total} />
          </div>

          <h3>各大类月度平均加成率</h3>
          <table className="report-table" style={{ maxWidth: 480 }}>
            <thead><tr><th>Business Scope</th><th className="num">平均加成率</th><th className="num">案件数</th></tr></thead>
            <tbody>
              {report.avgByScope.map((s) => (
                <tr key={s.scope}><td>{s.scope || "(空)"}</td><td className="num strong">{pct(s.avg)}</td><td className="num">{s.count}</td></tr>
              ))}
              {report.avgByScope.length === 0 && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>本月无落在标准表范围内的案件</td></tr>}
            </tbody>
          </table>

          <h3>审查明细（按偏离排序，🚩=超标）</h3>
          <table className="report-table">
            <thead>
              <tr><th>OPT 编号</th><th>大类</th><th>服务类型</th><th className="num">收入</th><th className="num">成本</th><th className="num">加成率</th><th className="num">标准</th><th className="num">偏离</th><th>状态</th></tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.opt_no} style={r.需审查 ? { background: "#3a181833" } : undefined}>
                  <td>{r.opt_no}</td><td>{r.business_scope}</td><td>{r.服务类型}</td>
                  <td className="num">{yen(r.收入)}</td><td className="num">{yen(r.成本)}</td>
                  <td className="num strong">{pct(r.加成率)}</td><td className="num">{pct(r.标准)}</td>
                  <td className="num" style={{ color: r.需审查 ? "var(--red)" : "var(--muted)" }}>{r.偏离 == null ? "—" : (r.偏离 * 100).toFixed(0) + "%"}</td>
                  <td style={{ color: r.需审查 ? "var(--red)" : "var(--green)" }}>{r.需审查 ? "🚩 需审查" : "✅ 正常"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>
            注：Business Scope 不在标准表（Aerospace/Ship Spares/Other）的案件、及 OBC（缺"6小时内提货"字段）暂不审查。
          </p>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div className="kpi"><div className="kpi-label">{label}</div><div className="kpi-value" style={color ? { color } : undefined}>{value}</div></div>;
}

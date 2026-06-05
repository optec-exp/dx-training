import Link from "next/link";
import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport, type ProfitReport } from "@/lib/profit";

export const dynamic = "force-dynamic";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

const DIMS = ["見積", "国别", "输出", "输入"] as const;

export default async function ProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const months = await getAvailableMonths();
  const month = (await searchParams).month || months[0] || "2026-05";

  let report: ProfitReport | null = null;
  let err: string | null = null;
  try {
    const cases = await getCasesForMonth(month);
    report = computeProfitReport(cases, month);
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑤ 利润报表</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {months.map((m) => (
          <Link
            key={m}
            href={`/profit?month=${m}`}
            className="card"
            style={{
              padding: "6px 14px",
              borderColor: m === month ? "var(--accent)" : "var(--border)",
              color: m === month ? "var(--accent)" : "var(--muted)",
            }}
          >
            {m}
          </Link>
        ))}
      </div>

      {err && <div className="placeholder">读取失败：{err}</div>}

      {report && (
        <>
          <div className="kpi-row">
            <Kpi label="全社 利润" value={report.total} accent />
            <Kpi label="中国" value={report.china} />
            <Kpi label="日本" value={report.japan} />
            <Kpi label="案件数" value={report.caseCount} raw />
          </div>

          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            JP DESK 拆分（{report.jpdesk.cnHeads}:{report.jpdesk.jpHeads}）：Japan Desk 課{" "}
            {yen(report.jpdesk.profit)} → 中国 {yen(report.jpdesk.cn)} + 日本 {yen(report.jpdesk.jp)}
          </p>

          <h3>小组 × 4 维度（日元）</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>小组</th>
                <th className="num">合计</th>
                {DIMS.map((d) => (
                  <th key={d} className="num">{d}</th>
                ))}
                <th style={{ width: "26%" }}>占比</th>
              </tr>
            </thead>
            <tbody>
              {report.teams.map((t) => {
                const maxTotal = Math.max(...report!.teams.map((x) => x.total), 1);
                return (
                  <tr key={t.team}>
                    <td>{t.team}</td>
                    <td className="num strong">{yen(t.total)}</td>
                    {DIMS.map((d) => (
                      <td key={d} className="num">{yen(t[d])}</td>
                    ))}
                    <td>
                      <div className="bar" style={{ width: `${(t.total / maxTotal) * 100}%` }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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

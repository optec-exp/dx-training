import Link from "next/link";
import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport, type ProfitReport } from "@/lib/profit";
import { getSgaForMonth, type SgaAgg } from "@/lib/sga";
import MonthPicker from "@/app/_components/MonthPicker";

export const dynamic = "force-dynamic";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

const DIMS = ["見積", "国别", "输出", "输入"] as const;
const FEE5 = ["人件費", "事業活動費", "事業維持費", "人材·IT投資", "役員関連費用"] as const;

export default async function ProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const months = await getAvailableMonths();
  const month = (await searchParams).month || months[0] || "2026-05";

  let report: ProfitReport | null = null;
  let sga: SgaAgg | null = null;
  let err: string | null = null;
  try {
    const cases = await getCasesForMonth(month);
    report = computeProfitReport(cases, month);
    sga = await getSgaForMonth(month);
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑤ 利润报表</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <MonthPicker value={month} basePath="/profit" />
        <span style={{ color: "var(--muted)", fontSize: 12 }}>已同步：</span>
        {months.map((m) => (
          <Link
            key={m}
            href={`/profit?month=${m}`}
            className="card"
            style={{
              padding: "4px 12px",
              borderColor: m === month ? "var(--accent)" : "var(--border)",
              color: m === month ? "var(--accent)" : "var(--muted)",
            }}
          >
            {m}
          </Link>
        ))}
      </div>

      {err && <div className="placeholder">读取失败：{err}</div>}

      {report && report.caseCount === 0 && (
        <div className="warn-box">
          {month} 暂无案件数据。请先到 <a href="/sync" style={{ color: "var(--accent)" }}>同步页</a> 同步该月。
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

          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            JP DESK 拆分（{report.jpdesk.cnHeads}:{report.jpdesk.jpHeads}）：Japan Desk 課{" "}
            {yen(report.jpdesk.profit)} → 中国 {yen(report.jpdesk.cn)} + 日本 {yen(report.jpdesk.jp)}
            {sga && sga.yakuin > 0 && <> ｜ 役員関連費用 {yen(sga.yakuin)} 按中日 5/5 分</>}
          </p>

          {sga && (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              贩管费 5 类：
              {FEE5.map((f) => `${f} ${yen(sga.byCategory[f] || 0)}`).join("  ｜  ")}
            </p>
          )}
          {sga && sga.unmappedNonZero.length > 0 && (
            <div className="warn-box">
              ⚠️ 未映射地域的贩管费（未计入中/日，请确认归属）：
              {sga.unmappedNonZero.map((u) => `${u.部门} ${yen(u.金额)}`).join("、")}
            </div>
          )}

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
